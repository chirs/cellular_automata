
# [ca](https://ca.edgemony.org)

A framework for simulating [cellular automata](http://en.wikipedia.org/wiki/Cellular_automaton) in vanilla JavaScript — no build step, no dependencies.

Any discrete cellular automaton can be simulated by passing a rule function: Game of Life and its variants, elementary (1D) automata, Langton's Ant-style turmites, cyclic automata, forest fire models, Brian's Brain, and anything else you can express as "look at a cell and its neighbors, return the next state."

### Features

* **Dashboard** ([index.html](www/index.html)) — twelve rules (including Wireworld and Greenberg–Hastings spirals) with play/pause/step/reset, a speed slider, keyboard shortcuts, a birth/survival rule editor, and click-to-draw.
* **Shareable URLs** — `#cyclic` links to a rule; the Share button encodes the entire grid state in the URL (run-length encoded), so a drawing can be sent as a link.
* **Standard RLE import/export** — paste a pattern from [LifeWiki](https://conwaylife.com/wiki/) or Golly anywhere on the dashboard (or drop a `.rle` file); the RLE button copies the current grid back out.
* **Fast engine** — typed-array storage, precomputed neighbor indexes, and an allocation-free update loop; a 960×540 Game of Life grid runs at ~140 generations/sec (`npm run bench`).
* **Toroidal grids** with configurable neighborhoods (von Neumann, Moore, 1D elementary, and their 3D counterparts).
* **Langton's Ant** ([ant.html](www/examples/ant.html)) — from a blank grid to the highway at ~10,000 steps.
* **3D automata** ([life3d.html](www/examples/life3d.html)) — Bays' 3D Life rules and clouds, rendered as rotating voxels on a plain 2D canvas.
* **[About page](www/about.html)** with live embedded demos explaining how it all works.

### Elementary cellular automata

1-dimensional automata where each cell sees only itself and its two neighbors — small enough that all 256 rules can be enumerated. [elementary.html](www/examples/elementary.html) steps through them by Wolfram number, or shows all 256 at once. (The engine's rule tables are indexed `[self, left, right]`; `Board.setWolframRule(n)` converts from Wolfram numbering.)

### Development

Serve the `www/` directory with any static file server:

    python3 -m http.server -d www

Run tests (Node's built-in runner, also run in CI on push):

    npm test

Benchmark the engine:

    npm run bench

See [ROADMAP.md](ROADMAP.md) for planned work — hexagonal grids, Wireworld, multi-ant turmites, a WebGL renderer, and more.
