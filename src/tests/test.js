import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  rules, Matrix, makeArray, blankStart, canonicalStart,
  getIndexes, entropy, flatten, sum, hammingDistance
} from '../js/automata.js';


// --- Tier 1: Pure utility functions ---

describe('sum', () => {
  it("sums an array of numbers", () => {
    assert.equal(sum([1, 2, 3, 4]), 10);
  });

  it("returns 0 for empty array", () => {
    assert.equal(sum([]), 0);
  });

  it("handles single element", () => {
    assert.equal(sum([5]), 5);
  });
});

describe('flatten', () => {
  it("flattens nested arrays", () => {
    assert.deepEqual(flatten([[1, 2], [3, 4]]), [1, 2, 3, 4]);
  });

  it("flattens deeply nested arrays", () => {
    assert.deepEqual(flatten([[[1]], [[2]]]), [1, 2]);
  });

  it("returns flat array unchanged", () => {
    assert.deepEqual(flatten([1, 2, 3]), [1, 2, 3]);
  });

  it("handles empty array", () => {
    assert.deepEqual(flatten([]), []);
  });
});

describe('makeArray', () => {
  it("creates 1D array", () => {
    assert.deepEqual(makeArray([3], () => 0), [0, 0, 0]);
  });

  it("creates 2D array", () => {
    assert.deepEqual(makeArray([2, 3], () => 0), [[0, 0, 0], [0, 0, 0]]);
  });

  it("creates array with callback values", () => {
    let n = 0;
    assert.deepEqual(makeArray([4], () => n++), [0, 1, 2, 3]);
  });

  it("returns empty array for zero dimension", () => {
    assert.deepEqual(makeArray([0], () => 1), []);
  });
});

describe('blankStart', () => {
  it("creates 1D zero array", () => {
    assert.deepEqual(blankStart([4]), [0, 0, 0, 0]);
  });

  it("creates 2D zero array", () => {
    assert.deepEqual(blankStart([2, 2]), [[0, 0], [0, 0]]);
  });
});

describe('canonicalStart', () => {
  it("creates array with center cell set to 1", () => {
    const result = canonicalStart([5]);
    assert.deepEqual(result, [0, 0, 1, 0, 0]);
  });

  it("creates 2D array with center cell set to 1", () => {
    const result = canonicalStart([3, 3]);
    assert.deepEqual(result, [[0, 0, 0], [0, 1, 0], [0, 0, 0]]);
  });
});

describe('getIndexes', () => {
  it("returns all indexes for 1D", () => {
    assert.deepEqual(getIndexes([3]), [[0], [1], [2]]);
  });

  it("returns all indexes for 2D", () => {
    const result = getIndexes([2, 2]);
    assert.deepEqual(result, [[0, 0], [0, 1], [1, 0], [1, 1]]);
  });

  it("returns single empty index for empty dimensions", () => {
    assert.deepEqual(getIndexes([]), [[]]);
  });
});

describe('entropy', () => {
  it("returns 0 for uniform array", () => {
    assert.equal(entropy([1, 1, 1, 1]), -0);
  });

  it("returns 1 for two equally frequent values", () => {
    assert.equal(entropy([0, 1, 0, 1]), 1);
  });

  it("returns higher entropy for more variety", () => {
    const low = entropy([0, 0, 0, 1]);
    const high = entropy([0, 1, 2, 3]);
    assert.ok(high > low);
  });
});

describe('hammingDistance', () => {
  it("returns 0 for identical arrays", () => {
    assert.equal(hammingDistance([1, 2, 3], [1, 2, 3]), 0);
  });

  it("counts differing positions", () => {
    assert.equal(hammingDistance([1, 0, 1], [0, 0, 1]), 1);
  });

  it("returns length for completely different arrays", () => {
    assert.equal(hammingDistance([0, 0, 0], [1, 1, 1]), 3);
  });
});


// --- Tier 2: Matrix ---

describe('Matrix', () => {
  describe('get and set', () => {
    it("gets value from 1D matrix", () => {
      const m = new Matrix([10, 20, 30]);
      assert.equal(m.get([0]), 10);
      assert.equal(m.get([2]), 30);
    });

    it("gets value from 2D matrix", () => {
      const m = new Matrix([[1, 2], [3, 4]]);
      assert.equal(m.get([0, 0]), 1);
      assert.equal(m.get([1, 1]), 4);
    });

    it("sets value in 2D matrix", () => {
      const m = new Matrix([[0, 0], [0, 0]]);
      m.set([1, 0], 5);
      assert.equal(m.get([1, 0]), 5);
    });
  });

  describe('move (toroidal wrapping)', () => {
    it("moves within bounds", () => {
      const m = new Matrix([[0, 0, 0], [0, 0, 0], [0, 0, 0]]);
      assert.deepEqual(m.move([1, 1], [1, 0]), [2, 1]);
    });

    it("wraps positive overflow", () => {
      const m = new Matrix([[0, 0, 0], [0, 0, 0], [0, 0, 0]]);
      assert.deepEqual(m.move([2, 2], [1, 1]), [0, 0]);
    });

    it("wraps negative underflow", () => {
      const m = new Matrix([[0, 0, 0], [0, 0, 0], [0, 0, 0]]);
      assert.deepEqual(m.move([0, 0], [-1, -1]), [2, 2]);
    });

    it("wraps 1D matrix", () => {
      const m = new Matrix([0, 0, 0, 0, 0]);
      assert.deepEqual(m.move([4], [1]), [0]);
      assert.deepEqual(m.move([0], [-1]), [4]);
    });
  });

  describe('dimensions', () => {
    it("detects 1D dimensions", () => {
      const m = new Matrix([0, 0, 0]);
      assert.deepEqual(m.dimensions, [3]);
    });

    it("detects 2D dimensions", () => {
      const m = new Matrix([[0, 0], [0, 0], [0, 0]]);
      assert.deepEqual(m.dimensions, [3, 2]);
    });
  });
});


// --- Existing: Rule functions ---

describe('cyclicRule', () => {
  const rule = rules.makeCyclic(4);

  it("advances to next state when successor neighbor present", () => {
    assert.equal(rule([0,1,0,0]), 1);
  });

  it("advances when successor is last neighbor", () => {
    assert.equal(rule([0,0,0,1]), 1);
  });

  it("wraps around: state 3 advances to 0", () => {
    assert.equal(rule([3,0,0,1]), 0);
  });

  it("stays same when no successor neighbor", () => {
    assert.equal(rule([0,0,0,0]), 0);
  });

  it("ignores non-successor neighbors", () => {
    assert.equal(rule([0,2,0,0]), 0);
  });
});
