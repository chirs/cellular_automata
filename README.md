# [ca](http://ca.edgemon.org)

A framework for simulating [cellular automata](http://en.wikipedia.org/wiki/Cellular_automaton).

You can simulate any discrete cellular automata by passing a function.

Possible automata include, but are not limited to:

* Game of life and game of life variants.
* Elementary cellular automata
* Langton's ant-style automata (can be used in conjunction with other board rules or ants.)
* Cyclic automata
* Forest fire simulation automata.
* Anything else you can imagine.

(function examples?)

### quick start

To simulate an automaton, include the draw.js and automata.js files.

automata.js exposes a Board object and objects defining frequently used rules and neighborhoods.

#### Conway's Game of Life

(Is this up to date?)

      var draw2dBoard = function(canvasId, board, scale){
        var canvas = document.getElementById(canvasId);
        var context = canvas.getContext("2d");

        var d = new Drawer(context, board, scale)
        d.draw2dBoard();
      };

      // Game of Life
      var lifeBoard = new Board([50, 50], 2, neighborhoods.moore, [0.70, 0.3]).setRule(rules.gameOfLife)
      draw2dBoard("lifeBoard", lifeBoard, 6);


    $(document).ready(function() {
      var boardSize = 300;

      // Elementary cellular automata
      var elemCanvas = document.getElementById("elemBoard");
      var elemContext = elemCanvas.getContext("2d");


    var cells = [50, 50]
     , states = 2
     , randomStart = true

    board = new Board(cells, states, neighborhoods.moore, randomStart).setRule(rules.gameOfLife)

    })

#### custom automaton
 
    var cells = [50, 50]
     , states = 4
     , randomStart = true


    var topNeighborhood = [[0,0], [1,0], [2,0]] // The cell itself, the cell above, and the cell above that.

    board = new Board(cells, states, 4, randomStart).setRule(function(states){
        if ([0,1].indexOf(states[0]) !== -1){
            return 2;
        }
        if ([2,3,4].indexOf(states[1]) !== -1){
            return 3;
        }      
        return Math.floor(Math.random() * 4);
     })

#### Elementary cellular automaton

This is a 1-dimensional cellular automata.

Consider the famous Rule 30 (00011110)

The binary numbers define the 8 possible states for the candidate cell and its two neighbors.
A 1 means the cell's value in the next iteration is 1 (alive, presumably), 0 means the opposite.
"Rule 30 is of special interest because it is chaotic" (http://mathworld.wolfram.com/Rule30.html)



### Todo

* Add 3-d support (three.js?) [http://cubes.io/]
* improve Langton's ant.

### Other postential automata to implement

* asynchronous cellular automata
* hexagonal
* continuous automata
* continuous spatial automata
* Codd's cellular automaton
* Nobili cellular automata
* Wireworld
* CoDi
* Langton's loops
* Greenberg Hastings cellular automaton