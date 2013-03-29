// An implementation of Elementary Cellular automaton
// http://en.wikipedia.org/wiki/Elementary_cellular_automaton


// Example
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


var makeArray = function(n, f){
  var arr = []
  for (var i=0; i<n; i++) { f(arr) }
  return arr
}

var randomStart = function (n, density) {
  return makeArray(n, function(arr) {
    if (Math.random() > density) { arr.push(1); }
    else { arr.push(0) }
  });

}

var canonicalStart = function(n) {
  var a = makeArray(n, function(arr){ arr.push(0); })
  a[Math.floor(n/2)] = 1;
  return a;
}


var generateRule = function(n){
  var l = n.toString(2).split("").map( function(s){ return parseInt(s) } )
  while (l.length < 8){ l.unshift(0); }
  return l
};

var getNext = function(l, m, r, rule){
  var s = [l,m,r].join("");
  var n = parseInt(s, 2);
  var i = 7 - n;
  return rule[i];
};


var generateNext = function(row, n){
  var rule = generateRule(n);
  var l = [];
  var ln = row.length
  l.push(getNext(row[ln-1], row[0], row[1], rule))

  for (var i=1; i < ln-1; i++){
    l.push(getNext(row[i-1], row[i], row[i+1], rule))
  }
  l.push(getNext(row[i-1], row[i], row[0], rule))
  return l

}
                          

// n should be a number between 0 and 255.
var generator = function(length, n, random, density){
  if (random) {
    var rows = [randomStart(length, density)];
  } else {
    var rows = [canonicalStart(density)];
  }

  return {

    next: function(){
      var l = generateNext(rows[rows.length-1], n)
      rows.push(l)
      return l
    },

  }
}


