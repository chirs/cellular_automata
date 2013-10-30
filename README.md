## structures 
### cellular automata simulator

[structures.edgemon.org](http://structures.edgemon.org)


### about

structures is a framework for simulating cellular automata. You can simulate any cellular automata by passing in an appropriate function.

Tested automata include:

* Game of life and game of life variants.
* Elementary cellular automata
* Langton's ant-style automata (can be used in conjunction with other board rules or ants.)
* Cyclic automata
* Forest fire simulation automata.
* Most other cellular automata can be simulated.


### quick start

To simulate an automaton, include the draw.js and automata.js files.

automata.js exposes a Board object and objects defining frequently used rules and neighborhoods.

#### Conway's Game of Life

    var cells = [50, 50]
     , states = 2
     , randomStart = true

    board = new Board(cells, states, neighborhoods.moore, randomStart).setRule(rules.gameOfLife)

#### custom automaton
 
    var cells = [50, 50], states = 4, randomStart = true
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





### Todo

* Add 3-d support (three.js?) [http://cubes.io/]
* improve Langton's ant.

Unimplemented automata:

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



