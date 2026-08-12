/**
 * RV32I subset: instruction model, encoder, and the demo workload.
 *
 * Instructions are authored in a small structured form and encoded to real
 * RV32I machine words so the memory viewer / waveform panels show credible
 * bit patterns rather than placeholders.
 */

export type InstrClass = "alu" | "load" | "store" | "branch" | "jump" | "nop";

export interface Instruction {
  /** Byte address in the .text segment. */
  readonly pc: number;
  /** Encoded 32-bit machine word. */
  readonly word: number;
  readonly asm: string;
  readonly mnemonic: string;
  readonly kind: InstrClass;
  readonly rd: number;
  readonly rs1: number;
  readonly rs2: number;
  readonly imm: number;
  /** True when the instruction commits a value to the register file. */
  readonly writesReg: boolean;
  /** Source operands actually consumed (drives hazard analysis). */
  readonly usesRs1: boolean;
  readonly usesRs2: boolean;
}

export const REG_NAMES = [
  "zero", "ra", "sp", "gp", "tp", "t0", "t1", "t2",
  "s0", "s1", "a0", "a1", "a2", "a3", "a4", "a5",
  "a6", "a7", "s2", "s3", "s4", "s5", "s6", "s7",
  "s8", "s9", "s10", "s11", "t3", "t4", "t5", "t6",
] as const;

export const TEXT_BASE = 0x0000_0000;
export const DATA_BASE = 0x0000_1000;
export const MEMORY_BYTES = 0x0000_2000;

/** Register index by ABI name. Throws on unknown names (defensive by design). */
export function regIndex(name: string): number {
  const idx = REG_NAMES.indexOf(name as (typeof REG_NAMES)[number]);
  if (idx < 0) throw new Error(`Unknown register: ${name}`);
  return idx;
}

type Spec =
  | [mnemonic: "add" | "sub" | "and" | "or" | "xor" | "sll" | "srl" | "slt" | "mul", rd: string, rs1: string, rs2: string]
  | [mnemonic: "addi" | "andi" | "ori" | "xori" | "slli" | "srli" | "slti", rd: string, rs1: string, imm: number]
  | [mnemonic: "lw" | "lh" | "lb", rd: string, rs1: string, imm: number]
  | [mnemonic: "sw" | "sh" | "sb", rs2: string, rs1: string, imm: number]
  | [mnemonic: "beq" | "bne" | "blt" | "bge", rs1: string, rs2: string, targetLabel: string]
  | [mnemonic: "jal", rd: string, targetLabel: string]
  | [mnemonic: "nop"];

const R_TYPE = new Set(["add", "sub", "and", "or", "xor", "sll", "srl", "slt", "mul"]);
const I_TYPE = new Set(["addi", "andi", "ori", "xori", "slli", "srli", "slti"]);
const LOADS = new Set(["lw", "lh", "lb"]);
const STORES = new Set(["sw", "sh", "sb"]);
const BRANCHES = new Set(["beq", "bne", "blt", "bge"]);

const FUNCT3: Record<string, number> = {
  add: 0, sub: 0, sll: 1, slt: 2, xor: 4, srl: 5, or: 6, and: 7, mul: 0,
  addi: 0, slti: 2, xori: 4, ori: 6, andi: 7, slli: 1, srli: 5,
  lb: 0, lh: 1, lw: 2, sb: 0, sh: 1, sw: 2,
  beq: 0, bne: 1, blt: 4, bge: 5,
};

function encode(m: string, rd: number, rs1: number, rs2: number, imm: number): number {
  const f3 = (FUNCT3[m] ?? 0) & 0x7;
  if (R_TYPE.has(m)) {
    const f7 = m === "sub" ? 0x20 : m === "mul" ? 0x01 : 0x00;
    return ((f7 << 25) | (rs2 << 20) | (rs1 << 15) | (f3 << 12) | (rd << 7) | 0x33) >>> 0;
  }
  if (I_TYPE.has(m)) return (((imm & 0xfff) << 20) | (rs1 << 15) | (f3 << 12) | (rd << 7) | 0x13) >>> 0;
  if (LOADS.has(m)) return (((imm & 0xfff) << 20) | (rs1 << 15) | (f3 << 12) | (rd << 7) | 0x03) >>> 0;
  if (STORES.has(m)) {
    const hi = (imm >> 5) & 0x7f;
    const lo = imm & 0x1f;
    return ((hi << 25) | (rs2 << 20) | (rs1 << 15) | (f3 << 12) | (lo << 7) | 0x23) >>> 0;
  }
  if (BRANCHES.has(m)) {
    const b = imm;
    const hi = (((b >> 12) & 1) << 6) | ((b >> 5) & 0x3f);
    const lo = (((b >> 1) & 0xf) << 1) | ((b >> 11) & 1);
    return ((hi << 25) | (rs2 << 20) | (rs1 << 15) | (f3 << 12) | (lo << 7) | 0x63) >>> 0;
  }
  if (m === "jal") return ((imm & 0xfffff) << 12 | (rd << 7) | 0x6f) >>> 0;
  return 0x0000_0013; // nop == addi x0, x0, 0
}

/** Assemble a structured program into decoded + encoded instructions. */
export function assemble(source: ReadonlyArray<Spec | string>): Instruction[] {
  // First pass: resolve labels to byte addresses.
  const labels = new Map<string, number>();
  let addr = TEXT_BASE;
  for (const line of source) {
    if (typeof line === "string") labels.set(line, addr);
    else addr += 4;
  }

  const out: Instruction[] = [];
  addr = TEXT_BASE;
  for (const line of source) {
    if (typeof line === "string") continue;
    const m = line[0];
    let rd = 0, rs1 = 0, rs2 = 0, imm = 0, asm = m as string;
    let kind: InstrClass = "alu";
    let writesReg = false, usesRs1 = false, usesRs2 = false;

    if (R_TYPE.has(m)) {
      rd = regIndex(line[1] as string); rs1 = regIndex(line[2] as string); rs2 = regIndex(line[3] as string);
      writesReg = true; usesRs1 = true; usesRs2 = true;
      asm = `${m} ${line[1]}, ${line[2]}, ${line[3]}`;
    } else if (I_TYPE.has(m)) {
      rd = regIndex(line[1] as string); rs1 = regIndex(line[2] as string); imm = line[3] as number;
      writesReg = true; usesRs1 = true;
      asm = `${m} ${line[1]}, ${line[2]}, ${imm}`;
    } else if (LOADS.has(m)) {
      rd = regIndex(line[1] as string); rs1 = regIndex(line[2] as string); imm = line[3] as number;
      writesReg = true; usesRs1 = true; kind = "load";
      asm = `${m} ${line[1]}, ${imm}(${line[2]})`;
    } else if (STORES.has(m)) {
      rs2 = regIndex(line[1] as string); rs1 = regIndex(line[2] as string); imm = line[3] as number;
      usesRs1 = true; usesRs2 = true; kind = "store";
      asm = `${m} ${line[1]}, ${imm}(${line[2]})`;
    } else if (BRANCHES.has(m)) {
      rs1 = regIndex(line[1] as string); rs2 = regIndex(line[2] as string);
      const target = labels.get(line[3] as string);
      if (target === undefined) throw new Error(`Unresolved label: ${line[3]}`);
      imm = target - addr;
      usesRs1 = true; usesRs2 = true; kind = "branch";
      asm = `${m} ${line[1]}, ${line[2]}, ${line[3]}`;
    } else if (m === "jal") {
      rd = regIndex(line[1] as string);
      const target = labels.get(line[2] as string);
      if (target === undefined) throw new Error(`Unresolved label: ${line[2]}`);
      imm = target - addr;
      writesReg = true; kind = "jump";
      asm = `jal ${line[1]}, ${line[2]}`;
    } else {
      kind = "nop";
      asm = "nop";
    }

    out.push({
      pc: addr, word: encode(m, rd, rs1, rs2, imm), asm, mnemonic: m,
      kind, rd, rs1, rs2, imm, writesReg, usesRs1, usesRs2,
    });
    addr += 4;
  }
  return out;
}

/**
 * Demo workload: a strided dot-product kernel with an inner accumulate loop,
 * a data-dependent branch, and a store-back epilogue. Chosen because it
 * exercises load-use stalls, forwarding, branch prediction and D-cache reuse.
 */
export const DEMO_PROGRAM: ReadonlyArray<Spec | string> = [
  ["addi", "a0", "zero", 0x100],   // a0 = &vecA (DATA_BASE + 0x100 via gp below)
  ["addi", "a1", "zero", 0x180],   // a1 = &vecB
  ["addi", "a2", "zero", 16],      // a2 = length
  ["addi", "a3", "zero", 0],       // a3 = accumulator
  ["addi", "t0", "zero", 0],       // t0 = i
  "loop",
  ["lw", "t1", "a0", 0],           // t1 = A[i]
  ["lw", "t2", "a1", 0],           // t2 = B[i]      (load-use pressure)
  ["mul", "t3", "t1", "t2"],       // t3 = A[i]*B[i] (RAW -> forwarded)
  ["add", "a3", "a3", "t3"],       // acc += t3
  ["addi", "a0", "a0", 4],
  ["addi", "a1", "a1", 4],
  ["addi", "t0", "t0", 1],
  ["blt", "t0", "a2", "loop"],     // backward branch: predictor warms up
  ["sw", "a3", "zero", 0x1f0],     // store result
  ["andi", "a4", "a3", 0xff],
  ["slti", "a5", "a4", 64],
  ["beq", "a5", "zero", "done"],   // data-dependent, poorly predicted
  ["addi", "a6", "zero", 1],
  ["sw", "a6", "zero", 0x1f4],
  "done",
  ["addi", "t0", "zero", 0],
  ["addi", "a0", "zero", 0x100],
  ["addi", "a1", "zero", 0x180],
  ["addi", "a3", "zero", 0],
  ["jal", "zero", "loop"],         // restart kernel: steady-state telemetry
];

export const PROGRAM: Instruction[] = assemble(DEMO_PROGRAM);
export const NOP: Instruction = assemble([["nop"]])[0]!;
