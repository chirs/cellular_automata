// An implementation of Langton's ant.
// http://en.wikipedia.org/wiki/Langton's_ant
// 



var turnRight = function(o){
  return {
    'up': 'right',
    'right': 'down',
    'down': 'left',
    'left': 'up',
  }[o];
};

var turnLeft = function(o){
  return {
    'up': 'left',
    'left': 'down',
    'down': 'right',
    'right': 'up',
  }[o]
};

var reverse = function(o){
  return {
    'up': 'down',
    'down': 'up',
    'left': 'right',
    'right': 'left',
  }[o];
};

var straight = function(o){ return o; }


var makeAnt = function(description, colorList){
  description = description || "LR"

  colorList = colorList || ["#000", "#fff", "#ff0000", "#00ff00", "#0000ff",];
  //console.log(colorList);

  var totalColors = description.length

  actionMap = {
    'L': turnLeft,
    'R': turnRight,
    'V': reverse,
    'S': straight,
  }

  // Build action list.
  actionList = []
  for (var i=0; i < description.length; i++){
    var character = description[i];
    actionList.push(actionMap[character]);
  };


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


  var coord = [0,0]; 
  var orientation = 'up'; // Need to improve this.


  // get the next coord we'll be visiting.
  var getNewCoord = function(){

    if (coord == null){
      return [0,0];
    }
    var d =  {
      'up': [1,0],
      'left': [0,-1],
      'down': [-1, 0],
      'right': [0,1],
    }[orientation];

    return [coord[0] + d[0], coord[1] + d[1]]
  };



  // Just return the function?
  return {

    allColors: cellState.allColors,


    move: function(){
      var state = cellState.get(coord);
      var action = actionList[state];
      cellState.set(coord);
      orientation = action(orientation);
      coord = getNewCoord();


      return {
        coord: coord,
        color: cellState.getColor(coord),
      }
    }
  };

};


//exports.makeAnt = makeAnt