"""
Unit tests for Phase 14: Backup Manager, Disaster Recovery, and Health Monitor
"""

import os
import shutil
import sqlite3
import tempfile
import unittest
from crypto_ai_trader.app.data.backup_manager import DatabaseBackupManager
from crypto_ai_trader.app.core.health_monitor import SystemHealthMonitor


class TestPhase14Production(unittest.TestCase):

    def setUp(self):
        self.temp_dir = tempfile.mkdtemp()
        self.db_path = os.path.join(self.temp_dir, "test_trader.db")
        self.backup_dir = os.path.join(self.temp_dir, "backups")

        # Initialize source db with mock sensitive settings
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT)")
            conn.execute("CREATE TABLE trades (id TEXT PRIMARY KEY, symbol TEXT, pnl REAL)")
            conn.execute("INSERT INTO settings VALUES ('api_key', 'SUPER_SECRET_KEY')")
            conn.execute("INSERT INTO settings VALUES ('bot_mode', 'PAPER')")
            conn.execute("INSERT INTO trades VALUES ('T1', 'BTC/USDT', 154.20)")
            conn.commit()

        self.backup_mgr = DatabaseBackupManager(
            db_path=self.db_path,
            backup_dir=self.backup_dir,
            max_retention=3
        )
        self.health_monitor = SystemHealthMonitor(db_path=self.db_path)

    def tearDown(self):
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_create_and_sanitize_backup(self):
        meta = self.backup_mgr.create_backup(sanitize_secrets=True)
        self.assertTrue(os.path.exists(meta.file_path))
        self.assertTrue(meta.integrity_verified)
        self.assertTrue(meta.is_sanitized)
        self.assertIn("trades", meta.tables_backed_up)
        self.assertIn("settings", meta.tables_backed_up)

        # Verify secret was sanitized in backup
        with sqlite3.connect(meta.file_path) as conn:
            cur = conn.cursor()
            cur.execute("SELECT value FROM settings WHERE key = 'api_key'")
            val = cur.fetchone()[0]
            self.assertEqual(val, "[REDACTED_FOR_BACKUP]")

    def test_disaster_recovery_restore(self):
        # 1. Create a backup
        meta = self.backup_mgr.create_backup(sanitize_secrets=False)
        
        # 2. Simulate disaster: corrupt or delete current DB
        os.remove(self.db_path)
        self.assertFalse(os.path.exists(self.db_path))

        # 3. Restore from backup snapshot
        restored = self.backup_mgr.restore_from_backup(meta.file_path)
        self.assertTrue(restored)
        self.assertTrue(os.path.exists(self.db_path))

        # 4. Verify data survived
        with sqlite3.connect(self.db_path) as conn:
            cur = conn.cursor()
            cur.execute("SELECT symbol, pnl FROM trades WHERE id = 'T1'")
            row = cur.fetchone()
            self.assertEqual(row, ("BTC/USDT", 154.20))

    def test_retention_pruning(self):
        # Create 5 backups with max_retention = 3
        for _ in range(5):
            self.backup_mgr.create_backup()
        
        backups = self.backup_mgr.list_backups()
        self.assertLessEqual(len(backups), 3)

    def test_system_health_report(self):
        self.health_monitor.record_ws_latency(38.5)
        report = self.health_monitor.generate_report()
        self.assertEqual(report.status, "HEALTHY")
        self.assertEqual(report.ws_latency_ms, 38.5)
        self.assertGreaterEqual(report.uptime_seconds, 0.0)

        # High latency trigger degraded
        self.health_monitor.record_ws_latency(650.0)
        report2 = self.health_monitor.generate_report()
        self.assertEqual(report2.status, "DEGRADED")


if __name__ == "__main__":
    unittest.main()
