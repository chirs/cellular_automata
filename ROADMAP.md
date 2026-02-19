# ROADMAP.md — Development Roadmap

Consolidated from `todo`, `README.md` roadmap, and issues found in the codebase.

---

## Phase 0: Bug Fixes & Cleanup

Prerequisite work before building new features.

- [x] Fix `product()` — references `array[i]` instead of `arr[i]`, missing `var` on loop variable
- [x] Implement or remove `point2index()` — function body is empty
- [x] Implement or remove `areClean()` — stub with empty `if` body
- [x] Fix `diff()` static detection — sets `static = true` when `d.length === 1`, should be `0`
- [x] Fix `changeSquare()` — uses implicit global `event`, should accept event parameter
- [x] Fix `blank.html` — `changeSquare` passed without binding, `this` context is wrong
- [x] Fix `elementary2.html` — `rows = 0` makes the page non-functional
- [x] Fix `ant.html` — "Something is wrong with ant" per code comment; wire up next/reset buttons
- [x] Fix `life2.html` — title says "Game of Life" but uses gnarl rule
- [x] Migrate remaining `setInterval` loops to `requestAnimationFrame` (`cyclic.html`, `ant.html`, `blank.html`)

## Phase 1: Testing

- [x] Board integration tests — `next()` on known patterns (blinker, glider, block), verify `reset()`, `diff()`
- [x] Ant tests — movement, internal state transitions, cell toggling
- [x] Elementary CA tests — verify `setRuleByNumber()` and `createRuleTable()` against known Wolfram outputs
- [x] Rule table tests — `setRandomRule()`, `setRuleTable()`, `array2integer()`
- [x] CI pipeline — run `node --test` on push

## Phase 2: UI Improvements

- [x ] Wire up existing pause/resume/step buttons on dashboard (`#play`, `#back`, `#forward` are in HTML but not functional)
- [ ] Remove jQuery dependency — replace slider with native `<input type="range">`
- [ ] Click-to-toggle on dashboard canvas (currently only works on `blank.html`)
- [ ] Responsive canvas — resize canvas on viewport change
- [ ] Clean up `#modify` panel or implement it

## Phase 3: URL State Sharing

- [ ] Encode current rule + parameters in URL hash
- [ ] Leverage existing `getURLHash()` utility (currently unused)
- [ ] Load rule from URL on page init
- [ ] Pattern import/export (RLE or similar format)

## Phase 4: Performance

- [ ] Replace nested arrays with typed arrays (`Uint8Array`) for matrix storage
- [ ] Web Workers for large grid computation
- [ ] `ImageData` batch rendering — write pixel data directly instead of individual `fillRect` calls
- [ ] Optimize hot path in `calculateState()` / `next()` — avoid array allocations per cell
- [ ] Profile and reduce GC pressure

## Phase 5: New Automata

- [ ] Expanded Langton's Ant — multi-color turmites, multiple ants
- [ ] Hexagonal grids — 6-neighbor topology
- [ ] Wireworld
- [ ] Greenberg-Hastings cellular automaton
- [ ] Asynchronous / stochastic update modes
- [ ] Continuous-state automata

## Phase 6: 3D Visualization

- [ ] Stacked generation view for 1D automata (time as vertical axis, already done in `elementary.html`)
- [ ] True 3D cellular automata with 3D neighborhoods
- [ ] Three.js or WebGL renderer (experimental `three.html` exists)

## Phase 7: Project Organization

- [ ] Consolidate examples into fewer pages or a unified demo
- [ ] Clean up experimental files (`tmp.html`, `test.html`, `three.html`)
- [ ] Add JSDoc comments to public API
- [ ] Add method chaining to more Board methods
- [ ] Review and update `README.md`

## Phase 8: Applications (Exploratory)

Long-term exploration from `todo` file.

- [ ] Processor simulation using CA
- [ ] Cryptographic applications
- [ ] Error correction coding
