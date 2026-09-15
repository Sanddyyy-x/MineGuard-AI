import sqlite3
import logging
from typing import Optional

logger = logging.getLogger("MineGuardAI.SQLiteManager")


class SQLiteManager:
    def __init__(self, db_path: str = "mineguard_local.db"):
        self.db_path = db_path
        self._initialize_database()

    def get_connection(self) -> sqlite3.Connection:
        """Returns a standard thread-safe connection to the SQLite local database."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _initialize_database(self) -> None:
        """Creates the mirrored Supabase schemas and local synchronization queue."""
        queries = [
            # Mirrored table: inspections
            """CREATE TABLE IF NOT EXISTS inspections (
                id TEXT PRIMARY KEY,
                mine_id TEXT NOT NULL,
                inspector_id TEXT NOT NULL,
                inspection_type TEXT,
                inspection_date TEXT,
                latitude REAL,
                longitude REAL,
                overall_status TEXT,
                summary TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );""",

            # Mirrored table: inspection_observations
            """CREATE TABLE IF NOT EXISTS inspection_observations (
                id TEXT PRIMARY KEY,
                inspection_id TEXT NOT NULL,
                category TEXT,
                description TEXT,
                severity TEXT,
                latitude REAL,
                longitude REAL,
                photo_url TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(inspection_id)
                    REFERENCES inspections(id) ON DELETE CASCADE
            );""",

            # Mirrored table: inspection_safety_measurements
            # One safety-measurement record per inspection.
            """CREATE TABLE IF NOT EXISTS inspection_safety_measurements (
                id TEXT PRIMARY KEY,
                inspection_id TEXT NOT NULL UNIQUE,
                oxygen_percent REAL,
                methane_percent REAL,
                carbon_monoxide_ppm REAL,
                temperature_celsius REAL,
                ventilation_condition TEXT,
                ground_condition TEXT,
                electrical_safety_condition TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(inspection_id)
                    REFERENCES inspections(id) ON DELETE CASCADE
            );""",

            # Mirrored table: violations
            """CREATE TABLE IF NOT EXISTS violations (
                id TEXT PRIMARY KEY,
                mine_id TEXT NOT NULL,
                observation_id TEXT,
                violation_code TEXT,
                title TEXT,
                description TEXT,
                category TEXT,
                severity TEXT,
                status TEXT,
                detected_date TEXT,
                resolved_date TEXT,
                recurring INTEGER DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );""",

            # Local-Only table: synchronization queue
            """CREATE TABLE IF NOT EXISTS sync_queue (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                table_name TEXT NOT NULL,
                record_id TEXT NOT NULL,
                action TEXT NOT NULL,
                payload TEXT NOT NULL,
                timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
                retry_count INTEGER DEFAULT 0,
                status TEXT DEFAULT 'PENDING'
            );"""
        ]

        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                for query in queries:
                    cursor.execute(query)
                conn.commit()
            logger.info("Local SQLite core infrastructure successfully mounted.")
        except sqlite3.Error as e:
            logger.critical(f"Failed to mount SQLite core infrastructure: {e}")
            raise
