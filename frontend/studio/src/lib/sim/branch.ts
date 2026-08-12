/**
 * Gshare branch predictor: global history XOR'd with the PC indexes a table
 * of 2-bit saturating counters, backed by a small direct-mapped BTB.
 */

export interface PredictorEvent {
  pc: number;
  taken: boolean;
  predictedTaken: boolean;
  correct: boolean;
  counterBefore: number;
  counterAfter: number;
}

const STRONG_NOT_TAKEN = 0;
const STRONG_TAKEN = 3;

export class GsharePredictor {
  readonly historyBits: number;
  readonly table: Uint8Array;
  private history = 0;

  btb = new Map<number, number>();
  events: PredictorEvent[] = [];
  stats = { predictions: 0, correct: 0, mispredicts: 0, recoveryCycles: 0 };

  constructor(historyBits = 6) {
    this.historyBits = historyBits;
    this.table = new Uint8Array(1 << historyBits).fill(1);
  }

  reset(): void {
    this.table.fill(1);
    this.history = 0;
    this.btb.clear();
    this.events = [];
    this.stats = { predictions: 0, correct: 0, mispredicts: 0, recoveryCycles: 0 };
  }

  get accuracy(): number {
    return this.stats.predictions === 0 ? 0 : this.stats.correct / this.stats.predictions;
  }

  get globalHistory(): number {
    return this.history;
  }

  index(pc: number): number {
    const mask = (1 << this.historyBits) - 1;
    return ((pc >>> 2) ^ this.history) & mask;
  }

  predict(pc: number): { taken: boolean; target: number | undefined; counter: number } {
    const counter = this.table[this.index(pc)]!;
    return { taken: counter >= 2, target: this.btb.get(pc), counter };
  }

  /** Resolve a branch in EX and train the predictor. Returns true on mispredict. */
  update(pc: number, taken: boolean, target: number, predictedTaken: boolean, flushPenalty: number): boolean {
    const i = this.index(pc);
    const before = this.table[i]!;
    const after = taken ? Math.min(STRONG_TAKEN, before + 1) : Math.max(STRONG_NOT_TAKEN, before - 1);
    this.table[i] = after;
    this.history = ((this.history << 1) | (taken ? 1 : 0)) & ((1 << this.historyBits) - 1);
    if (taken) this.btb.set(pc, target);

    const correct = predictedTaken === taken;
    this.stats.predictions += 1;
    if (correct) this.stats.correct += 1;
    else {
      this.stats.mispredicts += 1;
      this.stats.recoveryCycles += flushPenalty;
    }

    this.events.push({ pc, taken, predictedTaken, correct, counterBefore: before, counterAfter: after });
    if (this.events.length > 64) this.events.shift();
    return !correct;
  }
}
