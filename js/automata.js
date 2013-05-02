!function(scope){

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


  var help = function(e){ 
    var s = Math.floor(e).toString(16);
    if (s.length === 1){ s = "0" + s; }
    return s;
  };
  var rgb2css = function(l){ return "#" + help(l[0]) + help(l[1]) + help(l[2]); };

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
  return function(states){
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
  return function(states){
    var currentState = states[0];
    var neighbors = states.slice(1);

    if (currentState === 0 && Math.random() <growProb) {return 1;}
    if (currentState === 1 && neighbors.indexOf(2)> -1) {return 2;}
    if (currentState === 1 && Math.random() <burnProb ) {return 2;}

    if (currentState === 2) {return 0;}
    return currentState;
  }
}


// Family: Life
var makeLifeFamilyRule = function(deadStates, liveStates){

  return function(states){
    var state = states[0];
    var neighbors = sum(states.slice(1));
    if (state === 0 && deadStates.indexOf(neighbors) > -1){ return 1; }
    if (state === 1 && liveStates.indexOf(neighbors) > -1){ return 1; }
    return 0;
  };
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

Ant.prototype.getPosition = function() { return this.position; }



var Board = function(dimensions, cellStates, neighbors, initial_distribution){

  this.dimensions = dimensions
  this.cellStates = cellStates
  this.neighbors = neighbors
  this.indexes = getIndexes(dimensions);

  this.neighborStates = Math.pow(cellStates, neighbors.length); // Number of possible cell arrangements.
  this.ruleSets = Math.pow(2, this.neighborStates);

  this.startFunc = function() { return new Matrix(initial_distribution ? randomStart(dimensions, initial_distribution) : canonicalStart(dimensions)); };
  this.matrix = this.startFunc();
  this.otherMatrix = new Matrix(canonicalStart(this.dimensions));

  this.rule = undefined
  this.ruleTable = null;

  this.static = false // Set when matrix == otherMatrix - not working yet. 

  this.colorMap = generateColors(cellStates);
  this.neighborMatrix = this.generateNeighbors();
}

Board.prototype.state2color = function(state){ return this.colorMap[state]; }

Board.prototype.generateNeighbors = function(){
  var m = new Matrix(blankStart(this.dimensions));
  for (var i=0, l=this.indexes.length; i<l; i++){
    var p = this.indexes[i]
    var n = this.neighbors.map(function(v){ return m.move(v, p) });
    m.set(p, n);
  }
  return m;
}

Board.prototype.setRule = function(r){ 
  this.ruleTable = null;
  this.rule = r; 
  return this;
};

Board.prototype.setRuleByNumber = function(n){ return this.setRuleTable(this.createRuleTable(n)); };

Board.prototype.setRuleTable = function(t){ 
  this.setRule(function(a){ return this.ruleTable[array2integer(a, 10)] });
  this.ruleTable = t;
  return this;
};

Board.prototype.setRandomRule = function(){
  return this.setRuleTable(randomStart([this.neighborStates], this.cellStates));
  };

Board.prototype.createRuleTable = function(n){
    // Fix this.
    var arr = n.toString(2).split("").map( function(s){ return parseInt(s, 10); } );
    var l = arr.length
    while (l < this.neighborStates){ arr.unshift(0); } // left-fill with zeros.
    return arr;
  };

Board.prototype.getPopulationCount = function(){
    var counts = blankStart([this.cellStates]);

    for (var i=0, l=this.indexes.length; i < l; i++){
      counts[this.matrix.get(this.indexes[i])] += 1;
    }
    return counts;
  };


Board.prototype.calculateStateOld = function(cell){
    var states = [];
    for (var i=0, l=this.neighbors.length; i < l; i++){
      var n = this.matrix.move(cell, this.neighbors[i])
      var v = this.matrix.get(n)
      states.push(v);
    }
    return this.rule(states);
  };

Board.prototype.calculateState = function(p){
  var m = this.matrix;
  var neighbors = this.neighborMatrix.get(p);
  var states = []
  for (var i=0,l=neighbors.length; i<l; i++){
    states.push(m.get(neighbors[i]))
  }
  //var states = neighbors.map(function(n){ return m.get(n); });
  return this.rule(states);
}


Board.prototype.updateValue = function(point){
  var s = this.matrix.get(point);
  var ns = (s + 1) % this.cellStates;
  this.matrix.set(point, ns);
  return ns;
}

Board.prototype.next = function(){
  if (this.static === true){
    return this.matrix;
  }

  for (var i=0, l=this.indexes.length; i < l; i++){
    this.otherMatrix.set(this.indexes[i], this.calculateState(this.indexes[i]));
  }

  var tmp = this.matrix
  this.matrix = this.otherMatrix
  this.otherMatrix = tmp
  return this.matrix
}

Board.prototype.diff = function()  {

  if (this.static === true) {
    return [];
  }
  var d = matrixDiff(this.indexes, this.matrix, this.otherMatrix)
  if (d.length === 1){
    this.static = true;
    console.log('static');
  }
  console.log(d);
  return d
  // diff seems to be missing the final item?
  }

Board.prototype.reset = function() { this.matrix = this.startFunc(); }
Board.prototype.getState = function() { return this.matrix.state(); }


var matrixDiff = function(indexes, m1, m2){
  var p;
  var d = [];
  for (var i=0, l=indexes.length; i<l; i++){
    p = indexes[i];
    if (m1.get(p) != m2.get(p)){
      d.push(p)
    }
  }
  return d;
}


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


var randomStart = function (dimensions, distribution) {

  if (typeof(distribution) === "number"){
    var val = 1 / distribution;
    var distribution = makeArray([distribution], function(){ return val });
  }
 
  var f = function(){
    var cutoff = 0;
    var r = Math.random();
    for (var i=0, l=distribution.length; i < l; i++){
      cutoff += distribution[i];
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
  var m = new Matrix(a);
  m.set(center, 1)
  return m.state()
};

var blankStart = function(dimensions) {
  return makeArray(dimensions, function(){ return 0; });
};

var getDimensions = function(table){
  var D = []
  while (isArray(table)){
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



// Utility functions.

var isArray = function (o) {
  return (o instanceof Array) ||
    (Object.prototype.toString.apply(o) === '[object Array]');
};

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
  
  this.Ant = Ant
  this.Board = Board
  this.neighborhoods = {
    elementary: [[0], [-1], [1]],
    elementary2: [[-2],[-1], [0], [1],[2]],
    elementary3: [[-3], [-2], [-1], [0], [1], [2], [3]],
    vonNeumann: [[0,0], [0,1], [-1,0], [0,-1], [1,0]],
    moore: [[0,0], [0,1], [-1,0], [0,-1], [1,0],[1,1],[1,-1],[-1,1],[-1,-1]]
    // margolis...
  }

  this.rules = {
    makeCyclic: makeCyclicRule,
    makeTree: makeTreeRule,
    langtonsAnt: langtonsAntRule,
    gnarl: makeLifeFamilyRule([1], [1]),
    gameOfLife: makeLifeFamilyRule([3], [2,3]),
    highLife: makeLifeFamilyRule([3,6], [2,3]),
    twoByTwo: makeLifeFamilyRule([3,6], [1,2,5]),
    walledCities: makeLifeFamilyRule([2,3,4,5], [4,5,6,7,8]),
    seeds: makeLifeFamilyRule([2], []),
    dayAndNight: makeLifeFamilyRule([3,6,7,8], [3,4,6,7,8]),
    maze: makeLifeFamilyRule([1,2,3,4,5], [3]),
    serviettes: makeLifeFamilyRule([], [2,3,4]),
    amoeba: makeLifeFamilyRule([3,5,7], [1,3,5,8]),
    coral: makeLifeFamilyRule([3], [4,5,6,7,8]),
    morley: makeLifeFamilyRule([3,6,8], [2,4,5]), // Named after Stephen Morley; also called Move. Supports very high-period and slow spaceships
    vote: makeLifeFamilyRule([5,6,7,8], [4,5,6,7,8]),
  }
    
}(this);