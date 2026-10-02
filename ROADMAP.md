# ROADMAP.md — Development Roadmap

Open work only; completed items are removed as they land (see git history).

---

## Project Organization

- [ ] Add JSDoc comments to public API

## 3D Visualization

- [ ] Three.js or WebGL renderer (early experiments were in `tmp.html`/`three.html`, removed in cleanup — see git history; `examples/life3d.html` has a dependency-free isometric canvas renderer)

## New Automata

- [ ] Expanded Langton's Ant — multi-color turmites, multiple ants
- [ ] Hexagonal grids — 6-neighbor topology
- [ ] Asynchronous / stochastic update modes
- [ ] Continuous-state automata

## Applications (Exploratory)

- [ ] Processor simulation using CA
- [ ] Cryptographic applications
- [ ] Error correction coding

## Deferred

- Web Workers for large grid computation — after the typed-array rewrite a 960×540 grid runs at ~140 gens/sec single-threaded; not worth the message-passing complexity
- Responsive canvas (resize boards when the window resizes) — boards are sized at page load; only matters if the window changes mid-session, and a reload fixes it. Would need a pad/crop-or-restart policy and re-centering of seeded patterns
