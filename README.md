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

## Quanto pesa `src/` sulla rete

`src/` sono 84 moduli per 1,35 MB su disco, serviti senza minificazione per scelta
(nessun build step: `index.html` usa una importmap). Sulla rete non pesano quello:
Cloudflare li comprime in brotli (`main.js` 330 KB -> 70 KB) e il totale compresso e'
intorno ai 300 KB. Le intestazioni live sono `cache-control: no-cache` con ETag: a ogni
visita successiva il browser rifa' 84 richieste condizionate che tornano 304. E' il
numero di richieste, non i byte, a decidere il costo della seconda visita; minificare
non lo cambierebbe, cambiare la politica di cache del worker si'. Nessuna delle due e'
stata fatta qui: sono scelte di prodotto.
