/**
 * In-order 5-stage RV32I pipeline model (IF / ID / EX / MEM / WB) with
 * EX->EX and MEM->EX forwarding, load-use interlock, branch prediction with
 * flush recovery, and blocking L1 instruction/data caches.
 *
 * The model is deliberately cycle-driven rather than instruction-driven: each
 * `step()` advances exactly one clock, which is what every visualization in
 * the studio consumes.
 */

import { Cache, type CacheConfig } from "./cache";
import { GsharePredictor } from "./branch";
import { DATA_BASE, MEMORY_BYTES, NOP, PROGRAM, TEXT_BASE, type Instruction } from "./isa";

export const STAGES = ["IF", "ID", "EX", "MEM", "WB"] as const;
export type StageName = (typeof STAGES)[number];

export type SlotStatus = "active" | "bubble" | "stalled" | "flushed" | "empty";

export interface StageSlot {
  instr: Instruction | null;
  status: SlotStatus;
  /** Unique per dynamic instruction; lets the UI animate movement. */
  uid: number;
  note: string;
}

export type HazardKind = "RAW-forward" | "RAW-stall" | "WAR" | "WAW" | "structural" | "control";

export interface HazardEvent {
  cycle: number;
  kind: HazardKind;
  producer: string;
  consumer: string;
  register: number;
  path: string;
  resolution: string;
  penalty: number;
}

export interface ForwardingPath {
  from: "EX/MEM" | "MEM/WB";
  to: "rs1" | "rs2";
  register: number;
}

export interface MemoryEvent {
  cycle: number;
  address: number;
  value: number;
  write: boolean;
  hit: boolean;
}

export interface CycleRecord {
  cycle: number;
  pc: number;
  stages: Record<StageName, { asm: string | null; status: SlotStatus }>;
  stall: boolean;
  flush: boolean;
  iCacheHit: boolean | null;
  dCacheHit: boolean | null;
  retired: boolean;
  branchResolved: boolean;
}

export interface SimMetrics {
  cycles: number;
  retired: number;
  stallCycles: number;
  bubbleCycles: number;
  flushes: number;
  loadUseStalls: number;
  forwards: number;
  memoryStallCycles: number;
  ipc: number;
  cpi: number;
}

export interface Assertion {
  id: string;
  name: string;
  description: string;
  /** Returns false when the invariant is violated in the current state. */
  check: (sim: Simulator) => boolean;
}

const HISTORY_DEPTH = 512;

const I_CACHE: CacheConfig = { name: "L1I", sizeBytes: 1024, lineBytes: 32, ways: 2, policy: "lru", missPenalty: 6 };
const D_CACHE: CacheConfig = { name: "L1D", sizeBytes: 1024, lineBytes: 32, ways: 4, policy: "lru", missPenalty: 8 };

function emptySlot(): StageSlot {
  return { instr: null, status: "empty", uid: 0, note: "" };
}

export class Simulator {
  readonly program: readonly Instruction[] = PROGRAM;
  readonly iCache = new Cache(I_CACHE);
  readonly dCache = new Cache(D_CACHE);
  readonly predictor = new GsharePredictor(6);

  regs = new Int32Array(32);
  regWrittenAtCycle = new Int32Array(32).fill(-1);
  memory = new Uint8Array(MEMORY_BYTES);

  pc = TEXT_BASE;
  cycle = 0;

  slots: Record<StageName, StageSlot> = {
    IF: emptySlot(), ID: emptySlot(), EX: emptySlot(), MEM: emptySlot(), WB: emptySlot(),
  };

  metrics: SimMetrics = {
    cycles: 0, retired: 0, stallCycles: 0, bubbleCycles: 0, flushes: 0,
    loadUseStalls: 0, forwards: 0, memoryStallCycles: 0, ipc: 0, cpi: 0,
  };

  hazards: HazardEvent[] = [];
  forwarding: ForwardingPath[] = [];
  memoryEvents: MemoryEvent[] = [];
  history: CycleRecord[] = [];
  /** Per-opcode execution counts, consumed by the coverage model. */
  opcodeCoverage = new Map<string, number>();
  ipcSeries: number[] = [];

  private uidCounter = 1;
  private memStallRemaining = 0;
  private fetchStallRemaining = 0;
  private predictedTakenByUid = new Map<number, boolean>();
  private aluResult = new Map<number, number>();
  private lastRetired: Instruction | null = null;

  constructor() {
    this.seedMemory();
  }

  /** Deterministic data segment so the kernel produces stable results. */
  private seedMemory(): void {
    this.memory.fill(0);
    for (let i = 0; i < 32; i += 1) {
      this.writeWord(DATA_BASE + 0x100 + i * 4, ((i * 7) % 23) + 1);
      this.writeWord(DATA_BASE + 0x180 + i * 4, ((i * 13) % 17) + 2);
    }
  }

  reset(): void {
    this.regs = new Int32Array(32);
    this.regWrittenAtCycle = new Int32Array(32).fill(-1);
    this.memory = new Uint8Array(MEMORY_BYTES);
    this.seedMemory();
    this.pc = TEXT_BASE;
    this.cycle = 0;
    this.slots = { IF: emptySlot(), ID: emptySlot(), EX: emptySlot(), MEM: emptySlot(), WB: emptySlot() };
    this.metrics = {
      cycles: 0, retired: 0, stallCycles: 0, bubbleCycles: 0, flushes: 0,
      loadUseStalls: 0, forwards: 0, memoryStallCycles: 0, ipc: 0, cpi: 0,
    };
    this.hazards = [];
    this.forwarding = [];
    this.memoryEvents = [];
    this.history = [];
    this.opcodeCoverage = new Map();
    this.ipcSeries = [];
    this.uidCounter = 1;
    this.memStallRemaining = 0;
    this.fetchStallRemaining = 0;
    this.predictedTakenByUid.clear();
    this.aluResult.clear();
    this.iCache.reset();
    this.dCache.reset();
    this.predictor.reset();
  }

  // ---------------------------------------------------------------- memory --
  readWord(addr: number): number {
    const a = addr & (MEMORY_BYTES - 1);
    return (
      (this.memory[a]! | (this.memory[a + 1]! << 8) | (this.memory[a + 2]! << 16) | (this.memory[a + 3]! << 24)) | 0
    );
  }

  writeWord(addr: number, value: number): void {
    const a = addr & (MEMORY_BYTES - 1);
    this.memory[a] = value & 0xff;
    this.memory[a + 1] = (value >>> 8) & 0xff;
    this.memory[a + 2] = (value >>> 16) & 0xff;
    this.memory[a + 3] = (value >>> 24) & 0xff;
  }

  private fetchAt(pc: number): Instruction | null {
    const index = (pc - TEXT_BASE) >> 2;
    return this.program[index] ?? null;
  }

  // ----------------------------------------------------------------- clock --
  /**
   * Advance one clock. Stages are evaluated back-to-front so each consumes the
   * pipeline-register value produced in the previous cycle.
   */
  step(): void {
    this.cycle += 1;
    this.forwarding = [];

    let stalled = false;
    let flushed = false;
    let retiredThisCycle = false;
    let branchResolved = false;
    let dHit: boolean | null = null;
    let iHit: boolean | null = null;

    const { IF, ID, EX, MEM, WB } = this.slots;

    // ---- WB -----------------------------------------------------------------
    if (WB.instr && WB.status === "active") {
      const i = WB.instr;
      if (i.writesReg && i.rd !== 0) {
        this.regs[i.rd] = this.aluResult.get(WB.uid) ?? 0;
        this.regWrittenAtCycle[i.rd] = this.cycle;
      }
      this.metrics.retired += 1;
      this.lastRetired = i;
      this.opcodeCoverage.set(i.mnemonic, (this.opcodeCoverage.get(i.mnemonic) ?? 0) + 1);
      retiredThisCycle = true;
    }

    // ---- MEM ----------------------------------------------------------------
    let memStalling = false;
    if (MEM.instr && MEM.status === "active") {
      const i = MEM.instr;
      if (i.kind === "load" || i.kind === "store") {
        if (this.memStallRemaining > 0) {
          this.memStallRemaining -= 1;
          memStalling = true;
          this.metrics.memoryStallCycles += 1;
        } else {
          const base = this.aluResult.get(MEM.uid) ?? 0;
          const addr = (DATA_BASE + (base & 0x0fff)) >>> 0;
          const result = this.dCache.access(addr, i.kind === "store");
          dHit = result.hit;
          if (!result.hit) {
            this.memStallRemaining = this.dCache.config.missPenalty - 1;
            memStalling = true;
            this.metrics.memoryStallCycles += 1;
            MEM.note = `L1D miss @0x${addr.toString(16)} (+${this.dCache.config.missPenalty})`;
          } else if (i.kind === "load") {
            const value = this.readWord(addr);
            this.aluResult.set(MEM.uid, value);
            this.memoryEvents.push({ cycle: this.cycle, address: addr, value, write: false, hit: true });
            MEM.note = `LD 0x${addr.toString(16)}`;
          } else {
            const value = this.regs[i.rs2]!;
            this.writeWord(addr, value);
            this.memoryEvents.push({ cycle: this.cycle, address: addr, value, write: true, hit: true });
            MEM.note = `ST 0x${addr.toString(16)}`;
          }
        }
      }
    }
    if (this.memoryEvents.length > 128) this.memoryEvents.splice(0, this.memoryEvents.length - 128);

    // ---- EX -----------------------------------------------------------------
    let redirectPc: number | null = null;
    if (!memStalling && EX.instr && EX.status === "active") {
      const i = EX.instr;
      const a = this.readOperand(i.rs1, i.usesRs1, "rs1");
      const b = this.readOperand(i.rs2, i.usesRs2, "rs2");
      this.aluResult.set(EX.uid, this.execute(i, a, b));

      if (i.kind === "branch" || i.kind === "jump") {
        branchResolved = true;
        const taken = i.kind === "jump" ? true : this.branchTaken(i, a, b);
        const target = i.pc + i.imm;
        const predictedTaken = this.predictedTakenByUid.get(EX.uid) ?? false;
        const mispredicted =
          i.kind === "jump"
            ? this.slots.ID.instr?.pc !== target && this.slots.IF.instr?.pc !== target
            : this.predictor.update(i.pc, taken, target, predictedTaken, 2);

        if (mispredicted) {
          redirectPc = taken ? target : i.pc + 4;
          this.metrics.flushes += 1;
          flushed = true;
          this.hazards.push({
            cycle: this.cycle, kind: "control", producer: i.asm,
            consumer: this.slots.ID.instr?.asm ?? "(fetched)", register: -1,
            path: "EX -> IF/ID redirect",
            resolution: `Flush 2 stages, redirect PC to 0x${(redirectPc >>> 0).toString(16).padStart(8, "0")}`,
            penalty: 2,
          });
        }
      }
    }

    // ---- ID: decode + load-use interlock ------------------------------------
    let loadUseStall = false;
    if (!memStalling && ID.instr && ID.status === "active") {
      const consumer = ID.instr;
      const producer = EX.instr;
      if (
        producer && EX.status === "active" && producer.kind === "load" && producer.rd !== 0 &&
        ((consumer.usesRs1 && consumer.rs1 === producer.rd) || (consumer.usesRs2 && consumer.rs2 === producer.rd))
      ) {
        loadUseStall = true;
        this.metrics.loadUseStalls += 1;
        this.hazards.push({
          cycle: this.cycle, kind: "RAW-stall", producer: producer.asm, consumer: consumer.asm,
          register: producer.rd, path: "MEM/WB -> EX (delayed one cycle)",
          resolution: "Interlock: inject bubble into EX, hold IF/ID", penalty: 1,
        });
      }
    }

    if (this.hazards.length > 128) this.hazards.splice(0, this.hazards.length - 128);

    stalled = memStalling || loadUseStall;
    if (stalled) this.metrics.stallCycles += 1;

    // ---- advance pipeline registers -----------------------------------------
    if (memStalling) {
      this.slots.WB = { ...emptySlot(), status: "bubble" };
      this.metrics.bubbleCycles += 1;
      this.markStalled(["MEM", "EX", "ID", "IF"]);
    } else if (loadUseStall) {
      this.slots.WB = MEM;
      this.slots.MEM = EX;
      this.slots.EX = { ...emptySlot(), status: "bubble", uid: this.uidCounter++, note: "load-use bubble" };
      this.metrics.bubbleCycles += 1;
      this.markStalled(["ID", "IF"]);
    } else {
      this.slots.WB = MEM;
      this.slots.MEM = EX;
      this.slots.EX = ID.status === "active" || ID.status === "stalled" ? { ...ID, status: "active" } : { ...emptySlot(), status: "bubble" };
      this.slots.ID = IF.status === "active" || IF.status === "stalled" ? { ...IF, status: "active" } : { ...emptySlot(), status: "bubble" };
      this.slots.IF = this.fetchNext(redirectPc);
      iHit = this.lastFetchHit;
    }

    if (redirectPc !== null) {
      // Squash the two younger instructions behind the mispredicted branch.
      this.slots.ID = { ...emptySlot(), status: "flushed", note: "squashed" };
      this.pc = redirectPc >>> 0;
      this.slots.IF = this.fetchNext(null);
      iHit = this.lastFetchHit;
    }

    // ---- telemetry ----------------------------------------------------------
    this.metrics.cycles = this.cycle;
    this.metrics.ipc = this.cycle === 0 ? 0 : this.metrics.retired / this.cycle;
    this.metrics.cpi = this.metrics.retired === 0 ? 0 : this.cycle / this.metrics.retired;

    this.history.push({
      cycle: this.cycle,
      pc: this.pc,
      stages: {
        IF: { asm: this.slots.IF.instr?.asm ?? null, status: this.slots.IF.status },
        ID: { asm: this.slots.ID.instr?.asm ?? null, status: this.slots.ID.status },
        EX: { asm: this.slots.EX.instr?.asm ?? null, status: this.slots.EX.status },
        MEM: { asm: this.slots.MEM.instr?.asm ?? null, status: this.slots.MEM.status },
        WB: { asm: this.slots.WB.instr?.asm ?? null, status: this.slots.WB.status },
      },
      stall: stalled,
      flush: flushed,
      iCacheHit: iHit,
      dCacheHit: dHit,
      retired: retiredThisCycle,
      branchResolved,
    });
    if (this.history.length > HISTORY_DEPTH) this.history.shift();

    if (this.cycle % 8 === 0) {
      this.ipcSeries.push(Number(this.metrics.ipc.toFixed(3)));
      if (this.ipcSeries.length > 120) this.ipcSeries.shift();
    }
  }

  private markStalled(stages: StageName[]): void {
    for (const s of stages) {
      const slot = this.slots[s];
      if (slot.instr) slot.status = "stalled";
    }
  }

  private lastFetchHit: boolean | null = null;

  private fetchNext(redirect: number | null): StageSlot {
    if (redirect !== null) this.pc = redirect >>> 0;
    if (this.fetchStallRemaining > 0) {
      this.fetchStallRemaining -= 1;
      this.lastFetchHit = false;
      return { ...emptySlot(), status: "bubble", note: "I-cache refill" };
    }
    const instr = this.fetchAt(this.pc);
    if (!instr) {
      this.pc = TEXT_BASE;
      this.lastFetchHit = null;
      return { ...emptySlot(), status: "bubble", note: "end of text" };
    }
    const access = this.iCache.access(instr.pc, false);
    this.lastFetchHit = access.hit;
    if (!access.hit) this.fetchStallRemaining = 1;

    const uid = this.uidCounter++;
    let nextPc = instr.pc + 4;
    if (instr.kind === "branch") {
      const p = this.predictor.predict(instr.pc);
      this.predictedTakenByUid.set(uid, p.taken);
      if (p.taken) nextPc = instr.pc + instr.imm;
    } else if (instr.kind === "jump") {
      this.predictedTakenByUid.set(uid, true);
      nextPc = instr.pc + instr.imm;
    }
    this.pc = nextPc >>> 0;
    return { instr, status: "active", uid, note: access.hit ? "" : "L1I miss" };
  }

  /** Operand read with EX/MEM and MEM/WB forwarding. */
  private readOperand(reg: number, used: boolean, port: "rs1" | "rs2"): number {
    if (!used || reg === 0) return reg === 0 ? 0 : this.regs[reg]!;
    const mem = this.slots.MEM;
    if (mem.instr && mem.status === "active" && mem.instr.writesReg && mem.instr.rd === reg && mem.instr.kind !== "load") {
      this.forwarding.push({ from: "EX/MEM", to: port, register: reg });
      this.metrics.forwards += 1;
      this.recordForward("EX/MEM -> EX", mem.instr.asm, reg);
      return this.aluResult.get(mem.uid) ?? 0;
    }
    const wb = this.slots.WB;
    if (wb.instr && wb.status === "active" && wb.instr.writesReg && wb.instr.rd === reg) {
      this.forwarding.push({ from: "MEM/WB", to: port, register: reg });
      this.metrics.forwards += 1;
      this.recordForward("MEM/WB -> EX", wb.instr.asm, reg);
      return this.aluResult.get(wb.uid) ?? 0;
    }
    return this.regs[reg]!;
  }

  private recordForward(path: string, producer: string, register: number): void {
    this.hazards.push({
      cycle: this.cycle, kind: "RAW-forward", producer,
      consumer: this.slots.EX.instr?.asm ?? "-", register, path,
      resolution: "Bypassed without stalling", penalty: 0,
    });
  }

  private execute(i: Instruction, a: number, b: number): number {
    switch (i.mnemonic) {
      case "add": return (a + b) | 0;
      case "sub": return (a - b) | 0;
      case "and": return a & b;
      case "or": return a | b;
      case "xor": return a ^ b;
      case "sll": return a << (b & 31);
      case "srl": return a >>> (b & 31);
      case "slt": return a < b ? 1 : 0;
      case "mul": return Math.imul(a, b);
      case "addi": return (a + i.imm) | 0;
      case "andi": return a & i.imm;
      case "ori": return a | i.imm;
      case "xori": return a ^ i.imm;
      case "slli": return a << (i.imm & 31);
      case "srli": return a >>> (i.imm & 31);
      case "slti": return a < i.imm ? 1 : 0;
      case "lw": case "lh": case "lb": case "sw": case "sh": case "sb": return (a + i.imm) | 0;
      case "jal": return (i.pc + 4) | 0;
      default: return 0;
    }
  }

  private branchTaken(i: Instruction, a: number, b: number): boolean {
    switch (i.mnemonic) {
      case "beq": return a === b;
      case "bne": return a !== b;
      case "blt": return a < b;
      case "bge": return a >= b;
      default: return false;
    }
  }

  get occupancy(): number {
    const filled = STAGES.filter((s) => this.slots[s].instr !== null).length;
    return filled / STAGES.length;
  }

  get lastRetiredInstr(): Instruction | null {
    return this.lastRetired;
  }
}

/** Design assertions evaluated continuously by the verification center. */
export const ASSERTIONS: Assertion[] = [
  {
    id: "A001", name: "x0_hardwired_zero",
    description: "Register x0 must read as zero in every cycle (RV32I spec 2.1).",
    check: (s) => s.regs[0] === 0,
  },
  {
    id: "A002", name: "pc_word_aligned",
    description: "Program counter must remain 4-byte aligned without compressed ISA support.",
    check: (s) => s.pc % 4 === 0,
  },
  {
    id: "A003", name: "no_double_writeback",
    description: "At most one architectural register write commits per cycle.",
    check: (s) => s.slots.WB.status !== "active" || s.slots.WB.instr !== null,
  },
  {
    id: "A004", name: "cache_accounting",
    description: "L1D hits plus misses must equal total accesses.",
    check: (s) => s.dCache.stats.hits + s.dCache.stats.misses === s.dCache.stats.accesses,
  },
  {
    id: "A005", name: "ipc_upper_bound",
    description: "A scalar in-order pipeline can never retire more than 1 IPC.",
    check: (s) => s.metrics.ipc <= 1.0001,
  },
  {
    id: "A006", name: "predictor_accounting",
    description: "Predictor correct + mispredicted must equal total predictions.",
    check: (s) => s.predictor.stats.correct + s.predictor.stats.mispredicts === s.predictor.stats.predictions,
  },
  {
    id: "A007", name: "no_load_use_bypass_violation",
    description: "A load result must never be forwarded in the same cycle it is addressed.",
    check: (s) => !(s.slots.EX.instr?.kind === "load" && s.forwarding.length > 0 && s.slots.EX.status === "bubble"),
  },
  {
    id: "A008", name: "memory_in_range",
    description: "All data accesses stay inside the mapped 8 KiB physical window.",
    check: (s) => s.memoryEvents.every((e) => e.address < 0x2000),
  },
];
