import sqlite3
import json
import logging
from typing import Dict, Any, List
from database.sqlite_manager import SQLiteManager

logger = logging.getLogger("MineGuardAI.SyncQueue")

class SyncQueue:
    def __init__(self, db_manager: SQLiteManager):
        self.db = db_manager

    def queue_operation(self, table_name: str, record_id: str, action: str, payload: Dict[str, Any]) -> bool:
        """Serializes and logs an operation into the transaction sync queue."""
        query = """
            INSERT INTO sync_queue (table_name, record_id, action, payload)
            VALUES (?, ?, ?, ?)
        """
        try:
            with self.db.get_connection() as conn:
                conn.execute(query, (table_name, record_id, action, json.dumps(payload)))
                conn.commit()
            logger.info(f"Operation queued successfully for table: {table_name} (Record ID: {record_id})")
            return True
        except sqlite3.Error as e:
            logger.error(f"Failed to append transaction mutation to sync queue: {e}")
            return False

    def get_pending_queue(self) -> List[sqlite3.Row]:
        """Fetches all sequential mutations waiting to pass safely to Supabase."""
        query = "SELECT * FROM sync_queue WHERE status = 'PENDING' ORDER BY timestamp ASC"
        with self.db.get_connection() as conn:
            return conn.execute(query).fetchall()
