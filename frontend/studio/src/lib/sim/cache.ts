/**
 * Set-associative write-back / write-allocate cache model with LRU or
 * random replacement. Used for both L1I and L1D.
 */

export type ReplacementPolicy = "lru" | "random";

export interface CacheLine {
  valid: boolean;
  dirty: boolean;
  tag: number;
  /** Monotonic counter used for LRU ordering. */
  lastUsed: number;
}

export interface CacheAccessResult {
  hit: boolean;
  setIndex: number;
  way: number;
  tag: number;
  evicted: boolean;
  evictedTag: number;
  writeBack: boolean;
}

export interface CacheStats {
  accesses: number;
  hits: number;
  misses: number;
  evictions: number;
  writeBacks: number;
}

export interface CacheConfig {
  readonly name: string;
  readonly sizeBytes: number;
  readonly lineBytes: number;
  readonly ways: number;
  readonly policy: ReplacementPolicy;
  /** Cycles added to the pipeline on a miss. */
  readonly missPenalty: number;
}

export class Cache {
  readonly config: CacheConfig;
  readonly sets: number;
  readonly lines: CacheLine[][];
  stats: CacheStats = { accesses: 0, hits: 0, misses: 0, evictions: 0, writeBacks: 0 };
  /** Rolling window of recent accesses for the hit/miss sparkline. */
  recent: Array<{ addr: number; hit: boolean; setIndex: number; write: boolean }> = [];

  private clock = 0;

  constructor(config: CacheConfig) {
    this.config = config;
    this.sets = Math.max(1, Math.floor(config.sizeBytes / (config.lineBytes * config.ways)));
    this.lines = Array.from({ length: this.sets }, () =>
      Array.from({ length: config.ways }, () => ({ valid: false, dirty: false, tag: 0, lastUsed: 0 })),
    );
  }

  reset(): void {
    for (const set of this.lines) {
      for (const line of set) {
        line.valid = false;
        line.dirty = false;
        line.tag = 0;
        line.lastUsed = 0;
      }
    }
    this.stats = { accesses: 0, hits: 0, misses: 0, evictions: 0, writeBacks: 0 };
    this.recent = [];
    this.clock = 0;
  }

  get hitRate(): number {
    return this.stats.accesses === 0 ? 0 : this.stats.hits / this.stats.accesses;
  }

  decompose(addr: number) {
    const blockOffsetBits = Math.log2(this.config.lineBytes);
    const setIndex = (addr >>> blockOffsetBits) % this.sets;
    const tag = Math.floor(addr / (this.config.lineBytes * this.sets));
    return { setIndex, tag, offset: addr % this.config.lineBytes };
  }

  access(addr: number, isWrite: boolean): CacheAccessResult {
    this.clock += 1;
    const { setIndex, tag } = this.decompose(addr);
    const set = this.lines[setIndex]!;
    this.stats.accesses += 1;

    const hitWay = set.findIndex((l) => l.valid && l.tag === tag);
    if (hitWay >= 0) {
      const line = set[hitWay]!;
      line.lastUsed = this.clock;
      if (isWrite) line.dirty = true;
      this.stats.hits += 1;
      this.pushRecent(addr, true, setIndex, isWrite);
      return { hit: true, setIndex, way: hitWay, tag, evicted: false, evictedTag: 0, writeBack: false };
    }

    this.stats.misses += 1;
    let victim = set.findIndex((l) => !l.valid);
    let evicted = false;
    let writeBack = false;
    let evictedTag = 0;

    if (victim < 0) {
      victim = this.selectVictim(set);
      const line = set[victim]!;
      evicted = true;
      evictedTag = line.tag;
      if (line.dirty) {
        writeBack = true;
        this.stats.writeBacks += 1;
      }
      this.stats.evictions += 1;
    }

    const line = set[victim]!;
    line.valid = true;
    line.tag = tag;
    line.dirty = isWrite;
    line.lastUsed = this.clock;
    this.pushRecent(addr, false, setIndex, isWrite);
    return { hit: false, setIndex, way: victim, tag, evicted, evictedTag, writeBack };
  }

  private selectVictim(set: CacheLine[]): number {
    if (this.config.policy === "random") return Math.floor(Math.random() * set.length);
    let best = 0;
    for (let i = 1; i < set.length; i += 1) {
      if (set[i]!.lastUsed < set[best]!.lastUsed) best = i;
    }
    return best;
  }

  private pushRecent(addr: number, hit: boolean, setIndex: number, write: boolean): void {
    this.recent.push({ addr, hit, setIndex, write });
    if (this.recent.length > 96) this.recent.shift();
  }
}
