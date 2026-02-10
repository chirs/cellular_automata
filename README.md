
# [ca](https://ca.edgemon.org)

A framework for simulating [cellular automata](http://en.wikipedia.org/wiki/Cellular_automaton).

### Background

You can simulate any discrete cellular automata by passing a function.

Possible automata include, but are not limited to:

* Game of life and game of life variants.
* Elementary cellular automata
* Langton's ant-style automata (can be used in conjunction with other board rules or ants.)
* Cyclic automata
* Forest fire simulation automata.
* Anything else you can imagine.


#### Elementary cellular automaton

1-dimensional cellular automata. Consider the famous Rule 30 (`00011110`): the binary digits define the 8 possible states for a cell and its two neighbors. A `1` means the cell is alive in the next generation.

"Rule 30 is of special interest because it is chaotic" ([Wolfram MathWorld](https://mathworld.wolfram.com/Rule30.html))


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


### Roadmap

* Board integration tests — verify known patterns (blinker, glider, block)
* Pause/resume/step controls
* Remove jQuery slider?
* URL-based state sharing — encode rule + grid state in the URL hash
* Unified demo page — switch rules, adjust parameters, and draw on the grid from a single page
* Performance tuning — typed arrays, Web Workers for large grids
* 3-d support
* additional models + improved Langton's ant
