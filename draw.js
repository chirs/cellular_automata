
!function(scope){

//"use strict";

// From http://martin.ankerl.com/2009/12/09/how-to-create-random-colors-programmatically/


  var Drawer = function(context, board, scale){

    var row = 0;

    var dRow = function(arr){
      for (var i=0; i < arr.length; i++){
        var color = board.state2color(arr[i]);
        fillCoord([i, row], color);
      }
    };

    var fillCoord = function(coord, style){
      var x = coord[0] * scale ;
      var y = coord[1] * scale ;
      context.fillStyle = style;
      context.fillRect(x,y,scale,scale);
    };

    var drawTable = function(){
      var boardState = board.state();
      var rows = boardState.length;
      if (rows === 0) { return; }
  
      var cols = boardState[0].length;
  
      for (var i=0; i < rows; i++){
        for (var j=0; j < cols; j++){
          var state = boardState[i][j];
          var color = board.state2color(state);
          fillCoord([i,j], color);
        }
      }
    };

    var drawTableNext = function(){
      drawTable();
      board.next();
    }


    var drawRows = function(count){

      if (count === undefined){ count = 1; }
    
      for (var i=0; i < count; i++){
        dRow(board.state());
        board.next();
      }
    }

  var changeSquare = function(){
      var point = [Math.floor(event.offsetX / scale), Math.floor(event.offsetY / scale)];
      var nstate = board.updateValue(point);
      fillCoord(point, board.state2color(nstate));
  }

  var clearCanvas = function(canvas){
      context.clearRect(0,0,canvas.width,canvas.height);
  }

  this.changeSquare = changeSquare
  this.clearCanvas = clearCanvas
  this.drawRows = drawRows
  this.drawTable = drawTable
  this.drawTableNext = drawTableNext
  this.fillCoord = fillCoord
  this.reset = function(){ row = 0;}

};


// Utilities.

var getURLHash = function(w, deflt){
  var wlh = w.location.hash;
  if (wlh) { return wlh.slice(1, wlh.length); }
  else { return deflt; }
};


this.Drawer = Drawer

}(this);