

// From http://martin.ankerl.com/2009/12/09/how-to-create-random-colors-programmatically/

var drawRows = function(context,generator) {
  for (var i=0; i < 10; i++){ 
    drawRow(context, generator.next()) 
  }
      }
var drawRow = function(context, arr){
  for (var i=0; i < arr.length; i++){
    if (arr[i] == 1){
      drawPoint(context, i, ROW);
    };
  }
}

var state2color = function(a) {
  return ["#fff", "#000"][a]
}


      // Pull out state2color?
var changeSquare = function(context, gen, scale){
  return function(event){
    var point = [Math.floor(event.offsetX / scale), Math.floor(event.offsetY / scale)]
    var state = getValue(point, gen.state())
    var nstate = Math.abs(state - 1)
    setValue(point, nstate, gen.state())
    fillCoord(context, point, scale, state2color(nstate));
  }
}


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






var fillCoord = function(context, coord, scale, style){
  var x = coord[0] * scale ;
  var y = coord[1] * scale ;
  context.fillStyle = style;
  context.fillRect(x,y,scale,scale);
};

var drawPoint = function(context, x,y){
  context.fillRect(x,y,1,1);
}


var getURLHash = function(w, deflt){
  var wlh = w.location.hash
  if (wlh) {
    return wlh.slice(1, wlh.length)
  } else  {
    return deflt
  }
}

var clearCanvas = function(canvas, context){
  context.clearRect(0,0,canvas.width,canvas.height);
};

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




var panner = function(){
  var p;
  
  setMousePosition = function(){
    this.mousemove();
  }
}


          



