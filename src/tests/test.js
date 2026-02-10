import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { rules } from '../js/automata.js';


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



