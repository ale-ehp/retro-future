# Convenzioni

Questo repository è una vetrina, non un progetto aperto ai contributi: il codice non è
riutilizzabile senza permesso scritto. Quello che segue è il documento di lavoro con cui
lo sviluppo, tenuto qui perché le regole spiegano il codice meglio di qualsiasi
descrizione.

Tutto quello che c'è scritto è stato misurato, non assunto. Le date sono quelle delle
misure.

## Comandi

```sh
npm ci                          # versioni bloccate dal package-lock.json
npx playwright install chromium # una volta sola, serve alle prove di pagina
npm test                  # 160 prove, node --test, Chromium per quelle di pagina
npm run typecheck         # tsc con checkJs, soglia a cricchetto
npm run typecheck -- --tutti
npm run morto             # nomi mai usati e import inutili: zero, devono restare zero
npm run gate -- /tmp/rf   # cattura visiva
python3 tools/confronto-visivo.py test/baseline-linux /tmp/rf
npm run doc:dev           # il manuale in locale
```

Il gate visivo e la sua baseline sono spiegati in
[`test/baseline-linux/README.md`](test/baseline-linux/README.md).

## Regole delle prove

- Una prova guarda il comportamento: costruisce la scena, o apre la pagina in Chromium,
  e misura dove finiscono le cose. Solo quattro file leggono il sorgente, e solo per
  affermazioni che il sorgente può fare da solo: `audio-contesto-unico`, `importmap`,
  `invarianti`, `ordine-boot-frame`.
- Ogni prova nuova ha una controprova: si rompe apposta quello che deve intercettare e
  si verifica che diventi rossa. Una prova che non è mai stata rossa non è una prova.
- `src/invarianti.test.mjs` tiene le relazioni fra valori che si annullano in silenzio,
  cioè la famiglia di tutti i bug trovati finora. Due eccezioni note sono dichiarate nel
  file con i numeri: il cursore della luminosità del cielo arriva a 4.8 ma lo shader si
  ferma a 2.4; i LED della folla con i cursori canonici darebbero 31 e vengono tagliati
  a 15, quindi la costante di intensità oggi non conta.
- Una prova che legge il testo del codice è quasi sempre una prova sbagliata. Un caso
  vero: il `depthWrite` del pannello del terminale non è deciso dal valore scritto alla
  costruzione ma dal `traverse` che lo riassegna dopo. La prova che cercava quel valore
  nel sorgente passava mentre il comportamento era l'opposto.

## Come si scrivono i tipi, senza bundler e senza TypeScript

`tsc` legge i `.js` con `checkJs` e i tipi stanno nei commenti JSDoc. Il debito di
partenza, 524 errori il 2026-09-19, è andato a zero il 2026-09-20 in quindici commit.
Le convenzioni che ne sono uscite valgono per chi scrive codice nuovo.

- **Mai `any` per far sparire un errore.** È già successo: tipizzare `any` le dipendenze
  del pannello aveva nascosto 305 errori veri. Se un conteggio crolla più del previsto,
  sospetta di te stesso e guarda il diff degli errori, non solo il totale.
- **Il cast sta dove nasce il valore, una volta sola.** `document.getElementById`
  dichiara `HTMLElement`: in `src/controls/controls.js` quattro aiutanti (`cursore`,
  `scelta`, `bottone`, `etichetta`) fanno il cast una volta sola e coprono 537 chiamate,
  e chi li usa non deve saperne niente. Stesso principio per
  `querySelectorAll`, con il cast del `NodeListOf` sul selettore.
- **I segnaposto delle dipendenze portano la firma vera.** `let refresh = () => {}` fa
  dedurre `() => void` e ogni chiamata con argomenti diventa un errore. Dove la funzione
  vera è esportata, il segnaposto ne prende il tipo con `typeof import('./x.js').f`, così
  non può scollarsi; altrimenti la firma si scrive a mano dopo averla aperta.
- **Un oggetto di dipendenze ha un typedef intero.** `DipendenzeTerminale` in
  `src/world/contact-terminal.js` è l'esempio: i default coprono una parte, i campi
  iniettati sono opzionali. Dove le prove passano un doppio, il tipo dice il minimo che
  il runtime tocca, non un `HTMLElement` o un `WebGLRenderer` interi.
- **`traverse()` passa anche gruppi e luci**: il nodo è `THREE.Object3D &
  Partial<THREE.Mesh>` (`NodoForseMesh`), non un cast a `Mesh`, che sui gruppi sarebbe
  una bugia.
- **Le opzioni destrutturate con campi senza default** (`{ x, z, enabled = ... } = {}`)
  vogliono un `@param` con il tipo intero: `tsc` deduce solo i campi che hanno un
  default.
- **Una `let` con un letterale** (`let state = STATI.HIDDEN`) diventa quel solo
  letterale. Annota l'unione, ma prima verifica che gli altri valori vengano assegnati
  davvero: se non succede hai trovato un ramo morto da togliere.
- **Quello che il browser ha e `lib.dom` no** (`navigator.deviceMemory`,
  `webkitRequestFullscreen`) si dichiara in `src/globali.d.ts`, opzionale com'è.
- **I doppi di prova si dichiarano come tali**: un cast doppio, `unknown` e poi il tipo,
  con un commento che dice cosa finge. Non un `any`.

Quattro cose che i tipi hanno scovato e che non erano problemi di tipi: `elStrip` e
`sideDoorFaceOffset` iniettati e mai letti, `createTronRunnerParts({})` con un argomento
ignorato, `audio.playsInline` (attributo dei video) ed `extensions.derivatives` (WebGL 1)
che non facevano niente. Tolti, gate visivo identico.

## Come si divide il codice

`main.js` non costruisce la scena da solo: apre i sottosistemi nell'ordine giusto e li
lega fra loro.

**Un modulo è un sottosistema, e il criterio non è il numero di righe.** Un file di
trecento righe che fa due mestieri va diviso; uno di milleduecento che ne fa uno resta
com'è. Il 21 settembre 2026 tre file tenevano insieme cose diverse ed è stato misurato
prima di toccarli, contando le funzioni condivise nelle due direzioni: la folla
costruiva, muoveva e si fotografava; il rivelo teneva materiali, matematica del fronte e
regia; i tabelloni erano due tabelloni diversi. Divisi. I quattro file ancora sopra le
mille righe sono ognuno un sottosistema solo, e spezzarli vorrebbe dire inventare un
modulo di stato per far scendere un numero.

Altre due regole tengono in piedi la divisione.

1. **Lo stato condiviso è un oggetto, non venti getter.** Dove un dominio ha numeri che
   altri leggono o scrivono, il modulo esporta un oggetto mutabile (`post`, `boulevard`,
   `player`, `collisioni`, `frame`, `pannello`) e fuori si scrive `post.bloomEnabled`. Ci
   finisce un nome solo se qualcuno fuori dal file lo tocca; il resto resta `let` privato.
2. **Chi costruisce lo fa dentro `initX(deps)`.** `main.js` importa i moduli prima di
   creare scena, camera e renderer, quindi un modulo che chiama `scene.add()` o legge il
   renderer non può farlo al momento dell'import: i binding sono dichiarati in cima al
   file e assegnati dentro la funzione, che `main.js` chiama dove stava il codice.

L'ordine di boot e l'ordine dentro il frame sono protetti da una prova apposita: sono
relazioni che si rompono in silenzio.

## Commit

Convenzione `tipo(ambito): frase`, con il corpo che dice **perché**, non cosa: il diff
dice già cosa. Sui 471 commit del repository la distribuzione è questa, ed è il ritratto
più onesto di come è andato il lavoro.

| tipo | commit |
|---|---|
| `refactor` | 134 |
| `feat` | 115 |
| `perf` | 98 |
| `fix` | 79 |
| `docs` | 18 |
| `test` | 13 |
| altri (`build`, `chore`, `style`, più due prefissi fuori convenzione) | 11 |
| `Revert` | 3 |

Più refactor che feature, e quasi tante perf quante fix: la demo è stata riscritta più
volte per reggere il telefono.

Un commit per dominio. Le tappe di risanamento del typecheck sono andate avanti così:
quindici commit, ognuno con i cinque controlli verdi prima di essere scritto.

## Senza JavaScript

La copertina si vede intera anche senza JavaScript: foto statiche, titolo, link alla
home. Il bottone di ingresso non potrebbe fare niente, quindi un `<noscript>` lo nasconde
e spiega che la demo è una scena 3D. Le quattro facce sono canvas decorativi con
`aria-hidden="true"` e accanto hanno l'etichetta visibile del reparto: un `alt` non
aggiungerebbe niente che uno screen reader non legga già.
