# retro-future

Demo interattiva three.js di avstudio: un boulevard in stile Tron Legacy con folla animata, board civiche, equalizer audio reattivo e pannello di controlli live.

## Avvio

Sono file statici (nessuna build). Vanno serviti via HTTP, non da `file://`, perche `index.html` importa `three.module.min.js` come modulo inline.

    python3 -m http.server 8000

poi apri http://localhost:8000/

## Struttura

- `index.html` scena principale (boulevard)
- `one-building-lab.html`, `music-mockups.html`, `character-mockups/` laboratori e mockup
- `audio/` colonna sonora, footstep e music mockup (.opus / .wav)
- `boulevard-canonical-settings.json` preset del pannello controlli
- `vendor/three/` three.js + postprocessing vendored (EffectComposer, FXAA, UnrealBloom, GLTFLoader, ...)
- `scripts/` generatore dei music mockup + verifica audio footstep

## Provenienza

Estratta con la storia git dal branch `retro-future` del monorepo `osservatorio`. Servita in produzione su avstudio.ai/tecnologie/retro-future/.

## Demo live

La demo gira su [avstudio.ai/chi-siamo/retro-future](https://avstudio.ai/chi-siamo/retro-future/), la pagina Chi siamo di [avstudio](https://avstudio.ai), studio italiano di automazioni AI per aziende.

## Licenza e crediti

© Alessandro Veneziano · avstudio ([avstudio.ai](https://avstudio.ai)). Tutti i diritti riservati: codice, grafica e musica sono pubblicati come vetrina e non sono riutilizzabili senza permesso scritto.

La demo usa [three.js](https://threejs.org) (licenza MIT, © three.js authors), inclusa nei file `three.core.js`, `three.module.min.js` e nei moduli di post-processing.
