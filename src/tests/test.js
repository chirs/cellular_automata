import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  rules, Matrix, Board, Ant, neighborhoods, makeArray, blankStart, canonicalStart,
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


// --- Tier 3: Rule functions ---

// Life-family rules receive [self, n1..n8] for Moore neighborhood.
// makeLifeFamilyRule(deadStates, liveStates) sums neighbors (slice(1)),
// then: dead cell born if count in deadStates, live cell survives if count in liveStates.

// Helper: build a Moore-neighborhood input array.
// cellState = 0 or 1, liveNeighborCount = how many of the 8 neighbors are 1.
function mooreInput(cellState, liveNeighborCount) {
  const neighbors = Array(8).fill(0);
  for (let i = 0; i < liveNeighborCount; i++) neighbors[i] = 1;
  return [cellState, ...neighbors];
}

describe('gameOfLife (B3/S23)', () => {
  const rule = rules.gameOfLife;

  it("dead cell with 3 neighbors is born", () => {
    assert.equal(rule(mooreInput(0, 3)), 1);
  });

  it("dead cell with 2 neighbors stays dead", () => {
    assert.equal(rule(mooreInput(0, 2)), 0);
  });

  it("dead cell with 4 neighbors stays dead", () => {
    assert.equal(rule(mooreInput(0, 4)), 0);
  });

  it("live cell with 2 neighbors survives", () => {
    assert.equal(rule(mooreInput(1, 2)), 1);
  });

  it("live cell with 3 neighbors survives", () => {
    assert.equal(rule(mooreInput(1, 3)), 1);
  });

  it("live cell with 1 neighbor dies (underpopulation)", () => {
    assert.equal(rule(mooreInput(1, 1)), 0);
  });

  it("live cell with 4 neighbors dies (overpopulation)", () => {
    assert.equal(rule(mooreInput(1, 4)), 0);
  });

  it("live cell with 0 neighbors dies", () => {
    assert.equal(rule(mooreInput(1, 0)), 0);
  });
});

describe('seeds (B2/S)', () => {
  const rule = rules.seeds;

  it("dead cell with 2 neighbors is born", () => {
    assert.equal(rule(mooreInput(0, 2)), 1);
  });

  it("dead cell with 3 neighbors stays dead", () => {
    assert.equal(rule(mooreInput(0, 3)), 0);
  });

  it("live cell always dies (no survival states)", () => {
    assert.equal(rule(mooreInput(1, 0)), 0);
    assert.equal(rule(mooreInput(1, 2)), 0);
    assert.equal(rule(mooreInput(1, 5)), 0);
  });
});

describe('highLife (B36/S23)', () => {
  const rule = rules.highLife;

  it("dead cell born with 3 neighbors", () => {
    assert.equal(rule(mooreInput(0, 3)), 1);
  });

  it("dead cell born with 6 neighbors", () => {
    assert.equal(rule(mooreInput(0, 6)), 1);
  });

  it("dead cell with 2 neighbors stays dead", () => {
    assert.equal(rule(mooreInput(0, 2)), 0);
  });

  it("live cell survives with 2 or 3 neighbors", () => {
    assert.equal(rule(mooreInput(1, 2)), 1);
    assert.equal(rule(mooreInput(1, 3)), 1);
  });

  it("live cell dies with 6 neighbors", () => {
    assert.equal(rule(mooreInput(1, 6)), 0);
  });
});

describe('gnarl (B1/S1)', () => {
  const rule = rules.gnarl;

  it("dead cell born with exactly 1 neighbor", () => {
    assert.equal(rule(mooreInput(0, 1)), 1);
  });

  it("dead cell with 2 neighbors stays dead", () => {
    assert.equal(rule(mooreInput(0, 2)), 0);
  });

  it("live cell survives with exactly 1 neighbor", () => {
    assert.equal(rule(mooreInput(1, 1)), 1);
  });

  it("live cell with 0 or 2 neighbors dies", () => {
    assert.equal(rule(mooreInput(1, 0)), 0);
    assert.equal(rule(mooreInput(1, 2)), 0);
  });
});

describe('dayAndNight (B3678/S34678)', () => {
  const rule = rules.dayAndNight;

  it("dead cell born with 3, 6, 7, or 8 neighbors", () => {
    assert.equal(rule(mooreInput(0, 3)), 1);
    assert.equal(rule(mooreInput(0, 6)), 1);
    assert.equal(rule(mooreInput(0, 7)), 1);
    assert.equal(rule(mooreInput(0, 8)), 1);
  });

  it("dead cell stays dead with 4 or 5 neighbors", () => {
    assert.equal(rule(mooreInput(0, 4)), 0);
    assert.equal(rule(mooreInput(0, 5)), 0);
  });

  it("live cell survives with 3, 4, 6, 7, or 8 neighbors", () => {
    assert.equal(rule(mooreInput(1, 3)), 1);
    assert.equal(rule(mooreInput(1, 4)), 1);
    assert.equal(rule(mooreInput(1, 6)), 1);
    assert.equal(rule(mooreInput(1, 7)), 1);
    assert.equal(rule(mooreInput(1, 8)), 1);
  });

  it("live cell dies with 2 or 5 neighbors", () => {
    assert.equal(rule(mooreInput(1, 2)), 0);
    assert.equal(rule(mooreInput(1, 5)), 0);
  });
});

describe('makeTreeRule (deterministic branches)', () => {
  // Tree rule: 0=empty, 1=tree, 2=burning
  // Input: [self, neighbor1, neighbor2, ...]
  const rule = rules.makeTree(0, 0); // zero probabilities for deterministic testing

  it("burning tree becomes empty", () => {
    assert.equal(rule([2, 0, 0, 0, 0]), 0);
    assert.equal(rule([2, 1, 1, 1, 1]), 0);
  });

  it("tree with burning neighbor catches fire", () => {
    assert.equal(rule([1, 2, 0, 0, 0]), 2);
    assert.equal(rule([1, 0, 0, 2, 0]), 2);
  });

  it("tree without burning neighbor stays tree (burnProb=0)", () => {
    assert.equal(rule([1, 0, 0, 0, 0]), 1);
    assert.equal(rule([1, 1, 1, 1, 1]), 1);
  });

  it("empty cell stays empty (growProb=0)", () => {
    assert.equal(rule([0, 0, 0, 0, 0]), 0);
    assert.equal(rule([0, 1, 1, 1, 1]), 0);
  });
});

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


// --- Tier 4: Board integration ---

// Helper: create a 2D board with Game of Life rules and all cells dead,
// then set specific cells alive.
function makeLifeBoard(rows, cols, liveCells) {
  const board = new Board([rows, cols], 2, neighborhoods.moore, false);
  board.setRule(rules.gameOfLife);
  for (const [r, c] of liveCells) {
    board.matrix.set([r, c], 1);
  }
  return board;
}

describe('Board: next() with blinker', () => {
  it("horizontal blinker becomes vertical after one step", () => {
    // Horizontal blinker at row 2, cols 1-3
    const board = makeLifeBoard(5, 5, [[2,1],[2,2],[2,3]]);
    board.next();
    // Should become vertical at col 2, rows 1-3
    assert.equal(board.matrix.get([1,2]), 1);
    assert.equal(board.matrix.get([2,2]), 1);
    assert.equal(board.matrix.get([3,2]), 1);
    // Old horizontal ends should be dead
    assert.equal(board.matrix.get([2,1]), 0);
    assert.equal(board.matrix.get([2,3]), 0);
  });

  it("blinker returns to horizontal after two steps", () => {
    const board = makeLifeBoard(5, 5, [[2,1],[2,2],[2,3]]);
    board.next();
    board.next();
    assert.equal(board.matrix.get([2,1]), 1);
    assert.equal(board.matrix.get([2,2]), 1);
    assert.equal(board.matrix.get([2,3]), 1);
    assert.equal(board.matrix.get([1,2]), 0);
    assert.equal(board.matrix.get([3,2]), 0);
  });
});

describe('Board: next() with block (still life)', () => {
  it("2x2 block remains unchanged after one step", () => {
    const board = makeLifeBoard(4, 4, [[1,1],[1,2],[2,1],[2,2]]);
    board.next();
    assert.equal(board.matrix.get([1,1]), 1);
    assert.equal(board.matrix.get([1,2]), 1);
    assert.equal(board.matrix.get([2,1]), 1);
    assert.equal(board.matrix.get([2,2]), 1);
    // Corners should stay dead
    assert.equal(board.matrix.get([0,0]), 0);
    assert.equal(board.matrix.get([3,3]), 0);
  });
});

describe('Board: next() with glider', () => {
  it("glider shifts diagonally after 4 generations", () => {
    // Standard glider pattern:
    //   .X.
    //   ..X
    //   XXX
    const board = makeLifeBoard(6, 6, [[0,1],[1,2],[2,0],[2,1],[2,2]]);
    for (let i = 0; i < 4; i++) board.next();
    // After 4 gens, glider moves +1 row, +1 col (with wrapping)
    assert.equal(board.matrix.get([1,2]), 1);
    assert.equal(board.matrix.get([2,3]), 1);
    assert.equal(board.matrix.get([3,1]), 1);
    assert.equal(board.matrix.get([3,2]), 1);
    assert.equal(board.matrix.get([3,3]), 1);
  });
});

describe('Board: reset()', () => {
  it("restores initial state after advancing", () => {
    const board = makeLifeBoard(5, 5, [[2,1],[2,2],[2,3]]);
    const initialState = JSON.stringify(board.matrix.state());
    board.next();
    board.next();
    board.next();
    board.reset();
    assert.equal(board.static, false);
    // Reset restores to startFunc which is canonicalStart (center cell = 1)
    // since initial_distribution was false
    const expected = canonicalStart([5, 5]);
    assert.deepEqual(board.matrix.state(), expected);
  });
});

describe('Board: diff()', () => {
  it("returns changed coordinates after blinker step", () => {
    const board = makeLifeBoard(5, 5, [[2,1],[2,2],[2,3]]);
    board.next();
    const changed = board.diff();
    // Blinker changes: [2,1] dies, [2,3] dies, [1,2] born, [3,2] born
    // (center [2,2] stays alive in both)
    // diff compares matrix vs otherMatrix (pre-swap state)
    assert.ok(changed.length > 0);
  });
});

describe('Board: static flag', () => {
  it("diff returns empty array for still life", () => {
    // Block is a still life — diff should find 0 changes
    const board = makeLifeBoard(4, 4, [[1,1],[1,2],[2,1],[2,2]]);
    board.next();
    const d = board.diff();
    assert.equal(d.length, 0);
  });

  it("short-circuits next() when static is set", () => {
    const board = makeLifeBoard(4, 4, [[1,1],[1,2],[2,1],[2,2]]);
    board.next();
    board.static = true; // manually set since diff's auto-detection has a known bug
    const stateBefore = JSON.stringify(board.matrix.state());
    board.next(); // should short-circuit
    assert.equal(JSON.stringify(board.matrix.state()), stateBefore);
  });
});

describe('Board: getPopulationCount()', () => {
  it("counts cells correctly", () => {
    const board = makeLifeBoard(5, 5, [[0,0],[1,1],[2,2]]);
    const counts = board.getPopulationCount();
    assert.equal(counts[0], 22); // 25 - 3 dead
    assert.equal(counts[1], 3);  // 3 alive
  });
});

describe('Board: updateValue()', () => {
  it("cycles cell state modulo cellStates", () => {
    const board = new Board([3, 3], 3, neighborhoods.moore, false);
    board.setRule(rules.gameOfLife);
    assert.equal(board.matrix.get([0,0]), 0);
    board.updateValue([0,0]);
    assert.equal(board.matrix.get([0,0]), 1);
    board.updateValue([0,0]);
    assert.equal(board.matrix.get([0,0]), 2);
    board.updateValue([0,0]);
    assert.equal(board.matrix.get([0,0]), 0); // wraps back to 0
  });
});


// --- Tier 5: Ant ---

describe('Ant', () => {
  // Simple Langton's ant rule: same logic as the non-exported langtonsAntRule
  const antRule = (boardState, internalState) => {
    const moves = [[0,1],[1,0],[0,-1],[-1,0]];
    return moves[internalState];
  };

  describe('updateInternalState', () => {
    it("increments state on cell 0 (mod 4)", () => {
      const board = new Board([5, 5], 2, neighborhoods.moore, false);
      const ant = new Ant([2, 2], antRule, board);
      assert.equal(ant.internalState, 0);
      ant.updateInternalState(0);
      assert.equal(ant.internalState, 1);
      ant.updateInternalState(0);
      assert.equal(ant.internalState, 2);
      ant.updateInternalState(0);
      assert.equal(ant.internalState, 3);
      ant.updateInternalState(0);
      assert.equal(ant.internalState, 0); // wraps
    });

    it("decrements state on cell 1 (+3 mod 4)", () => {
      const board = new Board([5, 5], 2, neighborhoods.moore, false);
      const ant = new Ant([2, 2], antRule, board);
      assert.equal(ant.internalState, 0);
      ant.updateInternalState(1);
      assert.equal(ant.internalState, 3); // 0+3 mod 4
      ant.updateInternalState(1);
      assert.equal(ant.internalState, 2); // 3+3 mod 4
    });
  });

  describe('moveOne()', () => {
    it("toggles cell, updates position and internal state", () => {
      const board = new Board([5, 5], 2, neighborhoods.moore, false);
      // Set all cells to 0 (canonical start has center=1, fix that)
      for (const idx of getIndexes([5, 5])) board.matrix.set(idx, 0);
      const ant = new Ant([2, 2], antRule, board);

      // Cell at [2,2] is 0, so internal state goes 0→1
      // Then rule(0, 1) = [1,0], position moves from [2,2] by [1,0] → [3,2]
      ant.moveOne();
      assert.equal(board.matrix.get([2, 2]), 1); // toggled
      assert.equal(ant.internalState, 1);
      assert.deepEqual(ant.position, [3, 2]);
    });
  });

  describe('move(n)', () => {
    it("takes n steps", () => {
      const board = new Board([5, 5], 2, neighborhoods.moore, false);
      for (const idx of getIndexes([5, 5])) board.matrix.set(idx, 0);
      const ant = new Ant([2, 2], antRule, board);

      ant.move(3);
      // After 3 moves, the ant has moved 3 times from start
      // Verify the start cell was toggled
      assert.equal(board.matrix.get([2, 2]), 1);
      // Ant is no longer at start
      assert.notDeepEqual(ant.position, [2, 2]);
    });
  });
});


// --- Tier 6: Elementary CA & rule tables ---

describe('Board: createRuleTable()', () => {
  it("converts Rule 30 correctly", () => {
    const board = new Board([7], 2, neighborhoods.elementary, false);
    const table = board.createRuleTable(30);
    // 30 = 00011110 in binary, padded to 8 (2^3 neighbor states)
    assert.deepEqual(table, [0,0,0,1,1,1,1,0]);
  });

  it("converts Rule 0 to all zeros", () => {
    const board = new Board([7], 2, neighborhoods.elementary, false);
    const table = board.createRuleTable(0);
    assert.deepEqual(table, [0,0,0,0,0,0,0,0]);
  });

  it("converts Rule 255 to all ones", () => {
    const board = new Board([7], 2, neighborhoods.elementary, false);
    const table = board.createRuleTable(255);
    assert.deepEqual(table, [1,1,1,1,1,1,1,1]);
  });
});

describe('Board: setRuleByNumber() + next() for elementary CA', () => {
  it("Rule 90 produces correct first generation from canonical start", () => {
    // 1D board, 7 cells, canonical start: [0,0,0,1,0,0,0]
    // Rule 90 table: [0,1,0,1,1,0,1,0]
    // Neighborhood is [self, left, right] → states fed to array2integer as index
    const board = new Board([7], 2, neighborhoods.elementary, false);
    board.setRuleByNumber(90);

    assert.deepEqual(board.matrix.state(), [0,0,0,1,0,0,0]);

    board.next();
    // Cell 2: [0,0,1]→idx 1→1, Cell 3: [1,0,0]→idx 4→1, Cell 4: [0,1,0]→idx 2→0
    // Others all [0,0,0]→idx 0→0
    assert.deepEqual(board.matrix.state(), [0,0,1,1,0,0,0]);
  });
});

describe('Board: setRuleTable()', () => {
  it("applies a manual rule table correctly", () => {
    const board = new Board([5], 2, neighborhoods.elementary, false);
    // Set a simple table: all neighborhoods produce 1
    const table = [1,1,1,1,1,1,1,1];
    board.setRuleTable(table);
    board.next();
    // All cells should be 1
    for (let i = 0; i < 5; i++) {
      assert.equal(board.matrix.get([i]), 1);
    }
  });
});

describe('Board: setRandomRule()', () => {
  it("sets a rule and can advance without error", () => {
    const board = new Board([7], 2, neighborhoods.elementary, false);
    board.setRandomRule();
    assert.ok(board.ruleTable);
    board.next(); // should not throw
  });
});
