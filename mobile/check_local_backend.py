import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent / "mineguard_local.db"

print("=" * 60)
print("MINEGUARD LOCAL BACKEND / SQLITE CHECK")
print("=" * 60)

if not DB_PATH.exists():
    print("FAIL: mineguard_local.db was not found.")
    print(f"Expected: {DB_PATH}")
    raise SystemExit(1)

conn = sqlite3.connect(DB_PATH)
conn.row_factory = sqlite3.Row
cur = conn.cursor()

# 1. Tables
cur.execute("""
    SELECT name
    FROM sqlite_master
    WHERE type = 'table'
    ORDER BY name
""")
tables = [row["name"] for row in cur.fetchall()]

print("\n[1] LOCAL TABLES")
for table in tables:
    print("PASS:", table)

required = {
    "inspections",
    "inspection_observations",
    "violations",
    "sync_queue",
}
missing = required - set(tables)

if missing:
    print("FAIL: Missing required tables:", ", ".join(sorted(missing)))
else:
    print("PASS: All required local tables exist.")

# 2. Counts
print("\n[2] RECORD COUNTS")
for table in ["inspections", "inspection_observations", "violations", "sync_queue"]:
    if table in tables:
        cur.execute(f"SELECT COUNT(*) AS count FROM {table}")
        print(f"{table}: {cur.fetchone()['count']}")

# 3. Latest inspection
print("\n[3] LATEST LOCAL INSPECTION")
if "inspections" in tables:
    cur.execute("""
        SELECT id, mine_id, inspector_id, inspection_type,
               inspection_date, latitude, longitude,
               overall_status, summary
        FROM inspections
        ORDER BY rowid DESC
        LIMIT 1
    """)
    row = cur.fetchone()
    if row:
        for key in row.keys():
            print(f"{key}: {row[key]}")
        print("PASS: Latest inspection record exists.")
    else:
        print("WARN: No inspection records found.")

# 4. Latest observation
print("\n[4] LATEST LOCAL OBSERVATION")
if "inspection_observations" in tables:
    cur.execute("""
        SELECT id, inspection_id, category, description, severity,
               latitude, longitude, photo_url
        FROM inspection_observations
        ORDER BY rowid DESC
        LIMIT 1
    """)
    row = cur.fetchone()
    if row:
        for key in row.keys():
            print(f"{key}: {row[key]}")
        print("PASS: Latest observation record exists.")
    else:
        print("WARN: No observation records found.")

# 5. Latest queue operations
print("\n[5] LATEST SYNC QUEUE")
if "sync_queue" in tables:
    cur.execute("""
        SELECT id, table_name, record_id, action,
               retry_count, status, timestamp
        FROM sync_queue
        ORDER BY id DESC
        LIMIT 10
    """)
    rows = cur.fetchall()
    if rows:
        for row in rows:
            print(
                f"queue_id={row['id']} | "
                f"table={row['table_name']} | "
                f"record_id={row['record_id']} | "
                f"action={row['action']} | "
                f"status={row['status']} | "
                f"retry={row['retry_count']} | "
                f"time={row['timestamp']}"
            )
        print("PASS: Sync queue can be read.")
    else:
        print("WARN: Sync queue is empty.")

# 6. Foreign-key consistency for latest observation
print("\n[6] LOCAL RELATION CHECK")
if "inspections" in tables and "inspection_observations" in tables:
    cur.execute("""
        SELECT o.id, o.inspection_id
        FROM inspection_observations o
        LEFT JOIN inspections i ON i.id = o.inspection_id
        WHERE i.id IS NULL
        LIMIT 10
    """)
    orphaned = cur.fetchall()
    if orphaned:
        print("FAIL: Orphaned observations found:", len(orphaned))
        for row in orphaned:
            print(row["id"], "->", row["inspection_id"])
    else:
        print("PASS: No orphaned observations found.")

conn.close()

print("\n" + "=" * 60)
print("LOCAL CHECK COMPLETE")
print("=" * 60)
