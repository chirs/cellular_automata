# [ca](https://ca.edgemon.org)

A framework for simulating [cellular automata](http://en.wikipedia.org/wiki/Cellular_automaton).

You can simulate any discrete cellular automata by passing a function.

Possible automata include, but are not limited to:

* Game of life and game of life variants.
* Elementary cellular automata
* Langton's ant-style automata (can be used in conjunction with other board rules or ants.)
* Cyclic automata
* Forest fire simulation automata.
* Anything else you can imagine.

### Quick start

Import `automata.js` and `draw.js` as ES modules. `automata.js` exports `Board`, `neighborhoods`, `rules`, and other utilities.

#### Conway's Game of Life

```html
<canvas id="lifeBoard" width="300" height="300"></canvas>

<script type="module">
  import { Board, neighborhoods, rules } from '/js/automata.js';
  import { Drawer } from '/js/draw.js';

  var canvas = document.getElementById("lifeBoard");
  var ctx = canvas.getContext("2d");

  var board = new Board([50, 50], 2, neighborhoods.moore, [0.70, 0.3])
  board.setRule(rules.gameOfLife)

  var d = new Drawer(ctx, board, 6)
  d.draw2dBoard()
</script>
```

#### Custom automaton

```html
<script type="module">
  import { Board } from '/js/automata.js';

  var topNeighborhood = [[0,0], [1,0], [2,0]] // The cell itself, the cell above, and the cell above that.

  var board = new Board([50, 50], 4, topNeighborhood, true)
  board.setRule(function(states) {
    if ([0, 1].includes(states[0])) return 2;
    if ([2, 3, 4].includes(states[1])) return 3;
    return Math.floor(Math.random() * 4);
  })
</script>
```

#### Elementary cellular automaton

1-dimensional cellular automata. Consider the famous Rule 30 (`00011110`): the binary digits define the 8 possible states for a cell and its two neighbors. A `1` means the cell is alive in the next generation.

"Rule 30 is of special interest because it is chaotic" ([Wolfram MathWorld](https://mathworld.wolfram.com/Rule30.html))



### Roadmap

* Drop jQuery dependency — replace with vanilla JS
* Board integration tests — verify known patterns (blinker, glider, block)
* Replace `setInterval` with `requestAnimationFrame` for smoother rendering
* Pause/resume/step controls
* URL-based state sharing — encode rule + grid state in the URL hash
* Unified demo page — switch rules, adjust parameters, and draw on the grid from a single page
* Performance tuning — typed arrays, Web Workers for large grids
* 3-d support
* additional models + improved Langton's ant


### Other automata

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