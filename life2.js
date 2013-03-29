


NEIGHBORS = [[0,0], [0,1], [-1,0], [0,-1], [1,0]]
LIFE_NEIGHBORS = [[0,0], [0,1], [-1,1], [-1,0], [-1,-1], [0,-1], [1,-1], [1,0], [1,1]]

CELL_POSITIONS = Math.pow(2, NEIGHBORS.length)
RULE_SETS = Math.pow(2, CELL_POSITIONS)

// Select a random rule.
var randomRule = function(){
  //return Math.floor(Math.random() * Math.pow(2, Math.pow(2, 5)))
  return Math.floor(Math.random() * RULE_SETS)
}






// Create an array with values generated by f.
var makeArray = function(rows, cols, f){
  var xs;
  var arr = [];
  for (var i=0; i<rows; i++){
    xs = []
    for (var j=0; j<cols; j++){
      xs.push(f())
    }
    arr.push(xs)
  }
  return arr;
}


var randomStart = function (rows, cols, limit) {
  var f = function(arr){ if (Math.random() > limit) { return 1; } else { return 0; } }
  return makeArray(rows, cols, f)
}


var canonicalStart = function(rows, cols) {
  var f = function(arr){ return 0 }
  var a = makeArray(rows, cols, f)
  var i = Math.floor(rows / 2)
  var j = Math.floor(cols / 2)
  a[i][j] = 1
  return a
}

var generateRule = function(n){
  var l = n.toString(2).split("").map( function(s){ return parseInt(s) } )
  while (l.length < CELL_POSITIONS){ l.unshift(0); }

  return l
};




var getState = function(cell, table, rule){

  var rows = table.length;
  var cols = table[0].length

  var getNeighbor = function(p1,p2){ return [(p1[0] + p2[0] + rows) % rows, (p1[1] + p2[1] + cols) % cols] }
  var getValue = function(p){ return table[p[0]][p[1]] }

  var states = []
  for (i=0; i < NEIGHBORS.length; i++){
    var n = getNeighbor(cell, NEIGHBORS[i])
    var v = getValue(n);
    states.push(v)
  }

  var n = parseInt(states.join(""), 2)
  return rule[n]
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
      //console.log("GNEXT ->") 
      //console.log(table);

      var state = getState([i,j], table, rule);
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

  var state = function(){ return history[history.length-1] }
  

  return {
    state: state, 

    next: function(){
      var newState = generateNext(state(), rule)
      history.push(newState)
      return newState
    },

  }
}








