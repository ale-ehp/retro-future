// Ambient one-liners the crowd says when the player comes near. Mix of warm greetings,
// slice-of-life, light avstudio worldbuilding and Tron flavour. No dashes, brand lowercase.
// Mirror of public/tecnologie/retro-future/CROWD_LINES.md (edit there, then re-sync here).
export const TRON_RUNNER_CROWD_LINES = [
  // Saluti caldi
  'Hei, un viso nuovo!',
  'Felice di incontrarti.',
  'Benvenuto sulla griglia.',
  'Ehi, ti aspettavamo.',
  'Ciao, nuovo arrivato.',
  'Bella serata, vero?',
  'Buona passeggiata!',
  'Che piacere vederti.',
  'Salve, viaggiatore.',
  'Ti sei perso? Resta pure.',
  'Sorridi, sei in città.',
  // Quotidiano
  'Oggi ho dimenticato il pranzo.',
  'Che giornata lunga.',
  'Adoro queste luci di notte.',
  'Stavo giusto tornando a casa.',
  'Hai visto che traffico di dati?',
  'Mi servirebbe un caffè.',
  'Domani riposo, finalmente.',
  'Ho i piedi a pezzi.',
  'Sto cercando un amico.',
  'Le notti qui non finiscono mai.',
  'Tu non dormi mai?',
  // Mondo avstudio
  'Qui costruiamo cose che funzionano.',
  'Ogni luce è un processo che gira.',
  'Lo ha disegnato lo studio.',
  'Niente magia, solo lavoro fatto bene.',
  'Automatizziamo la parte noiosa.',
  "Dietro ogni schermo c'è una persona.",
  'Misuriamo tutto, poi miglioriamo.',
  'Le idee qui diventano sistemi.',
  'Funziona prima, stupisce dopo.',
  // Tron / sci-fi
  'Il flusso è stabile stanotte.',
  'Segui le linee.',
  'La griglia ti riconosce.',
  'Resta sul tracciato.',
  'Energia al massimo.',
  'I dati scorrono come fiumi.',
  'Nessun errore stanotte.',
  'Sento il ronzio della rete.',
  'Le torri non dormono mai.',
  'Sei dentro il sistema adesso.',
];

export const TRON_RUNNER_CROWD_TALK_RANGE = 15;     // say something within this distance
export const TRON_RUNNER_CROWD_TALK_REARM_RANGE = 18; // re-arm once you step past this (hysteresis)
export const TRON_RUNNER_CROWD_TALK_DURATION_MS = 4000;
export const TRON_RUNNER_CROWD_TALK_LINES_PER_MEMBER = 3;

export function pickTronRunnerCrowdLines(index, pool, count) {
  const out = [];
  const used = new Set();
  let s = (Math.imul(index + 1, 2654435761) >>> 0) || 1;
  while (out.length < count && used.size < pool.length) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const k = s % pool.length;
    if (!used.has(k)) { used.add(k); out.push(pool[k]); }
  }
  return out;
}
