from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import os


@dataclass(frozen=True)
class Settings:
    repo_root: Path
    backend_root: Path
    frontend_root: Path
    runs_root: Path
    default_top: str = "pipeline_cpu_complete_tb"
    smoke_top: str = "cpu_top_tb"
    iverilog_path: str = os.getenv("QUANTUMRISC_IVERILOG", r"C:\iverilog\bin\iverilog.exe")
    vvp_path: str = os.getenv("QUANTUMRISC_VVP", r"C:\iverilog\bin\vvp.exe")


def get_settings() -> Settings:
    backend_root = Path(__file__).resolve().parents[2]
    repo_root = backend_root.parent
    return Settings(
        repo_root=repo_root,
        backend_root=backend_root,
        frontend_root=repo_root / "frontend",
        runs_root=repo_root / "runs",
    )

