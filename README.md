# Retro Future: come si lavora sulla demo

Documento di lavoro, non viene pubblicato (il build esclude i `.md`). Tutto cio' che
segue e' stato misurato il 2026-09-19, non assunto.

## Comandi (dalla radice del repository)

```
npm run test:retro-future        # prove node (browser Chromium di Playwright per quelle di pagina)
npm run typecheck:retro-future   # tsc sui .js, soglia a cricchetto: gli errori possono solo scendere
npm run build:retro-future       # dist-retro/ + la pagina inglese generata dal dizionario
node scripts/retro-future-visual-gate.mjs /tmp/rf --port 8811
python3 scripts/retro-future-visual-compare.py test/retro-future-baseline /tmp/rf
```

Il gate visivo e la sua baseline sono spiegati in `test/retro-future-baseline/README.md`.

## Regole delle prove

- Una prova guarda il comportamento: costruisce la scena (o apre la pagina in Chromium)
  e misura dove finiscono le cose. Solo quattro file leggono il sorgente, e solo per cose
  che il sorgente puo' dire da solo: `audio-contesto-unico`, `importmap`, `invarianti`,
  `ordine-boot-frame`.
- Ogni prova nuova ha una controprova: si rompe apposta cio' che deve intercettare e si
  verifica che diventi rossa.
- `src/invarianti.test.mjs` tiene le relazioni fra valori che si annullano in silenzio,
  la famiglia di tutti i bug trovati finora. Due eccezioni note aspettano una decisione
  dell'autore, con i numeri scritti nel file: il cursore della luminosita' del cielo
  arriva a 4.8 ma lo shader si ferma a 2.4; i LED della folla con i cursori canonici
  darebbero 31 e vengono tagliati a 15, quindi la costante d'intensita' oggi non conta.

## Senza JavaScript

La copertina si vede intera anche senza JavaScript (foto statiche, titolo, link alla
home). Il bottone "Esplora i reparti" non potrebbe fare niente, quindi un `<noscript>`
lo nasconde e spiega che la demo e' una scena 3D. Le quattro facce sono canvas
decorativi con `aria-hidden="true"` e accanto hanno l'etichetta visibile del reparto:
un `alt` non aggiungerebbe niente che uno screen reader non legga gia'.

## Come e' diviso `src/`

`main.js` non costruisce piu' la scena da solo: apre i sottosistemi nell'ordine giusto e
li lega fra loro. Dalla tappa 5 (2026-09-19) i domini stanno in file propri, nessuno
sopra le 1.500 righe.

| dove | cosa tiene |
|---|---|
| `engine/post-pipeline.js` | composer, bloom, FXAA/MSAA, FSR, TAA, risoluzione adattiva, budget |
| `engine/retro-benchmark-runtime.js` | pannello del benchmark, fotografia dell'ambiente, partenza da `?benchmark=1` |
| `engine/boot-prewarm.js` | prewarm di texture e ossa, boot con i valori finali dei controlli |
| `engine/inspect-hooks.js` | le scorciatoie `window.__tron*` di console |
| `engine/frame-loop.js` | `tick()`, contatore FPS, ridimensionamento della finestra |
| `world/boulevard-layout.js` | la mappa del boulevard: larghezze, scale, incroci, strade laterali |
| `world/city-wiring.js` | montaggio di palazzi, ponti, LED, tabelloni, terminale, equalizer, rivelo |
| `camera/player-state.js` | posa, spawn, parametri del movimento, superficie di cammino |
| `camera/camera-collision.js` | collisioni della camera con palazzi, folla e bordo strada |
| `character/runner-wiring.js` | cablaggio del corridore e della folla, cursori del personaggio |
| `character/runner-greeter.js` | chi accoglie: posizione, cammino verso il tabellone, sguardo, fumetti |
| `controls/control-panel.js` | schede del pannello, spawn salvato, benchmark FSR, montaggio |
| `controls/live-controls.js` | `applyLiveControls` (691 righe, intera) e il suo programmatore |

Due regole che tengono in piedi la divisione:

1. **Lo stato condiviso e' un oggetto, non venti getter.** Dove un dominio ha numeri che
   altri leggono o scrivono, il modulo esporta un oggetto mutabile (`post`, `boulevard`,
   `player`, `collisioni`, `frame`, `pannello`) e fuori si scrive `post.bloomEnabled`. Ci
   finisce un nome SOLO se qualcuno fuori dal file lo tocca; il resto resta `let` privato.
2. **Chi costruisce lo fa dentro `initX(deps)`.** `main.js` importa i moduli prima di
   creare scena, camera e renderer, quindi un modulo che chiama `scene.add()` o legge il
   renderer non puo' farlo al momento dell'import: i binding sono dichiarati in cima al
   file e assegnati dentro la funzione, che `main.js` chiama dove stava il codice.

## Quanto pesa `src/` sulla rete

`src/` sono 97 moduli per 1,37 MB su disco, serviti senza minificazione per scelta
(nessun build step: `index.html` usa una importmap). Sulla rete non pesano quello:
Cloudflare li comprime in brotli (misurato il 2026-09-19 con `brotli -q 11`: `main.js`
51 KB -> 12 KB, il totale 307 KB). Le intestazioni live sono `cache-control: no-cache`
con ETag: a ogni visita successiva il browser rifa' una richiesta condizionata per
modulo, e adesso i moduli sono 97 invece di 84. E' il numero di richieste, non i byte, a
decidere il costo della seconda visita; minificare non lo cambierebbe, cambiare la
politica di cache del worker si'. Nessuna delle due e' stata fatta qui: sono scelte di
prodotto, e la divisione della tappa 5 ha reso la seconda piu' interessante.
