# SPEC.md — Technical Specification

## 1. Overview

A vanilla JavaScript framework for simulating cellular automata. Runs as a static website with no build system, no bundler, and no package manager beyond a minimal `package.json` for the test script. Licensed under MIT.

Production URL: `https://ca.edgemon.org`

## 2. Architecture Overview

```
src/
  js/
    automata.js    Core engine (Board, Matrix, Ant, rules, utilities)
    draw.js        Canvas renderer (Drawer, getURLHash)
  css/
    style.css      Shared styles
  index.html       Dashboard — multi-rule switcher with sidebar menu
  about.html       Explanatory page about cellular automata
  examples/        Standalone single-automaton demos
  tests/
    test.js        Node.js test suite
etc/
  nginx/           Production server config
package.json       Test script only ("node --test src/tests/test.js")
```

Two ES modules (`automata.js`, `draw.js`) contain all logic. HTML pages import them via `<script type="module">`. The only external dependency is jQuery + jQuery UI, used on `index.html` for the speed slider.

## 3. Core Engine (`src/js/automata.js`)

### 3.1 Board

```js
Board(dimensions, cellStates, neighbors, initial_distribution)
```

| Parameter | Type | Description |
|---|---|---|
| `dimensions` | `number[]` | Grid shape, e.g. `[50, 50]` for 2D, `[500]` for 1D |
| `cellStates` | `number` | Number of possible cell states |
| `neighbors` | `number[][]` | Neighborhood offset vectors |
| `initial_distribution` | `number[] \| number \| false` | Probability array, uniform shorthand, or `false` for canonical start |

**Internal state:**

| Property | Description |
|---|---|
| `matrix` | Current generation (`Matrix`) |
| `otherMatrix` | Back buffer for double-buffering (`Matrix`) |
| `indexes` | Pre-computed flat list of all grid coordinates |
| `neighborMatrix` | Pre-computed neighbor coordinate lookup (`Matrix`) |
| `colorMap` | CSS color strings for each state |
| `rule` | Current rule function |
| `ruleTable` | Lookup table (when using rule numbers) |
| `static` | Flag set when `diff()` detects no change |
| `startFunc` | Closure that regenerates the initial matrix for `reset()` |

**Methods:**

| Method | Description |
|---|---|
| `setRule(fn)` | Assign a rule function. Returns `this`. |
| `setRuleByNumber(n)` | Set rule from an elementary CA rule number. Returns `this`. |
| `setRuleTable(t)` | Set rule from a precomputed lookup table. Returns `this`. |
| `setRandomRule()` | Generate and set a random rule table. Returns `this`. |
| `createRuleTable(n)` | Convert rule number to binary lookup array. |
| `next()` | Advance one generation. Computes new state into `otherMatrix`, then swaps buffers. Short-circuits if `static` is true. |
| `step(p)` | Compute next state for a single cell and write to `otherMatrix`. |
| `calculateState(p)` | Gather neighbor states via `neighborMatrix` and apply `rule`. |
| `calculateStateB(cell)` | Alternate neighbor calculation using `matrix.move()` directly. |
| `updateValue(point)` | Increment cell state by 1 (mod `cellStates`). Used for click-to-toggle. |
| `getPopulationCount()` | Return array of counts per state. |
| `diff()` | Return list of coordinates that differ between `matrix` and `otherMatrix`. Sets `static = true` when `d.length === 1`. |
| `reset()` | Regenerate matrix from `startFunc`, clear `otherMatrix`, reset `static`. |
| `getState()` | Return raw nested array from current matrix. |
| `state2color(state)` | Map state integer to CSS color string. |
| `generateNeighbors()` | Build the `neighborMatrix` of pre-resolved coordinates. |
| `areClean(points)` | **Stub — empty body.** Intended for dirty-cell optimization. |

### 3.2 Matrix

```js
Matrix(array)
```

Wraps an n-dimensional nested JavaScript array.

| Method | Description |
|---|---|
| `get(point)` | Traverse nested arrays by index to read a value. |
| `set(point, value)` | Traverse to the parent array and write at the final index. |
| `move(p1, p2)` | Vector addition with **toroidal wrapping**: `(p1[i] + p2[i] + dim[i]) % dim[i]`. |
| `state()` | Return the raw backing array. |
| `dimensions` | Computed on construction by walking `array[0][0]...` until non-array. |

### 3.3 Ant

```js
Ant(position, rule, board)
```

A turmite agent that walks on a Board.

| Property | Description |
|---|---|
| `position` | Current `[row, col]` coordinate |
| `internalState` | Integer 0-3, representing facing direction |
| `rule` | Function `(boardState, internalState) => [dr, dc]` |

| Method | Description |
|---|---|
| `updateInternalState(cellState)` | Turn right (+1 mod 4) on state 0, turn left (+3 mod 4) on state 1. |
| `moveOne()` | Read cell, update internal state, toggle cell, apply rule to get movement vector, move via `matrix.move()`. |
| `move(n)` | Call `moveOne()` n times (default 1). |

### 3.4 Neighborhoods

| Name | Offsets | Dimensionality | Size |
|---|---|---|---|
| `elementary` | `[0], [-1], [1]` | 1D | 3 (self + 2) |
| `elementary2` | `[-2], [-1], [0], [1], [2]` | 1D | 5 (self + 4) |
| `elementary3` | `[-3], [-2], [-1], [0], [1], [2], [3]` | 1D | 7 (self + 6) |
| `vonNeumann` | `[0,0], [0,1], [-1,0], [0,-1], [1,0]` | 2D | 5 (self + 4) |
| `moore` | `[0,0], [0,1], [-1,0], [0,-1], [1,0], [1,1], [1,-1], [-1,1], [-1,-1]` | 2D | 9 (self + 8) |

In all neighborhoods, the first element is the self-offset `[0]` or `[0,0]`.

### 3.5 Rules

#### Life-family rules

Built with `makeLifeFamilyRule(birthCounts, survivalCounts)`. The rule function receives `[self, n1, ..., n8]`, sums `slice(1)` to get neighbor count, then: dead cell is born if count is in `birthCounts`; live cell survives if count is in `survivalCounts`; otherwise returns 0.

| Name | B/S Notation | Birth | Survival |
|---|---|---|---|
| `gameOfLife` | B3/S23 | 3 | 2, 3 |
| `highLife` | B36/S23 | 3, 6 | 2, 3 |
| `twoByTwo` | B36/S125 | 3, 6 | 1, 2, 5 |
| `walledCities` | B2345/S45678 | 2, 3, 4, 5 | 4, 5, 6, 7, 8 |
| `seeds` | B2/S | 2 | (none) |
| `dayAndNight` | B3678/S34678 | 3, 6, 7, 8 | 3, 4, 6, 7, 8 |
| `maze` | B3/S12345 | 3 | 1, 2, 3, 4, 5 |
| `serviettes` | B/S234 | (none) | 2, 3, 4 |
| `amoeba` | B357/S1358 | 3, 5, 7 | 1, 3, 5, 8 |
| `coral` | B3/S45678 | 3 | 4, 5, 6, 7, 8 |
| `morley` | B368/S245 | 3, 6, 8 | 2, 4, 5 |
| `gnarl` | B1/S1 | 1 | 1 |
| `vote` | B5678/S45678 | 5, 6, 7, 8 | 4, 5, 6, 7, 8 |

#### Other rule factories

| Function | Description |
|---|---|
| `makeCyclic(modulus)` | Cyclic CA: cell advances to the next state (mod `modulus`) if any neighbor is exactly one step ahead. |
| `makeTree(growProb, burnProb)` | Forest fire: 3 states (0=empty, 1=tree, 2=burning). Empty grows with `growProb`. Tree catches fire from burning neighbor or spontaneously with `burnProb`. Burning becomes empty. |

#### Ant rules (not exported)

| Function | Description |
|---|---|
| `langtonsAntRule(boardState, internalState)` | Returns movement vector from `moves[internalState]`. Used with `Ant`. |
| `staticRule(state)` | Returns `[0,-1]` or `[1,0]` based on state. |
| `upAntRule(state)` | Always returns `[0,-1]`. |
| `randomWalkRule(state)` | Returns a random cardinal direction. |

### 3.6 Utility Functions

#### Exported

| Function | Description |
|---|---|
| `makeArray(dimensions, callback)` | Recursively build an n-dimensional array, calling `callback()` for each leaf. |
| `canonicalStart(dimensions)` | All-zero array with center cell set to 1. |
| `blankStart(dimensions)` | All-zero array. |
| `getIndexes(dimensions)` | All coordinate tuples for the given dimensions. |
| `entropy(xs)` | Shannon entropy (log base 2) of a flat array. |
| `flatten(arr)` | Deep flatten nested arrays. |
| `sum(xs)` | Sum a numeric array. |
| `hammingDistance(xs, ys)` | Count of differing positions between two arrays. |

#### Internal (not exported)

| Function | Description |
|---|---|
| `randomStart(dimensions, distribution)` | Generate array with random states per distribution weights. |
| `getDimensions(table)` | Infer dimensions by walking nested array. |
| `generateColors(n)` | Generate n CSS color strings (see below). |
| `hsv2rgb(h, s, v)` | Convert HSV to RGB array. |
| `point2index(p, dimensions)` | **Empty stub — no implementation.** |
| `product(arr)` | **Buggy — references `array` instead of `arr`.** |
| `matrixDiff(indexes, m1, m2)` | Compare two matrices, return list of differing coordinates. |
| `array2integer(arr)` | Convert binary array to integer via bit shifting. |
| `simpleHash(s, tableSize)` | Simple string hash. |
| `range(start, end)` | Generate integer range array. |
| `randomChoice(arr)` | Return random element from array. |
| `hammingNeighbors(xs, states)` | All arrays with Hamming distance 1 from `xs`. |

### 3.7 Color Generation

`generateColors(n)` handles three cases:

1. **n = 2**: Returns `["#fff", "#000"]` (white/black).
2. **n = 3**: Returns `["black", "green", "red"]` (empty/tree/fire, for forest fire).
3. **n > 3**: Uses golden-ratio-based HSV distribution. Starting from a random hue, increments by the golden ratio conjugate (0.618...) for each color, converts from HSV (s=0.5, v=0.95) to hex CSS strings.

## 4. Renderer (`src/js/draw.js`)

### 4.1 Drawer

```js
Drawer(context, board, scale, rate)
```

| Parameter | Description |
|---|---|
| `context` | Canvas 2D rendering context |
| `board` | A `Board` instance |
| `scale` | Pixel size of each cell |
| `rate` | Speed multiplier for animation (frames per base tick) |

**Methods:**

| Method | Description |
|---|---|
| `draw2dBoard()` | Start a `requestAnimationFrame` loop. Each frame: if enough time has elapsed (based on `rate`), call `board.next()` then `drawTableDiff()`. Calls `stop()` first to cancel any prior loop. |
| `drawTable()` | Full redraw: iterate all rows and columns, fill each cell rectangle. |
| `drawTableDiff()` | Incremental redraw: only repaint cells returned by `board.diff()`. |
| `drawTableNext()` | Alias for `drawTable()` (commented-out next call). |
| `drawRow(row)` | Draw a single row — used for 1D elementary CA rendering. |
| `drawRowHelper(arr, row)` | Paint each cell in a row. |
| `fillCoord(coord, style)` | Fill a single `scale x scale` rectangle at grid coordinate. |
| `changeSquare()` | Toggle cell under mouse click. **Bug: uses implicit global `event` instead of accepting an event parameter.** |
| `clearCanvas(canvas)` | Clear the entire canvas. |
| `setRate(rate)` | Update the `rate` property. |
| `stop()` | Cancel the current `requestAnimationFrame` loop. |

### 4.2 getURLHash

```js
getURLHash(window, default) → string
```

Returns `window.location.hash` (without `#`) or the provided default. Not currently used by any page.

## 5. Example Pages

### Dashboard (`src/index.html`)

Multi-rule switcher. Sidebar menu lets the user pick from 9 rules. Uses jQuery UI slider for speed control. Scale: 6px, dimensions fill the viewport.

Rules available: Life, Cyclic (12 states, mod 9), Forest Fire, Day and Night, Walled Cities, Gnarl, Serviettes, Amoeba, Coral.

### Standalone Examples (`src/examples/`)

| File | Title | Dimensions | States | Neighborhood | Rule | Animation | Controls |
|---|---|---|---|---|---|---|---|
| `life.html` | Conway's Game of Life | viewport / 2 | 2 | moore | gameOfLife | rAF loop | Reset button |
| `life2.html` | "Conway's Game of Life" | 800 x 400 | 2 | moore | **gnarl** (mislabeled) | rAF loop | Reset button |
| `elementary.html` | Elementary CA | 1D, 500 cells | 2 | elementary | Rule 145 (randomizes every 500 rows) | rAF loop | None |
| `elementary2.html` | Elementary CA | 1D, `rows=0` | 2 | elementary | (none) | setInterval | **Non-functional — `rows` is 0, loops never execute** |
| `cyclic.html` | Cyclic CA | 450 x 200 | 12 | vonNeumann | makeCyclic(12) | setInterval 100ms | Click to randomize + reset |
| `forest.html` | Forest Fire | 900 x 400 | 3 | moore | makeTree(g, b) | rAF loop | Grow/burn prob inputs, restart, reset, population counts |
| `ant.html` | Langton's Ant | 900 x 400 | 2 | moore | langtonsAnt | setInterval 100ms | next/reset buttons (not wired) |
| `blank.html` | Sandbox | 180 x 80 | 2 | moore | twoByTwo | Manual step / setInterval 1s | Click to toggle, next, play |

### Other Pages

| File | Description |
|---|---|
| `about.html` | Explanatory text about cellular automata (no JS) |
| `three.html` | Experimental Three.js page |
| `tmp.html` | Temporary/scratch file |
| `test.html` | Test page |

## 6. Tests

**Runner:** `node --test src/tests/test.js`

**Coverage:**

| Area | Status |
|---|---|
| Utility functions (sum, flatten, makeArray, blankStart, canonicalStart, getIndexes, entropy, hammingDistance) | Tested |
| Matrix (get, set, move, dimensions) | Tested |
| Life-family rules (gameOfLife, seeds, highLife, gnarl, dayAndNight) | Tested |
| Cyclic rule | Tested |
| Tree rule (deterministic edge cases) | Tested |
| Board integration (next, reset, diff) | Not tested |
| Ant | Not tested |
| Elementary CA (rule numbers) | Not tested |
| Drawer / rendering | Not tested |

## 7. Configuration & Deployment

**`package.json`**: Minimal — defines `"type": "module"` and a `test` script. No dependencies.

**nginx** (`etc/nginx/ca.edgemon.org`): Serves `src/` as document root on port 80 for `ca.edgemon.org`.

**`.gitignore`**: Only ignores `*~` (editor backup files).

## 8. Design Decisions

- **ES modules with no build step.** Files are served directly. Browser-native `import`/`export`.
- **Toroidal topology.** All grids wrap at edges via `Matrix.move()`. No boundary conditions to configure.
- **Double-buffering.** `Board.next()` writes to `otherMatrix`, then swaps references. Avoids in-place mutation artifacts.
- **Rule function convention.** All rules receive `[self, neighbor1, ..., neighborN]` and return a new state integer. Self is always the first element.
- **Wolfram rule inversion.** Elementary CA rule numbers are bit-inverted relative to the Wolfram convention (e.g., Rule 30 is entered as 145). Colors are also inverted.
- **Pre-computed neighbor coordinates.** `Board.generateNeighbors()` builds a matrix of resolved coordinates at construction time, avoiding repeated `move()` calls during simulation.

## 9. Known Issues

| Issue | Location | Description |
|---|---|---|
| Empty `point2index()` | `automata.js:22-23` | Function body is empty. |
| Buggy `product()` | `automata.js:480-486` | References `array[i]` instead of `arr[i]`. Missing `var` on loop variable. |
| Incomplete `areClean()` | `automata.js:260-266` | Stub with empty `if` body. |
| `diff()` static detection | `automata.js:331` | Sets `static = true` when `d.length === 1` (should be `0`). |
| `changeSquare()` event | `draw.js:72` | Uses implicit global `event` instead of accepting an event parameter. |
| `life2.html` mislabeled | `examples/life2.html` | Title says "Conway's Game of Life" but uses the `gnarl` rule. |
| `elementary2.html` broken | `examples/elementary2.html` | `rows = 0` means loops never execute. Uses `setInterval` without delay. |
| `ant.html` controls | `examples/ant.html:16` | Comment says "Something is wrong with ant." next/reset buttons are not wired up. Uses `setInterval`. |
| `blank.html` event bug | `examples/blank.html:22` | `changeSquare` is called without binding, so `this` is wrong. |
| Some examples use `setInterval` | `cyclic.html`, `ant.html`, `blank.html` | Not yet migrated to `requestAnimationFrame`. |
