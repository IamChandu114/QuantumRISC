from __future__ import annotations

from typing import Any


class MetricsEngine:
    def analyze(self, timeline: list[dict[str, Any]], hazards: list[dict[str, Any]]) -> dict[str, Any]:
        if not timeline:
            return {
                "cycles": 0,
                "retired": 0,
                "stalls": 0,
                "hazards": 0,
                "forwards": 0,
                "flushes": 0,
                "ipc": 0.0,
                "cpi": 0.0,
            }

        clk_key = self._find_signal(timeline[0].get("changed", {}), ["clk", "clock"])
        rst_key = self._find_signal(timeline[0].get("changed", {}), ["reset", "rst"])
        flush_key = self._find_signal(timeline[0].get("changed", {}), ["flush"])
        stall_key = self._find_signal(timeline[0].get("changed", {}), ["stall"])

        cycles = 0
        retired = 0
        stalls = 0
        flushes = 0
        prev_clk = None

        for sample in timeline:
            changed = sample.get("changed", {})
            c_val = str(changed.get(clk_key, "")) if clk_key else None
            r_val = str(changed.get(rst_key, "")) if rst_key else "0"
            is_reset = (r_val == "1")

            is_rising = (prev_clk == "0" and c_val == "1") if (prev_clk is not None and c_val is not None) else False
            if c_val is not None:
                prev_clk = c_val

            if is_rising and not is_reset:
                cycles += 1
                f_val = str(changed.get(flush_key, "0")) if flush_key else "0"
                s_val = str(changed.get(stall_key, "0")) if stall_key else "0"

                if f_val == "1":
                    flushes += 1
                elif s_val == "1":
                    stalls += 1
                else:
                    retired += 1

        if cycles == 0:
            cycles = len({sample.get("time") for sample in timeline if sample.get("time") is not None})
            retired = len(self._program_events(timeline))

        forwards = len(hazards)
        ipc = round(retired / cycles, 3) if cycles > 0 else 0.0
        cpi = round(cycles / retired, 3) if retired > 0 else 0.0

        return {
            "cycles": cycles,
            "retired": retired,
            "stalls": stalls,
            "hazards": len(hazards),
            "forwards": forwards,
            "flushes": flushes,
            "ipc": ipc,
            "cpi": cpi,
        }

    def _find_signal(self, changed: dict[str, Any], keywords: list[str]) -> str | None:
        for name in changed:
            lower = name.lower()
            if any(lower == k or lower.endswith("." + k) or f".{k} " in lower for k in keywords):
                return name
        return None

    def _program_events(self, timeline: list[dict[str, Any]]) -> list[dict[str, Any]]:
        events = []
        for sample in timeline:
            changed = sample.get("changed", {})
            instr = self._to_int(
                changed.get("pipeline_cpu_complete_tb.DUT.if_instruction [31:0]")
                or changed.get("cpu_top_tb.dut.instruction_debug [31:0]")
                or changed.get("cpu_top_tb.dut.instruction [31:0]")
            )
            if instr is not None:
                events.append({"instr": instr})
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
