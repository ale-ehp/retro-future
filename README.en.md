# Retro Future

An explorable neon boulevard in WebGL: three.js as ES modules, served with no bundler,
with type checking, behavioural tests and a visual gate running on every push.

[![ci](https://github.com/ale-ehp/retro-future/actions/workflows/ci.yml/badge.svg)](https://github.com/ale-ehp/retro-future/actions/workflows/ci.yml)
![typecheck](https://img.shields.io/badge/typecheck-0%20errors-2fd37a)
![tests](https://img.shields.io/badge/tests-160-2fd37a)
![three.js](https://img.shields.io/badge/three.js-r184-000000)
![node](https://img.shields.io/badge/node-%E2%89%A522.15-5fa04e)

![The boulevard with the full scene loaded](doc/static/img/panoramica.webp)

**[Live demo](https://avstudio.ai/chi-siamo/retro-future/)** ·
**[Technical manual, in Italian](https://avstudio.ai/chi-siamo/retro-future/doc/)** ·
[Italiano](README.md)

## What this is

A night city you walk through in first person, built to find out how much holds up in a
browser with no toolchain: 102 ES modules loaded from an import map, three.js r184 copied
into `vendor/` and served locally, no build step between the source file and what
reaches the browser.

It contains an animated crowd with speech bubbles and reflections, a 3D contact terminal
that takes exclusive control of the camera, a procedural sky with storms and a cube bake,
a post-processing chain with bloom, temporal antialiasing and upscaling, a soundtrack
driving the equalisers on the building facades, and a live control panel with more than
five hundred parameters.

The **[technical manual](https://avstudio.ai/chi-siamo/retro-future/doc/)** is the real
documentation: nineteen chapters, one per subsystem, each with the problem, the solution,
the measured numbers and the things I cannot explain. Its source lives in [`doc/`](doc/)
and is built in CI along with everything else. It is written in Italian.

## The decisions that explain the rest

**No bundler, on purpose.** `index.html` declares an import map and the modules arrive
exactly as I wrote them. I know the cost and I measured it: 1.44 MB on disk that become
324 KB over brotli, and a hundred and two conditional requests on a second visit. The payoff
is that what I debug in the browser is the file I opened in the editor.

**Types live in comments, the check is real.** No TypeScript in the build chain, but
`tsc` with `checkJs` reads every `.js` file. The starting debt, 524 errors, was not
hidden: it became the threshold of a ratchet that can only go down. It reached zero in
fifteen commits, one domain per commit, without a single `any`, and on the way it
uncovered five real bugs that loose types had been covering.

**Tests observe behaviour, not the text of the code.** They build the scene, or open the
page in Chromium, and measure where things end up. Only four files read the source, and
only for claims the source can make on its own. Every new test ships with its
counter-test: you deliberately break what it should catch and verify that it turns red.

**The visual gate keeps one baseline per platform.** A 3D scene can pass every test and
still change how it looks. The gate photographs the page in Chromium at a fixed instant,
masks the pulsing regions and compares pixels against a measured noise floor. A baseline
captured on a machine with a real GPU does not hold on a GPU-less runner, and the reason
is written out with numbers in
[`test/baseline-linux/README.md`](test/baseline-linux/README.md).

## What runs on every push

| gate | what it measures | today |
|---|---|---|
| tests | 160 tests across 35 files, scene and page behaviour | green |
| typecheck | `tsc --checkJs` over `src/` and `test/`, ratcheted threshold | 0 errors |
| dead code | top-level names never used, imports never read | 0 and 0 |
| visual gate | cover, static scene and structural fingerprint against the runner baseline | green |
| manual | the Docusaurus build fails on a broken link or a missing image | green |

None of these is relaxed to let a commit through. The typecheck threshold only goes down;
the visual baseline is regenerated only after looking at the new images.

## Running it

Static files. They must be served over HTTP, not opened from `file://`, because the page
imports ES modules.

```sh
npm start                 # python3 -m http.server 8000
open http://localhost:8000/
```

You need a WebGL2 browser. Audio starts after the first interaction, as the autoplay
policy requires.

## Commands

```sh
npm ci                          # only for the checks: typescript, playwright, acorn, @types
npx playwright install chromium # the browser the page tests need, once
npm test                        # 160 tests (node --test, Chromium for the page ones)
npm run typecheck               # tsc with checkJs, ratcheted threshold
npm run morto                   # dead names and unused imports
npm run gate -- /tmp/rf         # visual capture; compare with tools/confronto-visivo.py
npm run doc:dev                 # the manual, locally
```

The browser is required: 23 tests open the real page in Chromium and measure what the
browser actually computed, instead of reading the HTML with regular expressions. Without
it they fail, and they fail on purpose: skipping them would be a rubber stamp.

The demo itself has no dependencies: the four dev ones serve the checks only and are
locked in `package-lock.json`, so `npm ci` installs the same versions today and a year
from now. three.js is vendored, and the tests resolve it through
[`test/resolve-three.mjs`](test/resolve-three.mjs), the node equivalent of the import map.

## Controls

| key | effect |
|---|---|
| `Space` or the on-screen button | start |
| `W A S D` or arrows | movement, `Shift` to run |
| mouse | look, `Esc` releases it |
| `H` | resets the camera to its starting height |
| `E` in front of the terminal | opens the contacts, arrows to scroll, `Enter` to open |

On a phone held sideways a joystick replaces the keyboard.

## URL parameters

The scene is driven from the query string. These exist for A/B comparisons and to switch
an effect off without touching the code.

| parameter | effect |
|---|---|
| `?benchmark=1` | records fps, worst frames and memory, and shows the panel |
| `?benchmarkSeconds=N` | recording length |
| `?aa=fxaa\|msaa\|taa\|none` | antialiasing mode |
| `?taa=0` · `?taa.profile=quality\|lite` | disables or profiles temporal antialiasing |
| `?pipeline=0` | falls back to the previous colour chain |
| `?forceMobile=1` | mobile profile on any device |
| `?techBreakdown=1` | overlay with pipeline, frame, scene, LOD and bake state |
| `?pixelRatio=N` | forces the render resolution |

The rest (`skyQuality`, `skyCheap`, `floorLite`, `floorReflect`, `buildingReflect`,
`dirLight`, `boardUpload`, `aaSamples`, `skyBake`) are measurement levers, read in the
`*FromParams` functions of the modules that use them.

## How the code is split

102 modules, 34,734 lines, median 241. `main.js` does not build the scene: it opens the
subsystems in the right order and wires them together.

The rule is not a line ceiling, it is that a module is **one subsystem**. Four files sit
above a thousand lines and stay there because that is what they are: the orchestrator, the
equaliser, the character wiring, the hex floor. The three that did hold more than one job
were split: the crowd into build, movement and diagnostics; the reveal into materials,
front geometry and direction; the boards into departments and roles.

| directory | what it holds |
|---|---|
| `src/engine/` | post-processing, temporal antialiasing, prewarm, frame loop, benchmark |
| `src/world/` | boulevard, buildings, bridges, LEDs, boards, terminal, sky, city reveal |
| `src/character/` | runner, crowd, animations, speech bubbles, reflections |
| `src/camera/` | pose, movement, collisions, mouse look |
| `src/controls/` | control panel, input, equaliser, mobile controls |
| `src/audio/` | soundtrack and footsteps |
| `vendor/` | three.js r184 and its addons, with `vendor/README.md` listing what is modified |
| `tools/` | typecheck, dead code, visual gate, manual screenshots |
| `doc/` | source of the technical manual (Docusaurus) |

The conventions that hold the split together are in [CONTRIBUTING.md](CONTRIBUTING.md),
in Italian.

## Licence and credits

© 2026 Alessandro Veneziano · [avstudio](https://avstudio.ai). All rights reserved: code,
graphics and music are published as a showcase and cannot be reused without written
permission. The detail, with the third-party exceptions, is in [LICENSE](LICENSE).

What I did not write myself, with its licence:

- **three.js r184** and its addons, MIT licence, © three.js authors. Two files are
  modified from upstream and [`vendor/README.md`](vendor/README.md) says which and how.
- **The four heads on the cover**: “Kaonashi (No-Face)” by Riccardo Mazzi, from
  [Sketchfab](https://sketchfab.com/3d-models/kaonashi-no-face-bc0b122ee31a4909b3b2cee99c824ad0),
  [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), adapted.
- **Space Grotesk** by Florian Karsten, SIL Open Font License 1.1.
- **The soundtrack** is mine, produced with Suno (Pro plan).

The [credits page in the manual](https://avstudio.ai/chi-siamo/retro-future/doc/riferimento/crediti)
keeps the full list.
