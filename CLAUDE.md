# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A vanilla JavaScript framework for simulating cellular automata (Game of Life, elementary CA, Langton's Ant, cyclic automata, forest fire, and more). Runs as a static website with no build system or package manager.

## Development

**Running locally:** Serve the `src/` directory with any static file server (e.g., `python3 -m http.server -d src`). The nginx config in `etc/nginx/` shows the production setup with document root at `src/`.

**Tests:** Run with Node's built-in test runner: `node --test src/tests/test.js`. Tests use ES module imports directly from `src/js/automata.js`. Current coverage: utility functions (sum, flatten, makeArray, etc.), Matrix (get/set/move/dimensions), and rule functions (Game of Life, Seeds, HighLife, Gnarl, Day and Night, cyclic, tree). Board integration tests are not yet written.

## Architecture

### Core Engine (`src/js/automata.js`)

ES module exporting: `Board`, `Ant`, `Matrix`, `neighborhoods`, `rules`, and utility functions (`makeArray`, `canonicalStart`, `blankStart`, `getIndexes`, `entropy`, `flatten`, `sum`, `hammingDistance`).

- **`Board(dimensions, cellStates, neighbors, initial_distribution)`** — The main simulation object. `dimensions` is an array (e.g., `[50, 50]` for 2D), `cellStates` is the number of states, `neighbors` defines the neighborhood topology, and `initial_distribution` sets random start probabilities. Call `.setRule(fn)` to assign a rule function, or `.setRuleByNumber(n)` for elementary CA rule numbers. `.next()` advances one generation using double-buffering (swaps `matrix` and `otherMatrix`).

- **`Matrix(array)`** — Wraps an n-dimensional nested array. Supports `.get(point)`, `.set(point, value)`, and `.move(p1, p2)` with toroidal wrapping.

- **`Ant(position, rule, board)`** — Turmite/Langton's Ant agent that walks on a Board, tracking internal state and updating cells.

- **`neighborhoods`** — Predefined offset arrays: `elementary` (1D), `vonNeumann` (4+self), `moore` (8+self).

- **`rules`** — Predefined rule functions: `gameOfLife`, `highLife`, `dayAndNight`, `seeds`, `maze`, `makeCyclic(mod)`, `makeTree(growProb, burnProb)`, and others. All built with `makeLifeFamilyRule(deadStates, liveStates)` for Life-family variants.

Rule functions receive an array of neighbor states (first element is the cell itself) and return the new state.

### Renderer (`src/js/draw.js`)

ES module exporting: `Drawer`, `getURLHash`.

- **`Drawer(context, board, scale, rate)`** — Renders a Board onto an HTML5 Canvas. `.draw2dBoard()` starts an animation loop. `.drawTableDiff()` does incremental rendering using `board.diff()`. `.changeSquare()` handles click-to-toggle interaction.

### Example Pages (`src/examples/`)

Each HTML file is a standalone demo that loads jQuery (CDN) and imports from `automata.js` and `draw.js` via `<script type="module">`, then wires up a specific automaton. The main `src/index.html` is a multi-automaton demo with a sidebar menu to switch between rules.

## Git

Do not add a Co-Authored-By line to commit messages.

## Known Bugs

- `Board.reset` references an undefined `initial_distribution` variable (should use `this.startFunc` or store the distribution on the instance).

## Key Patterns

- JS files are ES modules with named exports.
- HTML files use `<script type="module">` with `import` statements.
- Boards are toroidal (edges wrap) via `Matrix.move()`.
- Double-buffering in `Board.next()`: computes new state into `otherMatrix`, then swaps.
- Color generation uses golden-ratio-based HSV distribution for >3 states.
- Rule numbers for elementary CA are bit-inverted relative to Wolfram convention.
