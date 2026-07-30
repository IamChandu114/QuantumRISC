from __future__ import annotations

from typing import Any


class MetricsEngine:
    def analyze(self, timeline: list[dict[str, Any]], hazards: list[dict[str, Any]]) -> dict[str, Any]:
        cycles = len({sample.get("time") for sample in timeline})
        retired = len(self._program_events(timeline))
        stalls = 0
        ipc = round(retired / cycles, 3) if cycles else 0.0
        cpi = round(cycles / retired, 3) if retired else 0.0
        return {
            "cycles": cycles,
            "retired": retired,
            "stalls": stalls,
            "hazards": len(hazards),
            "ipc": ipc,
            "cpi": cpi,
        }

    def _program_events(self, timeline: list[dict[str, Any]]) -> list[dict[str, Any]]:
        events = []
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
