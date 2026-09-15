import sqlite3
import uuid
import logging
from typing import Dict, Any, Optional
from database.sqlite_manager import SQLiteManager
from sync.sync_queue import SyncQueue

logger = logging.getLogger("MineGuardAI.InspectionRepository")

class InspectionRepository:
    def __init__(self, db_manager: SQLiteManager, sync_queue: SyncQueue):
        self.db = db_manager
        self.sync_queue = sync_queue

    def create_offline_inspection(self, data: Dict[str, Any]) -> Optional[str]:
        """Saves a raw inspection inside the SQLite device engine and queues it for the cloud sync."""
        if not data.get("id"):
            data["id"] = str(uuid.uuid4()) # Generate robust uniform primary string key offline

        query = """
            INSERT INTO inspections (id, mine_id, inspector_id, inspection_type, inspection_date, latitude, longitude, overall_status, summary)
            VALUES (:id, :mine_id, :inspector_id, :inspection_type, :inspection_date, :latitude, :longitude, :overall_status, :summary)
        """
        try:
            with self.db.get_connection() as conn:
                conn.execute(query, data)
                conn.commit()
            
            # Put transaction securely in sync pipeline queue
            self.sync_queue.queue_operation("inspections", data["id"], "INSERT", data)
            return data["id"]
        except sqlite3.Error as e:
            logger.error(f"Critical execution error during native inspection save: {e}")
            return None
