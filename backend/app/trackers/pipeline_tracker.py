from __future__ import annotations

from typing import Any


class PipelineTracker:
    def snapshot(self, timeline: list[dict[str, Any]]) -> dict[str, Any]:
        changed = timeline[-1].get("changed", {}) if timeline else {}
        return {
            "pc": self._fmt(self._get_signal(changed, ["pc_current", "if_pc", "pc_debug", "pc_out", "pc"])),
            "instruction": self._fmt(self._get_signal(changed, ["if_instruction", "instruction_debug", "instruction_out", "instruction"])),
            "opcode": self._fmt(self._get_signal(changed, ["opcode"])),
            "rs1": self._fmt(self._get_signal(changed, ["rs1"])),
            "rs2": self._fmt(self._get_signal(changed, ["rs2"])),
            "rd": self._fmt(self._get_signal(changed, ["rd"])),
            "immediate": self._fmt(self._get_signal(changed, ["immediate"])),
            "alu_result": self._fmt(self._get_signal(changed, ["alu_result", "result"])),
            "writeback_data": self._fmt(self._get_signal(changed, ["writeback_data", "write_data"])),
            "regwrite": self._fmt(self._get_signal(changed, ["RegWrite", "we"])),
        }

    def _get_signal(self, changed: dict[str, Any], candidates: list[str]) -> Any:
        for cand in candidates:
            for key, val in changed.items():
                lower = key.lower()
                if lower.endswith(f".{cand}") or f".{cand} " in lower or lower.endswith(f".{cand} [") or key == cand:
                    return val
        return None

    def _fmt(self, value: Any) -> str:
        if value is None:
            return "0x0"
        text = str(value).strip()
        if text == "":
            return "0x0"
        if all(ch in "01" for ch in text):
            try:
                return f"0x{int(text, 2):X}"
            except ValueError:
                return text
        return text

