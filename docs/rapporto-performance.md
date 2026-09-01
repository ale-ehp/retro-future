# Rapporto di audit performance

Audit statico del codice runtime. Data: 2026-09-01.

> **Stato: tutti i 35 finding sono stati risolti** nei commit successivi a questo
> rapporto. Due sono stati chiusi con la variante alternativa che il rapporto
> stesso propone, e sono segnati come tali nelle rispettive voci. Il testo qui
> sotto resta la diagnosi originale; la sezione finale elenca cosa è cambiato.

Metodo: 8 passate di analisi indipendenti sul codice (hot path del tick,
engine/post-processing, world, crowd, allocazioni GC, pipeline GPU, DOM/UI/audio,
leak e spike), ogni finding poi ri-verificato in modo adversariale leggendo il
codice reale e i call site, più una passata finale di completezza.
Esito: 35 finding — 29 confermati, 5 ridimensionati dopo verifica, 1 non
verificato, 0 refutati.

Il codice è già molto attento alle performance (pixel ratio adattivo, stride sugli
effetti secondari, isolamento dei sottosistemi durante il reveal, LOD della crowd,
batching dei LED): quanto segue sono i problemi residui, in ordine di impatto.

---

## CRITICO

### 1. L'ottimizzazione MSAA del composer è inerte: la scena renderizza in un buffer orfano che resize e quality-scaler non toccano mai

`src/main.js:4218` — confermato, per-frame, fix piccolo.

Dopo `composer = new EffectComposer(renderer, msaaTarget)` il codice sostituisce
`composer.renderTarget2` con un target single-sample ("post passes a 1x"). Ma il
costruttore di `EffectComposer` (vendor/EffectComposer.js:79-97) ha già catturato
`this.readBuffer = this.renderTarget2` — il **clone MSAA** originale — e quella
referenza non viene mai aggiornata. Conseguenze sul path desktop di default
(`antialiasMode 'msaa'`, main.js:4299):

1. `RenderPass` e `UnrealBloomPass` (entrambi `needsSwap=false`) leggono e
   scrivono `readBuffer` in place: la scena e i pass post rasterizzano nel clone
   MSAA orfano, con resolve full-res forzato a ogni lettura — ~3 scritture MSAA +
   ~3 resolve per frame dove il commento ne prevede 1+1.
2. Il `singleTarget` appena allocato non viene mai renderizzato: ~16-33 MB di
   VRAM morta.
3. `composer.setSize`/`setPixelRatio` ridimensionano `renderTarget1` e
   `renderTarget2` ma **mai** il readBuffer orfano: dopo un resize o uno step del
   quality scaler dinamico (`tunePerformanceBudget → applyRenderResolution →
   composer.setPixelRatio`) la scena continua a renderizzare alla risoluzione di
   boot. **L'auto-downscale che dovrebbe recuperare FPS non riduce mai il fill
   della scena su desktop**: la qualità cala senza guadagnare frame.

**Soluzione** — riallineare i buffer vivi dopo la sostituzione e riasserire
l'invariante prima del render (robusto a un numero dispari di pass `needsSwap`):

```js
// in rebuildComposer, dopo composer.renderTarget2 = singleTarget:
composer.readBuffer = composer.renderTarget1;   // scena → target MSAA
composer.writeBuffer = composer.renderTarget2;  // ping-pong post a 1 sample

// e prima di composer.render() per ogni frame:
composer.readBuffer = composer.renderTarget1;
composer.writeBuffer = composer.renderTarget2;
```

Nota della verifica: il composite finale di `UnrealBloomPass` (in-place su
readBuffer, vendor/UnrealBloomPass.js:385-386) resterà a sample rate MSAA anche
dopo il fix — residuo minore, inerente al design del pass vendorizzato.

---

## ALTO

### 2. Poll da 400ms che costruisce l'intero dump diagnostico per leggere un booleano, durante la finestra più critica

`index.html:162` — confermato, periodico, fix banale.

`activationPoll` chiama `window.__tronInspect?.().cityRevealComplete` ogni 400ms
finché il reveal non completa. `__tronInspect` (main.js:6440-6690, ~250 righe)
ricostruisce ogni volta un grafo di oggetti enorme: `.map()`/`.filter()` multipli
sugli array di scena, `inspect()` annidati di crowd/equalizer/bridges/profiler,
spread di `renderer.info`. Millisecondi di CPU + decine di KB di garbage iniettati
ogni 400ms esattamente nella fase (boot + reveal) che il resto del codice
protegge congelando gli effetti secondari.

**Soluzione**: esporre un flag dedicato a costo zero
(`window.__tronRevealComplete = true` al completamento, o un
`CustomEvent 'tron-reveal-complete'` con listener `{ once: true }`), ed eliminare
il setInterval.

---

## MEDIO

### 3. Bolla di benvenuto animata: redraw canvas 896×360 + upload GPU a ogni frame

`src/character/speech-bubbles.js:461` — confermato, per-frame, fix piccolo.

Quando il testo contiene la riga logo (la welcome la contiene), `__animated` è
true e ogni frame: redraw completo del canvas 896×360 con 3 passate `shadowBlur`,
`tex.needsUpdate = true` (re-upload ~1.3 MB/frame), fit-loop del font che rilancia
`map` + `measureText` fino a ~28 volte, e churn della Map LRU anche a cache hit.
Jank proprio nel momento scenico del saluto, peggio su mobile.

**Soluzione**: throttle del redraw a ~12-15 fps (`if (nowMs - tex.__lastDrawMs > 70)`),
cache di `fontPx` per testo al primo draw, fast-path nell'accesso LRU per la
stessa texture dell'ultimo frame.

### 4. Bubble della crowd: rasterizzazione sincrona + upload nel frame di attivazione, con LRU 12 contro ~40 frasi

`src/character/speech-bubbles.js:405` — confermato, per-evento, fix piccolo.

Al cache miss (player entra nei 15 u di un membro) si rasterizza un canvas
896×360 con shadowBlur e si crea una `CanvasTexture` nuova (texImage2D + mipmap
al primo render). Più membri possono attivarsi nello stesso frame → hitch. Con 40
frasi × cap LRU 12, le eviction sono continue: gli spike si ripresentano per
tutta la sessione.

**Soluzione**: pre-rasterizzare le 3 frasi per membro durante la build (già
chunked) o in `requestIdleCallback`; canvas più piccolo (448×180) senza
shadowBlur per le frasi corte; `generateMipmaps = false`; alzare il cap LRU a ~44.

### 5. Equalizer CRT: ~1400 stringhe `hsla()` + reparse CSS per ogni draw a 20 Hz

`src/controls/equalizer.js:795` — confermato, periodico, fix piccolo.

`drawLabEqualizerCanvas` (fino a 20 Hz con musica attiva) chiama
`labEqualizerCrtBlockColor` fino a ~1400 volte a piena scala: ogni chiamata fa 4
`toFixed` + template literal, e ogni assegnazione a `ctx.fillStyle` forza il
reparse della stringa colore. Raster + upload 768×384 cadono a blocchi su un
frame ogni 3 → jitter di frame-time nel steady state.

**Soluzione**: memoizzare le stringhe per bucket quantizzato (hue/sat/light), o
calcolare il colore base una volta per cella e usare `ctx.globalAlpha` per le 3
varianti di alpha fisse invece di ri-stringificare.

### 6. Pass FSR sempre abilitato: blit full-screen che non fa nulla nella config di produzione

`src/main.js:4013` — confermato, per-frame, fix banale.

`syncFsrUpscalePass` forza `enabled = true` sempre. Con i default di produzione
(FSR off, sharpness 0, cinematic look attivo che porta già l'encode finale) lo
shader collassa a `color = center.rgb`: una copia full-res pura (fino a 4-8
MPixel di banda) ogni frame — e sul path MSAA rotto di cui sopra è uno dei pass
che rasterizza multisample.

**Soluzione**: `fsrUpscalePass.enabled = fsrPassCarriesOutputEncode ||
isFsrUpscaleActive() || fsrSharpness > 0` (memorizzando in `rebuildComposer` se
il pass porta l'encode di output). `shouldUseComposer` usa già
`isFsrUpscaleActive()`, quindi il gating del composer non cambia.

### 7. Sky procedurale "full" per-pixel a ogni frame su desktop; il bake in cubemap esiste ma è solo mobile

`src/world/sky-dome.js:553` — confermato, per-frame, fix piccolo.

Il branch "full" (default desktop, `index.html` select) esegue ~11 campi di noise
3D multi-ottava per pixel di cielo (~metà schermo a livello strada), ogni frame,
per sempre. Il percorso di bake (cubemap 128px, sky come cube sample economico) è
già implementato e validato, ma `skyBakeRequested()` lo accende solo su mobile o
con `?skyBake=1`.

**Soluzione**: estendere il bake al desktop in steady state (il sync riceve già
`cityRevealComplete && !isCityRevealCompositeActive()`), eventualmente con cubo
256px per non perdere dettaglio. Alternativa minima: default "balanced" su
desktop.

### 8. Departures board: redraw 1024×512 con shadowBlur + upload ~2 MB a 13 Hz, in ciclo infinito

`src/world/city-boards.js:157` — confermato, periodico, fix medio.

Post-reveal il board cicla per sempre (hold 2.6 s + switch 1.1 s). Ogni switch
ridisegna la texture ~14 volte, e ogni draw rifà TUTTO il canvas — cornici e
header statici inclusi — con ~15+ operazioni sotto `shadowBlur` (l'op 2D più
costosa), poi `texImage2D` da ~2 MB. Micro-hitch ricorrenti ogni ~3.7 s su
hardware medio.

**Soluzione**: pre-renderizzare il layer statico (cornice, header, sfondi) in un
offscreen canvas al build; nel draw di switch solo `drawImage(staticLayer)` + il
testo delle 6 righe senza shadowBlur. In aggiunta: FPS texture 13 → 8.

### 9. Crowd reflections: 60 rig skinnati costruiti per un budget di 2 attivi — creati anche a effetto disattivato

`src/character/runner-crowd-runtime.js:468` — confermato, startup/build, fix medio.

`buildTronRunnerCrowdReflection` fa 2 `SkeletonUtils.clone` + 2 `AnimationMixer`
per OGNI membro (30) mentre `TRON_RUNNER_CROWD_REFLECTION_MAX_ACTIVE = 2`; la
creazione avviene anche quando `fxEnabled('crowdReflections')` è false (solo la
`group.add` è nel gate). Costi: chunk di build più pesanti subito dopo il reveal,
~140 Object3D residenti in più per membro, e con riflesso attivo 3 mixer
campionano la stessa posa (runner-animation.js:46-73).

**Soluzione**: pool di 2 rig di riflessione riagganciati al membro più vicino;
meglio ancora, bind delle mesh di riflessione allo skeleton del body
(`reflMesh.bind(bodySkinnedMesh.skeleton, bindMatrix)`) — il mirroring lo fa già
`scale.y` negativo. Come minimo: saltare la creazione a fx spento.

### 10. Spatial grid della crowd: bucket riallocati a ogni tick (45 Hz)

`src/character/character-crowd.js:131` — confermato, per-frame, fix piccolo.

`prepareTronRunnerCrowdSpatialGrid` fa `spatialGrid.clear()` e rialloca un array
per cella occupata a ogni tick: ~1300 allocazioni/sec costanti che alimentano i
minor-GC.

**Soluzione**: bucket persistenti azzerati con `bucket.length = 0`, pruning
periodico delle celle vuote.

### 11. Catena di prewarm al boot interamente sincrona; `compileAsync` non usato

`src/main.js:6433` — confermato, startup, fix medio.

`prewarmHiddenSkinnedMeshRender` (renderer.compile + render della scena forzata
visibile), `prewarmPostProcessingPasses` (2 composer.render) e
`prewarmRealPass` (ricompila con clipping plane) girano serializzati in un unico
task main-thread: su mobile centinaia di ms con input bloccato. La r184
vendorizzata ha `renderer.compileAsync` (KHR_parallel_shader_compile).

**Soluzione**: `await renderer.compileAsync(scene, camera)` al posto dei compile
sincroni (anche in `prewarmRealPass`, con i clippingPlanes già impostati) e uno
yield (`await new Promise(r => requestAnimationFrame(r))`) tra i passi pesanti.

### 12. Scan-glow del reveal: bounding box della città ricalcolata da zero ogni frame dello sweep

`src/world/city-reveal-scan-glow.js:80` — confermato, per-frame (finestra reveal), fix piccolo.

`dimensions()` alloca `[...getSideBuildingRecords(), ...getMainBuildingRecords()]`
e scansiona tutti gli edifici e ponti per ricavare min/max — ogni frame, durante
la finestra già trattata come performance-critical — su geometria statica.

**Soluzione**: memoizzare la porzione statica del bounding box (invalidazione al
rebuild dei record), tenere per-frame solo il check di visibilità dei ponti,
iterare i due array senza spread.

### 13. Disc cursor: mousemove non throttlato con layout-read + scritture DOM incondizionate

`src/camera/disc-cursor.js:44` (handler agganciato in `mouse-look.js:202`) —
segnalato da due passate indipendenti, non ri-verificato adversarialmente,
per-evento, fix piccolo.

Fuori dal pointer-lock ogni mousemove nativo (anche centinaia/sec con mouse ad
alto polling) fa `closest()` + `getBoundingClientRect()` e poi riscrive classList
di body, classList del cursore e 2 style anche quando lo stato non cambia.

**Soluzione**: early-return in `setTronDiscCursorVisible` se
`shouldShow === tronDiscCursorState.visible`; cache del rect del canvas
(aggiornata su resize); opzionale coalescing rAF come già fatto in
`welcome-ui.js`.

---

## BASSO

Problemi reali ma con impatto contenuto o confinato a finestre brevi. In ordine
sparso, con la soluzione proposta per ciascuno.

- **`src/main.js:1316`** — `setFixedCameraFov` scrive `fovEl.textContent` (valore
  costante) a ogni frame via `updateWalkSimulation`: mutazione DOM 60×/sec.
  *Fix*: scrivere il testo una volta al boot; nel per-frame solo il guard
  `if (camera.fov !== FIXED_CAMERA_FOV)` già presente.
- **`src/world/contact-terminal.js:655`** — raycast + `getBoundingClientRect` +
  `updateWorldMatrix(true,true)` su OGNI pointermove a terminale attivo, senza
  coalescing; `controller.snapshot()` alloca anche a terminale spento.
  *Fix*: salvare `lastPointerEvent` e processare l'hit-test 1×/frame in
  `update()`; cache del rect; getter `state()` senza allocazione.
- **`src/world/contact-terminal.js:161`** — `snapshot()` alloca ~5-6 oggetti a
  frame nei percorsi `update → refreshAvailability → syncDomState`.
  *Fix*: getter diretti (`getState()`, `isAvailable()`) o un solo snapshot per
  update passato come parametro.
- **`src/engine/city-reveal-profiler.js:147`** — profiler sempre attivo in
  produzione: ogni 500 ms un `traverse` completo della scena (migliaia di
  Object3D con la crowd) durante la finestra del reveal, per dati letti solo da
  `window.__tronRevealProfile`. *Fix*: campionare lo snapshot pesante solo con
  `?revealProfile=1`, o sostituire il traverse con contatori già gratuiti
  (`renderer.info.render`, stats di culling esistenti).
- **`src/engine/city-reveal-profiler.js:270`** — spread di `renderInfo` +
  oggetto `lastFrame` + 4 `toFixed` allocati a ogni frame del reveal (più lo
  spread `{ ...renderer.info.render }` nel tick). *Fix*: scratch object mutato in
  place; passare `renderer.info.render` direttamente (consumo sincrono, pattern
  già usato per il benchmark).
- **`src/world/building-leds.js:339`** — cornici dei board: 4 mesh per cornice,
  ognuna con BoxGeometry e MeshBasicMaterial propri → ~60 draw call trasparenti
  depthWrite:false per frame. *Fix*: materiale condiviso per colore + merge dei 4
  segmenti in una BufferGeometry (o InstancedMesh unica "board-frames"): ~60 → 1
  draw.
- **`src/world/building-leds.js:478`** — `updateEdgeStrips` a ogni input dei
  controlli: dispose + `new BoxGeometry` per strip e ~7 allocazioni THREE per
  strip instanziata (drag slider = 60 Hz). *Fix*: unit box condivisa + `scale.set`,
  scratch objects module-level, cache dei 128 punti loop per chiave.
- **`src/world/boundary-error.js:249`** — glitch //error: ricomposizione
  full-canvas 768×360 + re-upload a ~12.5 Hz per ~3 s a ogni urto col bordo.
  *Fix*: spostare lo slicing in shader (uniform seed/strength che offsettano le
  UV) — zero redraw; minimo: throttle 0.08 → 0.15 s e slice da canvas sorgente
  immutabile.
- **`src/world/boundary-error.js:196`** — la CanvasTexture del glitch non
  disattiva i mipmap: ogni upload rigenera l'intera catena mip. *Fix*:
  `generateMipmaps = false; minFilter = LinearFilter`.
- **`src/character/character-movement.js:24`** — walk-sync fa `mixer.update(0)`
  (resampling completo di ~65 bone) anche per membri in pausa o con fase
  invariata, 45 Hz × membri visibili — triplo per i membri con riflesso attivo.
  *Fix*: memoizzare l'ultima `action.time` sincronizzata e saltare a fase
  invariata.
- **`src/world/city-reveal-main-led.js:105`** — depth sources ricostruite per
  frame durante l'overlay del reveal: spread-concat dei record edifici + un
  oggetto a 7 campi per record (~25-45), su geometria statica. *Fix*: cache
  dell'array con solo il flag `visible` letto al volo.
- **`src/world/hex-tiles.js:273`** — `setHexRoadLodProfile` chiamato ogni frame
  alloca settings + copia spread di ritorno mai usata + oggetto stats. *Fix*:
  early-out a profilo invariato, niente copia nel percorso per-frame, stats su
  scratch object.
- **`src/camera/mouse-look.js:337`** — `Array.from().filter()` + 2 closure per
  ogni touchmove (60-120 Hz durante il drag-look su mobile). *Fix*: iterare la
  TouchList direttamente senza array intermedi nel percorso caldo.
- **`src/controls/mobile-movement.js:136`** — `getBoundingClientRect()` del pad
  joystick a ogni pointermove durante il drag (il pad è statico durante il drag).
  *Fix*: cache di rect/centro/raggio al pointerdown, invalidata su
  resize/orientationchange (hook già esistente).
- **`src/engine/reflection-env.js:72`** — 7 bake PMREM eager al boot (1×512 + 6
  varianti road 256px) di cui una sola usata alla volta. *Fix*: bake lazy con
  cache per livello richiesto.
- **`index.html:876`** — 4 WebGLRenderer separati (antialias +
  preserveDrawingBuffer) per le teste del welcome, creati in concorrenza col boot
  pesante. *Fix*: un solo renderer offscreen condiviso + `drawImage` nei 4 canvas
  2D (le teste sono quasi statiche).
- **`src/character/runner-reveal.js:212`** — `material.needsUpdate = true`
  incondizionato per-frame su runner/riflessi/scan durante il reveal (ogni bump
  di version rifà getParameters + program cache key). *Fix*: replicare il gate già
  usato per la crowd (needsUpdate solo quando `transparent` flippa); rimuoverlo
  dove cambia solo l'opacity.
- **`src/world/facade-led-treatment.js:590`** — *(ridimensionato in verifica:
  attivo solo pre-reveal, short-circuit post-reveal già presente)* — bounds del
  facade reveal ricalcolati per frame con ~80-90 allocazioni. *Fix*: cache con
  invalidazione dai setter dei controlli facciata.
- **`src/world/city-reveal-wireframe.js:86`** — *(ridimensionato: finestre
  brevi)* — `window.matchMedia('(prefers-reduced-motion)')` per frame durante lo
  sweep; stesso pattern in `contact-terminal.js:397` durante le transizioni.
  *Fix*: MediaQueryList creata una volta a module scope, leggere `.matches`.
- **`src/character/runner-crowd-runtime.js:1195`** — *(ridimensionato: ordine di
  grandezza reale basso)* — oggetti-wrapper per membro a ogni tick del crowd
  (distanza camera, pointInsideRoute, stato riflessi): ~2500-5000 alloc/sec.
  *Fix*: firme posizionali o scratch object riusato (pattern già usato per
  l'avoidance).
- **`src/engine/temporal-aa-pass.js:278`** — *(ridimensionato: TAA attivo solo
  via parametro URL, non di default)* — 3 draw full-screen per frame invece di 2:
  la copia dedicata writeBuffer→history è pura banda. *Fix*: ping-pong di due
  history target con swap, eliminando la copia.
- **`src/main.js:5927`** — *(ridimensionato: il pannello live è rimosso in
  produzione da `trimProductionControls`, rilevante solo in authoring)* — ogni
  drag di un controllo non-scoped ricostruisce per frame i base pad di 13
  edifici (5 cicli dispose+ExtrudeGeometry ciascuno). *Fix*: cache-and-diff degli
  input di `updateBuildingFootprints` o scope FAST_CONTROL_IDS dedicato.

---

## Priorità suggerita

| # | Intervento | Guadagno atteso | Sforzo |
|---|-----------|-----------------|--------|
| 1 | Fix readBuffer/writeBuffer del composer (`main.js:4218`) | Meno rasterizzazione MSAA e resolve per frame su desktop; il quality scaler dinamico torna efficace; ~16-33 MB VRAM recuperati | Piccolo |
| 2 | Flag dedicato al posto di `__tronInspect()` nel poll (`index.html:162`) | Elimina spike periodici da ~ms durante boot/reveal | Banale |
| 3 | Disabilitare il pass FSR no-op (`main.js:4013`) | Un pass full-res in meno a frame | Banale |
| 4 | Throttle + cache delle speech bubble (greeter e crowd) | Elimina redraw+upload per-frame e gli hitch all'avvicinamento | Piccolo |
| 5 | Sky bake anche su desktop (`sky-dome.js:553`) | Taglia il costo per-pixel del cielo in steady state | Piccolo |
| 6 | `compileAsync` + yield nel prewarm (`main.js:6433`) | Boot percepito più fluido, niente freeze input su mobile | Medio |
| 7 | Batch delle micro-allocazioni per-frame (spatial grid, hex LOD, snapshot, profiler, scan-glow) | Meno pressione GC → meno micro-jank periodico | Piccolo |
| 8 | Equalizer: cache colori + layer statico del departures board | Meno jitter periodico nel steady state | Piccolo/Medio |

## Cosa è stato applicato

Tutti i 35 finding sono stati risolti. La suite (`npm test`, 141 test) resta
verde e la scena è stata confrontata a video prima/dopo: stesse inquadrature,
stessi fumetti, stesse board, con un pass di post-processing in meno nell'HUD
(`Pass/Draw 4/1` → `3/1`), 184 → 143 geometrie in scena e un solo contesto WebGL
al posto di quattro durante il boot.

Due voci sono state chiuse con la variante alternativa già prevista dal rapporto,
perché quella principale non era verificabile qui senza rischio di regressione
visiva:

- **Riflessi della folla** (`runner-crowd-runtime.js:468`): applicata la variante
  minima, cioè non costruire più i rig quando l'effetto è spento (60 rig skinnati
  che non potevano renderizzare). Il pool di 2 rig riagganciati al membro più
  vicino, o il bind allo scheletro del corpo, sposterebbe la proprietà
  dell'animazione e non è verificabile a video in questo ambiente: resta aperto
  come lavoro successivo, ed è il residuo più grosso del rapporto.
- **Glitch //error** (`boundary-error.js:249`): applicata la variante minima
  (throttle 0.08 → 0.15 s e slice disegnate da un canvas sorgente immutabile
  invece del self-copy) più i mipmap disattivati. Lo spostamento del glitch in
  shader cambierebbe il look e non è stato fatto.

Sul finding critico va segnalato il residuo già noto in fase di verifica: il
composite finale di `UnrealBloomPass` scrive in place nel readBuffer, quindi
quel singolo draw resta a sample rate MSAA anche dopo il fix. È inerente al
design del pass vendorizzato.
