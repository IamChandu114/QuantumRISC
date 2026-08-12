from __future__ import annotations

import json
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Any, TYPE_CHECKING

if TYPE_CHECKING:
    from app.sessions.manager import SessionRecord


def init_db(db_path: Path) -> None:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(db_path))
    try:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                top TEXT,
                testbench TEXT,
                status TEXT,
                created_at TEXT,
                updated_at TEXT,
                compile TEXT,
                run TEXT,
                parsed TEXT,
                timeline TEXT,
                cursor INTEGER,
                paused INTEGER,
                playback_mode TEXT,
                vcd_path TEXT,
                build_path TEXT,
                workdir TEXT,
                output_path TEXT
            )
        """)
        conn.commit()
    finally:
        conn.close()


def save_session(db_path: Path, session: "SessionRecord") -> None:
    conn = sqlite3.connect(str(db_path))
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT OR REPLACE INTO sessions (
                id, top, testbench, status, created_at, updated_at,
                compile, run, parsed, timeline, cursor, paused,
                playback_mode, vcd_path, build_path, workdir, output_path
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                session.id,
                session.top,
                session.testbench,
                session.status,
                session.created_at.isoformat(),
                session.updated_at.isoformat(),
                json.dumps(session.compile),
                json.dumps(session.run),
                json.dumps(session.parsed),
                json.dumps(session.timeline),
                session.cursor,
                1 if session.paused else 0,
                session.playback_mode,
                str(session.vcd_path) if session.vcd_path else None,
                str(session.build_path) if session.build_path else None,
                str(session.workdir) if session.workdir else None,
                str(session.output_path) if session.output_path else None,
            ),
        )
        conn.commit()
    finally:
        conn.close()


def load_sessions(db_path: Path) -> dict[str, "SessionRecord"]:
    if not db_path.exists():
        return {}
    conn = sqlite3.connect(str(db_path))
    from app.sessions.manager import SessionRecord
    sessions: dict[str, SessionRecord] = {}
    try:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM sessions")
        rows = cursor.fetchall()
        for row in rows:
            created_at = datetime.fromisoformat(row["created_at"])
            updated_at = datetime.fromisoformat(row["updated_at"])
            
            record = SessionRecord(
                id=row["id"],
                top=row["top"],
                testbench=row["testbench"],
                created_at=created_at,
                updated_at=updated_at,
                status=row["status"],
                compile=json.loads(row["compile"] or "{}"),
                run=json.loads(row["run"] or "{}"),
                parsed=json.loads(row["parsed"] or "{}"),
                timeline=json.loads(row["timeline"] or "[]"),
                cursor=row["cursor"],
                paused=bool(row["paused"]),
                playback_mode=row["playback_mode"],
                vcd_path=Path(row["vcd_path"]) if row["vcd_path"] else None,
                build_path=Path(row["build_path"]) if row["build_path"] else None,
                workdir=Path(row["workdir"]) if row["workdir"] else None,
                output_path=Path(row["output_path"]) if row["output_path"] else None,
            )
            sessions[record.id] = record
    except Exception:
        # Ignore errors loading corrupt sessions and return empty or partial dict
        pass
    finally:
        conn.close()
    return sessions
