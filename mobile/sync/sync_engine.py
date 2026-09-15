import json
import logging
import mimetypes
import os
import requests
from typing import Dict, Any, Optional

from database.sqlite_manager import SQLiteManager


logger = logging.getLogger("MineGuardAI.SyncEngine")


class SyncEngine:
    def __init__(
        self,
        db_manager: SQLiteManager,
        supabase_url: str,
        supabase_anon_key: str,
        access_token: Optional[str] = None,
    ):
        """
        Initialize the cloud synchronization engine.

        supabase_anon_key:
            Supabase publishable/anon key used for the API key header.

        access_token:
            JWT access token belonging to the currently logged-in user.
            This is required for Supabase RLS to evaluate auth.uid().
        """

        self.db = db_manager
        self.supabase_url = supabase_url.strip("/")
        self.supabase_anon_key = supabase_anon_key
        self.access_token = access_token

        self.headers = {
            "apikey": self.supabase_anon_key,
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        }

        if self.access_token:
            self.headers["Authorization"] = f"Bearer {self.access_token}"
        else:
            logger.warning(
                "No authenticated Supabase access token was provided. "
                "Cloud inserts may be rejected by RLS."
            )

    def set_access_token(self, access_token: Optional[str]) -> None:
        """Update the authenticated user's access token."""
        self.access_token = access_token

        if access_token:
            self.headers["Authorization"] = f"Bearer {access_token}"
        else:
            self.headers.pop("Authorization", None)

    def synchronize_offline_queue(self) -> Dict[str, int]:
        """
        Processes all pending local synchronization queue entries.

        For observations with photos, the synchronization order is:

            1. Observation INSERT
            2. Storage upload
            3. Mark queue item SYNCED only when both succeed

        Storage bucket:
            mineguard-documents

        Storage object path:
            observations/<observation_id>/<filename>
        """

        results = {
            "processed": 0,
            "failed": 0,
        }

        if not self.access_token:
            logger.error(
                "Cloud synchronization aborted: "
                "no authenticated user access token is available."
            )
            return results

        query = """
            SELECT *
            FROM sync_queue
            WHERE status != 'SYNCED'
            ORDER BY timestamp ASC
        """

        with self.db.get_connection() as conn:
            pending_items = conn.execute(query).fetchall()

        if not pending_items:
            logger.info("No pending synchronization items found.")
            return results

        logger.info(
            f"Found {len(pending_items)} pending synchronization item(s)."
        )

        for item in pending_items:
            queue_id = item["id"]
            table_name = item["table_name"]
            action = item["action"]

            try:
                payload = json.loads(item["payload"])
            except (json.JSONDecodeError, TypeError) as e:
                logger.error(
                    f"Invalid JSON payload for queue item {queue_id}: {e}"
                )
                self._update_queue_status(
                    queue_id,
                    "FAILED",
                    increment_retry=True,
                )
                results["failed"] += 1
                continue

            logger.info(
                f"Synchronizing queue item {queue_id}: "
                f"{action} -> {table_name}"
            )

            success = False

            if action == "INSERT":

                if table_name == "observations":
                    success = self._synchronize_observation(payload)

                else:
                    success = self._push_insert_to_supabase(
                        table_name,
                        payload,
                    )

            else:
                logger.warning(
                    f"Unsupported synchronization action: {action}"
                )

            if success:
                self._update_queue_status(
                    queue_id,
                    "SYNCED",
                )
                results["processed"] += 1

                logger.info(
                    f"Queue item {queue_id} synchronized successfully."
                )

            else:
                self._update_queue_status(
                    queue_id,
                    "FAILED",
                    increment_retry=True,
                )
                results["failed"] += 1

                logger.warning(
                    f"Queue item {queue_id} failed to synchronize."
                )

        return results

    def _synchronize_observation(
        self,
        payload: Dict[str, Any],
    ) -> bool:
        """
        Synchronize one observation.

        Required order:

            observation INSERT
                    ↓
            Storage upload

        The observation's photo_url is set to the final bucket-relative
        Storage path before the observation INSERT.

        If the observation INSERT succeeds but Storage upload fails,
        this method returns False so the queue item remains retryable.

        On retry, if the observation already exists, the INSERT is not
        repeated. The method proceeds directly to the Storage upload.
        """

        observation_id = payload.get("id")

        if not observation_id:
            logger.error(
                "Observation payload does not contain an id."
            )
            return False

        photo_path = payload.get("photo_url")

        # -------------------------------------------------------------
        # Determine final Storage path BEFORE observation INSERT
        # -------------------------------------------------------------

        local_photo_path = None
        storage_object_path = None

        if photo_path:
            # Already-uploaded URL: nothing to upload.
            if isinstance(photo_path, str) and photo_path.startswith(
                ("http://", "https://")
            ):
                logger.info(
                    f"Observation already contains a URL: {photo_path}"
                )

            else:
                local_photo_path = str(photo_path)

                if not os.path.isfile(local_photo_path):
                    logger.error(
                        "Observation photo file does not exist."
                    )
                    logger.error(
                        f"Local photo path: {local_photo_path}"
                    )
                    return False

                filename = os.path.basename(local_photo_path)

                storage_object_path = (
                    f"observations/{observation_id}/{filename}"
                )

                # IMPORTANT:
                # The observation row stores the bucket-relative path,
                # not the local filesystem path.
                payload["photo_url"] = storage_object_path

                logger.info(
                    "Observation Storage path prepared."
                )
                logger.info(
                    f"Storage bucket : mineguard-documents"
                )
                logger.info(
                    f"Object path    : {storage_object_path}"
                )
                logger.info(
                    f"Local file     : {local_photo_path}"
                )

        # -------------------------------------------------------------
        # STEP 1: INSERT OBSERVATION FIRST
        # -------------------------------------------------------------

        logger.info(
            "Step 1/2: Inserting observation into Supabase..."
        )

        insert_result = self._insert_observation(
            payload
        )

        if not insert_result:
            logger.error(
                "Observation INSERT failed. "
                "Storage upload will NOT be attempted."
            )
            return False

        # -------------------------------------------------------------
        # STEP 2: UPLOAD PHOTO AFTER OBSERVATION EXISTS
        # -------------------------------------------------------------

        if not local_photo_path:
            logger.info(
                "Observation has no local photo requiring upload."
            )
            return True

        logger.info(
            "Step 2/2: Uploading observation photo to Storage..."
        )

        upload_success = self._upload_photo_to_storage(
            local_photo_path,
            storage_object_path,
        )

        if not upload_success:
            logger.error(
                "Storage upload failed AFTER observation INSERT."
            )
            logger.error(
                "Observation remains in Supabase, but the queue item "
                "will remain FAILED so synchronization can be retried."
            )
            return False

        logger.info(
            "Observation INSERT + Storage upload completed successfully."
        )

        logger.info(
            f"Final observation photo_url: {storage_object_path}"
        )

        return True

    def _insert_observation(
        self,
        payload: Dict[str, Any],
    ) -> bool:
        """
        Insert an observation into Supabase.

        If the observation already exists because a previous attempt
        successfully inserted it before Storage failed, HTTP 409 is
        treated as 'already inserted' and synchronization continues
        to the Storage step.
        """

        endpoint = (
            f"{self.supabase_url}/rest/v1/observations"
        )

        try:
            response = requests.post(
                endpoint,
                headers=self.headers,
                json=[payload],
                timeout=10,
            )

            logger.info(
                f"Observation INSERT HTTP status: "
                f"{response.status_code}"
            )

            logger.info(
                f"Observation INSERT response: "
                f"{response.text}"
            )

            if response.status_code in (201, 204):
                logger.info(
                    "Observation INSERT successful."
                )
                return True

            # ---------------------------------------------------------
            # Retry handling
            # ---------------------------------------------------------
            #
            # If Storage failed after the observation was inserted,
            # the next queue retry will attempt the INSERT again.
            #
            # Supabase/PostgREST may return 409 because the UUID already
            # exists. That is not a real failure for our retry flow.
            #
            if response.status_code == 409:
                logger.warning(
                    "Observation already exists in Supabase "
                    "(HTTP 409)."
                )
                logger.info(
                    "Treating existing observation as already inserted "
                    "and continuing with Storage upload."
                )
                return True

            print("\n" + "=" * 70)
            print("[Supabase Observation INSERT Error]")
            print(f"HTTP Status : {response.status_code}")
            print(f"Response    : {response.text}")
            print("=" * 70 + "\n")

            logger.error(
                "Supabase rejected observation INSERT."
            )

            return False

        except requests.RequestException as e:
            logger.error(
                f"Network transport error during observation INSERT: {e}"
            )
            return False

    def _upload_photo_to_storage(
        self,
        local_file_path: str,
        storage_object_path: str,
    ) -> bool:
        """
        Upload one local image to the private Supabase Storage bucket.

        Bucket:
            mineguard-documents

        Object path:
            observations/<observation_id>/<filename>

        Uses the authenticated user's JWT.

        x-upsert=true allows safe retries when the same observation
        photo is uploaded again.
        """

        bucket_name = "mineguard-documents"

        endpoint = (
            f"{self.supabase_url}/storage/v1/object/"
            f"{bucket_name}/{storage_object_path}"
        )

        content_type, _ = mimetypes.guess_type(
            local_file_path
        )

        if not content_type:
            content_type = "application/octet-stream"

        storage_headers = {
            "apikey": self.supabase_anon_key,
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": content_type,
            "x-upsert": "true",
        }

        logger.info(
            "Uploading observation photo to Supabase Storage..."
        )

        logger.info(
            f"Storage bucket : {bucket_name}"
        )

        logger.info(
            f"Storage object path: {storage_object_path}"
        )

        logger.info(
            f"Local file     : {local_file_path}"
        )

        logger.info(
            f"Content-Type   : {content_type}"
        )

        logger.info(
            f"Storage endpoint: {endpoint}"
        )

        try:
            with open(
                local_file_path,
                "rb",
            ) as image_file:

                response = requests.post(
                    endpoint,
                    headers=storage_headers,
                    data=image_file,
                    timeout=30,
                )

            logger.info(
                f"Storage upload HTTP status: "
                f"{response.status_code}"
            )

            logger.info(
                f"Storage upload response: "
                f"{response.text}"
            )

            if response.status_code in (200, 201):
                logger.info(
                    "Storage upload successful."
                )

                logger.info(
                    f"Storage bucket : {bucket_name}"
                )

                logger.info(
                    f"Storage object : {storage_object_path}"
                )

                return True

            print("\n" + "=" * 70)
            print("[Supabase Storage Upload Error]")
            print(f"Bucket       : {bucket_name}")
            print(f"Object Path  : {storage_object_path}")
            print(f"HTTP Status  : {response.status_code}")
            print(f"Response     : {response.text}")
            print("=" * 70 + "\n")

            logger.error(
                "Supabase Storage rejected the photo upload."
            )

            logger.error(
                f"Storage HTTP status: {response.status_code}"
            )

            logger.error(
                f"Storage response: {response.text}"
            )

            return False

        except FileNotFoundError:
            logger.error(
                f"Photo file was not found: {local_file_path}"
            )
            return False

        except OSError as e:
            logger.error(
                f"Could not read photo file "
                f"{local_file_path}: {e}"
            )
            return False

        except requests.RequestException as e:
            logger.error(
                f"Network error during Supabase Storage upload: {e}"
            )
            return False

    def _push_insert_to_supabase(
        self,
        table_name: str,
        payload: Dict[str, Any],
    ) -> bool:
        """
        Inserts one record into a Supabase table using PostgREST.

        Used for inspections and inspection_safety_measurements.

        The payload is sent as-is. No inspector_id, record ID,
        overall_status, or other inspection data is modified.
        """

        endpoint = (
            f"{self.supabase_url}/rest/v1/{table_name}"
        )

        try:
            response = requests.post(
                endpoint,
                headers=self.headers,
                json=[payload],
                timeout=10,
            )

            if response.status_code in (201, 204):
                logger.info(
                    f"Successfully synced record to Supabase "
                    f"table: {table_name}"
                )
                return True

            print("\n" + "=" * 70)
            print("[Supabase Cloud Rejection Error]")
            print(f"Table Target : {table_name}")
            print(f"HTTP Status  : {response.status_code}")
            print(f"Response     : {response.text}")
            print("=" * 70 + "\n")

            logger.error(
                f"Supabase rejected INSERT into {table_name}. "
                f"HTTP {response.status_code}"
            )

            return False

        except requests.RequestException as e:
            logger.error(
                f"Network transport error during cloud sync: {e}"
            )
            return False

    def _update_queue_status(
        self,
        queue_id: int,
        status: str,
        increment_retry: bool = False,
    ) -> None:
        """Updates the local synchronization queue status."""

        if increment_retry:
            query = """
                UPDATE sync_queue
                SET
                    status = ?,
                    retry_count = retry_count + 1
                WHERE id = ?
            """
        else:
            query = """
                UPDATE sync_queue
                SET status = ?
                WHERE id = ?
            """

        with self.db.get_connection() as conn:
            conn.execute(
                query,
                (
                    status,
                    queue_id,
                ),
            )
            conn.commit()