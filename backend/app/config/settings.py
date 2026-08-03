from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import os
import platform
import shutil


@dataclass(frozen=True)
class Settings:
    repo_root: Path
    backend_root: Path
    frontend_root: Path
    runs_root: Path
    host: str
    port: int
    cors_origins: list[str]
    sqlite_db_path: Path
    default_top: str = "pipeline_cpu_complete_tb"
    smoke_top: str = "cpu_top_tb"
    iverilog_path: str = "iverilog"
    vvp_path: str = "vvp"


def get_settings() -> Settings:
    backend_root = Path(__file__).resolve().parents[2]
    repo_root = backend_root.parent
    runs_root = repo_root / "runs"
    
    # Cross-platform Icarus Verilog resolution
    is_windows = platform.system() == "Windows"
    
    # Check env vars first
    env_iverilog = os.getenv("QUANTUMRISC_IVERILOG")
    env_vvp = os.getenv("QUANTUMRISC_VVP")
    
    if env_iverilog:
        iverilog_path = env_iverilog
    elif is_windows:
        win_default = r"C:\iverilog\bin\iverilog.exe"
        if Path(win_default).exists():
            iverilog_path = win_default
        else:
            iverilog_path = shutil.which("iverilog") or "iverilog"
    else:
        iverilog_path = shutil.which("iverilog") or "iverilog"

    if env_vvp:
        vvp_path = env_vvp
    elif is_windows:
        win_default = r"C:\iverilog\bin\vvp.exe"
        if Path(win_default).exists():
            vvp_path = win_default
        else:
            vvp_path = shutil.which("vvp") or "vvp"
    else:
        vvp_path = shutil.which("vvp") or "vvp"

    # CORS configuration
    cors_raw = os.getenv("CORS_ORIGINS", "*")
    if cors_raw == "*":
        cors_origins = ["*"]
    else:
        cors_origins = [orig.strip() for orig in cors_raw.split(",") if orig.strip()]

    # SQLite DB location
    sqlite_raw = os.getenv("SQLITE_DB_PATH", "runs/sessions.db")
    sqlite_db_path = Path(sqlite_raw)
    if not sqlite_db_path.is_absolute():
        sqlite_db_path = repo_root / sqlite_db_path

    return Settings(
        repo_root=repo_root,
        backend_root=backend_root,
        frontend_root=repo_root / "frontend",
        runs_root=runs_root,
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", "8000")),
        cors_origins=cors_origins,
        sqlite_db_path=sqlite_db_path,
        iverilog_path=iverilog_path,
        vvp_path=vvp_path,
    )


