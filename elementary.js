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


var randomStart = function(n){
  var arr = [];
  for (var i=0; i<n; i++) {
    if (Math.random() > .5) { arr.push(1); }
    else { arr.push(0) }
  }
  return arr;
};

  
  

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

  l.push(getNext(row[i+1], row[i+2], 0, rule))
  return l

}
                          

// n should be a number between 0 and 255.
var generator = function(length, n){
  var rows = [randomStart(length)];
  console.log(rows)


  return {

    next: function(){
      var l = generateNext(rows[rows.length-1], n)
      rows.push(l)
      return l
    },


  }

              
  
}




  // This manages cell state.
  var cellState = function(){
    var cellMap = {};

    var g = function(key){
      if (key in cellMap){
        return cellMap[key]
      } else {
        return 0;
      }
    };

    var s = function(key){
      cellMap[key] = (g(key) + 1) % totalColors;
    };

    //var c = function(key){
    //  return [
    //    "#000",
    //    "#fff",
    //    "#ccc",
    //    "#999",
    //    "#555",
    //  ][g(key)]
    //};


    var c = function(key){
      return colorList[g(key)];
    };

    var a = function(){
      var l= []
      for (var k in cellMap){
        if (cellMap.hasOwnProperty(k)){
          var key = k.split(',').map(function(s){return parseInt(s) } ) // ugh.
          l.push([key, c(k)]);
        };
      }

      return l;
    };


    return { get: g, set: s, getColor: c, allColors: a, foo: "x" }
  }();



