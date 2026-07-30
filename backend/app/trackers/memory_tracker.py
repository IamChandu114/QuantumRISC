from __future__ import annotations

from typing import Any


class MemoryTracker:
    def snapshot(self, timeline: list[dict[str, Any]]) -> dict[str, Any]:
        window = []
        events = self._program_events(timeline)
        for idx, sample in enumerate(events[:16]):
            window.append({
                "address": f"0x{idx * 4:08X}",
                "value": f"0x{sample['instr']:08X}",
            })
        return {"base": "0x00000000", "words": window}

    def _program_events(self, timeline: list[dict[str, Any]]) -> list[dict[str, Any]]:
        events: list[dict[str, Any]] = []
        seen: set[int] = set()
        for sample in timeline:
            changed = sample.get("changed", {})
            rd = self._to_int(
                changed.get("pipeline_cpu_complete_tb.DUT.RF.rd [4:0]")
                or changed.get("cpu_top_tb.dut.rd [4:0]")
            )
            instr = self._to_int(
                changed.get("pipeline_cpu_complete_tb.DUT.if_instruction [31:0]")
                or changed.get("cpu_top_tb.dut.instruction_debug [31:0]")
                or changed.get("cpu_top_tb.dut.instruction [31:0]")
            )
            writeback = self._to_int(
                changed.get("pipeline_cpu_complete_tb.DUT.RF.write_data [31:0]")
                or changed.get("cpu_top_tb.dut.alu_result [31:0]")
            )
            if rd is None or instr is None or rd == 0 or rd in seen or writeback is None or writeback == 0:
                continue
            seen.add(rd)
            events.append({"rd": rd, "instr": instr})
        return events

    def _to_int(self, value: Any) -> int | None:
        if value is None:
            return None
        text = str(value).strip()
        if text == "" or any(ch in text for ch in "xXzZ"):
            return None
        if all(ch in "01" for ch in text):
            try:
                return int(text, 2)
            except ValueError:
                return None
        try:
            return int(text, 0)
        except ValueError:
            return None
