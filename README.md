# retro-future

Demo interattiva three.js di [avstudio](https://avstudio.ai): un boulevard in stile Tron Legacy con folla animata, board civiche, equalizer audio reattivo e pannello di controlli live. Vanilla JavaScript, un solo modulo ES, nessuna build.

![Il boulevard a scena piena](docs/screenshot-boulevard.webp)

All'avvio la città appare in wireframe con un volo introduttivo; premendo Spazio partono musica, reveal della città e camminata libera.

![Intro wireframe con finestra di benvenuto](docs/screenshot-intro.webp)

## Avvio

Sono file statici (nessuna build). Vanno serviti via HTTP, non da `file://`, perché `index.html` importa three.js come modulo ES.

    python3 -m http.server 8000

poi apri http://localhost:8000/

Requisiti: browser recente con WebGL2. L'audio parte dopo la prima interazione (Spazio).

## Controlli

- `Spazio` avvia la demo dalla finestra di benvenuto
- `W A S D` / frecce · movimento (`Shift` sprint)
- mouse · sguardo (click sul canvas per il pointer lock, `Esc` per rilasciarlo)
- `H` riporta la camera all'altezza di default
- `SETTAGGI` (in alto a destra) apre il pannello di controlli live

## Struttura

- `index.html` scena principale (boulevard)
- `one-building-lab.html` laboratorio: snapshot congelato della demo in variante a singolo edificio, usato per il tuning di materiali e LED
- `music-mockups.html`, `character-mockups/` mockup di colonna sonora e personaggi; `character-mockups/assets/` contiene anche asset condivisi con la demo (`soldier.glb`)
- `audio/` colonna sonora, footstep e music mockup (.opus / .wav)
- `boulevard-canonical-settings.json` preset del pannello controlli
- `vendor/three/` three.js r184 + moduli addons vendorizzati (EffectComposer, FXAA, UnrealBloom, GLTFLoader, ...)
- `scripts/` generatore dei music mockup (richiede numpy, scipy, ffmpeg) e verifica degli asset audio footstep (`node scripts/verify-tron-footstep-audio.mjs`)

## Provenienza

Estratta con la storia git dal branch `retro-future` del monorepo `osservatorio`: lo scope `(retro-future)` nei messaggi di commit viene da lì.

## Demo live

La demo gira su [avstudio.ai/chi-siamo/retro-future](https://avstudio.ai/chi-siamo/retro-future/), la pagina Chi siamo di [avstudio](https://avstudio.ai), studio italiano di automazioni AI per aziende.

## Licenza e crediti

© Alessandro Veneziano · avstudio ([avstudio.ai](https://avstudio.ai)). Tutti i diritti riservati: codice, grafica e musica sono pubblicati come vetrina e non sono riutilizzabili senza permesso scritto.

La demo usa [three.js](https://threejs.org) (licenza MIT, © three.js authors), inclusa nei file di `vendor/three/`. Il modello `soldier.glb` dei character mockup proviene dagli esempi three.js (personaggio Mixamo "Vanguard").
