# retro-future

Demo interattiva three.js di [avstudio](https://avstudio.ai): un boulevard in stile Tron Legacy con folla animata, contact terminal 3D, board civiche, equalizer audio reattivo e pannello di controlli live. Vanilla JavaScript modulare, nessuna build: `index.html` + `src/` in moduli ES.

![Il boulevard a scena piena, con folla e contact terminal](docs/screenshot-boulevard.webp)

All'ingresso una schermata con le card dei reparti; da lì partono musica, reveal della città e camminata libera.

![Schermata di ingresso con le card dei reparti](docs/screenshot-intro.webp)

## Avvio

Sono file statici (nessuna build). Vanno serviti via HTTP, non da `file://`, perché la demo importa moduli ES.

    python3 -m http.server 8000

poi apri http://localhost:8000/

Requisiti: browser recente con WebGL2. L'audio parte dopo la prima interazione.

## Controlli

- `Spazio` (o il bottone a schermo) avvia la demo
- `W A S D` / frecce · movimento (`Shift` sprint)
- mouse · sguardo
- contact terminal: avvicinati al pannello contatti per interagire

## Struttura

- `index.html` shell della pagina e markup UI
- `retro-future.css` stili
- `src/` codice della scena in moduli ES: `camera/`, `character/`, `world/`, `audio/`, `controls/`, con `main.js` come entry point
- `src/camera/mouse-look.test.mjs` test unitari (`node --test src/camera/mouse-look.test.mjs`)
- `assets/`, `audio/`, `character-mockups/` asset di scena, colonna sonora e mockup personaggi
- `demo-5-boulevard-canonical-settings.json` preset del pannello controlli
- three.js r184 + moduli addons vendorizzati in root (EffectComposer, FXAA, UnrealBloom, GLTFLoader, ...)
- `CROWD_LINES.md`, `WEBGPU_TAA_ROADMAP.md` appunti di lavorazione

## Provenienza

Estratta con la storia git (367 commit) dal monorepo `osservatorio`, linea attiva della demo. Il branch `legacy-monolite` conserva la precedente vetrina a file singolo.

## Demo live

La demo gira su [avstudio.ai/chi-siamo/retro-future](https://avstudio.ai/chi-siamo/retro-future/), la pagina Chi siamo di [avstudio](https://avstudio.ai), studio italiano di automazioni AI per aziende. Questo repository è la stessa versione servita in produzione.

## Licenza e crediti

© Alessandro Veneziano · avstudio ([avstudio.ai](https://avstudio.ai)). Tutti i diritti riservati: codice, grafica e musica sono pubblicati come vetrina e non sono riutilizzabili senza permesso scritto.

La demo usa [three.js](https://threejs.org) (licenza MIT, © three.js authors), inclusa nei file `three.core.js`, `three.module.min.js` e nei moduli addons vendorizzati. Il modello `soldier.glb` dei character mockup proviene dagli esempi three.js (personaggio Mixamo "Vanguard").
