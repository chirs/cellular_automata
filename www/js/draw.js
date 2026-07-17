//"use strict";

// From http://martin.ankerl.com/2009/12/09/how-to-create-random-colors-programmatically/


var Drawer = function(context, board, scale, rate){
    this.context = context
    this.board = board
    this.scale = scale
    this.rate = rate

  }

  Drawer.prototype.drawRowHelper = function(arr, row){

     for (var i=0, l=arr.length; i < l; i++){
        var color = this.board.state2color(arr[i]);
        this.fillCoord([i, row], color);
      }
    };

  Drawer.prototype.fillCoord = function(coord, style){
      var x = coord[0] * this.scale ;
      var y = coord[1] * this.scale ;
      this.context.fillStyle = style;
      this.context.fillRect(x,y,this.scale,this.scale);
    };

  // --- ImageData rendering (2D boards) ---
  // Cells are painted into a persistent 1px-per-cell ImageData, put on an
  // offscreen canvas, then scaled onto the main canvas in one drawImage.

  // (Re)build buffers when the board or scale changes. Returns false for
  // non-2D boards, which fall back to per-cell fillRect.
  Drawer.prototype.prepareBuffers = function(){
    var dims = this.board.matrix.dimensions;
    if (dims.length !== 2){ return false; }
    if (this.bufferBoard === this.board && this.bufferScale === this.scale){ return true; }
    this.bufferBoard = this.board;
    this.bufferScale = this.scale;
    this.boardWidth = dims[0];
    this.boardHeight = dims[1];
    this.offscreen = document.createElement('canvas');
    this.offscreen.width = dims[0];
    this.offscreen.height = dims[1];
    this.offscreenContext = this.offscreen.getContext('2d');
    this.imageData = this.offscreenContext.createImageData(dims[0], dims[1]);
    this.pixels = new Uint32Array(this.imageData.data.buffer);
    this.palette = this.makePalette();
    return true;
  };

  // state -> pixel value (RGBA bytes read as little-endian uint32). Colors
  // are normalized through a scratch canvas so named colors and short hex
  // both come back as #rrggbb.
  Drawer.prototype.makePalette = function(){
    var colors = this.board.colorMap;
    var scratch = document.createElement('canvas').getContext('2d');
    var palette = new Uint32Array(colors.length);
    for (var i=0; i < colors.length; i++){
      scratch.fillStyle = colors[i];
      var hex = scratch.fillStyle;
      var r = parseInt(hex.slice(1,3), 16);
      var g = parseInt(hex.slice(3,5), 16);
      var b = parseInt(hex.slice(5,7), 16);
      palette[i] = (255 << 24) | (b << 16) | (g << 8) | r;
    }
    return palette;
  };

  Drawer.prototype.blit = function(){
    this.offscreenContext.putImageData(this.imageData, 0, 0);
    this.context.imageSmoothingEnabled = false;
    this.context.drawImage(this.offscreen, 0, 0, this.boardWidth * this.scale, this.boardHeight * this.scale);
  };

  Drawer.prototype.drawTable = function(){
    if (!this.prepareBuffers()){ return this.drawTableRects(); }
    var cells = this.board.matrix.cells;
    var pix = this.pixels, pal = this.palette;
    var w = this.boardWidth, h = this.boardHeight;
    for (var x=0; x < w; x++){
      var base = x * h;
      for (var y=0; y < h; y++){
        pix[y*w + x] = pal[cells[base + y]];
      }
    }
    this.blit();
  };

  Drawer.prototype.drawIndexes = function(indexes){
    if (indexes.length === 0){ return; }
    if (!this.prepareBuffers()){ return this.drawIndexesRects(indexes); }
    var cells = this.board.matrix.cells;
    var pix = this.pixels, pal = this.palette;
    var w = this.boardWidth, h = this.boardHeight;
    for (var i=0, l=indexes.length; i < l; i++){
      var p = indexes[i];
      pix[p[1]*w + p[0]] = pal[cells[p[0]*h + p[1]]];
    }
    this.blit();
  };

  // fillRect fallbacks for non-2D boards.

  Drawer.prototype.drawTableRects = function(){
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

  Drawer.prototype.drawIndexesRects = function(indexes){
    var boardState = this.board.getState();
    for (var i=0, l=indexes.length; i<l; i++){
      var p = indexes[i];
      var state = boardState[p[0]][p[1]]
      var color = this.board.state2color(state)
      this.fillCoord(p, color);
    }
  }

  Drawer.prototype.drawTableDiff = function(){
    this.drawIndexes(this.board.diff());
  }

   Drawer.prototype.drawTableNext = function(){
     this.drawTable();
      //board.next();
      //console.log(board)
      //board.next();
    }


    Drawer.prototype.drawRow = function(row){
      this.drawRowHelper(this.board.getState(), row);
    }

  Drawer.prototype.changeSquare = function(event){
      var point = [Math.floor(event.offsetX / this.scale), Math.floor(event.offsetY / this.scale)];
      var dims = this.board.matrix.dimensions;
      if (point[0] < 0 || point[1] < 0 || point[0] >= dims[0] || point[1] >= dims[1]) { return; }
      this.board.updateValue(point);
      this.drawIndexes([point]);
  }

  Drawer.prototype.clearCanvas = function(canvas){
    this.context.clearRect(0,0,canvas.width,canvas.height);
  }

  Drawer.prototype.setRate = function(rate){
    this.rate = rate;
  }


  Drawer.prototype.stop = function(){
    if (this._animFrameId) {
      cancelAnimationFrame(this._animFrameId);
      this._animFrameId = null;
    }
  };

  Drawer.prototype.draw2dBoard = function(){
    this.stop();
    var d = this;
    var interval = (1000 / 60) / this.rate;
    var lastTime = 0;
    this.drawTable(this.board.getState())
    function loop(timestamp) {
      d._animFrameId = requestAnimationFrame(loop);
      if (timestamp - lastTime >= interval) {
        lastTime = timestamp;
        d.board.next();
        d.drawTableDiff();
      }
    }
    this._animFrameId = requestAnimationFrame(loop);
  };




// --- 3D isometric renderer ---
// Live cells are drawn as screen-aligned isometric cube sprites, painter-
// sorted back-to-front. The voxel cloud rotates about the vertical axis;
// the sprites keep a fixed screen orientation, which sidesteps per-face
// visibility math while still reading clearly as rotation.

var Drawer3d = function(context, board, scale, rate){
  this.context = context;
  this.board = board;
  this.scale = scale;   // half-width of a cube sprite in pixels
  this.rate = rate;     // generations per second
  this.theta = Math.PI / 6;
  this.spin = 0.004;    // radians per frame while not dragging
  this.alpha = 0.5;     // cube face opacity; overlaps build up toward opaque
  this.running = true;
  this.dragging = false;
  this.faceColors = this.makeFaceColors();
  this.bindPointer();
};

  // Per state: [top, left, right] face colors shaded from board.colorMap,
  // normalized through a scratch canvas like Drawer.makePalette.
  Drawer3d.prototype.makeFaceColors = function(){
    var colors = this.board.colorMap;
    var scratch = document.createElement('canvas').getContext('2d');
    var faces = [null]; // state 0 is never drawn
    var alpha = this.alpha;
    for (var s=1; s < colors.length; s++){
      scratch.fillStyle = colors[s];
      var hex = scratch.fillStyle;
      var r = parseInt(hex.slice(1,3), 16);
      var g = parseInt(hex.slice(3,5), 16);
      var b = parseInt(hex.slice(5,7), 16);
      var shade = function(f){
        return "rgba(" + Math.round(r*f) + "," + Math.round(g*f) + "," + Math.round(b*f) + "," + alpha + ")";
      };
      faces.push([shade(1), shade(0.72), shade(0.5)]);
    }
    return faces;
  };

  // (x, y) is the top corner of the cube's top face.
  Drawer3d.prototype.drawCube = function(x, y, faces){
    var w = this.scale, h = this.scale;
    var ctx = this.context;
    ctx.fillStyle = faces[0]; // top
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y + w/2);
    ctx.lineTo(x, y + w);
    ctx.lineTo(x - w, y + w/2);
    ctx.fill();
    ctx.fillStyle = faces[1]; // left
    ctx.beginPath();
    ctx.moveTo(x - w, y + w/2);
    ctx.lineTo(x, y + w);
    ctx.lineTo(x, y + w + h);
    ctx.lineTo(x - w, y + w/2 + h);
    ctx.fill();
    ctx.fillStyle = faces[2]; // right
    ctx.beginPath();
    ctx.moveTo(x + w, y + w/2);
    ctx.lineTo(x, y + w);
    ctx.lineTo(x, y + w + h);
    ctx.lineTo(x + w, y + w/2 + h);
    ctx.fill();
  };

  // Wireframe of the (toroidal) domain's bounding box, drawn behind the
  // cells as a spatial reference.
  Drawer3d.prototype.drawFrame = function(cos, sin){
    var ctx = this.context;
    var canvas = ctx.canvas;
    var dims = this.board.matrix.dimensions;
    var w = this.scale, h = this.scale;
    var ox = canvas.width / 2, oy = canvas.height / 2;
    var hx = dims[0]/2, hy = dims[1]/2, hz = dims[2]/2;
    var corners = [];
    for (var i=0; i < 8; i++){
      var dx = i & 1 ? hx : -hx, dy = i & 2 ? hy : -hy, dz = i & 4 ? hz : -hz;
      var rx = dx*cos - dy*sin;
      var ry = dx*sin + dy*cos;
      corners.push([ox + (rx - ry) * w, oy + (rx + ry) * w/2 - dz * h]);
    }
    var edges = [[0,1],[0,2],[1,3],[2,3],[4,5],[4,6],[5,7],[6,7],[0,4],[1,5],[2,6],[3,7]];
    ctx.strokeStyle = "#ccc";
    ctx.beginPath();
    for (var i=0; i < edges.length; i++){
      var a = corners[edges[i][0]], b = corners[edges[i][1]];
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
    }
    ctx.stroke();
  };

  Drawer3d.prototype.render = function(){
    var ctx = this.context;
    var canvas = ctx.canvas;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    var m = this.board.matrix;
    var dims = m.dimensions;
    var cells = m.cells;
    var cos = Math.cos(this.theta), sin = Math.sin(this.theta);
    this.drawFrame(cos, sin);
    var cx = (dims[0]-1)/2, cy = (dims[1]-1)/2, cz = (dims[2]-1)/2;
    var w = this.scale, h = this.scale;
    var ox = canvas.width / 2, oy = canvas.height / 2;

    // Rotate about the vertical axis, then project isometrically. Depth is
    // rx+ry (viewer distance) with z as a tie-break so stacked cubes paint
    // bottom-up within a column.
    var live = [];
    for (var i=0, l=cells.length; i < l; i++){
      var state = cells[i];
      if (state === 0){ continue; }
      var p = m.point(i);
      var dx = p[0]-cx, dy = p[1]-cy, dz = p[2]-cz;
      var rx = dx*cos - dy*sin;
      var ry = dx*sin + dy*cos;
      live.push([(rx + ry) + dz*1e-3,
                 ox + (rx - ry) * w,
                 oy + (rx + ry) * w/2 - dz * h,
                 state]);
    }
    live.sort(function(a, b){ return a[0] - b[0]; });
    for (var i=0, l=live.length; i < l; i++){
      this.drawCube(live[i][1], live[i][2], this.faceColors[live[i][3]]);
    }
  };

  Drawer3d.prototype.bindPointer = function(){
    var d = this;
    var canvas = this.context.canvas;
    var lastX = 0;
    canvas.addEventListener('pointerdown', function(e){
      d.dragging = true;
      lastX = e.clientX;
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', function(e){
      if (!d.dragging){ return; }
      d.theta += (e.clientX - lastX) * 0.01;
      lastX = e.clientX;
    });
    canvas.addEventListener('pointerup', function(){ d.dragging = false; });
  };

  // Render every frame so rotation stays smooth; advance generations on
  // their own cadence, and only while running.
  Drawer3d.prototype.draw3dBoard = function(){
    this.stop();
    var d = this;
    var lastGen = 0;
    function loop(timestamp){
      d._animFrameId = requestAnimationFrame(loop);
      if (d.running && timestamp - lastGen >= 1000 / d.rate){
        lastGen = timestamp;
        d.board.next();
      }
      if (!d.dragging){ d.theta += d.spin; }
      d.render();
    }
    this._animFrameId = requestAnimationFrame(loop);
  };

  Drawer3d.prototype.setRate = function(rate){ this.rate = rate; };

  Drawer3d.prototype.stop = Drawer.prototype.stop;


// Utilities.

var getURLHash = function(w, deflt){
  var wlh = w.location.hash;
  if (wlh) { return wlh.slice(1, wlh.length); }
  else { return deflt; }
};


export { Drawer, Drawer3d, getURLHash };
