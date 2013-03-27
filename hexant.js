
var makeAnt = function(){
  var coord = null;
  var blackSquares = {};
  var orientation = 'up';

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

  return {

    getCoord: function(){ return coord;  },
    getBlackSquares: function(){ return blackSquares; },
    getOrientation: function(){ return orientation; },
    isBlack: function(){ return coord in blackSquares; },

    move: function(){
      coord = getNewCoord();      
      if (coord in blackSquares) {
        turnLeft();
        delete blackSquares[coord];
      } else {
        turnRight();
        blackSquares[coord] = true;
      }

    }
  };

};


//exports.makeAnt = makeAnt