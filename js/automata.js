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


var treeRule = function(states){
  var currentState = states[0];
  var tree_prob = 0.005
  var prob_grow = Math.random()
  var neighbors = states.slice(1);

  if (currentState === 0 && prob_grow <tree_prob) {return 1;}
  if (currentState === 1 && neighbors.indexOf(2)> -1) {return 2;}
  if (currentState === 2) {return 0;}
  return currentState;
}

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
  var internalState = 0;

  var updateInternalState = function(cellState){
    if (cellState === 0){
      internalState = (internalState + 1) % 4;
    } else {
      internalState = (internalState + 3) % 4;
    }
  };

  var move = function(n){
    // Change the value of the cell occupied cell.
    var cellState = board.matrix().get(position);
    updateInternalState(cellState);
    board.updateValue(position);

    var m = rule(cellState, internalState);
    position = board.matrix().move(position, m) // Update position
    return position;
  };

  this.move = move
  this.getPosition = function() { return position; }

};



var Board = function(dimensions, cellStates, neighbors, initial_distribution){

  var neighborStates = Math.pow(cellStates, neighbors.length); // Number of possible cell arrangements.
  var ruleSets = Math.pow(2, neighborStates);

  var startFunc = function() { return new Matrix(initial_distribution ? randomStart(dimensions, initial_distribution) : canonicalStart(dimensions)); };
  var matrix = startFunc();

  var rule;
  var ruleTable = null;

  var colorMap = generateColors(cellStates);
  var state2color = function(state){ return colorMap[state]; }

  var setRule = function(r){ 
    ruleTable = null;
    rule = r; 
    return self;
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
    var l = arr.length
    while (l < neighborStates){ arr.unshift(0); } // left-fill with zeros.
    return arr;
  };

  var getPopulationCount = function(){
    var counts = blankStart([cellStates]);
    var indexes = getIndexes(dimensions);

    for (var i=0, l=indexes.length; i < l; i++){
      counts[matrix.get(indexes[i])] += 1;
    }
    return counts;
  };


  var calculateState = function(cell){
    var states = [];
    for (var i=0, l=neighbors.length; i < l; i++){
      var n = matrix.move(cell, neighbors[i])
      var v = matrix.get(n)
      states.push(v);
    }
    return rule(states);
  };

  var generateNextState = function(){

    var indexes = getIndexes(dimensions);
    var newMatrix = new Matrix(canonicalStart(dimensions));

    for (var i=0, l=indexes.length; i < l; i++){
      newMatrix.set(indexes[i], calculateState(indexes[i]));
    }

    return newMatrix;
  };  

  var updateValue = function(point){
      var s = matrix.get(point);
      var ns = (s + 1) % cellStates;
      matrix.set(point, ns);
      return ns;
  }

  var next = function(){
      matrix = generateNextState();
      return matrix
  }

  this.cellStates = cellStates
  this.dimensions = dimensions
  this.getPopulationCount = getPopulationCount
  this.matrix = function() { return matrix; }
  this.next = next
  this.reset = function() { matrix = startFunc(); }
  this.ruleTable = function(){ return ruleTable; }
  this.setRule = setRule
  this.setRandomRule = setRandomRule
  this.setRuleTable = setRuleTable
  this.setRuleByNumber = setRuleByNumber
  this.state = function() { return matrix.state(); }
  this.state2color = state2color
  this.updateValue = updateValue

};



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

  var dimensions = getDimensions(matrix);

  this.state = function() {return matrix; }

  this.move = function(p1, p2){
    var arr = [];
    for (var i=0, l=p1.length; i<l; i++){
      var dimension = dimensions[i];
      var v = (p1[i] + p2[i] + dimension) % dimension;
      arr.push(v);
    }
    return arr;
  }

  this.get = function(key){
    var res = matrix;
    for (var i=0, l=key.length; i < l; i++){
      res = res[key[i]];
      }
    return res;
  }

  this.set = function(key, value){
    var res = matrix
    for (var i=0,l=key.length-1; i < l; i++){
      res = res[key[i]];
    }
    res[key[i]] = value 
  }
};


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
    gnarl: makeLifeStyleRule([1], [1]),
    gameOfLife: makeLifeStyleRule([3], [2,3]),
    highLife: makeLifeStyleRule([3,6], [2,3]),
    twoByTwo: makeLifeStyleRule([3,6], [1,2,5]),
    walledCities: makeLifeStyleRule([2,3,4,5], [4,5,6,7,8]),
    seeds: makeLifeStyleRule([2], []),
    dayAndNight: makeLifeStyleRule([3,6,7,8], [3,4,6,7,8]),
    maze: makeLifeStyleRule([1,2,3,4,5], [3]),
    serviettes: makeLifeStyleRule([], [2,3,4]),
    amoeba: makeLifeStyleRule([3,5,7], [1,3,5,8]),
    coral: makeLifeStyleRule([3], [4,5,6,7,8]),
    morley: makeLifeStyleRule([3,6,8], [2,4,5]), // Named after Stephen Morley; also called Move. Supports very high-period and slow spaceships
    vote: makeLifeStyleRule([5,6,7,8], [4,5,6,7,8]),
  }
    
}(this);