// An implementation of Langton's ant.
// http://en.wikipedia.org/wiki/Langton's_ant
// 


var makeAnt = function(){
  var totalColors = 2;


  // This manages cell state.
  var cellColor = function(){
    var cellMap = {}

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

    var c = function(key){
      return [
        "#000",
        "#fff",
      ][g(key)]
    };

      return { get: g, set: s, getColor: c }
  }();


  var coord = [0,0]; 
  var orientation = 'up'; // Need to improve this.

  var turnRight = function(o){
    orientation = {
      'up': 'right',
      'right': 'down',
      'down': 'left',
      'left': 'up',
    }[orientation];
  };

  var turnLeft = function(o){
    orientation =  {
      'up': 'left',
      'left': 'down',
      'down': 'right',
      'right': 'up',
    }[orientation];
  };

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

  var actionMap = [
    turnRight,
    turnLeft,
  ]


  // Just return the function?
  return {

    move: function(){
      var color = cellColor.get(coord);
      //console.log(color);
      var action = actionMap[color];
      cellColor.set(coord);
      action();
      coord = getNewCoord();

      return {
        coord: coord,
        color: cellColor.getColor(coord),
      }
    }
  };

};


//exports.makeAnt = makeAnt