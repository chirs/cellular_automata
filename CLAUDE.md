# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A vanilla JavaScript framework for simulating cellular automata (Game of Life, elementary CA, Langton's Ant, cyclic automata, forest fire, Brian's Brain, and more). Runs as a static website with no build system or package manager dependencies.

## Development

**Running locally:** Serve the `www/` directory with any static file server (e.g., `python3 -m http.server -d www`). The nginx config in `etc/nginx/` shows the production setup with document root at `www/`.

**Tests:** `npm test` (Node's built-in test runner; also runs in CI on push). Coverage: utility functions, Matrix and FlatMatrix, rule functions (Life family, cyclic, tree, brain, serviettes), Board integration (next/reset/diff/updateValue/setStartPattern, pattern export/import, elementary CA rule numbers, rule tables), Ant, and 3D (neighborhoods, Bays rules, lifeTable fast-path equivalence against the raw rule function). Drawer/rendering is not tested.

**Benchmarks:** `npm run bench` (`www/tests/bench.js`) — tracks engine throughput; a 960×540 Life grid should run at roughly 140 gens/sec.

## Architecture

### Core Engine (`www/js/automata.js`)

ES module exporting: `Board`, `Ant`, `Matrix`, `FlatMatrix`, `neighborhoods`, `rules`, and utility functions (`makeArray`, `canonicalStart`, `blankStart`, `getIndexes`, `entropy`, `flatten`, `sum`, `hammingDistance`, `encodeRLE`, `decodeRLE`).

- **`Board(dimensions, cellStates, neighbors, initial_distribution)`** — The main simulation object. `dimensions` is an array (e.g., `[50, 50]` for 2D; fractional values are ceil'd), `cellStates` is the number of states, `neighbors` defines the neighborhood topology, and `initial_distribution` sets random start probabilities (`false` = single live center cell). Setters chain: `.setRule(fn)`, `.setRuleByNumber(n)`, `.setStartPattern(points)` (seed from `[dx, dy]` offsets around center; `reset()` restores the seed). `.next()` advances one generation with an allocation-free loop: neighbor states are gathered via a precomputed `Int32Array` of flat indexes (`neighborFlat`) into a reusable `scratch` buffer; Life-family rules skip the per-cell function call entirely via a `lifeTable` lookup attached by `makeLifeFamilyRule`. `.exportPattern()` / `.importPattern(str)` serialize the grid as `"<w>x<h>;<rle>"` for URL sharing (import centers and clips).

- **`FlatMatrix(dimensions, cells?)`** — Board's cell storage: a single `Uint8Array` with stride math, exposing the same interface as `Matrix` (`.get(point)`, `.set(point, value)`, `.move(p1, p2)` with toroidal wrapping, `.state()` reconstructing nested arrays) plus `.cells`, `.index(point)`, `.point(index)`.

- **`Matrix(array)`** — Legacy wrapper around an n-dimensional nested array, same interface. Still exported and tested; no longer used by Board.

- **`Ant(position, rule, board)`** — Turmite/Langton's Ant agent that walks on a Board, tracking internal state and updating cells.

- **`neighborhoods`** — Predefined offset arrays: `elementary` (1D), `vonNeumann` (4+self), `moore` (8+self), `vonNeumann3d` (6+self), `moore3d` (26+self). Self is always first.

- **`rules`** — Predefined rule functions: `gameOfLife`, `highLife`, `dayAndNight`, `seeds`, `maze`, `serviettes` (B234/S — "persian rugs", grow it from a seed), `brain` (Brian's Brain, 3 states), `makeCyclic(mod)`, `makeTree(growProb, burnProb)`, and others. Life-family variants are built with `makeLifeFamilyRule(birthStates, survivalStates)` — note the order: birth first. 3D rules for `moore3d`: `bays4555` (B5/S45), `bays5766` (B6/S567), `clouds` (B13,14,17-19/S13-26; needs a full-grid soup or it erodes away).

Rule functions receive an array of neighbor states (first element is the cell itself) and return the new state.

### Renderer (`www/js/draw.js`)

ES module exporting: `Drawer`, `getURLHash`.

- **`Drawer(context, board, scale, rate)`** — Renders a Board onto an HTML5 Canvas. 2D boards render through a persistent `ImageData` blitted via an offscreen canvas and one scaled `drawImage` (buffers and the color palette rebuild automatically when `board` or `scale` changes); 1D boards fall back to per-cell `fillRect`. `.draw2dBoard()` starts a rAF animation loop. `.drawTableDiff()` renders incrementally using `board.diff()`. `.changeSquare(event)` handles click-to-toggle (bounds-checked, clears the board's `static` flag).

- **`Drawer3d(context, board, scale, rate)`** — Isometric voxel renderer for 3D boards (`rate` is generations/sec). Live cells are drawn as screen-aligned translucent cube sprites (`alpha`, default 0.5) shaded from `board.colorMap`, painter-sorted back-to-front inside a wireframe of the domain's bounding box; the cloud rotates about the vertical axis (drag to rotate, auto-spins otherwise). `.draw3dBoard()` renders every frame and ticks generations while `.running` is true.

### Example Pages (`www/examples/`, `www/index.html`, `www/about.html`)

Each HTML file is a standalone demo that imports from `automata.js` and `draw.js` via `<script type="module">`. No external dependencies. `www/index.html` is the multi-automaton dashboard: sidebar rule menu, play/pause/step/reset, click-to-draw, and URL sharing. `www/about.html` explains CA with live embedded demos.

## Git

Do not add a Co-Authored-By line to commit messages.

## Key Patterns

- JS files are ES modules with named exports; HTML files use `<script type="module">`.
- Boards are toroidal (edges wrap) via `move()`.
- Double-buffering in `Board.next()`: computes new state into `otherMatrix`, then swaps.
- URL hash grammar on the dashboard: `#<rule>` or `#<rule>;<w>x<h>;<rle data>` (rule-only autoplays; a pattern hash loads paused). `<rule>` is a menu name or a custom B/S rule like `b36s23` (from the panel's rule editor). RLE alphabet is `[0-9a-z]`: `<count><stateChar>` with count omitted when 1 and state = `'a' + state`.
- Elementary CA rule tables are indexed by `[self, left, right]` (self is the high bit), so Wolfram rule numbers do NOT map over directly — e.g., true Wolfram rule 30 is the table `[0,1,1,0,1,1,0,0]` via `setRuleTable`, not `setRuleByNumber(30)`.
- `Board.diff()` sets `static` when a generation changes nothing, short-circuiting `next()`; anything that mutates cells directly (`updateValue`, `importPattern`) must clear it.
- Color generation uses golden-ratio-based HSV distribution for >3 states; boards can override `colorMap` with any CSS colors (the Drawer normalizes them).
