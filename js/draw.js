
!function(scope){

//"use strict";

// From http://martin.ankerl.com/2009/12/09/how-to-create-random-colors-programmatically/


  var Drawer = function(context, board, scale){
    this.context = context
    this.board = board
    this.scale = scale

    this.row = 0; // bad idea.
  }

  Drawer.prototype.drawRow = function(arr){
     for (var i=0, l=arr.length; i < l; i++){
        var color = this.board.state2color(arr[i]);
        this.fillCoord([i, this.row], color);
      }
    };

  Drawer.prototype.fillCoord = function(coord, style){
      var x = coord[0] * this.scale ;
      var y = coord[1] * this.scale ;
      this.context.fillStyle = style;
      this.context.fillRect(x,y,this.scale,this.scale);
    };

  Drawer.prototype.drawTable = function(){
      var boardState = this.board.getState();
      var rows = boardState.length;
      if (rows === 0) { return; }
  
      var cols = boardState[0].length;
  
      for (var i=0; i < rows; i++){
        for (var j=0; j < cols; j++){
          var state = boardState[i][j];
          var color = this.board.state2color(state);
          this.fillCoord([i,j], color);
        }
      }
    };

   Drawer.prototype.drawTableNext = function(){
     this.drawTable();
      //board.next();
      //console.log(board)
      //board.next();
    }


    Drawer.prototype.drawRows = function(count){

      if (count === undefined){ count = 1; }
    
      for (var i=0; i < count; i++){
        this.drawRow(this.board.getState());
        this.board.next();
      }
    }

  Drawer.prototype.changeSquare = function(){
      var point = [Math.floor(event.offsetX / this.scale), Math.floor(event.offsetY / this.scale)];
      var nstate = this.board.updateValue(point);
      this.fillCoord(point, this.board.state2color(nstate));
  }

  Drawer.prototype.clearCanvas = function(canvas){
    this.context.clearRect(0,0,canvas.width,canvas.height);
  }

  Drawer.prototype.reset = function(){ this.row = 0;}



// Utilities.

var getURLHash = function(w, deflt){
  var wlh = w.location.hash;
  if (wlh) { return wlh.slice(1, wlh.length); }
  else { return deflt; }
};


this.Drawer = Drawer

}(this);