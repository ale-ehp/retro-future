// Quello che la demo appende a `window`: le scorciatoie di console e i pochi ponti fra
// moduli che passano dal globale.
//
// Perche' esiste (2026-09-19): senza dichiararle, tsc alza 52 errori TS2339 "Property
// '__tronInspect' does not exist on type 'Window'" sparsi in tutta la demo. Erano rumore
// che copriva gli errori veri, e soprattutto questo elenco non stava scritto da nessuna
// parte: chi apre la console non aveva modo di sapere cosa c'e'.
//
// Le firme sono larghe apposta. Queste funzioni tornano oggetti costruiti al momento,
// diversi da un punto all'altro della scena, e stringerle vorrebbe dire inventare un
// contratto che il codice non ha. Restano `any`: l'elenco dei NOMI e' il valore, e una
// prova (src/scorciatoie-console.test.mjs) verifica che rispondano davvero.
//
// Non finisce nel deploy: scripts/build-retro-future.mjs esclude i .d.ts come gia'
// esclude i .md e le prove.

/** Una scorciatoia di console: si chiama senza argomenti e torna una fotografia. */
type SpiaRetroFuture = () => any;

interface Window {
  // ---------- le scorciatoie di ispezione (src/engine/inspect-hooks.js e dintorni) ----------
  /** La fotografia grande: camera, rivelo, strada, cartelli, folla. ~125 chiavi. */
  __tronInspect?: SpiaRetroFuture;
  /** Prestazioni: risoluzione, bloom, antialiasing, memoria, prewarm. ~50 chiavi. */
  __tronPerfInspect?: SpiaRetroFuture;
  __tronRunnerInspect?: SpiaRetroFuture;
  __tronRevealProfile?: SpiaRetroFuture;
  __tronSpikeInspect?: SpiaRetroFuture;
  __tronFootstepInspect?: SpiaRetroFuture;
  __tronPerfIsolationInspect?: SpiaRetroFuture;
  __contactTerminalInspect?: SpiaRetroFuture;
  __cityDepartmentBoardInspect?: SpiaRetroFuture;
  __cityRoleBoardInspect?: SpiaRetroFuture;
  __labEqualizerInspect?: SpiaRetroFuture;
  __labEqualizerCanvasColorProbe?: SpiaRetroFuture;
  characterBubbleBackgroundOpacityInspect?: SpiaRetroFuture;
  /** La scena three.js viva, per frugarci dentro dalla console. */
  __fxScene?: () => any;
  /** Lo stato delle leve per-sottosistema di engine/fx-debug-toggles.js. */
  __fxToggles?: SpiaRetroFuture;
  /** Lo stato del composer, se il post-processing e' acceso. */
  __tronComposerInspect?: SpiaRetroFuture;

  // ---------- comandi ----------
  __tronPerfIsolation?: (next?: Record<string, any>) => any;
  __tronCaptureLiveSpawn?: () => any;
  __tronApplyPlayerSpawn?: (spawn?: any, showFeedback?: boolean) => any;
  __tronMusicStart?: (source?: string, options?: Record<string, any>) => any;
  __tronMusicStop?: (...args: any[]) => any;
  __tronMusicSetVolume?: (value: number) => any;
  __tronMusicForceCrossfade?: (...args: any[]) => any;
  __tronMusicInspect?: SpiaRetroFuture;
  __retroBenchmarkStart?: (options?: Record<string, any>) => any;
  __retroBenchmarkInspect?: SpiaRetroFuture;
  __retroBenchmarkDownload?: () => any;
  __labEqualizerStart?: (...args: any[]) => any;
  __labEqualizerToggle?: (...args: any[]) => any;
  startDroneIntroFlight?: (source?: string) => any;
  /** Attraversa i muri. `noclip` e' l'alias corto di `tronNoclip`. */
  tronNoclip?: (enabled: boolean, options?: Record<string, any>) => any;
  noclip?: (enabled: boolean, options?: Record<string, any>) => any;
  setCharacterBubbleBackgroundOpacity?: (value: number) => any;
  setCartelliSfondoOpacity?: (value: number) => any;
  resetCharacterBubbleBackgroundOpacity?: () => any;
  tronBubbleBackgroundOpacity?: (value: number) => any;

  // ---------- ponti fra moduli che passano dal globale ----------
  /** I moduli di post-processing caricati con import() da main.js. */
  __POST?: Record<string, any>;
  /**
   * Il contesto audio della pagina, condiviso. NON va fotografato all'import: chi arriva
   * primo lo pubblica qui e l'altro lo riusa, altrimenti nascono due AudioContext e
   * collegare nodi fra i due alza InvalidAccessError a ogni fotogramma (2026-09-18).
   */
  __retroAudio?: { context?: any; runtime?: any } | null;
  /** Il rivelo della citta' si e' concluso: lo legge il gate visivo. */
  __tronRevealComplete?: boolean;
  /** Interruttore da URL per il caricamento delle texture dei tabelloni. */
  __cityDepartmentBoardTextureUploadEnabled?: boolean;

  /** Safari vecchi: AudioContext col prefisso. */
  webkitAudioContext?: typeof AudioContext;
}
