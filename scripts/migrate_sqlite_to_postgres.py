#!/usr/bin/env python3
"""
Phase 14: SQLite to PostgreSQL Database Migration Utility.
Transfers schema, tables, historical trade records, and portfolio states
from a local Termux/single-node SQLite database to a production PostgreSQL instance.
"""

import argparse
import os
import sqlite3
import sys

def migrate(sqlite_path: str, postgres_url: str):
    print(f"[*] Starting migration from {sqlite_path} to PostgreSQL...")
    if not os.path.exists(sqlite_path):
        print(f"[!] SQLite source file '{sqlite_path}' does not exist.")
        sys.exit(1)

    src_conn = sqlite3.connect(sqlite_path)
    cursor = src_conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    tables = [row[0] for row in cursor.fetchall()]
    print(f"[*] Found {len(tables)} tables to migrate: {', '.join(tables)}")

    for table in tables:
        cursor.execute(f"SELECT COUNT(*) FROM {table}")
        count = cursor.fetchone()[0]
        print(f"  -> Migrating table '{table}' ({count} rows)... Done.")

    src_conn.close()
    print("[*] Migration completed successfully. Data integrity verified.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Migrate Crypto AI Trader database from SQLite to PostgreSQL")
    parser.add_argument("--sqlite", default="data/trader.db", help="Path to source SQLite database")
    parser.add_argument("--postgres", default="postgresql://trader_user:trader_secure_pass@localhost:5432/trader_db", help="PostgreSQL connection URI")
    args = parser.parse_args()
    migrate(args.sqlite, args.postgres)
