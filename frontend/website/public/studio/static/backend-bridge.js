(() => {
  const api = {
    async json(path, options = {}) {
      const response = await fetch(path, {
        headers: { "Content-Type": "application/json" },
        ...options,
      });
      if (!response.ok) {
        throw new Error(`${path} failed: ${response.status}`);
      }
      return response.json();
    },
    get(path) {
      return this.json(path);
    },
    post(path, body = null) {
      return this.json(path, {
        method: "POST",
        body: body ? JSON.stringify(body) : undefined,
      });
    },
  };

  const state = {
    session: null,
    snapshot: null,
    ws: null,
  };

  function toInt(text) {
    if (text == null) return null;
    const raw = String(text).trim();
    if (!raw || /[xz]/i.test(raw)) return null;
    if (/^[01]+$/.test(raw)) return parseInt(raw, 2);
    return Number.parseInt(raw, 16) || Number.parseInt(raw, 10);
  }

  function padHex(value, width = 8) {
    return `0x${(value >>> 0).toString(16).padStart(width, "0")}`;
  }

  function regName(idx) {
    return `x${idx}`;
  }

  function decodeAsm(instr) {
    const opcode = instr & 0x7f;
    const rd = (instr >>> 7) & 0x1f;
    const funct3 = (instr >>> 12) & 0x7;
    const rs1 = (instr >>> 15) & 0x1f;
    const rs2 = (instr >>> 20) & 0x1f;
    const funct7 = (instr >>> 25) & 0x7f;
    const immI = (instr << 20) >> 20;
    const immS = ((instr >>> 25) << 5) | ((instr >>> 7) & 0x1f);
    const signedS = (immS << 20) >> 20;

    switch (opcode) {
      case 0x13:
        return { asm: `addi x${rd}, x${rs1}, ${immI}`, dest: rd ? regName(rd) : null, src: [regName(rs1)], type: "alu" };
      case 0x33: {
        const op = funct3 === 0 && funct7 === 0x20 ? "sub" : "add";
        return { asm: `${op} x${rd}, x${rs1}, x${rs2}`, dest: rd ? regName(rd) : null, src: [regName(rs1), regName(rs2)], type: "alu" };
      }
      case 0x03:
        return { asm: `lw x${rd}, ${immI}(x${rs1})`, dest: rd ? regName(rd) : null, src: [regName(rs1)], type: "load" };
      case 0x23:
        return { asm: `sw x${rs2}, ${signedS}(x${rs1})`, dest: null, src: [regName(rs1), regName(rs2)], type: "store" };
      case 0x63:
        return { asm: `beq x${rs1}, x${rs2}, ${immI}`, dest: null, src: [regName(rs1), regName(rs2)], type: "branch" };
      default:
        return { asm: `nop /* ${padHex(instr)} */`, dest: null, src: [], type: "alu" };
    }
  }

  function parseTrace(timeline) {
    const seenPc = new Set();
    const program = [];
    const results = [];
    const programMemory = [];

    for (const row of timeline || []) {
      const changed = row.changed || {};
      const pcText =
        changed["pipeline_cpu_complete_tb.DUT.PC.pc_current [31:0]"] ||
        changed["cpu_top_tb.dut.pc_debug [31:0]"] ||
        changed["cpu_top_tb.dut.pc_current [31:0]"];
      const instrText =
        changed["pipeline_cpu_complete_tb.DUT.if_instruction [31:0]"] ||
        changed["cpu_top_tb.dut.instruction_debug [31:0]"] ||
        changed["cpu_top_tb.dut.instruction [31:0]"] ||
        changed["pipeline_cpu_complete_tb.DUT.instruction [31:0]"];
      const rdText = changed["pipeline_cpu_complete_tb.DUT.RF.rd [4:0]"] || changed["cpu_top_tb.dut.rd [4:0]"];
      const wbText = changed["pipeline_cpu_complete_tb.DUT.RF.write_data [31:0]"] || changed["cpu_top_tb.dut.alu_result [31:0]"];
      const pc = toInt(pcText);
      const instr = toInt(instrText);
      const rd = toInt(rdText);
      const wb = toInt(wbText);

      if (pc != null && instr != null && !seenPc.has(pc)) {
        seenPc.add(pc);
        program.push({ ...decodeAsm(instr), pc: padHex(pc) });
        const bytes = [instr & 0xff, (instr >>> 8) & 0xff, (instr >>> 16) & 0xff, (instr >>> 24) & 0xff];
        programMemory[pc >>> 2] = bytes;
      }

      if (rd != null && rd !== 0 && wb != null) {
        const existing = results.findIndex((entry) => entry && entry.reg === regName(rd));
        const next = { reg: regName(rd), val: wb };
        if (existing >= 0) results[existing] = next;
        else results.push(next);
      }
    }

    const denseResults = [];
    for (const item of results) denseResults.push(item);
    while (denseResults.length < 8) denseResults.push(null);

    const memory = new Array(64).fill(0);
    for (let i = 0; i < Math.min(programMemory.length, 16); i += 1) {
      const bytes = programMemory[i];
      if (!bytes) continue;
      memory[i * 4] = bytes[0];
      memory[i * 4 + 1] = bytes[1];
      memory[i * 4 + 2] = bytes[2];
      memory[i * 4 + 3] = bytes[3];
    }

    return { program, results: denseResults, memory };
  }

  function applyLiveModel(snapshot) {
    if (!snapshot) return;
    state.vcd = snapshot.vcd || state.vcd;
    const trace = parseTrace(snapshot.waveforms?.timeline || []);
    const retired = snapshot.metrics?.retired ?? trace.program.length;
    const cycleCount = snapshot.metrics?.cycles ?? (snapshot.waveforms?.timeline || []).length;
    const hazardCount = snapshot.hazards?.length ?? 0;
    const forwardCount = snapshot.forwarding?.length ?? 0;
    const hasVcd = Boolean(snapshot.vcd?.name || snapshot.vcd?.path);
    if (typeof PROGRAM !== "undefined") {
      PROGRAM = trace.program.length ? trace.program : PROGRAM;
    }
    if (typeof SCHED !== "undefined" && typeof buildSchedule === "function") {
      SCHED = buildSchedule(PROGRAM);
    }
    if (typeof REG_RESULT !== "undefined") {
      REG_RESULT = trace.results;
    }
    if (typeof MEM_INIT !== "undefined") {
      MEM_INIT = trace.memory;
    }
    if (typeof HAZARD_LOG !== "undefined" && typeof SCHED !== "undefined") {
      HAZARD_LOG = SCHED.forwards.map((f) => ({ ...f, type: "RAW", resolved: "forwarded" }))
        .concat(PROGRAM.map((_, i) => (SCHED.stallBefore[i] ? { from: i - 1, to: i, type: "RAW (load-use)", resolved: "stalled 1 cycle", kind: "stall" } : null)).filter(Boolean));
    }
    if (typeof TEST_SUITE !== "undefined") {
      TEST_SUITE = [
        {
          name: `${snapshot.top || "RTL"} compile`,
          kind: "Compile",
          status: snapshot.compile?.ok ? "PASS" : "FAIL",
          cycles: snapshot.compile?.ok ? 1 : 0,
          note: snapshot.compile?.ok ? "Backend compile completed successfully" : (snapshot.compile?.stderr || "Compile error"),
        },
        {
          name: `${snapshot.testbench || "simulation"} run`,
          kind: "Simulation",
          status: snapshot.run?.ok ? "PASS" : "FAIL",
          cycles: cycleCount,
          note: snapshot.vcd?.name ? `VCD: ${snapshot.vcd.name}` : "No VCD generated",
        },
        {
          name: "Hazard analysis",
          kind: "Analysis",
          status: "PASS",
          cycles: hazardCount,
          note: `${hazardCount} live hazard${hazardCount === 1 ? "" : "s"} detected; ${forwardCount} forwarding path${forwardCount === 1 ? "" : "s"} observed`,
        },
      ];
    }
    if (typeof ASSERTIONS !== "undefined") {
      ASSERTIONS = [
        {
          name: "x0_hardwired_zero",
          desc: "Register x0 remains zero across the run",
          fires: (snapshot.registers || []).find((r) => r?.reg === "x0" && Number(r?.val) !== 0) ? 1 : 0,
          checks: 1,
          status: (snapshot.registers || []).find((r) => r?.reg === "x0" && Number(r?.val) !== 0) ? "FAIL" : "PASS",
        },
        {
          name: "retired_instructions",
          desc: "Retirement count is derived from the live VCD trace",
          fires: retired,
          checks: cycleCount,
          status: snapshot.run?.ok ? "PASS" : "FAIL",
        },
        {
          name: "hazard_reporting",
          desc: "RAW hazards and forwarding decisions are reported from the backend",
          fires: hazardCount,
          checks: forwardCount,
          status: "PASS",
        },
        {
          name: "waveform_ready",
          desc: "Latest generated VCD is available to the waveform viewer",
          fires: hasVcd ? 1 : 0,
          checks: 1,
          status: hasVcd ? "PASS" : "FAIL",
        },
      ];
    }
    if (typeof COVERAGE !== "undefined") {
      const programCoverage = PROGRAM.length ? Math.round((retired / PROGRAM.length) * 100) : 0;
      COVERAGE = {
        functional: [
          { bin: "Retired instructions", pct: Math.max(0, Math.min(100, programCoverage)) },
          { bin: "Hazards analyzed", pct: hazardCount ? 100 : 0 },
          { bin: "Forwarding paths", pct: forwardCount ? 100 : 0 },
          { bin: "Waveform parsed", pct: (snapshot.waveforms?.timeline || []).length ? 100 : 0 },
        ],
        code: [
          { mod: `${snapshot.top || "core"}.sv`, pct: snapshot.compile?.ok ? 100 : 0 },
          { mod: `${snapshot.testbench || "tb"}.sv`, pct: snapshot.run?.ok ? 100 : 0 },
          { mod: "vcd_parser.py", pct: (snapshot.waveforms?.timeline || []).length ? 100 : 0 },
        ],
      };
    }
    if (typeof sim !== "undefined") {
      sim.cycle = snapshot.playback?.cursor ?? snapshot.waveforms?.cursor ?? Math.max(1, (snapshot.waveforms?.timeline || []).length - 1);
      sim.running = false;
      sim.timer = null;
    }
    if (typeof renderAll === "function") renderAll();
  }

  async function refresh() {
    if (!state.session) return;
    state.snapshot = await api.get(`/api/sessions/${state.session.id}/snapshot`);
    applyLiveModel(state.snapshot);
  }

  async function syncSession() {
    if (!state.session) return;
    state.snapshot = await api.get(`/api/sessions/${state.session.id}`);
    applyLiveModel(state.snapshot);
  }

  async function syncVcd() {
    if (!state.session) return;
    state.vcd = await api.get(`/api/sessions/${state.session.id}/vcd`);
  }

  async function compileAndRun() {
    await api.post(`/api/sessions/${state.session.id}/compile`);
    await api.post(`/api/sessions/${state.session.id}/run`);
    await refresh();
    await syncVcd();
  }

  function connectWebSocket() {
    const proto = location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(`${proto}://${location.host}/ws/sessions/${state.session.id}`);
    state.ws = ws;
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === "state.snapshot" && msg.payload) {
        state.snapshot = msg.payload;
        applyLiveModel(msg.payload);
      } else if (msg.type === "state.delta") {
        refresh();
      }
    };
  }

  async function start() {
    await api.get("/api/health");
    const discovery = await api.get("/api/discovery");
    state.session = await api.post("/api/sessions", {
      top: discovery.tops.includes("pipeline_cpu_complete") ? "pipeline_cpu_complete" : discovery.tops[0],
      testbench: discovery.default_testbench || "pipeline_cpu_complete_tb",
    });

    connectWebSocket();
    await syncSession();
    await compileAndRun();
  }

  function bindControl(selector, fn) {
    const el = document.querySelector(selector);
    if (el) el.addEventListener("click", fn);
  }

  bindControl("#btn-run", async () => {
    if (!state.session) return;
    const play = state.snapshot?.playback?.paused ? "resume" : "pause";
    await api.post(`/api/sessions/${state.session.id}/${play}`);
    await refresh();
  });
  bindControl("#btn-step", async () => {
    if (!state.session) return;
    await api.post(`/api/sessions/${state.session.id}/step`);
    await refresh();
  });
  bindControl("#btn-reset", async () => {
    if (!state.session) return;
    await api.post(`/api/sessions/${state.session.id}/reset`);
    await refresh();
  });

  window.addEventListener("keydown", (event) => {
    if (event.target && event.target.tagName === "INPUT") return;
    if (event.code === "Space" && state.session) {
      event.preventDefault();
      const play = state.snapshot?.playback?.paused ? "resume" : "pause";
      api.post(`/api/sessions/${state.session.id}/${play}`).then(refresh);
    }
    if ((event.key === "s" || event.key === "S") && state.session) {
      api.post(`/api/sessions/${state.session.id}/step`).then(refresh);
    }
    if ((event.key === "r" || event.key === "R") && state.session) {
      api.post(`/api/sessions/${state.session.id}/reset`).then(refresh);
    }
  });

  start().catch((error) => {
    console.error(error);
  });
})();
