"use strict";

// From http://martin.ankerl.com/2009/12/09/how-to-create-random-colors-programmatically/


var Drawer = function(context, board, scale, maximum, repeat){

  var row = 0;

  var dRow = function(arr){
    console.log(row);
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

  return {

    clearCanvas: function(canvas){
      context.clearRect(0,0,canvas.width,canvas.height);
    },
    
    changeSquare: function(){
      var point = [Math.floor(event.offsetX / scale), Math.floor(event.offsetY / scale)];
      var nstate = board.updateValue(point);
      fillCoord(point, board.state2color(nstate));
    },

    drawTable: drawTable,
    fillCoord: fillCoord,

    drawTableNext: function(){
      board.next();
      drawTable(context, board.state(), scale);
    },

    reset: function(){
      row = 0;
    },

    drawRows: function(count){
      console.log('d')
      if (row > maximum){ 
        if (repeat){
          row = 0;
        } else {
          return;
        }
      }

      if (count === undefined){ count = 1; }

      for (var i=0; i < count; i++){
        dRow(board.state());
        board.next();
        row += 1;
      }
    }

  };
};


// Utilities.

var getURLHash = function(w, deflt){
  var wlh = w.location.hash;
  if (wlh) { return wlh.slice(1, wlh.length); }
  else { return deflt; }
};


var hsv2rgb = function(h, s, v){
  var h_i = h * 6;
  var f = h * 6 - h_i;
  var p = v * (1 - s);
  var q = v * (1 - f * s);
  var t = v * (1 - (1 - f * s));
  var r, g, b;
  switch(Math.floor(h_i)){
  case 0: r=v, g=t, b=p; break;
  case 1: r=q, g=v, b=p; break;
  case 2: r=p, g=v, b=t; break;
  case 3: r=p, g=q, b=v; break;
  case 4: r=t, g=p, b=v; break;
  case 5: r=v, g=p, b=q; break;
  }
  return [r*256,g*256,b*256];
};


var generateColors = function(n){
  //return ["#ff0", "#0f0", "#00f","#f00", "#0ff", "#f0f"][a];

  if (n === 2){
    return ["#000", "#fff"];
  }


  var help = function(e){ 
    var s = Math.floor(e).toString(16);
    if (s.length === 1){ s = "0" + s; }
    return s;
  };
  var rgb2css = function(l){ return "#" + help(l[0]) + help(l[1]) + help(l[2]); };

  var goldenRatioConjugate = 0.618033988749895;
  var hue = Math.random();
  var colors = [];

  for (var i=0; i<n; i++){
    hue += goldenRatioConjugate;
    if (hue > 1){
      hue = hue - 1;
    }
    var l = hsv2rgb(hue, 0.5, 0.95);
    colors.push(rgb2css(l));
  }
  return colors;
};

//var gc = generateColors(10000);
