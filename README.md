### structures is a framework for generating and visualizing cellular automata.

structures can simulate and draw a very wide array of cellular automata. Support includes:

* Automata of arbitrary dimension can be simulated; 1- and 2-dimensional automata can be visualized.
* Arbitrary rules can be defined. A rule can either be a function or a table mapping neighborhood states to cell states.
* A board can cycle through any number of states.
* Langton's ant-style moving cells are supported.

## quick start

To use the automata, simply include the draw.js and automata.js files.

automata.js exposes a Board object and an Ant object, as well as objects containing frequently used rules and neighborhoods.

To create a board for playing Conway's Game of Life

`
var cells = [50, 50]
 , states = 2
 , randomStart = true

board = new Board(cells, states, neighborhoods.moore, randomStart)
board.setRule(rules.gameOfLife)
`

## Automata supported.

Tested automata include:

* Game of life and game of life variants.
* Elementary cellular automata
* Langton's ant-style automata (can be used in conjunction with other board rules or ants.)
* Cyclic automata
* Forest fire simulation automata.



