import os
import sys

from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(BASE_DIR)
load_dotenv(os.path.join(BASE_DIR, ".env"))

import datetime
import uuid
import sqlite3
import cv2

from kivymd.app import MDApp
from kivymd.uix.screen import MDScreen
from kivymd.uix.card import MDCard
from kivymd.uix.label import MDLabel
from kivymd.uix.boxlayout import MDBoxLayout
from kivy.lang import Builder

from database.sqlite_manager import SQLiteManager
from sync.sync_queue import SyncQueue


class LoginScreen(MDScreen):
    pass


class DashboardScreen(MDScreen):
    pass


class DataViewerScreen(MDScreen):
    pass


class MineGuardAIApp(MDApp):

    def build(self):
        self.db_manager = SQLiteManager()
        self.sync_queue = SyncQueue(self.db_manager)

        self.captured_lat = None
        self.captured_long = None
        self.captured_photo_path = "No Photo Attached"

        self.current_user = None
        self.current_session = None
        self.current_profile = None

        # Full mine records returned by get_accessible_mines()
        self.accessible_mines = []

        # Internal UUID of the currently selected mine.
        # This is never shown directly to the inspector.
        self.selected_mine_id = None

        if not os.path.exists("images"):
            os.makedirs("images")

        self.theme_cls.primary_palette = "Teal"
        self.theme_cls.theme_style = "Dark"

        kv_path = os.path.join(
            os.path.dirname(__file__),
            "mineguard.kv"
        )

        return Builder.load_file(kv_path)

    def login_user(self):
        login_screen = self.root.get_screen("login")

        email = login_screen.ids.login_email.text.strip()
        password = login_screen.ids.login_password.text

        if not email or not password:
            login_screen.ids.login_status.text = (
                "Please enter email and password."
            )
            return

        login_screen.ids.login_status.text = "Signing in..."

        try:
            from services.auth_service import AuthService

            auth_service = AuthService()

            result = auth_service.sign_in(
                email=email,
                password=password
            )

            self.current_user = result.get("user")
            self.current_session = result.get("session")
            self.current_profile = result.get("profile")

            print("========================================")
            print("LOGIN SUCCESS")
            print("========================================")

            if self.current_user:
                print("User ID:", self.current_user.id)
                print("Email:", self.current_user.email)

            if self.current_profile:
                print(
                    "Full Name:",
                    self.current_profile.get("full_name")
                )
                print(
                    "Profile Email:",
                    self.current_profile.get("email")
                )
                print(
                    "Role:",
                    self.current_profile.get("role")
                )
                print(
                    "Status:",
                    self.current_profile.get("status")
                )

            print("========================================")

            mines = self.load_accessible_mines()

            if not mines:
                login_screen.ids.login_status.text = (
                    "Login successful, but no assigned mines were found."
                )
            else:
                login_screen.ids.login_status.text = (
                    "Login successful!"
                )

            self.root.current = "dashboard"
            self.update_dashboard_after_login()

        except Exception as e:
            print("========================================")
            print("LOGIN ERROR")
            print("========================================")
            print(type(e).__name__)
            print(str(e))
            print("========================================")

            login_screen.ids.login_status.text = (
                f"Login failed: {str(e)}"
            )

    def load_accessible_mines(self):
        try:
            from supabase_api.client import get_supabase_client

            supabase = get_supabase_client()

            print("")
            print("========================================")
            print("ACCESSIBLE MINES TEST")
            print("========================================")

            response = supabase.rpc(
                "get_accessible_mines"
            ).execute()

            mines = response.data or []

            self.accessible_mines = mines
            self.selected_mine_id = None

            print(
                "Number of accessible mines:",
                len(mines)
            )
            print("----------------------------------------")

            for mine in mines:
                print(mine)

            print("========================================")

            self.populate_mine_selector()

            return mines

        except Exception as e:
            print("")
            print("========================================")
            print("ACCESSIBLE MINES ERROR")
            print("========================================")
            print(type(e).__name__)
            print(str(e))
            print("========================================")

            self.accessible_mines = []
            self.selected_mine_id = None

            return []

    def populate_mine_selector(self):
        """Populate the Dashboard with the user's assigned mines."""

        try:
            dashboard = self.root.get_screen("dashboard")
        except Exception:
            return

        selector = dashboard.ids.mine_selector
        selector.values = []

        if not self.accessible_mines:
            selector.text = "No assigned mines"

            dashboard.ids.selected_mine_label.text = (
                "Selected Mine: None"
            )

            return

        display_values = []

        for mine in self.accessible_mines:
            mine_code = str(
                mine.get("mine_code") or "Unknown Code"
            )
            mine_name = str(
                mine.get("mine_name") or "Unnamed Mine"
            )

            display_values.append(
                f"{mine_code} — {mine_name}"
            )

        selector.values = display_values
        selector.text = "Select Assigned Mine"

        dashboard.ids.selected_mine_label.text = (
            f"Assigned Mines: {len(display_values)} | "
            "Selected Mine: None"
        )

    def select_mine(self, display_text):
        """
        Convert the mine displayed in the Spinner into its
        internal database UUID.

        The Spinner also calls this method when its text is reset
        to the placeholder after saving an inspection. In that case
        there is no mine to map, so we return without printing an
        error.
        """

        display_text = (display_text or "").strip()

        # These are UI placeholder values, not actual mines.
        if display_text in (
            "",
            "Select Assigned Mine",
            "No assigned mines",
        ):
            self.selected_mine_id = None
            return

        self.selected_mine_id = None

        for mine in self.accessible_mines:

            mine_code = str(
                mine.get("mine_code") or "Unknown Code"
            )

            mine_name = str(
                mine.get("mine_name") or "Unnamed Mine"
            )

            expected_text = (
                f"{mine_code} — {mine_name}"
            )

            if expected_text == display_text:

                self.selected_mine_id = mine.get("id")

                print("----------------------------------------")
                print("MINE SELECTED")
                print("Mine Code:", mine_code)
                print("Mine Name:", mine_name)
                print("Mine UUID:", self.selected_mine_id)
                print("----------------------------------------")

                dashboard = self.root.get_screen("dashboard")

                dashboard.ids.selected_mine_label.text = (
                    f"Selected Mine: "
                    f"{mine_code} — {mine_name}"
                )

                # Internal compatibility field.
                # The UUID is stored here but hidden by mineguard.kv.
                dashboard.ids.mine_id_input.text = str(
                    self.selected_mine_id
                )

                return

        print(
            "Could not map selected mine:",
            display_text
        )

    def update_dashboard_after_login(self):
        """Refresh dashboard information after login."""

        dashboard = self.root.get_screen("dashboard")

        if self.current_profile:

            full_name = (
                self.current_profile.get("full_name")
                or "User"
            )

            role = (
                self.current_profile.get("role")
                or "No role"
            )

            dashboard.ids.user_info_label.text = (
                f"Logged in as: {full_name} | Role: {role}"
            )

        self.populate_mine_selector()

    def capture_mock_gps(self) -> None:

        self.captured_lat = 27.2045
        self.captured_long = 73.3482

        dashboard = self.root.get_screen("dashboard")

        dashboard.ids.gps_label.text = (
            f"GPS Captured: "
            f"{self.captured_lat}, {self.captured_long}"
        )

    def capture_mock_photo(self) -> None:

        dashboard = self.root.get_screen("dashboard")

        dashboard.ids.photo_label.text = (
            "Opening webcam stream window..."
        )

        cam = cv2.VideoCapture(0)

        if not cam.isOpened():

            dashboard.ids.photo_label.text = (
                "Error: Webcam hardware not found or busy."
            )

            return

        cv2.namedWindow(
            "MineGuard AI - Camera View"
        )

        unique_img_id = str(uuid.uuid4())[:8]

        local_filename = (
            f"images/obs_{unique_img_id}.jpg"
        )

        while True:

            ret, frame = cam.read()

            if not ret:
                break

            cv2.putText(
                frame,
                "Press SPACEBAR to Take Photo | Press ESC to Exit",
                (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (0, 255, 255),
                2,
                cv2.LINE_AA
            )

            cv2.imshow(
                "MineGuard AI - Camera View",
                frame
            )

            key = cv2.waitKey(1) & 0xFF

            if key == 27:
                break

            elif key == 32:

                cv2.imwrite(
                    local_filename,
                    frame
                )

                self.captured_photo_path = (
                    local_filename
                )

                dashboard.ids.photo_label.text = (
                    f"Photo Saved: {local_filename}"
                )

                break

        cam.release()
        cv2.destroyAllWindows()

    def validate_inspection_form(self, dashboard):
        """Validate required inspection fields before local/cloud writes."""
        errors = []

        if not self.selected_mine_id:
            errors.append("Select an assigned mine.")

        if not dashboard.ids.type_input.text.strip():
            errors.append("Enter the inspection type.")

        for field_id, label in [
            ("oxygen_input", "Oxygen (O₂)"),
            ("methane_input", "Methane (CH₄)"),
            ("carbon_monoxide_input", "Carbon Monoxide (CO)"),
            ("temperature_input", "Temperature"),
        ]:
            value = dashboard.ids[field_id].text.strip()
            if not value:
                errors.append(f"Enter {label}.")
            else:
                try:
                    if float(value) < 0:
                        errors.append(f"{label} cannot be negative.")
                except ValueError:
                    errors.append(f"Enter a valid number for {label}.")

        for field_id, label in [
            ("ventilation_input", "Ventilation"),
            ("ground_condition_input", "Roof / Ground Condition"),
            ("electrical_safety_input", "Electrical Safety"),
        ]:
            value = dashboard.ids[field_id].text.strip()
            if not value or value.startswith("Select"):
                errors.append(f"Select {label}.")

        for field_id, label in [
            ("obs_category", "Observation category"),
            ("obs_severity", "Severity level"),
            ("obs_description", "Observation description"),
        ]:
            if not dashboard.ids[field_id].text.strip():
                errors.append(f"Enter {label}.")

        return errors

    def show_validation_errors(self, dashboard, errors):
        """Display validation feedback in the dedicated save section."""
        label = dashboard.ids.validation_status_label

        if len(errors) == 1:
            message = f"⚠ Please complete: {errors[0]}"
        else:
            message = "⚠ Please complete the following before saving:\n"
            message += "\n".join(
                f"• {error}" for error in errors
            )

        label.text = message
        label.theme_text_color = "Error"

    def process_complete_inspection(self) -> None:

        dashboard = self.root.get_screen("dashboard")

        validation_errors = self.validate_inspection_form(dashboard)
        if validation_errors:
            self.show_validation_errors(dashboard, validation_errors)
            print("----------------------------------------")
            print("INSPECTION VALIDATION FAILED")
            for error in validation_errors:
                print("-", error)
            print("----------------------------------------")
            return

        # Use the UUID selected from the assigned-mine list.
        mine_id = self.selected_mine_id

        ins_type = (
            dashboard.ids.type_input.text.strip()
        )

        obs_cat = (
            dashboard.ids.obs_category.text.strip()
        )

        obs_sev = (
            dashboard.ids.obs_severity.text.strip()
        )

        obs_desc = (
            dashboard.ids.obs_description.text.strip()
        )

        if not mine_id:

            dashboard.ids.selected_mine_label.text = (
                "Error: Please select one of your assigned mines."
            )

            return

        if not ins_type or not obs_cat:

            dashboard.ids.gps_label.text = (
                "Error: Inspection Type and Category are required!"
            )

            return

        inspection_id = str(uuid.uuid4())
        observation_id = str(uuid.uuid4())
        safety_measurement_id = str(uuid.uuid4())

        current_date = datetime.date.today().strftime(
            "%Y-%m-%d"
        )

        lat = (
            self.captured_lat
            if self.captured_lat is not None
            else 0.0
        )

        lon = (
            self.captured_long
            if self.captured_long is not None
            else 0.0
        )

        inspector_id = (
            self.current_user.id
            if getattr(self, "current_user", None)
            else None
        )

        # Read the seven validated raw safety parameters.
        oxygen_percent = float(
            dashboard.ids.oxygen_input.text.strip()
        )
        methane_percent = float(
            dashboard.ids.methane_input.text.strip()
        )
        carbon_monoxide_ppm = float(
            dashboard.ids.carbon_monoxide_input.text.strip()
        )
        temperature_celsius = float(
            dashboard.ids.temperature_input.text.strip()
        )
        ventilation_condition = (
            dashboard.ids.ventilation_input.text.strip()
        )
        ground_condition = (
            dashboard.ids.ground_condition_input.text.strip()
        )
        electrical_safety_condition = (
            dashboard.ids.electrical_safety_input.text.strip()
        )

        if not inspector_id:

            dashboard.ids.gps_label.text = (
                "Error: User is not authenticated."
            )

            return

        try:

            with self.db_manager.get_connection() as conn:

                conn.execute(
                    """
                    INSERT INTO inspections
                    (
                        id,
                        mine_id,
                        inspector_id,
                        inspection_type,
                        inspection_date,
                        latitude,
                        longitude,
                        overall_status,
                        summary
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        inspection_id,
                        str(mine_id),
                        inspector_id,
                        ins_type,
                        current_date,
                        lat,
                        lon,
                        "Operational",
                        "Observation logged offline."
                    )
                )

                conn.execute(
                    """
                    INSERT INTO inspection_observations
                    (
                        id,
                        inspection_id,
                        category,
                        description,
                        severity,
                        latitude,
                        longitude,
                        photo_url
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        observation_id,
                        inspection_id,
                        obs_cat,
                        obs_desc,
                        obs_sev,
                        lat,
                        lon,
                        self.captured_photo_path
                    )
                )

                # Store the seven raw safety parameters locally.
                conn.execute(
                    """
                    INSERT INTO inspection_safety_measurements
                    (
                        id,
                        inspection_id,
                        oxygen_percent,
                        methane_percent,
                        carbon_monoxide_ppm,
                        temperature_celsius,
                        ventilation_condition,
                        ground_condition,
                        electrical_safety_condition
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        safety_measurement_id,
                        inspection_id,
                        oxygen_percent,
                        methane_percent,
                        carbon_monoxide_ppm,
                        temperature_celsius,
                        ventilation_condition,
                        ground_condition,
                        electrical_safety_condition
                    )
                )

                conn.commit()

            # Queue the complete inspection record for cloud synchronization.
            inspection_queued = self.sync_queue.queue_operation(
                "inspections",
                inspection_id,
                "INSERT",
                {
                    "id": inspection_id,
                    "mine_id": str(mine_id),
                    "inspector_id": inspector_id,
                    "inspection_type": ins_type,
                    "inspection_date": current_date,
                    "latitude": lat,
                    "longitude": lon,
                    "overall_status": "Operational",
                    "summary": "Observation logged offline."
                }
            )

            if not inspection_queued:
                raise sqlite3.Error(
                    "Failed to queue inspection for cloud synchronization."
                )

            # Queue the observation separately using the same inspection UUID.
            observation_queued = self.sync_queue.queue_operation(
                "observations",
                observation_id,
                "INSERT",
                {
                    "id": observation_id,
                    "inspection_id": inspection_id,
                    "category": obs_cat,
                    "description": obs_desc,
                    "severity": obs_sev,
                    "latitude": lat,
                    "longitude": lon,
                    "photo_url": self.captured_photo_path
                }
            )

            if not observation_queued:
                raise sqlite3.Error(
                    "Failed to queue observation for cloud synchronization."
                )

            # Queue the raw safety measurements separately.
            safety_measurement_queued = self.sync_queue.queue_operation(
                "inspection_safety_measurements",
                safety_measurement_id,
                "INSERT",
                {
                    "id": safety_measurement_id,
                    "inspection_id": inspection_id,
                    "oxygen_percent": oxygen_percent,
                    "methane_percent": methane_percent,
                    "carbon_monoxide_ppm": carbon_monoxide_ppm,
                    "temperature_celsius": temperature_celsius,
                    "ventilation_condition": ventilation_condition,
                    "ground_condition": ground_condition,
                    "electrical_safety_condition": electrical_safety_condition
                }
            )

            if not safety_measurement_queued:
                raise sqlite3.Error(
                    "Failed to queue safety measurements for cloud synchronization."
                )

            print("----------------------------------------")
            print("SYNC QUEUE CREATED")
            print("Inspection ID:", inspection_id)
            print("Observation ID:", observation_id)
            print("Safety Measurement ID:", safety_measurement_id)
            print("Mine UUID:", mine_id)
            print("Inspector UUID:", inspector_id)
            print("----------------------------------------")

            dashboard.ids.gps_label.text = (
                "GPS: Waiting for capture"
            )

            dashboard.ids.validation_status_label.text = (
                "✓ Inspection saved offline successfully."
            )
            dashboard.ids.validation_status_label.theme_text_color = "Custom"
            dashboard.ids.validation_status_label.text_color = (0.55, 0.85, 0.65, 1)

            dashboard.ids.mine_id_input.text = ""
            dashboard.ids.type_input.text = ""
            dashboard.ids.obs_category.text = ""
            dashboard.ids.obs_severity.text = ""
            dashboard.ids.obs_description.text = ""

            dashboard.ids.oxygen_input.text = ""
            dashboard.ids.methane_input.text = ""
            dashboard.ids.carbon_monoxide_input.text = ""
            dashboard.ids.temperature_input.text = ""
            dashboard.ids.ventilation_input.text = (
                "Select: Normal / Attention / Critical"
            )
            dashboard.ids.ground_condition_input.text = (
                "Select: Safe / Attention / Critical"
            )
            dashboard.ids.electrical_safety_input.text = (
                "Select: Safe / Attention / Critical"
            )

            dashboard.ids.photo_label.text = (
                "Attached Photo: None"
            )

            dashboard.ids.mine_selector.text = (
                "Select Assigned Mine"
            )

            dashboard.ids.selected_mine_label.text = (
                f"Assigned Mines: "
                f"{len(self.accessible_mines)} | "
                "Selected Mine: None"
            )

            self.selected_mine_id = None

            self.captured_photo_path = (
                "No Photo Attached"
            )

        except sqlite3.Error as e:

            dashboard.ids.gps_label.text = (
                f"Database Write Error: {e}"
            )

    def load_local_stored_data(self) -> None:

        viewer_screen = self.root.get_screen("viewer")

        container = viewer_screen.ids.logs_container

        container.clear_widgets()

        try:

            with self.db_manager.get_connection() as conn:

                query = """
                    SELECT
                        i.id AS inspection_id,
                        i.mine_id,
                        i.inspection_type,
                        i.inspection_date,
                        o.category,
                        o.severity,
                        o.description,
                        o.photo_url,
                        s.oxygen_percent,
                        s.methane_percent,
                        s.carbon_monoxide_ppm,
                        s.temperature_celsius,
                        s.ventilation_condition,
                        s.ground_condition,
                        s.electrical_safety_condition
                    FROM inspections i
                    JOIN inspection_observations o
                        ON i.id = o.inspection_id
                    LEFT JOIN inspection_safety_measurements s
                        ON i.id = s.inspection_id
                    ORDER BY i.created_at DESC
                """

                records = conn.execute(
                    query
                ).fetchall()

            if not records:

                container.add_widget(
                    MDLabel(
                        text=(
                            "No offline inspection logs "
                            "found in database storage."
                        ),
                        halign="center",
                        size_hint_y=None,
                        height="48dp"
                    )
                )

                return

            for r in records:

                card = MDCard(
                    size_hint_y=None,
                    height="300dp",
                    style="elevated"
                )

                card_content = MDBoxLayout(
                    orientation="vertical",
                    padding="16dp",
                    spacing="6dp"
                )

                title = MDLabel(
                    text=(
                        f"Mine Project: {r['mine_id']} | "
                        f"Type: {r['inspection_type']}"
                    ),
                    font_style="Title",
                    role="small",
                    size_hint_y=None,
                    height="24dp"
                )

                date_lbl = MDLabel(
                    text=(
                        f"Logged: {r['inspection_date']} | "
                        f"Severity Level: {r['severity']}"
                    ),
                    font_style="Body",
                    role="small",
                    size_hint_y=None,
                    height="20dp"
                )

                desc_lbl = MDLabel(
                    text=(
                        f"Detail ({r['category']}): "
                        f"{r['description']}"
                    ),
                    font_style="Body",
                    role="medium",
                    size_hint_y=None,
                    height="44dp"
                )

                safety_lbl = MDLabel(
                    text=(
                        "Safety Measurements:\n"
                        f"O₂: {r['oxygen_percent']}%  |  "
                        f"CH₄: {r['methane_percent']}%  |  "
                        f"CO: {r['carbon_monoxide_ppm']} ppm  |  "
                        f"Temperature: {r['temperature_celsius']}°C\n"
                        f"Ventilation: {r['ventilation_condition']}  |  "
                        f"Ground: {r['ground_condition']}  |  "
                        f"Electrical: {r['electrical_safety_condition']}"
                    ),
                    font_style="Body",
                    role="small",
                    size_hint_y=None,
                    height="72dp"
                )

                img_lbl = MDLabel(
                    text=(
                        f"Photo Disk Track: "
                        f"{r['photo_url']}"
                    ),
                    font_style="Body",
                    role="small",
                    size_hint_y=None,
                    height="20dp"
                )

                card_content.add_widget(title)
                card_content.add_widget(date_lbl)
                card_content.add_widget(desc_lbl)
                card_content.add_widget(safety_lbl)
                card_content.add_widget(img_lbl)

                card.add_widget(card_content)

                container.add_widget(card)

        except sqlite3.Error as e:

            container.add_widget(
                MDLabel(
                    text=(
                        f"Error querying database disk: {e}"
                    ),
                    halign="center"
                )
            )

    def trigger_cloud_sync_from_ui(self) -> None:

        from sync.sync_engine import SyncEngine

        # Read Supabase credentials from .env.
        # The real publishable key is never stored in main.py.
        SUPABASE_URL = os.getenv("SUPABASE_URL")

        SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

        if not SUPABASE_URL:
            print(
                "Cloud sync aborted: SUPABASE_URL is missing from .env."
            )
            return

        if not SUPABASE_ANON_KEY:
            print(
                "Cloud sync aborted: SUPABASE_ANON_KEY is missing from .env."
            )
            return

        # Use the authenticated user's JWT for Supabase RLS.
        access_token = None

        if self.current_session:
            access_token = getattr(
                self.current_session,
                "access_token",
                None
            )

        if not access_token:
            print(
                "Cloud sync aborted: no authenticated "
                "Supabase access token is available."
            )
            return

        engine = SyncEngine(
            self.db_manager,
            SUPABASE_URL,
            SUPABASE_ANON_KEY,
            access_token=access_token
        )

        print(
            "Starting live cloud synchronization "
            "check block..."
        )

        results = (
            engine.synchronize_offline_queue()
        )

        print(
            f"Sync execution metrics processed -> {results}"
        )


if __name__ == "__main__":
    MineGuardAIApp().run()
