from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


class FileEntry(BaseModel):
    path: str
    kind: Literal["rtl", "tb", "verification", "docs", "other"]
    module_names: list[str] = Field(default_factory=list)


class DiscoveryResponse(BaseModel):
    tops: list[str]
    smoke_tops: list[str]
    testbenches: list[str]
    rtl_files: list[FileEntry]
    verification_files: list[FileEntry]
    default_top: str
    default_testbench: str


class SessionCreateRequest(BaseModel):
    top: str | None = None
    testbench: str | None = None


class SessionCreateResponse(BaseModel):
    id: str
    top: str
    testbench: str
    created_at: datetime


class CompileResponse(BaseModel):
    ok: bool
    returncode: int
    stdout: str = ""
    stderr: str = ""
    executable: str | None = None
    vcd_path: str | None = None


class RunResponse(BaseModel):
    ok: bool
    returncode: int
    stdout: str = ""
    stderr: str = ""
    vcd_path: str | None = None


class SessionSnapshot(BaseModel):
    session_id: str
    status: str
    top: str
    testbench: str
    created_at: datetime
    updated_at: datetime
    discovery: dict[str, Any] = Field(default_factory=dict)
    playback: dict[str, Any] = Field(default_factory=dict)
    compile: dict[str, Any] = Field(default_factory=dict)
    run: dict[str, Any] = Field(default_factory=dict)
    architecture: dict[str, Any] = Field(default_factory=dict)
    registers: list[dict[str, Any]] = Field(default_factory=list)
    memory: dict[str, Any] = Field(default_factory=dict)
    pipeline: dict[str, Any] = Field(default_factory=dict)
    hazards: list[dict[str, Any]] = Field(default_factory=list)
    forwarding: list[dict[str, Any]] = Field(default_factory=list)
    metrics: dict[str, Any] = Field(default_factory=dict)
    waveforms: dict[str, Any] = Field(default_factory=dict)
    vcd: dict[str, Any] = Field(default_factory=dict)
    cache: dict[str, Any] = Field(default_factory=dict)
    branch: dict[str, Any] = Field(default_factory=dict)
    verification: dict[str, Any] = Field(default_factory=dict)
    fpga: dict[str, Any] = Field(default_factory=dict)
