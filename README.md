
# [ca](https://ca.edgemon.org)

A framework for simulating [cellular automata](http://en.wikipedia.org/wiki/Cellular_automaton) in vanilla JavaScript — no build step, no dependencies.

Any discrete cellular automaton can be simulated by passing a rule function: Game of Life and its variants, elementary (1D) automata, Langton's Ant-style turmites, cyclic automata, forest fire models, Brian's Brain, and anything else you can express as "look at a cell and its neighbors, return the next state."

### Features

* **Dashboard** ([index.html](src/index.html)) — nine rules with play/pause/step/reset controls and click-to-draw.
* **Shareable URLs** — `#cyclic` links to a rule; the Share button encodes the entire grid state in the URL (run-length encoded), so a drawing can be sent as a link.
* **Fast engine** — typed-array storage, precomputed neighbor indexes, and an allocation-free update loop; a 960×540 Game of Life grid runs at ~140 generations/sec (`npm run bench`).
* **Toroidal grids** with configurable neighborhoods (von Neumann, Moore, 1D elementary, and their 3D counterparts).
* **3D automata** ([life3d.html](src/examples/life3d.html)) — Bays' 3D Life rules and clouds, rendered as rotating voxels on a plain 2D canvas.
* **[About page](src/about.html)** with live embedded demos explaining how it all works.

### Elementary cellular automata

1-dimensional automata where each cell sees only itself and its two neighbors — small enough that all 256 rules can be enumerated. The famous chaotic Rule 30 is on display on the about page. (Note: this engine's rule tables are indexed `[self, left, right]`, so Wolfram rule numbers don't map over directly.)

### Development

Serve the `src/` directory with any static file server:

    python3 -m http.server -d src

Run tests (Node's built-in runner, also run in CI on push):

    npm test

Benchmark the engine:

    npm run bench

See [ROADMAP.md](ROADMAP.md) for planned work — hexagonal grids, Wireworld, multi-ant turmites, a WebGL renderer, and more.
