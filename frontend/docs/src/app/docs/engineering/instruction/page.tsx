import { Breadcrumb } from '@/components/breadcrumb'
import { Pagination } from '@/components/pagination'

export default function InstructionPage() {
  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Docs', href: '/docs' },
          { label: 'Engineering', href: '/docs/engineering' },
          { label: 'Instruction Lifecycle' },
        ]}
      />

      <article className="prose prose-sm dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold tracking-tight mb-6">Instruction Lifecycle</h1>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Complete Instruction Journey</h2>
          <p>
            This document traces the complete lifecycle of a single RISC-V instruction through the QuantumRISC
            pipeline, from fetch to commit.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Example: ADD Instruction</h2>
          <p className="mb-4">We&apos;ll trace: <code>add r1, r2, r3</code></p>

          <div className="space-y-4">
            <div className="p-4 rounded-lg border border-border bg-card/50">
              <h3 className="font-mono font-semibold mb-2">Stage 1: Instruction Fetch (IF)</h3>
              <pre className="bg-background p-2 rounded text-xs overflow-x-auto">
                <code>{`Input: PC = 0x1000
Action:
  1. Access I-cache with tag = PC[31:10]
  2. Miss → fetch from main memory (20 cycles)
  3. Extract instruction at offset [PC[9:2]]
  4. Instruction = 0x00318533 (add r1, r2, r3)
  5. Update PC = PC + 4 = 0x1004

Output: 
  IF/ID_pipeline_register ← {
    instruction: 0x00318533,
    pc: 0x1000,
    pc_next: 0x1004
  }`}</code>
              </pre>
            </div>

            <div className="p-4 rounded-lg border border-border bg-card/50">
              <h3 className="font-mono font-semibold mb-2">Stage 2: Instruction Decode (ID)</h3>
              <pre className="bg-background p-2 rounded text-xs overflow-x-auto">
                <code>{`Input: instruction = 0x00318533
Action:
  1. Parse instruction format (R-type detected)
  2. Extract fields:
     - rs1 = 2 (source register 1)
     - rs2 = 3 (source register 2)
     - rd = 1 (destination register)
     - funct7 = 0, funct3 = 0 (ADD operation)
  3. Read register file:
     - regval_rs1 = r2 = 0x00000010
     - regval_rs2 = r3 = 0x00000020
  4. Generate control signals:
     - ALU_op = ADD
     - reg_write = 1
  5. Check hazards: No dependencies

Output:
  ID/EX_pipeline_register ← {
    regval_rs1: 0x00000010,
    regval_rs2: 0x00000020,
    rd: 1,
    alu_op: ADD,
    reg_write: 1
  }`}</code>
              </pre>
            </div>

            <div className="p-4 rounded-lg border border-border bg-card/50">
              <h3 className="font-mono font-semibold mb-2">Stage 3: Execute (EX)</h3>
              <pre className="bg-background p-2 rounded text-xs overflow-x-auto">
                <code>{`Input: regval_rs1 = 0x10, regval_rs2 = 0x20, alu_op = ADD
Action:
  1. Check forwarding:
     - Is EX/MEM_rd == ID/EX_rs1? No
     - Is MEM/WB_rd == ID/EX_rs1? No
     - Use register file values
  2. Execute ALU:
     - alu_result = 0x10 + 0x20 = 0x30
  3. No branch or memory operation
  4. Set zero flag = 0

Output:
  EX/MEM_pipeline_register ← {
    alu_result: 0x30,
    rd: 1,
    reg_write: 1,
    zero_flag: 0
  }`}</code>
              </pre>
            </div>

            <div className="p-4 rounded-lg border border-border bg-card/50">
              <h3 className="font-mono font-semibold mb-2">Stage 4: Memory Access (MEM)</h3>
              <pre className="bg-background p-2 rounded text-xs overflow-x-auto">
                <code>{`Input: alu_result = 0x30, rd = 1, reg_write = 1
Action:
  1. ADD is not a load/store, skip memory access
  2. Pass alu_result to next stage
  3. Maintain control signals

Output:
  MEM/WB_pipeline_register ← {
    write_data: 0x30,
    rd: 1,
    reg_write: 1
  }`}</code>
              </pre>
            </div>

            <div className="p-4 rounded-lg border border-border bg-card/50">
              <h3 className="font-mono font-semibold mb-2">Stage 5: Write Back (WB)</h3>
              <pre className="bg-background p-2 rounded text-xs overflow-x-auto">
                <code>{`Input: write_data = 0x30, rd = 1, reg_write = 1
Action:
  1. Check reg_write signal: 1 (write enabled)
  2. Write to register file:
     - r[1] ← 0x30
  3. Instruction complete

Output:
  Commit {
    rd: 1,
    value: 0x30,
    pc: 0x1000
  }

Result: r1 = 0x30 (sum of r2 + r3)`}</code>
              </pre>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Example: Load-Use Hazard</h2>
          <pre className="bg-card border border-border p-4 rounded-lg text-xs overflow-x-auto">
            <code>{`Program:
  Cycle 1: lw r1, 0(r2)    ; Load r1 from memory at r2
  Cycle 2: add r3, r1, r4  ; Use r1 immediately

Timeline:
  C1: lw enters IF
  C2: lw in ID, add in IF
  C3: lw in EX (address calc), add in ID (reads r1? Not yet written)
      → Hazard detected! Stall add in ID
  C4: lw in MEM (reads memory, 5 cycles)
  C5: stall continues
  C6: stall continues
  C7: lw in WB (writes r1)
      → add can proceed now
  C8: add in EX (uses r1 value from forwarding)
  C9: add in MEM
  C10: add in WB (writes r3)

Result: 10 cycles for 2 instructions (5 CPI)
Penalty: Load-use = +1 cycle stall`}</code>
          </pre>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Example: Branch Misprediction</h2>
          <pre className="bg-card border border-border p-4 rounded-lg text-xs overflow-x-auto">
            <code>{`Program:
  beq r1, r0, skip    ; Branch if r1 == 0
  add r2, r2, r3      ; Not executed if branch taken
  skip: lw r4, 0(r5)  ; Fetch after branch

Execution (assuming r1 ≠ 0, so branch NOT taken):
  C1: beq IF
  C2: beq ID, predict NOT taken
      fetch next instruction (add)
  C3: beq EX, condition false ✓ (correct!)
      add in ID
  C4: beq in WB (commit)
      add in EX

Result: 4 cycles, correct prediction → no penalty

If r1 == 0 (branch taken):
  C3: beq EX, condition true ✗ (mispredicted!)
      Flush pipeline, set PC = skip target
  C4: (flushed add in ID)
      lw IF (correct target)
  C5: lw ID
  C6: lw EX

Result: 6 cycles, misprediction → +3 cycle penalty`}</code>
          </pre>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">State Machine</h2>
          <div className="bg-card border border-border rounded-lg p-4 font-mono text-xs space-y-2">
            <div>Instruction State Progression:</div>
            <div className="ml-4">
              FETCHED → DECODED → EXECUTED → COMPLETED → COMMITTED
            </div>
            <div className="mt-4">Possible Transitions:</div>
            <div className="ml-4 space-y-1">
              <div>FETCHED → FETCHED (cache miss, stall)</div>
              <div>DECODED → DECODED (hazard, stall)</div>
              <div>EXECUTED → DECODED (mispredict, flush)</div>
              <div>COMPLETED → COMMITTED (write-back done)</div>
            </div>
          </div>
        </section>
      </article>

      <Pagination
        previous={{
          label: 'Engineering',
          href: '/docs/engineering',
        }}
        next={{
          label: 'Simulation Engine',
          href: '/docs/engineering/simulation',
        }}
      />
    </>
  )
}
