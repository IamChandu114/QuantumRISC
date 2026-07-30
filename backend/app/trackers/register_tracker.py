from __future__ import annotations

from typing import Any


ABI_NAMES = [
    "zero", "ra", "sp", "gp", "tp", "t0", "t1", "t2",
    "s0", "s1", "a0", "a1", "a2", "a3", "a4", "a5",
    "a6", "a7", "s2", "s3", "s4", "s5", "s6", "s7",
    "s8", "s9", "s10", "s11", "t3", "t4", "t5", "t6",
]


class RegisterTracker:
    def snapshot(self, timeline: list[dict[str, Any]]) -> list[dict[str, Any]]:
        registers = [0] * 32
        for sample in self._program_events(timeline):
            rd = sample["rd"]
            writeback = sample["writeback"]
            if rd != 0 and writeback is not None:
                registers[rd] = writeback & 0xFFFF_FFFF
        return [
            {
                "index": idx,
                "name": f"x{idx}",
                "abi": ABI_NAMES[idx],
                "value": f"0x{registers[idx]:08X}",
            }
            for idx in range(32)
        ]

    def _program_events(self, timeline: list[dict[str, Any]]) -> list[dict[str, Any]]:
        events: list[dict[str, Any]] = []
        seen: set[int] = set()
        for sample in timeline:
            changed = sample.get("changed", {})
            rd = self._to_int(
                changed.get("pipeline_cpu_complete_tb.DUT.RF.rd [4:0]")
                or changed.get("cpu_top_tb.dut.rd [4:0]")
            )
            writeback = self._to_int(
                changed.get("pipeline_cpu_complete_tb.DUT.RF.write_data [31:0]")
                or changed.get("cpu_top_tb.dut.alu_result [31:0]")
            )
            instr = self._to_int(
                changed.get("pipeline_cpu_complete_tb.DUT.if_instruction [31:0]")
                or changed.get("cpu_top_tb.dut.instruction_debug [31:0]")
                or changed.get("cpu_top_tb.dut.instruction [31:0]")
            )
            if rd is None or instr is None or rd == 0 or rd in seen or writeback is None or writeback == 0:
                continue
            seen.add(rd)
            events.append({"rd": rd, "instr": instr, "writeback": writeback})
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
