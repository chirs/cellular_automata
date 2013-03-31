


// Common neighborhoods
ELEMENTARY_NEIGHBORHOOD = [[-1], [0], [1]] 
VON_NEUMANN_NEIGHBORHOOD = [[0,0], [0,1], [-1,0], [0,-1], [1,0]]
MOORE_NEIGHBORHOOD = [[0,0], [0,1], [-1,0], [0,-1], [1,0],[1,1],[1,-1],[-1,1],[-1,-1]]
// MARGOLUS NEIGHBORHOOD...

STATES = 2 // The number of possible states. Not currently used.


var sum = function(xs){
  var r = 0
  for (var i=0; i < xs.length; i++){
    r += xs[i];
  }
  return r;
}



// This is actually summing two vectors.
// Used to identify node neighbors.
var getNeighbor = function(dimensions, p1, p2){
  var d = getDimensions(p1)
  var l = []
  for (var i=0; i<d; i++){
    var dimension = dimensions[i]
    var v = (p1[i] + p2[i] + dimension) % dimension
    l.push(v)
  }
  return l;
}


// Family: Life
var makeLifeStyleRule = function(deadStates, liveStates){

  return function(states){

    var state = states[0]
    var neighbors = sum(states.slice(1))

    if (state == 0 && deadStates.indexOf(neighbors) > -1){
      return 1
    } else {
      if (state == 1 && liveStates.indexOf(neighbors) > -1){
        return 1
      } else {
        return 0
      }
    }
  }
}

var forgotRule = makeLifeStyleRule([2], [])
var gameOfLifeRule = makeLifeStyleRule([3], [2,3])
var morleyRule = makeLifeStyleRule([3,6,8], [2,4,5]) // Named after Stephen Morley; also called Move. Supports very high-period and slow spaceships
var dayAndNightRule = makeLifeStyleRule([3,6,7,8], [3,4,6,7,8])
var highLifeRule = makeLifeStyleRule([3,6], [2,3])
var twoByTwoRule = makeLifeStyleRule([3,6], [1,2,5])
var mazeRule = makeLifeStyleRule([1,2,3,4,5], [3])
var serviettesRule = makeLifeStyleRule([], [2,3,4])
var walledCitiesRule = makeLifeStyleRule([2,3,4,5], [4,5,6,7,8])


var randomChoice = function(arr){
  var i = Math.floor(Math.random() * arr.length)
  return arr[i]
}

var randomWalkRule = function(state){
  return randomChoice([[0,1],[1,0],[-1,0],[0,-1]])
}

var upAntRule = function(state){
  return [0,-1]
}

var leftAntRule = function(state){
  return [-1,0,]
}

var staticRule = function(state){
  return [[0,-1,], [1, 0]][state]
}

var langtonsAntRule = function(boardState, internalState){
  var moves = [[0,1],[1,0],[0,-1],[-1,0]]
  return moves[internalState];
}

var adderAntRule = function(boardState, internalState){
  var moves = [[0,1],[1,0],[0,-1],[-1,0]]
  return moves[internalState];
}



var makeAnt = function(position, rule, board){
  //var moves = [[0,1],[1,0],[-1,0],[0,-1]]

  var internalState = 0


  var setInternalState = function(cellState){
    if (cellState == 0){
      internalState = (internalState + 1) % 4
    } else {
      internalState = (internalState + 3) % 4
    }
  }

  var move = function(){
      var cellState = getValue(position, board.state())
      setInternalState(cellState)

      board.updateValue(position)
      //console.log(position)
      //console.log(board)
      var move = rule(cellState, internalState)
      position = getNeighbor(board.dimensions, position, move)
      return position
  }



  
  return {

    getPosition: function() { return position },

    moves: function(n){
      for (var i=0; i<n; i++){
        move();
      }
    },

    move: move,
    
  }
}

  


var generator = function(dimensions, neighbors, random, density){
  var rule, ruleNumber;

  // Join states [0,1,0,0...], turn into a decimal number, e.g. 32000.
  var states2number =  function(states) { return parseInt(states.join(""), 2)}

  var number2states = function(n){ 
    var arr = n.toString(2).split("").map( function(s){ return parseInt(s) } )
    while (arr.length < cell_positions){ arr.unshift(0); } // left-fill with zeros.
    return length
  }
  
  var cell_positions = Math.pow(STATES, neighbors.length)
  var rule_sets = Math.pow(2, cell_positions)

  var randomRule = function(){ return Math.floor(Math.random() * rule_sets) }



  var generateRule = function(states){
    // Returns an array of the form [0,0,1,1,0,1...]
    var n = states2number(states)
    return  function(n) { return arr[n] }
  };
  var generateRandomRule = function(){
    return generateRule(number2states(randomRule()))
  }
  

  if (random) {
    var startFunc = function() { return randomStart(dimensions, density) }

  } else {
    var startFunc = function() { return canonicalStart(dimensions) }
  }
  var history = [startFunc()];

  var state = function(){ return history[history.length-1] }

  var setRule = function(r){
    if (r == undefined){
      rule = generateRandomRule()
    } else {
      rule = r
    }
  }

  var getRuleNumber = function(){
    return ruleNumber;
  }

  return {
    state: state, 
    getRuleNumber: getRuleNumber,
    setRule: setRule,
    dimensions: dimensions,

    reset: function() { history = [startFunc()] },

    updateValue: function(point){
      var s = getValue(point, state())
      var ns = (s + 1) % STATES
      setValue(point, ns, state())
      return ns

    },
    

    next: function(){
      var newState = generateNextState(dimensions, neighbors, state(), rule)
      history = []
      history.push(newState)
      return newState
    },

  }
}



// Create an array with values generated by a callback.
var makeArray = function(dimensions, callback){
  var arr = []
  if (dimensions.length == 0){
    return arr;
  } else if (dimensions.length == 1){
    for (var i=0; i < dimensions[0]; i++){ arr.push(callback()) }
    return arr;
  } else {
    var arr = []
    for (var i=0; i<dimensions[0]; i++){
      arr.push(makeArray(dimensions.slice(1), callback));
    }
    return arr;
  }
}


var randomStart = function (dimensions, limit) {
  var f = function(){ if (Math.random() > limit) { return 1; } else { return 0; } }
  return makeArray(dimensions, f)
}


var canonicalStart = function(dimensions) {
  var a = makeArray(dimensions, function(){ return 0 })
  //var i = Math.floor(rows / 2)
  //var j = Math.floor(cols / 2)
  //a[i][j] = 1
  return a
}




var getIndexes = function(dimensions){
  if (dimensions.length == 0){
    return [[]]
  } else {
    var arr = []
    for (var i=0; i < dimensions[0]; i++){
      var sub = getIndexes(dimensions.slice(1));
      for (var j=0; j < sub.length; j++){
        var m = sub[j]
        m.unshift(i)
        arr.push(m)
      }
    }
    return arr
  }
}
      



// Get the dimensions of an array. e.g. [[[1,2,3], [2,3,4], [1,5,8]]] -> 3 (should this be [1,1,3]?)
// Pretty sure this is just length.
var getDimensions = function(matrix){
  if (matrix.length == 0){
    return 0;
  } else {
    return 1 + getDimensions(matrix.slice(1));
  }
}




// Given a value like [1,4,7], pull those indexes from a nested array.
var getValue = function(p, table){
  if (p.length == 0){
    return table;
  } else {
    return getValue(p.slice(1), table[p[0]])
  }
}


var setValue = function(p, value, table){
  if (p.length == 1){
    table[p[0]] = value
  } else {
    return setValue(p.slice(1), value, table[p[0]])
  }
}


var getState = function(dimensions, neighbors, cell, table, rule){

  //var rows = table.length;
  //var cols = table[0].length

  //var getNeighbor = function(p1,p2){ return [(p1[0] + p2[0] + rows) % rows, (p1[1] + p2[1] + cols) % cols] }
  //var getValue = function(p){ return table[p[0]][p[1]] }

  var states = []
  for (i=0; i < neighbors.length; i++){
    var n = getNeighbor(dimensions, cell, neighbors[i])
    var v = getValue(n, table);
    states.push(v)
  }

  return rule(states)


}


// Need to iterate over whole table regardless of dimensions.
var generateNextState = function(dimensions, neighbors, table, rule){

  var indexes = getIndexes(dimensions);
  var newTable = canonicalStart(dimensions);


  for (var i=0; i < indexes.length; i++){
    var newVal = getState(dimensions, neighbors, indexes[i], table,rule)
    setValue(indexes[i], newVal, newTable);
  }
  return newTable;
}  
                          





