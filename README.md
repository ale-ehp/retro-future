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
- `demo-5-boulevard-canonical-settings.json` preset del pannello controlli
- three.js + postprocessing vendored (EffectComposer, SMAA, UnrealBloom, GLTFLoader, ...)
- `scripts/` generatore dei music mockup + verifica audio footstep

## Provenienza

Estratta con la storia git dal branch `retro-future` del monorepo `osservatorio`. Servita in produzione su avstudio.ai/tecnologie/retro-future/.
