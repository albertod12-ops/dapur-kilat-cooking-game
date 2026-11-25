// A tiny seeded random generator, so a screenshot seed always plays the same shift.
export function createRandom(seed) {
  let state = (seed >>> 0) || 1;
  return {
    next() {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 4294967296;
    },
    int(max) {
      return Math.floor(this.next() * max);
    },
    pick(list) {
      return list[this.int(list.length)];
    },
  };
}
