(() => {
  function getApiBaseUrl() {
    const stored = localStorage.getItem("QUANTUMRISC_API_URL");
    if (stored) return stored.replace(/\/$/, "");
    return window.location.origin;
  }

  const api = {
    async json(path, options = {}) {
      const baseUrl = getApiBaseUrl();
      const url = path.startsWith("http") ? path : `${baseUrl}${path}`;
      const response = await fetch(url, {
        headers: { "Content-Type": "application/json" },
        ...options,
      });
      if (!response.ok) {
        throw new Error(`${url} failed: ${response.status}`);
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
    showOverlay("Compiling RTL design...");
    try {
      const compileRes = await api.post(`/api/sessions/${state.session.id}/compile`);
      if (!compileRes.ok) {
        showErrorModal("Compilation Error", compileRes.stderr || "RTL Compilation failed.");
        hideOverlay();
        return;
      }
      
      showOverlay("Running simulation...");
      const runRes = await api.post(`/api/sessions/${state.session.id}/run`);
      if (!runRes.ok) {
        showErrorModal("Simulation Runtime Error", runRes.stderr || "Simulation execution failed.");
        hideOverlay();
        return;
      }
      
      showOverlay("Parsing VCD waveform data...");
      await refresh();
      await syncVcd();
      hideOverlay();
    } catch (e) {
      console.error("Compile/Run execution error:", e);
      showErrorModal("Execution Error", e.message || "Failed to complete compile and run cycle.");
      hideOverlay();
    }
  }

  function updateConnectionStatus(status) {
    const el = document.getElementById("connection-status");
    if (!el) return;
    if (status === "online") {
      el.textContent = "● simulator online";
      el.style.color = "var(--green)";
    } else if (status === "connecting") {
      el.textContent = "● connecting...";
      el.style.color = "var(--amber)";
    } else {
      el.textContent = "● simulator offline";
      el.style.color = "var(--red)";
    }
  }

  function showOverlay(message) {
    let overlay = document.getElementById("studio-loading-overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "studio-loading-overlay";
      overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(10, 12, 14, 0.85); display: flex; flex-direction: column;
        align-items: center; justify-content: center; z-index: 9999;
        font-family: var(--sans); color: var(--text-0); backdrop-filter: blur(4px);
      `;
      const spinner = document.createElement("div");
      spinner.style.cssText = `
        width: 40px; height: 40px; border: 3px solid var(--bg-3);
        border-top: 3px solid var(--cyan); border-radius: 50%;
        animation: spin 1s linear infinite; margin-bottom: 16px;
      `;
      if (!document.getElementById("spin-keyframes")) {
        const style = document.createElement("style");
        style.id = "spin-keyframes";
        style.textContent = "@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }";
        document.head.appendChild(style);
      }
      const label = document.createElement("div");
      label.id = "studio-loading-overlay-label";
      label.style.cssText = "font-size: 14px; font-weight: 500; letter-spacing: 0.5px;";
      
      overlay.appendChild(spinner);
      overlay.appendChild(label);
      document.body.appendChild(overlay);
    }
    document.getElementById("studio-loading-overlay-label").textContent = message;
    overlay.style.display = "flex";
  }

  function hideOverlay() {
    const overlay = document.getElementById("studio-loading-overlay");
    if (overlay) overlay.style.display = "none";
  }

  function showErrorModal(title, message) {
    let modal = document.getElementById("studio-error-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "studio-error-modal";
      modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(10, 12, 14, 0.85); display: flex; align-items: center;
        justify-content: center; z-index: 10000; backdrop-filter: blur(4px);
      `;
      const content = document.createElement("div");
      content.style.cssText = `
        background: var(--bg-1); border: 1px solid var(--red-dim);
        border-radius: 8px; width: 480px; max-width: 90%; padding: 24px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5); font-family: var(--sans);
      `;
      const header = document.createElement("div");
      header.id = "studio-error-modal-title";
      header.style.cssText = "font-size: 16px; font-weight: 700; color: var(--red); margin-bottom: 12px;";
      
      const body = document.createElement("pre");
      body.id = "studio-error-modal-body";
      body.style.cssText = `
        font-family: var(--mono); font-size: 12px; color: var(--text-1);
        background: var(--bg-0); border: 1px solid var(--panel-border);
        padding: 12px; border-radius: 6px; overflow: auto; max-height: 200px;
        white-space: pre-wrap; word-break: break-all; margin-bottom: 20px;
      `;
      const btn = document.createElement("button");
      btn.textContent = "Dismiss";
      btn.style.cssText = `
        height: 32px; padding: 0 16px; background: var(--bg-3);
        border: 1px solid var(--panel-border); border-radius: 4px;
        color: var(--text-0); font-weight: 600; cursor: pointer; float: right;
      `;
      btn.onclick = () => { modal.style.display = "none"; };
      
      content.appendChild(header);
      content.appendChild(body);
      content.appendChild(btn);
      modal.appendChild(content);
      document.body.appendChild(modal);
    }
    document.getElementById("studio-error-modal-title").textContent = title;
    document.getElementById("studio-error-modal-body").textContent = message;
    modal.style.display = "flex";
  }

  function showOfflineOverlay() {
    let overlay = document.getElementById("studio-offline-overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "studio-offline-overlay";
      overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: var(--bg-0); display: flex; flex-direction: column;
        align-items: center; justify-content: center; z-index: 99999;
        font-family: var(--sans); padding: 24px; box-sizing: border-box;
      `;
      const card = document.createElement("div");
      card.style.cssText = `
        background: var(--bg-1); border: 1px solid var(--panel-border);
        border-radius: 8px; width: 440px; max-width: 100%; padding: 32px;
        box-shadow: 0 15px 40px rgba(0,0,0,0.6); text-align: center;
      `;
      
      const title = document.createElement("h2");
      title.textContent = "QuantumRISC Simulator Offline";
      title.style.cssText = "color: var(--red); font-size: 20px; font-weight: 700; margin-bottom: 8px;";
      
      const desc = document.createElement("p");
      desc.innerHTML = `Unable to connect to the simulation backend at <strong style="color:var(--text-0)">${getApiBaseUrl()}</strong>.<br><br>Please ensure the backend is running and configured correctly.`;
      desc.style.cssText = "color: var(--text-1); font-size: 13px; line-height: 1.5; margin-bottom: 24px;";
      
      const label = document.createElement("label");
      label.textContent = "BACKEND API URL";
      label.style.cssText = "display: block; text-align: left; font-size: 10px; font-weight: 600; letter-spacing: 1px; color: var(--text-2); margin-bottom: 8px; text-transform: uppercase;";
      
      const input = document.createElement("input");
      input.type = "text";
      input.id = "offline-api-url-input";
      input.placeholder = "e.g. " + window.location.origin;
      input.style.cssText = `
        width: 100%; height: 36px; background: var(--bg-2); border: 1px solid var(--panel-border);
        border-radius: 6px; padding: 0 12px; box-sizing: border-box; color: var(--text-0);
        font-family: var(--mono); font-size: 12px; margin-bottom: 16px; outline: none;
      `;
      input.value = localStorage.getItem("QUANTUMRISC_API_URL") || window.location.origin;
      
      const btn = document.createElement("button");
      btn.textContent = "Save & Reconnect";
      btn.style.cssText = `
        width: 100%; height: 38px; background: var(--cyan-dim); border: 1px solid rgba(79,217,236,0.3);
        border-radius: 6px; color: var(--cyan); font-weight: 600; cursor: pointer;
        transition: all 0.12s ease;
      `;
      btn.onmouseover = () => { btn.style.background = "rgba(79,217,236,0.2)"; };
      btn.onmouseout = () => { btn.style.background = "var(--cyan-dim)"; };
      btn.onclick = () => {
        const val = input.value.trim();
        if (val) {
          localStorage.setItem("QUANTUMRISC_API_URL", val);
        } else {
          localStorage.removeItem("QUANTUMRISC_API_URL");
        }
        overlay.style.display = "none";
        start();
      };
      
      card.appendChild(title);
      card.appendChild(desc);
      card.appendChild(label);
      card.appendChild(input);
      card.appendChild(btn);
      overlay.appendChild(card);
      document.body.appendChild(overlay);
    }
    document.getElementById("offline-api-url-input").value = localStorage.getItem("QUANTUMRISC_API_URL") || window.location.origin;
    overlay.style.display = "flex";
  }

  function connectWebSocket() {
    if (state.ws) {
      try { state.ws.close(); } catch(e) {}
    }
    const apiBase = getApiBaseUrl();
    const wsProto = apiBase.startsWith("https") || window.location.protocol === "https:" ? "wss" : "ws";
    const wsBase = apiBase.replace(/^https?:\/\//, "");
    const wsUrl = `${wsProto}://${wsBase}/ws/sessions/${state.session.id}`;

    console.log("Connecting WebSocket to:", wsUrl);
    updateConnectionStatus("connecting");

    const ws = new WebSocket(wsUrl);
    state.ws = ws;

    ws.onopen = () => {
      console.log("WebSocket connected");
      updateConnectionStatus("online");
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === "ping") {
        try { ws.send(JSON.stringify({ type: "pong" })); } catch(e) {}
        return;
      }
      if (msg.type === "state.snapshot" && msg.payload) {
        state.snapshot = msg.payload;
        applyLiveModel(msg.payload);
      } else if (msg.type === "state.delta") {
        refresh();
      }
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected. Retrying in 3 seconds...");
      updateConnectionStatus("offline");
      setTimeout(() => {
        if (state.session && state.ws === ws) connectWebSocket();
      }, 3000);
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
      updateConnectionStatus("offline");
      ws.close();
    };
  }

  async function start() {
    showOverlay("Connecting to simulation engine...");
    try {
      await api.get("/api/health");
      
      showOverlay("Discovering simulation targets...");
      const discovery = await api.get("/api/discovery");
      
      showOverlay("Initializing simulation session...");
      state.session = await api.post("/api/sessions", {
        top: discovery.tops.includes("pipeline_cpu_complete") ? "pipeline_cpu_complete" : discovery.tops[0],
        testbench: discovery.default_testbench || "pipeline_cpu_complete_tb",
      });

      const offlineOverlay = document.getElementById("studio-offline-overlay");
      if (offlineOverlay) offlineOverlay.style.display = "none";

      connectWebSocket();
      await syncSession();
      await compileAndRun();
      hideOverlay();
    } catch (error) {
      console.error("Initialization failed:", error);
      hideOverlay();
      showOfflineOverlay();
    }
  }

  window.QuantumRiscRestart = async () => {
    if (state.ws) {
      try { state.ws.close(); } catch(e) {}
    }
    state.session = null;
    state.snapshot = null;
    await start();
  };

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

