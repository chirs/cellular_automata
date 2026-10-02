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
    var lastTime = 0;
    this.drawTable(this.board.getState())
    function loop(timestamp) {
      d._animFrameId = requestAnimationFrame(loop);
      // Read rate each frame so setRate() takes effect mid-animation.
      if (timestamp - lastTime >= (1000 / 60) / d.rate) {
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
  this.highlight = null; // {axis, index}: emphasize one slice, fade the rest
  this.visible = true;    // false: keep ticking generations but skip rendering
  this.onGeneration = null;
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

  // Project a point given as offsets from the domain center.
  Drawer3d.prototype.project = function(dx, dy, dz, cos, sin){
    var canvas = this.context.canvas;
    var w = this.scale;
    var rx = dx*cos - dy*sin;
    var ry = dx*sin + dy*cos;
    return [canvas.width/2 + (rx - ry) * w, canvas.height/2 + (rx + ry) * w/2 - dz * w, rx + ry];
  };

  Drawer3d.prototype.strokeLines = function(lines, style, width, dash){
    var ctx = this.context;
    ctx.strokeStyle = style;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.setLineDash(dash || []);
    ctx.beginPath();
    for (var i=0; i < lines.length; i++){
      ctx.moveTo(lines[i][0][0], lines[i][0][1]);
      ctx.lineTo(lines[i][1][0], lines[i][1][1]);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.lineWidth = 1;
  };

  // Bounding box of the (toroidal) domain as a spatial reference. Seen from
  // above, the bottom corner farthest from the viewer is hidden: its three
  // edges and the floor grid go behind the cells (front = false); the other
  // nine edges lie on visible faces and are stroked over them (front = true).
  Drawer3d.prototype.drawFrame = function(cos, sin, front){
    var dims = this.board.matrix.dimensions;
    var hx = dims[0]/2, hy = dims[1]/2, hz = dims[2]/2;
    var corners = [], hidden = -1;
    for (var i=0; i < 8; i++){
      var c = this.project(i & 1 ? hx : -hx, i & 2 ? hy : -hy, i & 4 ? hz : -hz, cos, sin);
      corners.push(c);
      if (!(i & 4) && (hidden === -1 || c[2] < corners[hidden][2])){ hidden = i; }
    }
    var edges = [[0,1],[0,2],[1,3],[2,3],[4,5],[4,6],[5,7],[6,7],[0,4],[1,5],[2,6],[3,7]];
    var lines = edges
      .filter(e => (e[0] === hidden || e[1] === hidden) !== front)
      .map(e => [corners[e[0]], corners[e[1]]]);

    if (front){
      this.strokeLines(lines, "rgba(70, 80, 110, 0.45)", 1.5);
      return;
    }

    var grid = [], step = 4;
    for (var x = -hx + step; x < hx; x += step){
      grid.push([this.project(x, -hy, -hz, cos, sin), this.project(x, hy, -hz, cos, sin)]);
    }
    for (var y = -hy + step; y < hy; y += step){
      grid.push([this.project(-hx, y, -hz, cos, sin), this.project(hx, y, -hz, cos, sin)]);
    }
    this.strokeLines(grid, "rgba(70, 80, 110, 0.1)", 1);
    this.strokeLines(lines, "rgba(70, 80, 110, 0.3)", 1.25, [4, 4]);
  };

  Drawer3d.prototype.render = function(){
    var ctx = this.context;
    var canvas = ctx.canvas;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    var m = this.board.matrix;
    var dims = m.dimensions;
    var cells = m.cells;
    var cos = Math.cos(this.theta), sin = Math.sin(this.theta);
    this.drawFrame(cos, sin, false);
    var cx = (dims[0]-1)/2, cy = (dims[1]-1)/2, cz = (dims[2]-1)/2;
    var w = this.scale, h = this.scale;
    var ox = canvas.width / 2, oy = canvas.height / 2;

    // Rotate about the vertical axis, then project isometrically. Depth is
    // rx+ry (viewer distance) with z as a tie-break so stacked cubes paint
    // bottom-up within a column.
    var hl = this.highlight;
    var live = [];
    for (var i=0, l=cells.length; i < l; i++){
      var state = cells[i];
      if (state === 0){ continue; }
      var p = m.point(i);
      var dx = p[0]-cx, dy = p[1]-cy, dz = p[2]-cz;
      var rx = dx*cos - dy*sin;
      var ry = dx*sin + dy*cos;
      // Sprites span y..y+2h from their top corner; shift up by h so the
      // cube is centered on the cell and lines up with the frame.
      live.push([(rx + ry) + dz*1e-3,
                 ox + (rx - ry) * w,
                 oy + (rx + ry) * w/2 - dz * h - h,
                 state,
                 !hl || p[hl.axis] === hl.index]);
    }
    live.sort(function(a, b){ return a[0] - b[0]; });
    for (var i=0, l=live.length; i < l; i++){
      ctx.globalAlpha = live[i][4] ? 1 : 0.08;
      this.drawCube(live[i][1], live[i][2], this.faceColors[live[i][3]]);
    }
    ctx.globalAlpha = 1;
    this.drawFrame(cos, sin, true);
    if (this.highlight){ this.drawSlicePlane(cos, sin); }
  };

  // Outline the highlighted slice's plane through its cell centers.
  Drawer3d.prototype.drawSlicePlane = function(cos, sin){
    var dims = this.board.matrix.dimensions;
    var a = this.highlight.axis;
    var half = dims.map(d => d/2);
    var at = this.highlight.index - (dims[a]-1)/2;
    var u = (a + 1) % 3, v = (a + 2) % 3;
    var corners = [[-1,-1], [1,-1], [1,1], [-1,1]].map(c => {
      var p = [0, 0, 0];
      p[a] = at; p[u] = c[0] * half[u]; p[v] = c[1] * half[v];
      return this.project(p[0], p[1], p[2], cos, sin);
    });
    var ctx = this.context;
    ctx.beginPath();
    corners.forEach((c, i) => i ? ctx.lineTo(c[0], c[1]) : ctx.moveTo(c[0], c[1]));
    ctx.closePath();
    ctx.fillStyle = "rgba(42, 122, 74, 0.08)";
    ctx.fill();
    ctx.strokeStyle = "rgba(42, 122, 74, 0.8)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.lineWidth = 1;
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
        if (d.onGeneration){ d.onGeneration(); }
      }
      if (!d.visible){ return; }
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
