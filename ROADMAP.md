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
- [ ] More 3D demo rules — population sweeps (2026-07) found other sustainers not yet in the demo: B4/S4 and B678/S345 (boiling equilibria like b45/s5), B2/S− ("3D seeds", chaotic flicker), and B4/S3-6 (grows to ~30% fill then freezes into a crystal). Note: 3D Brian's Brain with firing thresholds 4 or 5 dies out; a working 3D brain variant needs different parameters
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
