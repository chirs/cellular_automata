// An implementation of the Game of Life automaton.
// Pretty sure this is just a 2-d elementary cellular automaton.
// http://en.wikipedia.org/wiki/Elementary_cellular_automaton
// http://en.wikipedia.org/wiki/Conway's_Game_of_Life


// We consider the Moore neighborhood only, 
// so there are 2 ** 5 possible states for an individual
// that makes 2^(2^5) = 4294967296 possible states.
// (Moore neighborhood give 2^(2^9)= 1.3407807929942597e+154 states)


// e.g. Rule 14 = 0000 1110
// maps to this state ordering:
//  [1,1,1] -> 0
//  [1,1,0] -> 0
//  [1,0,1] -> 0
//  [1,0,0] -> 0
//  [0,1,1] -> 1
//  [0,1,0] -> 1
//  [0,0,1] -> 1
//  [0,0,0] -> 1
// Possibly have this reversed.


var makeArray = function(rows, cols, f){
  var xs
  var arr = []
  for (var i=0; i<rows; i++){
    xs = []
    for (var j=0; j<cols; j++){
      f(xs)
    }
    arr.push(xs)
  }
  return arr;
}


var randomRule = function(){
  return Math.floor(Math.random() * Math.pow(2, Math.pow(2, 5)))
}


var randomStart = function (rows, cols, limit) {
  var f = function(arr){ if (Math.random() > limit) { arr.push(1); } else { arr.push(0) } }
  return makeArray(rows, cols, f)
}


var canonicalStart = function(rows, cols) {
  var f = function(arr){ arr.push(0); }
  var a = makeArray(rows, cols, f)
  return a;
}


var generateRule = function(n){
  var l = n.toString(2).split("").map( function(s){ return parseInt(s) } )
  while (l.length < 32){ l.unshift(0); }
  return l
};

var getNext = function(l, m, r, rule){
  var s = [l,m,r].join("");
  var n = parseInt(s, 2);
  var i = 31 - n;
  return rule[i];
};

var getState = function(i, j, table, rule){
  if (Math.random() > .5){
    return 1;
  } else {
    return 0;
  }
}


var generateNext = function(table, n){
  var rule = generateRule(n);
  var l = [];
  var rows = table.length
  if (rows == 0){ return [] }
  var cols = table[0].length

  for (var i=0; i < rows; i++){
    var m = []
    for (var j=0; j < cols; j++){
      var state = getState(i, j, table, rule);
      m.push(state);
    }
    l.push(m);
    }
  return l
  }
  
                          

// n should be a number between 0 and 4294967296
// random -> randomly seeded board
var generator = function(rows, cols, rule, random, density){
  if (random) {
    var history = [randomStart(rows, cols, density)];
  } else {
    var history = [canonicalStart(rows, cols)];
  }
  

  return {

    next: function(){
      var state = generateNext(history[history.length-1], rule)
      history.push(state)
      return state
    },

  }
}


