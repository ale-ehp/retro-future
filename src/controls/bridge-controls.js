// ---------- Bridge control panel (extracted from main.js, init-deps) ----------
let deps = null;
let controlEls = null;
let scheduleLiveControls = null;
let bridgeRecords = null;
let BRIDGE_PAIR_5_6_INDEX = 0;
let BRIDGE_PAIR_5_6_Y_OFFSET = 0;

const bridgeControlFields = [
  { key: 'visible', label: 'Visibile', type: 'checkbox', value: true },
  { key: 'xOffset', label: 'Offset X', min: -80, max: 80, step: 0.5, value: 0, digits: 1 },
  { key: 'zOffset', label: 'Offset Z', min: -80, max: 80, step: 0.5, value: 0, digits: 1 },
  { key: 'yOffset', label: 'Altezza aggancio', min: -60, max: 100, step: 0.5, value: 0, digits: 1 },
  { key: 'spanScale', label: 'Lunghezza', min: 0.35, max: 2.4, step: 0.01, value: 1, digits: 2 },
  { key: 'heightScale', label: 'Altezza', min: 0.35, max: 3, step: 0.01, value: 1, digits: 2 },
  { key: 'depthScale', label: 'Profondita', min: 0.35, max: 3, step: 0.01, value: 1, digits: 2 },
  { key: 'lowLedOffset', label: 'Mov. LED bassi', min: -4, max: 4, step: 0.05, value: 0, digits: 2 },
  { key: 'highLedOffset', label: 'Mov. LED alti', min: -4, max: 4, step: 0.05, value: 0, digits: 2 },
];

function bridgeControlId(index, key) {
  return `bridge-${index}-${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`;
}

function getBridgeControl(index, key) {
  return document.getElementById(bridgeControlId(index, key));
}

/**
 * Il valore numerico di un controllo del ponte, o il default del campo se l'input non
 * c'e'. Il default passa da Number() perche' l'unico campo con `value: true` e' la
 * checkbox `visible`, che qui non arriva mai (la legge readBridgeVisible): senza, tsc
 * deduceva `number | boolean` e ogni somma in building-leds era un errore (2026-09-20).
 * @returns {number}
 */
export function readBridgeNumber(record, key) {
  const input = getBridgeControl(record.index, key);
  const fallback = Number(bridgeControlFields.find((field) => field.key === key)?.value ?? 0);
  const value = Number(input?.value ?? fallback);
  if (record.index === BRIDGE_PAIR_5_6_INDEX && key === 'yOffset') return BRIDGE_PAIR_5_6_Y_OFFSET;
  return Number.isFinite(value) ? value : fallback;
}

export function readBridgeVisible(record) {
  const input = getBridgeControl(record.index, 'visible');
  return input ? input.checked : true;
}

export function updateBridgeControlOutputs() {
  for (const record of bridgeRecords) {
    for (const field of bridgeControlFields) {
      if (field.type === 'checkbox') continue;
      const input = getBridgeControl(record.index, field.key);
      const output = document.getElementById(`${bridgeControlId(record.index, field.key)}-val`);
      if (!input || !output) continue;
      output.textContent = readBridgeNumber(record, field.key).toFixed(field.digits ?? 2);
    }
  }
}

export function applyBridgeFixedDefaults() {
  const input = getBridgeControl(BRIDGE_PAIR_5_6_INDEX, 'yOffset');
  if (!input) return;
  input.value = String(BRIDGE_PAIR_5_6_Y_OFFSET);
  input.defaultValue = String(BRIDGE_PAIR_5_6_Y_OFFSET);
}

export function renderBridgeControls() {
  if (!controlEls.bridgeControls || controlEls.bridgeControls.childElementCount) return;
  controlEls.bridgeControls.innerHTML = bridgeRecords.map((record) => {
    const title = `Ponte ${String(record.index + 1).padStart(2, '0')} · Z ${record.baseZ}`;
    const rows = bridgeControlFields.map((field) => {
      const id = bridgeControlId(record.index, field.key);
      if (field.type === 'checkbox') {
        return `<label class="control-row"><span class="control-head"><span>${field.label}</span><output id="${id}-val">on</output></span><input id="${id}" type="checkbox" checked /></label>`;
      }
      return `<label class="control-row"><span class="control-head"><span>${field.label}</span><output id="${id}-val">${Number(field.value).toFixed(field.digits ?? 2)}</output></span><input id="${id}" type="range" min="${field.min}" max="${field.max}" step="${field.step}" value="${field.value}" /></label>`;
    }).join('');
    return `<div class="control-section">${title}</div>${rows}`;
  }).join('');
  bridgeRecords.forEach((record) => {
    const visible = getBridgeControl(record.index, 'visible');
    if (visible) {
      const output = document.getElementById(`${bridgeControlId(record.index, 'visible')}-val`);
      visible.addEventListener('change', () => {
        if (output) output.textContent = visible.checked ? 'on' : 'off';
        scheduleLiveControls();
      });
    }
  });
}

export function initBridgeControls(d) {
  deps = d;
  ({
    controlEls,
    scheduleLiveControls,
    bridgeRecords,
    BRIDGE_PAIR_5_6_INDEX,
    BRIDGE_PAIR_5_6_Y_OFFSET,
  } = d);
}
