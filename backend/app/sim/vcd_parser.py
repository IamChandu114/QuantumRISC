from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
import re
from typing import Any


@dataclass
class VCDSignal:
    code: str
    name: str
    scope: str
    size: int | None = None

    @property
    def full_name(self) -> str:
        return f"{self.scope}.{self.name}" if self.scope else self.name


@dataclass
class VCDParseResult:
    signals: dict[str, VCDSignal] = field(default_factory=dict)
    timeline: list[dict[str, Any]] = field(default_factory=list)
    samples: dict[str, Any] = field(default_factory=dict)
    max_time: int = 0


class VCDParser:
    VAR_RE = re.compile(r"^\$var\s+\w+\s+(\d+)\s+(\S+)\s+(.+?)\s+\$end$")

    def parse(self, path: Path) -> VCDParseResult:
        result = VCDParseResult()
        if not path.exists():
            return result

        current_scope: list[str] = []
        code_to_signals: dict[str, list[VCDSignal]] = {}
        current_time = 0
        current_values: dict[str, str] = {}
        in_definitions = True
        has_pending_changes = False

        def commit_sample(time_val: int) -> None:
            nonlocal has_pending_changes
            if has_pending_changes or not result.timeline:
                result.timeline.append({
                    "time": time_val,
                    "changed": dict(current_values),
                })
                result.max_time = max(result.max_time, time_val)
                has_pending_changes = False

        for raw_line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
            line = raw_line.strip()
            if not line:
                continue
            if line.startswith("$scope"):
                parts = line.split()
                if len(parts) >= 3:
                    current_scope.append(parts[2])
                continue
            if line.startswith("$upscope"):
                if current_scope:
                    current_scope.pop()
                continue
            if line.startswith("$var"):
                m = self.VAR_RE.match(line)
                if m:
                    size = int(m.group(1))
                    code = m.group(2)
                    name = m.group(3).strip()
                    scope = ".".join(current_scope)
                    sig = VCDSignal(code=code, name=name, scope=scope, size=size)
                    code_to_signals.setdefault(code, []).append(sig)
                    result.signals[sig.full_name] = sig
                continue
            if line.startswith("$enddefinitions"):
                in_definitions = False
                continue
            if in_definitions:
                continue

            if line.startswith("#"):
                new_time = int(line[1:])
                if has_pending_changes:
                    commit_sample(current_time)
                current_time = new_time
                continue

            if line.startswith("$dumpvars") or line.startswith("$dumpall") or line.startswith("$end") or line.startswith("$comment"):
                continue

            if line[0] in "01xzXZ":
                value = line[0]
                code = line[1:]
                signals = code_to_signals.get(code, [])
                for sig in signals:
                    current_values[sig.full_name] = value
                if signals:
                    has_pending_changes = True
            elif line[0] == "b" or line[0] == "B":
                parts = line[1:].split(maxsplit=1)
                if len(parts) == 2:
                    bits, code = parts
                    signals = code_to_signals.get(code, [])
                    for sig in signals:
                        current_values[sig.full_name] = bits
                    if signals:
                        has_pending_changes = True

        if has_pending_changes or not result.timeline:
            commit_sample(current_time)

        if result.timeline:
            result.samples = result.timeline[-1]["changed"]
        return result

