# ROADMAP.md — Development Roadmap

Open work only; completed items are removed as they land (see git history).

---

## UI Improvements

- [ ] Responsive canvas — resize canvas on viewport change

## URL State Sharing

- [ ] Golly RLE interop for pattern import/export (current format is a custom RLE in the URL hash)

## Project Organization

- [ ] Consolidate examples into fewer pages or a unified demo (partial: removed duplicate `life2.html`)
- [ ] Add JSDoc comments to public API

## 3D Visualization

- [ ] Multi-color 3D automata in `life3d.html` — the renderer already shades per-state from `colorMap`, so multi-state rules (a 3D Brian's Brain / cyclic / generations-style rule with decay states) or coloring by cell age would light it up
- [ ] Three.js or WebGL renderer (early experiments were in `tmp.html`/`three.html`, removed in cleanup — see git history; `examples/life3d.html` has a dependency-free isometric canvas renderer)

## New Automata

- [ ] Expanded Langton's Ant — multi-color turmites, multiple ants
- [ ] Hexagonal grids — 6-neighbor topology
- [ ] Wireworld
- [ ] Greenberg-Hastings cellular automaton
- [ ] Asynchronous / stochastic update modes
- [ ] Continuous-state automata

## Applications (Exploratory)

- [ ] Processor simulation using CA
- [ ] Cryptographic applications
- [ ] Error correction coding

## Deferred

- Web Workers for large grid computation — after the typed-array rewrite a 960×540 grid runs at ~140 gens/sec single-threaded; not worth the message-passing complexity
