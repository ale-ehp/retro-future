# Baseline visiva del runner (Linux, Chromium di Playwright, rendering software)

Una baseline visiva non e' portabile fra macchine. Quella catturata su macOS con
Chrome e GPU vera non vale sul runner: il font Sora non c'e' (la copertina e' quasi tutta
testo, gate 0.05%) e il rendering software disegna luci e bloom in modo diverso. Percio'
il runner si confronta con una baseline sua, e questa e' quella. La baseline della
macchina di sviluppo resta fuori dal repository: e' 20 MB di raffica e serve solo a chi
lavora sul codice da quella macchina.

**Da dove viene:** artefatto `retro-future-gate-linux` del run 35453455419
(2026-09-19), scattato con l'istante fisso spostato a 300.000 ms. Guardata prima di committarla,
non timbrata: copertina intera con le quattro teste, il titolo e il bottone arancione
(il titolo e' in un sans di sistema, non in Sora, ed e' giusto cosi' qui); scena statica
col boulevard, i palazzi 1 e 2, il terminale dei contatti a destra e il pavimento
riflettente; scena libera uguale piu' due personaggi sul marciapiede.

**Cosa dice l'impronta di quel run:** 6.805 oggetti in scena, 133 id nel DOM, 129
richieste, zero errori di pagina, zero errori sulla pagina statica, zero richieste
fallite, in console solo warning (WebGL e KHR_parallel_shader_compile, normali senza
GPU). `staticCaptureAtMs` 316.076 ms.

## Perche' qui `scene-static.png` NON e' un cancello

Il gate fotografa la scena statica a un istante fisso di `performance.now()` proprio per
far coincidere le fasi di luci e nuvole fra sessioni. Sul runner non ci si riesce, e la
cosa e' misurata:

1. con l'istante di default (60.000 ms) il boot lo aveva gia' passato e ogni run
   fotografava a un momento suo (il primo a 143.983 ms);
2. spostandolo a 300.000 ms con `RF_GATE_STATIC_AT_MS` l'attesa lo manca comunque di
   sedici secondi, perche' senza GPU il thread e' troppo occupato per ripassare dal
   polling: chiesti 300.000, arrivata a 316.076;
3. in sedici secondi le nuvole si spostano. Tre run con la demo identica hanno dato
   2.11%, 7.71% e 8.19% contro un gate dell'1.5%.

Percio' il workflow passa `RF_COMPARE_STATIC_INFORMATIVO=1` e qui `scene-static.png`
viene stampata come informativa, accanto a `scene-A.png`. A fare il cancello restano
`welcome.png` e l'impronta strutturale (0 scostamenti in cinque run su cinque), che e'
poi quella che becca i cambi veri.

Su `welcome.png` una correzione a quello che c'era scritto qui prima: non e' vero che
fa 0.0000% sempre. Al quinto run ha fatto 0.0516% contro un gate dello 0.05%, e non per
una regressione. Il bottone di avvio ha un pulse CSS che sborda dal proprio rettangolo,
e `getBoundingClientRect()` non conosce il box-shadow: la maschera copriva il rettangolo
piu' 6 px, il bagliore ne usciva di 14. Misurata la zona dei pixel diversi
(x[466..813] y[414..507] contro un bottone a x[480..800] y[429..491]), `MASK_PADDING` e'
passato da 6 a 16 e il conto torna a 0.0000%. Su macOS con GPU vera non cambia niente:
`scene-static.png` resta un cancello all'1.5%.

Per farla tornare un cancello anche qui bisogna congelare l'orologio della scena, cioe'
togliere `performance.now()` dai quindici moduli che lo usano. Non e' stato fatto.

**Quando rigenerarla:** dopo ogni modifica *voluta* all'aspetto, e solo dopo aver
guardato le immagini nuove. Insieme alla baseline della macchina di sviluppo, non da sola.
