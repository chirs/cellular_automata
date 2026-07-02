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




// Utilities.

var getURLHash = function(w, deflt){
  var wlh = w.location.hash;
  if (wlh) { return wlh.slice(1, wlh.length); }
  else { return deflt; }
};


export { Drawer, getURLHash };
