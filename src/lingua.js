/**
 * lingua.js — la lingua in cui parlano i personaggi della demo.
 *
 * PERCHE' A RUNTIME. La pagina inglese non e' una copia: il build genera index.en.html
 * dall'italiano applicando il dizionario di scripts/retro-future-en.mjs, che tocca solo
 * l'HTML. I moduli sotto src/ sono gli stessi file per entrambe le pagine, quindi il
 * dizionario non li vede e l'unico modo di sapere in che lingua siamo e' guardare il
 * lang del documento, che il build mette a "en" sulla pagina inglese.
 *
 * Prima di questo file la regola stava copiata dentro runner-crowd-lines.js e gli altri
 * due parlanti non ce l'avevano affatto: la folla salutava in inglese mentre chi accoglieva
 * e chi era in pausa rispondevano in italiano (2026-09-18).
 */

/** 'en' sulla pagina inglese, 'it' altrove. Nei test di node non c'e' `document`: italiano. */
export function linguaPagina() {
  if (typeof document === 'undefined') return 'it';
  return /^en/i.test(document.documentElement?.lang ?? '') ? 'en' : 'it';
}

/** La voce giusta di `{ it, en }` per la lingua della pagina. */
export function inLingua(testi) {
  return linguaPagina() === 'en' ? testi.en : testi.it;
}
