import os
import logging
import hashlib
import pymysql

pymysql.install_as_MySQLdb()
import MySQLdb

logger = logging.getLogger(__name__)

DB_HOST = os.getenv("DB_HOST", "database")
DB_USER = os.getenv("DB_USER", "rms_user")
DB_PASSWORD = os.getenv("DB_PASSWORD", "z61kbNQgrbi6sS7oNOw9CGVx")
DB_NAME = os.getenv("DB_NAME", "se_assessment1_rms")

db_config = {"host": DB_HOST, "user": DB_USER, "passwd": DB_PASSWORD, "db": DB_NAME}

logger.info("Connecting to MySQL service at host: %s", DB_HOST)
conn = MySQLdb.connect(**db_config)


def secure_hash(text: str) -> str:
    """Computes a SHA-256 signature string to avoid plain-text storage."""
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def init_db():
    cursor = conn.cursor()

    try:
        # 1. User Directories Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            role VARCHAR(20) NOT NULL CHECK (
            role IN ('Commander', 'Viewer', 'Auditor'))
            );
        """)

        # 2. Simplified Operational Audit Log table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS mission_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            username VARCHAR(50) NOT NULL,
            action VARCHAR(100) NOT NULL,
            details TEXT
            );
        """)

        # 3. Seed default testing accounts if database is empty
        cursor.execute("SELECT COUNT(*) FROM users")
        if cursor.fetchone()[0] == 0:
            logger.info("Empty database detected")

            cursor.execute(
                """
                INSERT INTO users 
                (username, password_hash, role)
                VALUES 
                (%s, %s, %s);
            """,
                ("commander", secure_hash("commanderpass123"), "Commander"),
            )

            cursor.execute(
                """
                INSERT INTO users 
                (username, password_hash, role)
                VALUES 
                (%s, %s, %s);
            """,
                ("viewer", secure_hash("viewerpass123"), "Viewer"),
            )

            cursor.execute(
                """
                INSERT INTO users 
                (username, password_hash, role)
                VALUES 
                (%s, %s, %s);
            """,
                ("auditor", secure_hash("auditorpass123"), "Auditor"),
            )

        conn.commit()
        logger.info("MySQL tables verified and successfully updated.")

    except Exception as error:
        conn.rollback()
        logger.error("Database startup execution failed: %s", error)
        raise error
    finally:
        cursor.close()
