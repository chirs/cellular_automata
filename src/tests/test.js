import assert from 'assert';
import { rules } from '../js/automata.js';


describe('cyclicRule', function(){
  var rule = rules.makeCyclic(4);

  // 1-d tests.
  it("test 0 with 1 first neighbor -> 1", function(){ assert.equal(rule([0,1,0,0]), 1) })
  it("test 0 with 1 last neighbor -> 1", function(){ assert.equal(rule([0,0,0,1]), 1) })
  it("test 3 with 0 neighbor -> 0", function(){ assert.equal(rule([3,0,0,1]), 0) })
  it("test 0 with 0 neighbors -> 0", function(){ assert.equal(rule([0,0,0,0]), 0) })
  it("test 0 with 2 neighbor -> 0", function(){ assert.equal(rule([0,2,0,0]), 0) })

});



