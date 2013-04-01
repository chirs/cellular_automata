

// From http://martin.ankerl.com/2009/12/09/how-to-create-random-colors-programmatically/

var clearCanvas = function(canvas, context){
  context.clearRect(0,0,canvas.width,canvas.height);
};


var state2color = function(a) {
  return ["#fff", "#333", "#666","#999", "#000"][a]
  return ["#fff", "#000", "#333", "#666","#999"][a]
}

var fillCoord = function(context, coord, scale, style){
  var x = coord[0] * scale ;
  var y = coord[1] * scale ;
  context.fillStyle = style;
  context.fillRect(x,y,scale,scale);
};


var drawTable = function(context, table, scale){
  var rows = table.length
  if (rows == 0) { return; }
  
  var cols = table[0].length;
  
  for (var i=0; i < rows; i++){
    for (var j=0; j < cols; j++){
      var state = table[i][j]
      var color = state2color(state)
      fillCoord(context, [i,j], scale, color);
    }
  }
}



var Drawer = function(context, board, scale, maximum, repeat){

  var row = 0

  var dRow = function(arr){
    for (var i=0; i < arr.length; i++){
      var color = state2color(arr[i])
      fillCoord(context, [i, row], scale, color)
    }
  }


  return {

    clearCanvas: function(canvas){
      context.clearRect(0,0,canvas.width,canvas.height);
    },

    drawTable: function(){
      drawTable(context, board.state(), scale)
      board.next()


    },

    drawRows: function(count){
      if (row > maximum){ 
        if (repeat){
          row = 0
        } else {
          return 
        }
      }

      if (count == undefined){ count = 1 }

      for (var i=0; i < count; i++){
        dRow(board.state());
        board.next()
        row += 1;
      }
    },

  }
}


var changeSquare = function(context, board, scale){
  return function(event){
    var point = [Math.floor(event.offsetX / scale), Math.floor(event.offsetY / scale)]
    var nstate = board.updateValue(point)
    fillCoord(context, point, scale, state2color(nstate));
  }
}



// Utilities.

var getURLHash = function(w, deflt){
  var wlh = w.location.hash
  if (wlh) {
    return wlh.slice(1, wlh.length)
  } else  {
    return deflt
  }
}


var hsv2rgb = function(h, s, v){
  var h_i = h * 6;
  var f = h * 6 - h_i
  var p = v * (1 - s)
  var q = v * (1 - f * s)
  var t = v * (1 - (1 - f * s))
  var r, g, b;
  switch(Math.floor(h_i)){
  case 0: r=v, g=t, b=p; break;
  case 1: r=q, g=v, b=p; break;
  case 2: r=p, g=v, b=t; break;
  case 3: r=p, g=q, b=v; break;
  case 4: r=t, g=p, b=v; break;
  case 5: r=v, g=p, b=q; break;
  }
  return [r*256,g*256,b*256]
};


var generateColors = function(n){

  var help = function(e){ 
    var s = Math.floor(e).toString(16);
    if (s.length == 1){ s = "0" + s; }
    return s
  }
  var rgb2css = function(l){ return "#" + help(l[0]) + help(l[1]) + help(l[2]); }

  var goldenRatioConjugate = 0.618033988749895
  var hue = Math.random();
  var colors = []

  for (var i=0; i<n; i++){
    hue += goldenRatioConjugate;
    if (hue > 1){
      hue = hue - 1;
    }
    var l = hsv2rgb(hue, .5, .95);
    colors.push(rgb2css(l));
  }
  return colors;
};

var generateShade = function(){
}


