//"use strict";
// A program that models multi-dimensional cellular automata.
// Capable of representing Elementary cellular automata,
// Conway's Game of Life, Langton's Ant, and more.


// Wolfram - 20 Cellular automata problems.
// http://www.stephenwolfram.com/publications/articles/ca/85-twenty/3/text.html
// Lyapunov exponent


// Rule numbers for Elementary automata are inverted (110 -> 145)
// Colors are also inverted wrt standard.


// Common neighborhoods


// 1-Dimenisonal





var hsv2rgb = function(h, s, v){
  var h_i = h * 6;
  var f = h * 6 - h_i;
  var p = v * (1 - s);
  var q = v * (1 - f * s);
  var t = v * (1 - (1 - f * s));
  var r, g, b;
  switch(Math.floor(h_i)){
  case 0: r=v, g=t, b=p; break;
  case 1: r=q, g=v, b=p; break;
  case 2: r=p, g=v, b=t; break;
  case 3: r=p, g=q, b=v; break;
  case 4: r=t, g=p, b=v; break;
  case 5: r=v, g=p, b=q; break;
  }
  return [r*256,g*256,b*256];
};

// not working?
var generateColors = function(n){
  //return ["#ff0", "#0f0", "#00f","#f00", "#0ff", "#f0f"][a];

  if (n === 2){
    return ["#fff", "#000"];
  }
  if (n === 3){
    return ["black", "green", "red"];
  }


  var help = (e) => {
    var s = Math.floor(e).toString(16);
    if (s.length === 1){ s = "0" + s; }
    return s;
  };
  var rgb2css = (l) => "#" + help(l[0]) + help(l[1]) + help(l[2]);

  var goldenRatioConjugate = 0.618033988749895;
  var hue = Math.random();
  var colors = [];

  for (var i=0; i<n; i++){
    hue += goldenRatioConjugate;
    if (hue > 1){
      hue = hue - 1;
    }
    var l = hsv2rgb(hue, 0.5, 0.95);
    colors.push(rgb2css(l));
  }
  return colors;
};

// 2-Dimensional
var makeCyclicRule = function(modulus){
  return (states) => {
    var currentState = states[0];
    for (var i=1, l=states.length; i < l; i++){
      var s = (states[i] - currentState + modulus) % modulus;
      if (s === 1){
        return states[i];
      }
    }
    return currentState;
  };
};


var makeTreeRule = function(growProb, burnProb){
  return (states) => {
    var currentState = states[0];

    if (currentState === 0 && Math.random() < growProb) {return 1;}
    if (currentState === 1){
      for (var i=1, l=states.length; i < l; i++){
        if (states[i] === 2) {return 2;}
      }
      if (Math.random() < burnProb) {return 2;}
    }
    if (currentState === 2) {return 0;}
    return currentState;
  }
}


// Brian's Brain: 0 = off, 1 = firing, 2 = refractory. An off cell fires
// when exactly two neighbors are firing; firing cells always become
// refractory, refractory cells always turn off.
var brainRule = function(states){
  var currentState = states[0];
  if (currentState === 1){ return 2; }
  if (currentState === 2){ return 0; }
  var firing = 0;
  for (var i=1, l=states.length; i < l; i++){
    if (states[i] === 1){ firing += 1; }
  }
  return firing === 2 ? 1 : 0;
};


// Family: Life
var makeLifeFamilyRule = function(deadStates, liveStates){

  var rule = (states) => {
    var state = states[0];
    var neighbors = 0;
    for (var i=1, l=states.length; i < l; i++){ neighbors += states[i]; }
    if (state === 0 && deadStates.includes(neighbors)){ return 1; }
    if (state === 1 && liveStates.includes(neighbors)){ return 1; }
    return 0;
  };

  // Lookup table indexed [state << 4 | neighborSum], letting Board.next()
  // skip the per-cell function call for 2-state life-family rules.
  rule.lifeTable = new Uint8Array(2 * 16);
  deadStates.forEach(s => { rule.lifeTable[s] = 1; });
  liveStates.forEach(s => { rule.lifeTable[16 + s] = 1; });
  return rule;
};


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


var Ant = function(position, rule, board){
  //var moves = [[0,1],[1,0],[-1,0],[0,-1]]

  // Pass state logic as a parameter.
  this.position = position
  this.rule = rule
  this.board = board
  this.internalState = 0;
};

// The standard turmite rule?
Ant.prototype.updateInternalState = function(cellState){
  if (cellState === 0){
    this.internalState = (this.internalState + 1) % 4;
  } else {
    this.internalState = (this.internalState + 3) % 4;
  }
};

Ant.prototype.moveOne = function(){
  // Change the value of the cell occupied cell.
  var cellState = this.board.matrix.get(this.position);
  this.updateInternalState(cellState);
  this.board.updateValue(this.position);

  var m = this.rule(cellState, this.internalState);
  this.position = this.board.matrix.move(this.position, m) // Update position
  return this.position;
};

Ant.prototype.move = function(n){
  if (n === undefined){
    n = 1;
  }
  for (var i=0; i < n; i++){
    this.moveOne();
  }
}


var Board = function(dimensions, cellStates, neighbors, initial_distribution){

  this.dimensions = dimensions.map(Math.ceil); // callers may pass fractional sizes like width/scale
  this.cellStates = cellStates
  this.neighbors = neighbors
  this.indexes = getIndexes(this.dimensions);

  this.neighborStates = Math.pow(cellStates, neighbors.length); // Number of possible cell arrangements.
  this.ruleSets = Math.pow(2, this.neighborStates);

  this.startFunc = () => {
    var m = new FlatMatrix(this.dimensions);
    if (initial_distribution){
      var sample = makeSampler(initial_distribution);
      for (var i=0, l=m.cells.length; i < l; i++){ m.cells[i] = sample(); }
    } else {
      m.set(this.dimensions.map(e => Math.floor((e-1)/2)), 1); // canonical start: single live center cell
    }
    return m;
  };
  this.matrix = this.startFunc();
  this.otherMatrix = new FlatMatrix(this.dimensions);

  this.rule = undefined
  this.ruleTable = null;

  this.static = false // Set when matrix == otherMatrix - not working yet.

  this.colorMap = generateColors(cellStates);
  this.neighborFlat = this.generateNeighbors();
  this.scratch = new Array(neighbors.length); // reusable states buffer for next()
}

Board.prototype.state2color = function(state){ return this.colorMap[state]; }

// Precompute each cell's neighbor cells as flat indexes into matrix.cells,
// laid out as k consecutive entries per cell.
Board.prototype.generateNeighbors = function(){
  var m = this.matrix;
  var k = this.neighbors.length;
  var n = m.cells.length;
  var nf = new Int32Array(n * k);
  for (var c=0; c < n; c++){
    var p = m.point(c);
    for (var j=0; j < k; j++){
      nf[c*k + j] = m.index(m.move(this.neighbors[j], p));
    }
  }
  return nf;
}

Board.prototype.setRule = function(r){ 
  this.ruleTable = null;
  this.rule = r; 
  return this;
};


Board.prototype.setRuleByNumber = function(n){ return this.setRuleTable(this.createRuleTable(n)); };

Board.prototype.setRuleTable = function(t){
  this.setRule(function(a){ return t[array2integer(a, 10)] });
  this.ruleTable = t;
  return this;
};

Board.prototype.setRandomRule = function(){
  return this.setRuleTable(randomStart([this.neighborStates], this.cellStates));
  };

Board.prototype.createRuleTable = function(n){
    // Fix this.
  var arr = n.toString(2).split("").map(s => parseInt(s, 10));
  var l = arr.length
  while (arr.length < this.neighborStates){ arr.unshift(0); } // left-fill with zeros.
  return arr;
};

Board.prototype.getPopulationCount = function(){
  var counts = blankStart([this.cellStates]);
  var cells = this.matrix.cells;
  for (var i=0, l=cells.length; i < l; i++){
    counts[cells[i]] += 1;
  }
  return counts;
};


Board.prototype.updateValue = function(point){
  var s = this.matrix.get(point);
  var ns = (s + 1) % this.cellStates;
  this.matrix.set(point, ns);
  this.static = false;
  return ns;
}

// Pattern export/import for URL sharing. Format: "<w>x<h>;<rle data>".
// 2D boards only.

Board.prototype.exportPattern = function(){
  var dims = this.matrix.dimensions;
  return dims[0] + "x" + dims[1] + ";" + encodeRLE(this.matrix.cells);
};

Board.prototype.importPattern = function(str){
  var parts = str.split(";");
  var pdims = parts[0].split("x").map(Number);
  var cells = decodeRLE(parts[1]);
  var pw = pdims[0], ph = pdims[1];
  var bw = this.matrix.dimensions[0], bh = this.matrix.dimensions[1];

  // Center the pattern on the board; offsets go negative when the
  // pattern is larger than the board, clipping its edges.
  var ox = Math.floor((bw - pw) / 2);
  var oy = Math.floor((bh - ph) / 2);

  for (var i=0; i < bw; i++){
    for (var j=0; j < bh; j++){
      var pi = i - ox, pj = j - oy;
      var inside = pi >= 0 && pi < pw && pj >= 0 && pj < ph;
      this.matrix.set([i, j], inside ? (cells[pi * ph + pj] || 0) : 0);
    }
  }
  this.static = false;
  return this;
};

// Allocation-free hot loop: gather each cell's neighbor states into the
// shared scratch buffer, apply the rule, write into the back buffer, swap.
Board.prototype.next = function(){
  if (this.static === true){
    return this.matrix;
  }

  var cells = this.matrix.cells;
  var out = this.otherMatrix.cells;
  var nf = this.neighborFlat;
  var k = this.neighbors.length;
  var scratch = this.scratch;
  var rule = this.rule;
  var lt = rule.lifeTable;
  if (lt && this.cellStates === 2 && k <= 16){
    for (var c=0, n=cells.length; c < n; c++){
      var b = c * k;
      var s = 0;
      for (var j=1; j < k; j++){ s += cells[nf[b + j]]; }
      out[c] = lt[(cells[nf[b]] << 4) + s];
    }
  } else {
    for (var c=0, n=cells.length, b=0; c < n; c++){
      for (var j=0; j < k; j++, b++){ scratch[j] = cells[nf[b]]; }
      out[c] = rule(scratch);
    }
  }

  var tmp = this.matrix
  this.matrix = this.otherMatrix
  this.otherMatrix = tmp
  return this.matrix
}

// When is this called? This is the only time static is set.
Board.prototype.diff = function()  {

  if (this.static === true) {
    return [];
  }
  var a = this.matrix.cells;
  var b = this.otherMatrix.cells;
  var d = [];
  for (var i=0, l=a.length; i < l; i++){
    if (a[i] !== b[i]){
      d.push(this.matrix.point(i));
    }
  }
  if (d.length === 0){
    this.static = true;
  }
  return d
  }


Board.prototype.reset = function() {
    this.matrix = this.startFunc();
    this.otherMatrix = new FlatMatrix(this.dimensions);
    this.static = false;
};

// Start from a fixed seed pattern instead of a random soup: points are
// [dx, dy] offsets from the board center, set to state 1. Replaces
// startFunc so reset() restores the same seed.
Board.prototype.setStartPattern = function(points){
  var center = this.dimensions.map(e => Math.floor((e-1)/2));
  this.startFunc = () => {
    var m = new FlatMatrix(this.dimensions);
    for (var i=0, l=points.length; i < l; i++){
      m.set(m.move(center, points[i]), 1);
    }
    return m;
  };
  this.reset();
  return this;
};

			     

Board.prototype.getState = function() { return this.matrix.state(); }


// Functions for making and manipulating the matrixes.

// Create an array with values generated by a callback.
var makeArray = function(dimensions, callback){
  // Turn this into a map?
  // Fix the redundant code...

  var arr = [];
  if (dimensions.length === 0){ // pass
  } else if (dimensions.length === 1){
    for (var i=0; i < dimensions[0]; i++){ arr.push(callback()); }
  } else {
    for (var i=0; i<dimensions[0]; i++){
      arr.push(makeArray(dimensions.slice(1), callback));
    }
  }
  return arr;
};


// Build a () => state sampler from a distribution: either an array of
// probabilities per state, or a number n meaning uniform over n states.
var makeSampler = function(distribution){
  if (typeof(distribution) === "number"){
    var val = 1 / distribution;
    distribution = makeArray([distribution], () => val);
  }

  return () => {
    var cutoff = 0;
    var r = Math.random();
    for (var i=0, l=distribution.length; i < l; i++){
      cutoff += distribution[i];
      if (r < cutoff) {
        return i;
      }
    }
    return 0;
  };
};

var randomStart = function (dimensions, distribution) {
  return makeArray(dimensions, makeSampler(distribution));
};


var canonicalStart = function(dimensions) {
  var a = blankStart(dimensions);
  var center = dimensions.map(e => Math.floor((e-1)/2));
  var m = new Matrix(a);
  m.set(center, 1)
  return m.state()
};

var blankStart = function(dimensions) {
  return makeArray(dimensions, () => 0);
};

var getDimensions = function(table){
  var D = []
  while (Array.isArray(table)){
    D.push(table.length)
    table = table[0]
  }
  return D
}

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
      

var Matrix = function(matrix){
  this.matrix = matrix;
  this.dimensions = getDimensions(matrix);
}

  Matrix.prototype.state = function() { return this.matrix; }

  Matrix.prototype.move = function(p1, p2){
    var arr = [];
    for (var i=0, l=p1.length; i<l; i++){
      var dimension = this.dimensions[i];
      var v = (p1[i] + p2[i] + dimension) % dimension;
      arr.push(v);
    }
    return arr;
  }

  Matrix.prototype.get = function(key){
    var res = this.matrix;
    for (var i=0, l=key.length; i < l; i++){
      res = res[key[i]];
      }
    return res;
  }

  Matrix.prototype.set = function(key, value){
    var res = this.matrix
    for (var i=0,l=key.length-1; i < l; i++){
      res = res[key[i]];
    }
    res[key[i]] = value
  }


// Flat typed-array matrix used for Board cell storage. Same interface as
// Matrix (get/set/move/state/dimensions) but backed by a single Uint8Array,
// so cell states must be integers 0-255.
var FlatMatrix = function(dimensions, cells){
  this.dimensions = dimensions;
  this.strides = new Array(dimensions.length);
  var s = 1;
  for (var i = dimensions.length - 1; i >= 0; i--){
    this.strides[i] = s;
    s *= dimensions[i];
  }
  this.cells = cells || new Uint8Array(s);
};

  FlatMatrix.prototype.index = function(point){
    var idx = 0;
    for (var i=0, l=point.length; i < l; i++){ idx += point[i] * this.strides[i]; }
    return idx;
  };

  FlatMatrix.prototype.point = function(index){
    var p = new Array(this.dimensions.length);
    for (var i=0, l=this.dimensions.length; i < l; i++){
      p[i] = Math.floor(index / this.strides[i]) % this.dimensions[i];
    }
    return p;
  };

  FlatMatrix.prototype.get = function(point){ return this.cells[this.index(point)]; };

  FlatMatrix.prototype.set = function(point, value){ this.cells[this.index(point)] = value; };

  FlatMatrix.prototype.move = function(p1, p2){
    var arr = [];
    for (var i=0, l=p1.length; i<l; i++){
      var dimension = this.dimensions[i];
      var v = (p1[i] + p2[i] + dimension) % dimension;
      arr.push(v);
    }
    return arr;
  };

  FlatMatrix.prototype.state = function(){
    var self = this;
    var build = function(d, offset){
      var arr = [];
      var last = d === self.dimensions.length - 1;
      for (var i=0; i < self.dimensions[d]; i++){
        arr.push(last ? self.cells[offset + i] : build(d + 1, offset + i * self.strides[d]));
      }
      return arr;
    };
    return build(0, 0);
  };


  var product = function(arr){
    var prod = 1
    for (var i = 0; i < arr.length; i += 1) {
      prod *= arr[i];
    }
    return prod;
  }



// Utility functions.


var sum = function(xs){
  var r = 0;
  for (var i=0, l=xs.length; i < l; i++){
    r += xs[i];
  }
  return r;
};

var flatten = function(arr){
  var A = [];
  for (var i=0,l=arr.length; i < l; i++){
    if (Array.isArray(arr[i])){
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
  for (var i=0,l=xs.length; i < l; i++){
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
  for (var i=0,l=s.length; i < l; i++) {
    hash += (s[i].charCodeAt() * (i+1));
  }
    return Math.abs(hash) % tableSize;
};

// base 10.
var array2integer = function(arr){
  var n = 0;
  for (var i=0,l=arr.length; i < l; i++){ 
    n = n << 1; 
    n += arr[i]; 
  }
  return n
};


// Run-length encoding for pattern sharing. Each run is <count><stateChar>
// with the count omitted when 1 and the state encoded as a letter ('a' + state).
// Alphabet is [0-9a-z], so the result is URL-safe without escaping.

var encodeRLE = function(arr){
  var s = "";
  var i = 0;
  while (i < arr.length){
    var j = i;
    while (j < arr.length && arr[j] === arr[i]){ j++; }
    var count = j - i;
    s += (count > 1 ? count : "") + String.fromCharCode(97 + arr[i]);
    i = j;
  }
  return s;
};

var decodeRLE = function(str){
  var arr = [];
  var count = 0;
  for (var i=0, l=str.length; i < l; i++){
    var c = str.charCodeAt(i);
    if (c >= 48 && c <= 57){
      count = count * 10 + (c - 48);
    } else {
      var state = c - 97;
      for (var k=0, n=count || 1; k < n; k++){ arr.push(state); }
      count = 0;
    }
  }
  return arr;
};


var hammingDistance = function(xs, ys){
  var n = 0;
  for (var i=0,l=xs.length; i < l; i++){
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
  for (var i=0,l=xs.length; i < l; i++){
    var ns = subNeighbors(xs, i, states);
    a = a.concat(ns);
  }
  return a;
};
  
var neighborhoods = {
    elementary: [[0], [-1], [1]],
    elementary2: [[-2],[-1], [0], [1],[2]],
    elementary3: [[-3], [-2], [-1], [0], [1], [2], [3]],
    vonNeumann: [[0,0], [0,1], [-1,0], [0,-1], [1,0]],
    moore: [[0,0], [0,1], [-1,0], [0,-1], [1,0],[1,1],[1,-1],[-1,1],[-1,-1]]
    // margolis...
};

var rules = {
    makeCyclic: makeCyclicRule,
    makeTree: makeTreeRule,
    langtonsAnt: langtonsAntRule,
    brain: brainRule,
    gnarl: makeLifeFamilyRule([1], [1]),
    gameOfLife: makeLifeFamilyRule([3], [2,3]),
    highLife: makeLifeFamilyRule([3,6], [2,3]),
    twoByTwo: makeLifeFamilyRule([3,6], [1,2,5]),
    walledCities: makeLifeFamilyRule([4,5,6,7,8], [2,3,4,5]),
    seeds: makeLifeFamilyRule([2], []),
    dayAndNight: makeLifeFamilyRule([3,6,7,8], [3,4,6,7,8]),
    maze: makeLifeFamilyRule([3], [1,2,3,4,5]),
    serviettes: makeLifeFamilyRule([2,3,4], []), // B234/S — "Persian rugs"
    amoeba: makeLifeFamilyRule([3,5,7], [1,3,5,8]),
    coral: makeLifeFamilyRule([3], [4,5,6,7,8]),
    morley: makeLifeFamilyRule([3,6,8], [2,4,5]), // Named after Stephen Morley; also called Move. Supports very high-period and slow spaceships
    vote: makeLifeFamilyRule([5,6,7,8], [4,5,6,7,8]),
};

export { Board, Ant, Matrix, FlatMatrix, neighborhoods, rules, makeLifeFamilyRule, makeArray, canonicalStart, blankStart, getIndexes, entropy, flatten, sum, hammingDistance, encodeRLE, decodeRLE };
