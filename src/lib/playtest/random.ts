export class SeededRandom {
  private state: number;

  constructor(seed: string) {
    let h = 2166136261;
    for (let i = 0; i < seed.length; i += 1) {
      h ^= seed.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    this.state = h >>> 0;
  }

  next() {
    this.state = (1664525 * this.state + 1013904223) >>> 0;
    return this.state / 4294967296;
  }

  pick<T>(list: T[]) {
    if (!list.length) return undefined;
    return list[Math.floor(this.next() * list.length)];
  }
}
