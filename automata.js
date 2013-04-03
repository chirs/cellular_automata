"use strict";
// A program that models multi-dimensional cellular automata.
// Capable of representing Elementary cellular automata,
// Conway's Game of Life, Langton's Ant, and more.


// Wolfram - 20 Cellular automata problems.
// http://www.stephenwolfram.com/publications/articles/ca/85-twenty/3/text.html
// Lyapunov exponent


// Rule numbers for Elementary automata are inverted (110 -> 145)
// Colors are also inverted wrt standard.


// Common neighborhoods
var NEIGHBORHOODS = {
  ELEMENTARY: [[-1], [0], [1]],
  ELEMENTARY2: [[-2],[-1], [0], [1],[2]],
  ELEMENTARY3: [[-3], [-2], [-1], [0], [1], [2], [3]],
  VON_NEUMANN: [[0,0], [0,1], [-1,0], [0,-1], [1,0]],
  MOORE: [[0,0], [0,1], [-1,0], [0,-1], [1,0],[1,1],[1,-1],[-1,1],[-1,-1]]
  // MARGOLUS NEIGHBORHOOD...
};


// 2-Dimensional
// Family: Life
var makeLifeStyleRule = function(deadStates, liveStates){

  return function(states){
    var state = states[0];
    var neighbors = sum(states.slice(1));
    if (state === 0 && deadStates.indexOf(neighbors) > -1){ return 1; }
    if (state === 1 && liveStates.indexOf(neighbors) > -1){ return 1; }
    return 0;
  };
};

var forgotRule = makeLifeStyleRule([2], []);
var gameOfLifeRule = makeLifeStyleRule([3], [2,3]);
var morleyRule = makeLifeStyleRule([3,6,8], [2,4,5]); // Named after Stephen Morley; also called Move. Supports very high-period and slow spaceships
var dayAndNightRule = makeLifeStyleRule([3,6,7,8], [3,4,6,7,8]);
var highLifeRule = makeLifeStyleRule([3,6], [2,3]);
var twoByTwoRule = makeLifeStyleRule([3,6], [1,2,5]);
var mazeRule = makeLifeStyleRule([1,2,3,4,5], [3]);
var serviettesRule = makeLifeStyleRule([], [2,3,4]);
var walledCitiesRule = makeLifeStyleRule([2,3,4,5], [4,5,6,7,8]);


// Ant Rules

var randomWalkRule = function(state){
  return randomChoice([[0,1],[1,0],[-1,0],[0,-1]]);
};

var upAntRule = function(state){
  return [0,-1];
};

var staticRule = function(state){
  return [[0,-1], [1, 0]][state];
};

var langtonsAntRule = function(boardState, internalState){
  var moves = [[0,1],[1,0],[0,-1],[-1,0]];
  return moves[internalState];
};


// Adder ant was caused by a bug in the state rule funcion.
// Action on cellState 0 was nothing; only changed state (left 90 degrees) on seeing a 1.
//var adderAntRule = function(boardState, internalState){
//  var moves = [[0,1],[1,0],[0,-1],[-1,0]]
//  return moves[internalState];
//}


var makeAnt = function(position, rule, board){
  //var moves = [[0,1],[1,0],[-1,0],[0,-1]]

  // Pass state logic as a parameter.
  var internalState = 0;

  var updateInternalState = function(cellState){
    if (cellState === 0){
      internalState = (internalState + 1) % 4;
    } else {
      internalState = (internalState + 3) % 4;
    }
  };

  var move = function(){
    // Change the value of the cell occupied cell.
    var cellState = getValue(position, board.state());
    updateInternalState(cellState);
    board.updateValue(position);

    var move = rule(cellState, internalState);
    position = addPoints(board.dimensions, position, move);
    return position;
  };

  return {

    getPosition: function() { return position; },

    moves: function(n){
      for (var i=0; i<n; i++){
        move();
      }
    },

    move: move
    
  };
};



var makeBoard = function(dimensions, cellStates, neighbors, random){

  var neighborStates = Math.pow(cellStates, neighbors.length); // Number of possible cell arrangements.
  var ruleSets = Math.pow(2, neighborStates);

  var startFunc = function() { return (random ? randomStart(dimensions, cellStates) : canonicalStart(dimensions)); };
  var state = startFunc();

  var rule;
  var ruleTable = null;

  var setRule = function(r){ 
    ruleTable = null;
    rule = r; 
  };

  
  var setRuleByNumber = function(n){
    setRuleTable(createRuleTable(n));
  };

  var setRuleTable = function(t){
    setRule(function(a){ return ruleTable[array2integer(a, 10)] });
    ruleTable = t;
  };

  var setRandomRule = function(){
    setRuleTable(randomStart([neighborStates], cellStates));
  };


  var createRuleTable = function(n){
    // Fix this.
    var arr = n.toString(2).split("").map( function(s){ return parseInt(s, 10); } );
    while (arr.length < neighborStates){ arr.unshift(0); } // left-fill with zeros.
    return arr;
  };


  var generateNextState = function(table){

    var calculateState = function(cell){
      var a = [];
      for (var i=0; i < neighbors.length; i++){
        var n = addPoints(dimensions, cell, neighbors[i]);
        var v = getValue(n, table);
        a.push(v);
      }
      return rule(a);
    };

    var indexes = getIndexes(dimensions);
    var newTable = canonicalStart(dimensions);

    for (var i=0; i < indexes.length; i++){
      setValue(indexes[i], calculateState(indexes[i]), newTable);
    }
    return newTable;
  };  

  return {
    state: function() { return state; }, 
    setRule: setRule,
    setRandomRule: setRandomRule,
    setRuleTable: setRuleTable,
    setRuleByNumber: setRuleByNumber,
    dimensions: dimensions,
    ruleTable: function(){ return ruleTable; },
    cellStates: cellStates,

    reset: function() { state = startFunc(); },

    updateValue: function(point){
      var s = getValue(point, state);
      var ns = (s + 1) % cellStates;
      setValue(point, ns, state);
      return ns;
    },
    

    next: function(){
      state = generateNextState(state);
      return state;
    }

  };
};



// Functions for making and manipulating the matrixes.

// Create an array with values generated by a callback.
var makeArray = function(dimensions, callback){
  // Turn this into a map?
  // Fix the redundant code...
  var i;
  var arr = [];
  if (dimensions.length === 0){
    // pass
  } else if (dimensions.length === 1){
    for (i=0; i < dimensions[0]; i++){ arr.push(callback()); }
  } else {
    for (i=0; i<dimensions[0]; i++){
      arr.push(makeArray(dimensions.slice(1), callback));
    }

  }
  return arr;
};


var randomStart = function (dimensions, states, limit) {
  // Cutoff stops making sense with more than 2 states.
  // Need a probability distribution.

  var sectorSize = 1 / states;

  var f = function(){
    var cutoff = 0;
    var r = Math.random();
    for (var i=0; i < states; i++){
      cutoff += sectorSize;
      if (r < cutoff) {
        return i;
      }
    }
  };

  return makeArray(dimensions, f);
};


var canonicalStart = function(dimensions) {
  var a = blankStart(dimensions);
  var center = dimensions.map(function(e){ return Math.floor((e-1)/2); });
  setValue(center, 1, a);
  return a;
};

var blankStart = function(dimensions) {
  return makeArray(dimensions, function(){ return 0; });
};


var getIndexes = function(dimensions){
  // Given dimensions like [3,4,3], return [[0,0,0],...[2,4,2]
  if (dimensions.length === 0){
    return [[]]; // One empty list.
  } else {
    var arr = [];
    for (var i=0; i < dimensions[0]; i++){
      // is this optimal?
      var sub = getIndexes(dimensions.slice(1));
      for (var j=0; j < sub.length; j++){
        var m = sub[j];
        m.unshift(i);
        arr.push(m);
      }
    }
    return arr;
  }
};
      

// Sub these into table object.
// Make them not recursive.


// Matrix state management.


var getDimensions = function(table){
  var D = []
  while (isArray(table)){
    D.push(table.length)
    table = table[0]
  }
  return D
}


var createMatrix = function(matrix){

  var dimensions = getDimensions(matrix);

  return {
    state: function() {return matrix; },

    move: function(p1, p2){
      var l = [];
      for (var i=0; i<p1.length; i++){
        var dimension = dimensions[i];
        var v = (p1[i] + p2[i] + dimension) % dimension;
        l.push(v);
      }
      return l;
    },

    get: function(key){
      var res = matrix;
      for (var i=0; i < key.length; i++){
        res = res[key[i]];
      }
      return res;
    },

    set: function(key, value){
      var res = matrix
      for (var i=0; i < (key.length - 1); i++){
        res = res[key[i]];
      }
      res[key[i]] = value 
    }

  };
};


var getValue = function(p, table){
  // Given a value like [1,4,7], pull those indexes from a nested array.
  if (p.length === 0){
    return table;
  } else {
    return getValue(p.slice(1), table[p[0]]);
  }
};


var setValue = function(p, value, table){
  if (p.length === 1){
    table[p[0]] = value;
  } else {
    return setValue(p.slice(1), value, table[p[0]]);
  }
};


// This is actually summing two vectors.
// Used to identify node neighbors.
var addPoints = function(dimensions, p1, p2){
  var l = [];
  for (var i=0; i<p1.length; i++){
    var dimension = dimensions[i];
    var v = (p1[i] + p2[i] + dimension) % dimension;
    l.push(v);
  }
  return l;
};




// Utility funcitons.

var isArray = function (o) {
  return (o instanceof Array) ||
    (Object.prototype.toString.apply(o) === '[object Array]');
};


var sum = function(xs){
  var r = 0;
  for (var i=0; i < xs.length; i++){
    r += xs[i];
  }
  return r;
};

var flatten = function(arr){
  var A = [];
  for (var i=0; i < arr.length; i++){
    if (isArray(arr[i])){
      A = A.concat(flatten(arr[i]));
    } else {
      A.push(arr[i]);
    }

  }
  return A;
};


var range = function(start, end){
  if (end === undefined){
    end = start; 
    start = 0;
  }

  var A = [];
  for (var i=start; i < end; i++){
    A.push(i);
  }
  return A;
};


var randomChoice = function(arr){
  return arr[Math.floor(Math.random() * arr.length)];
};


// Entropy of a ca is undecidable: 
// http://people.unipmn.it/manzini/papers/tcs03.pdf

var entropy = function(xs){
  var total = 0;
  var frequencies = {};
  for (var i=0; i < xs.length; i++){
    total += 1;
    if (xs[i] in frequencies){
      frequencies[xs[i]] += 1;
    } else {
      frequencies[xs[i]] = 1;
    }
  }
  var s = 0;
  for (var k in frequencies){
    if (frequencies.hasOwnProperty(k)){ 
      var freq = frequencies[k] / total;
      s += freq * (Math.log(freq) / Math.LN2);
    }

  }
  return (-1 * s);
};


// from http://pmav.eu/stuff/javascript-hashing-functions/source.html
var simpleHash = function(s, tableSize) {
  var hash = 0;
  for (var i = 0; i < s.length; i++) {
    hash += (s[i].charCodeAt() * (i+1));
  }
    return Math.abs(hash) % tableSize;
};

// base 10.
var array2integer = function(arr){
  var n = 0;
  for (var i=0; i < arr.length; i++){ 
    n = n << 1; 
    n += arr[i]; 
  }
  return n
};


var hammingDistance = function(xs, ys){
  var n = 0;
  for (var i=0; i < xs.length; i++){
    if (xs[i] !== ys[i]){
      n += 1;
    }
  }
  return n;
};


var hammingNeighbors = function(xs, states){
  // Strings similar to xs with a hamming distance of 1.

  var subNeighbors = function(xs, index, states){
    var b = [];
    var val = xs[index];
    for (var i=0; i < states; i++){
      if (i !== val){
        var tmp = xs.slice(0);
        tmp[index] = i;
        b.push(tmp);
      }
    }
    return b;
  };

  var a = [];
  for (var i=0; i < xs.length; i++){
    var ns = subNeighbors(xs, i, states);
    a = a.concat(ns);
  }
  return a;
};







