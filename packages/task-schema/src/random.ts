/**
 * Deterministic pseudo-random number generator (Mulberry32) for reproducible task generation
 */
export class SeededRNG {
  private state: number;

  constructor(seed: number | string) {
    if (typeof seed === "string") {
      let hash = 0;
      for (let i = 0; i < seed.length; i++) {
        hash = Math.imul(31, hash) + seed.charCodeAt(i) | 0;
      }
      this.state = hash >>> 0;
    } else {
      this.state = seed >>> 0;
    }
  }

  public next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  public nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  public pick<T>(array: T[]): T {
    if (array.length === 0) {
      throw new Error("Cannot pick from empty array");
    }
    const idx = this.nextInt(0, array.length - 1);
    return array[idx]!;
  }

  public shuffle<T>(array: T[]): T[] {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      const temp = copy[i]!;
      copy[i] = copy[j]!;
      copy[j] = temp;
    }
    return copy;
  }
}
