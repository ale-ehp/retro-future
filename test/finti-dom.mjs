// Un `document` finto per i moduli di scena che disegnano su canvas.
//
// I cartelli, i tabelloni e il terminale rasterizzano il testo su un canvas 2D e ne fanno
// una texture. In node non c'e' ne' document ne' canvas: qui c'e' quanto basta perche'
// quel codice giri senza esplodere, cosi' le prove possono guardare DOVE finiscono gli
// oggetti nella scena e con quali materiali, invece di leggere il sorgente (2026-09-19).
// Il disegno in se' non viene verificato: ogni chiamata al contesto e' un no-op.

/** Un contesto 2D in cui ogni metodo esiste e non fa niente, salvo cio' che deve tornare qualcosa. */
export function contestoFinto() {
  const risposte = {
    measureText: (testo) => ({ width: 10 * String(testo ?? '').length }),
    getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(Math.max(1, w * h) * 4), width: w, height: h }),
    createLinearGradient: () => ({ addColorStop() {} }),
    createRadialGradient: () => ({ addColorStop() {} }),
    createPattern: () => ({}),
  };
  return new Proxy({}, {
    get(target, chiave) {
      if (chiave in risposte) return risposte[chiave];
      if (!(chiave in target)) target[chiave] = () => {};
      return target[chiave];
    },
    set(target, chiave, valore) { target[chiave] = valore; return true; },
  });
}

export function canvasFinto() {
  const canvas = {
    width: 0,
    height: 0,
    style: {},
    classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    getContext: () => contestoFinto(),
    toDataURL: () => 'data:,',
  };
  return canvas;
}

/** Installa un `document` minimo su globalThis, se non c'e' gia'. Torna quello installato. */
export function installaDocumentoFinto() {
  if (globalThis.document) return globalThis.document;
  // e' un finto: non pretende di essere un Document per tsc
  globalThis.document = /** @type {any} */ ({
    createElement: (tag) => (tag === 'canvas' ? canvasFinto() : { style: {}, classList: canvasFinto().classList, setAttribute() {}, appendChild() {} }),
    getElementById: () => null,
    querySelector: () => null,
    body: { classList: { add() {}, remove() {}, toggle() {}, contains: () => false } },
    documentElement: { lang: 'it' },
  });
  return globalThis.document;
}

/** Un renderer finto: quanto basta per le texture (anisotropia) e i prewarm. */
export function rendererFinto() {
  return {
    capabilities: { getMaxAnisotropy: () => 1 },
    initTexture() {},
    domElement: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 500 }) },
  };
}
