// Valori di configurazione fissi della scena: LED di edifici, base pad e ponti.
//
// Stavano dentro index.html come 72 <input type="hidden"> su una riga sola da
// 8 KB, illeggibile e senza modo di capire cosa fosse cosa. Non erano markup di
// interfaccia: erano dati travestiti da DOM, perche' controlEls legge tutto con
// getElementById(...).value e il resto del codice si aspetta quella forma.
//
// Qui i valori tornano a essere dati, e mountFixedControlDefaults() ricrea gli
// stessi elementi prima che createControlEls() li cerchi. Il DOM prodotto e'
// equivalente a quello che c'era nel markup: stessi id, stessi valori, stesso
// annidamento di #bridge-controls, che controls.js interroga.
//
// Cambiare un valore qui cambia la scena. I default degli slider del pannello
// stanno invece in demo-5-boulevard-canonical-settings.json, applicato al boot.

/** LED di edifici, facciate, base pad e offset comuni dei ponti. */
export const FIXED_LED_DEFAULTS = Object.freeze({
  'base-pad-led-brightness': 0.79,
  'base-pad-led-thickness': 0.34,
  'base-pad-led-offset': 0.25,
  'base-pad-led-hue': 0,
  'led-brightness': 0.79,
  'led-thickness': 0.9,
  'led-distance': -14.65,
  'building-horizontal-led-distance': 2.85,
  'building-horizontal-led-thickness': 2.04,
  'building-horizontal-led-radius': 1.15,
  'led-hue': 0,
  'building-low-led-offset': 1.15,
  'building-high-led-offset': 0.65,
  'building-vertical-led-length': 1.03,
  'building-vertical-led-y': -24.5,
  'building-low-led-y': 1,
  'building-high-led-y': -17,
  'building-facade-led-normal': 0.2,
  'building-facade-led-x': 0,
  'building-facade-led-y': 0,
  'building-facade-led-z': 0,
  'bridge-low-led-offset': 14.6,
  'bridge-high-led-offset': 12.55,
  'main-building-led-brightness': 0.56,
  'main-building-led-thickness': 0.9,
  'main-building-led-distance': -14.65,
  'main-building-horizontal-led-distance': 2.85,
  'main-building-horizontal-led-thickness': 2.04,
  'main-building-horizontal-led-radius': 1.15,
  'main-building-led-hue': -144,
  'main-building-low-led-offset': 1.15,
  'main-building-high-led-offset': 0.65,
  'main-building-vertical-led-length': 1.03,
  'main-building-vertical-led-y': -24.5,
  'main-building-low-led-y': 1,
  'main-building-high-led-y': -17,
});

/**
 * I quattro ponti del boulevard, nell'ordine in cui bridges.buildLinks() li
 * costruisce. `visible` e' una checkbox, gli altri sono valori numerici.
 */
export const BRIDGE_DEFAULTS = Object.freeze([
  Object.freeze({
    'visible': true,
    'x-offset': -3.5,
    'z-offset': 13,
    'y-offset': 66.5,
    'span-scale': 1.21,
    'height-scale': 1.05,
    'depth-scale': 1,
    'low-led-offset': 0,
    'high-led-offset': 0,
  }),
  Object.freeze({
    'visible': true,
    'x-offset': 0,
    'z-offset': 9.5,
    'y-offset': 74,
    'span-scale': 1.26,
    'height-scale': 0.9,
    'depth-scale': 0.87,
    'low-led-offset': 0,
    'high-led-offset': 0,
  }),
  Object.freeze({
    'visible': true,
    'x-offset': 0,
    'z-offset': 10.5,
    'y-offset': 17,
    'span-scale': 1.19,
    'height-scale': 1.32,
    'depth-scale': 0.96,
    'low-led-offset': 0,
    'high-led-offset': 0,
  }),
  Object.freeze({
    'visible': true,
    'x-offset': -1,
    'z-offset': -0.5,
    'y-offset': 66,
    'span-scale': 0.87,
    'height-scale': 1.02,
    'depth-scale': 1.37,
    'low-led-offset': -0.05,
    'high-led-offset': 0,
  }),
]);

function appendControl(parent, id, attrs) {
  const input = document.createElement('input');
  input.id = id;
  for (const [name, value] of Object.entries(attrs)) {
    if (value === true) input.setAttribute(name, '');
    else input.setAttribute(name, String(value));
  }
  parent.appendChild(input);
  // Ogni controllo ha il suo <span> di lettura: applyLiveControls ci scrive
  // dentro con .textContent, e senza esploderebbe su null.
  const readout = document.createElement('span');
  readout.id = `${id}-val`;
  readout.hidden = true;
  parent.appendChild(readout);
}

/**
 * Ricrea gli input nascosti che portano i valori fissi della scena.
 * Va chiamata PRIMA di createControlEls(), che li cerca per id.
 * Idempotente: se il contenitore esiste gia', non fa niente.
 */
export function mountFixedControlDefaults() {
  if (document.getElementById('fixed-led-values')) return;

  const root = document.createElement('div');
  root.id = 'fixed-led-values';
  root.hidden = true;
  root.setAttribute('aria-hidden', 'true');

  for (const [id, value] of Object.entries(FIXED_LED_DEFAULTS)) {
    appendControl(root, id, { type: 'hidden', value });
  }

  // controls.js legge #bridge-controls come contenitore, quindi l'annidamento
  // va conservato: i controlli dei ponti stanno dentro, non accanto.
  const bridges = document.createElement('div');
  bridges.id = 'bridge-controls';
  bridges.hidden = true;
  BRIDGE_DEFAULTS.forEach((bridge, index) => {
    for (const [key, value] of Object.entries(bridge)) {
      const id = `bridge-${index}-${key}`;
      if (typeof value === 'boolean') {
        appendControl(bridges, id, { type: 'checkbox', ...(value ? { checked: true } : {}), hidden: true });
      } else {
        appendControl(bridges, id, { type: 'hidden', value });
      }
    }
  });
  root.appendChild(bridges);

  document.body.appendChild(root);
}
