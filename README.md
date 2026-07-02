
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


### Development

Serve the `src/` directory with any static file server:

    python3 -m http.server -d src

Run tests with Node's built-in test runner:

    node --test src/tests/test.js

See [ROADMAP.md](ROADMAP.md) for planned work.
