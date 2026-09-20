// ---------- FX category control panels ----------
// Pure-DOM layout: re-parents the existing flat control rows into the collapsible FX category panels
// (bloom / performance / atmosphere / LED city / LED main) and builds a few hidden range rows. The only
// outbound coupling is the live performance-diagnostics element it creates, handed back to main.js via
// deps.setPerformanceDiagnosticsEl so the tick loop can update its text each frame.

export function mountFxCategoryPanels(deps) {
  const appendRow = (targetId, inputId) => {
    const target = document.getElementById(targetId);
    const input = document.getElementById(inputId);
    const row = input?.closest('.control-row');
    if (!target || !row) return;
    target.appendChild(row);
  };

  const appendRows = (targetId, inputIds) => {
    inputIds.forEach((inputId) => appendRow(targetId, inputId));
  };

  const appendElement = (targetId, elementId) => {
    const target = document.getElementById(targetId);
    const element = document.getElementById(elementId);
    if (target && element) target.appendChild(element);
  };

  const mountHiddenRange = (targetId, inputId, outputId, label, min, max, step, formatter = (value) => value.toFixed(2)) => {
    const target = document.getElementById(targetId);
    // getElementById dichiara HTMLElement: l'id e' un cursore (<input>), e il cast lo dice (2026-09-20).
    const input = /** @type {HTMLInputElement} */ (document.getElementById(inputId));
    const output = document.getElementById(outputId);
    if (!target || !input || !output) return;
    const storedValue = input.value;
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.type = 'range';
    input.value = storedValue;
    input.removeAttribute('hidden');
    output.removeAttribute('hidden');
    output.classList.add('control-value');
    output.textContent = formatter(Number(input.value));
    const row = document.createElement('label');
    row.className = 'control-row';
    const head = document.createElement('span');
    head.className = 'control-head';
    const text = document.createElement('span');
    text.textContent = label;
    head.appendChild(text);
    head.appendChild(output);
    row.appendChild(head);
    row.appendChild(input);
    target.appendChild(row);
  };

  appendRows('bloom-fx-controls', [
    'bloom-enabled',
    'bloom-strength',
    'bloom-radius',
    'bloom-threshold',
    'bloom-quality',
  ]);

  appendRows('performance-fx-controls', [
    'performance-mode',
    'render-resolution',
    'aa-mode',
    'pixel-ratio',
    'fsr-preset',
    'fsr-upscale-enabled',
    'fsr-internal-scale',
    'fsr-sharpness',
  ]);
  appendElement('performance-fx-controls', 'run-fsr-benchmark');
  appendElement('performance-fx-controls', 'fsr-benchmark-results');
  const performanceTarget = document.getElementById('performance-fx-controls');
  if (performanceTarget && !document.getElementById('performance-diagnostics')) {
    const section = document.createElement('div');
    section.className = 'control-section';
    section.textContent = 'Diagnostica live';
    performanceTarget.appendChild(section);
    const diagnosticsEl = document.createElement('div');
    diagnosticsEl.id = 'performance-diagnostics';
    diagnosticsEl.className = 'control-value';
    diagnosticsEl.style.whiteSpace = 'normal';
    diagnosticsEl.style.lineHeight = '1.45';
    diagnosticsEl.textContent = 'FPS --';
    performanceTarget.appendChild(diagnosticsEl);
    deps.setPerformanceDiagnosticsEl(diagnosticsEl);
  }

  appendRows('atmosphere-fx-controls', [
    'ambient-light',
    'key-light',
    'exposure',
    'sky-choice',
    'sky-quality',
    'sky-brightness',
    'sky-hue',
    'sky-cloud-contrast',
    'sky-storm-frequency',
    'sky-storm-intensity',
    'sky-storm-size',
    'sky-storm-cloud-threshold',
    'sky-storm-band',
    'sky-storm-veil',
  ]);

  [
    ['led-brightness', 'led-brightness-val', 'LED palazzi brightness', 0, 3, 0.01],
    ['led-thickness', 'led-thickness-val', 'LED palazzi spessore', 0.05, 3, 0.01],
    ['led-distance', 'led-distance-val', 'LED palazzi distanza', -40, 20, 0.05],
    ['led-hue', 'led-hue-val', 'LED palazzi hue', -180, 180, 1, (value) => value.toFixed(0)],
    ['building-horizontal-led-distance', 'building-horizontal-led-distance-val', 'Orizzontali distanza', -20, 20, 0.05],
    ['building-horizontal-led-thickness', 'building-horizontal-led-thickness-val', 'Orizzontali spessore', 0.04, 5, 0.01],
    ['building-horizontal-led-radius', 'building-horizontal-led-radius-val', 'Orizzontali radius', 0.1, 3.5, 0.01],
    ['building-low-led-offset', 'building-low-led-offset-val', 'Sotto distanza', -20, 20, 0.05],
    ['building-high-led-offset', 'building-high-led-offset-val', 'Sopra distanza', -20, 20, 0.05],
    ['building-vertical-led-length', 'building-vertical-led-length-val', 'Verticali lunghezza', 0.1, 2, 0.01],
    ['building-vertical-led-y', 'building-vertical-led-y-val', 'Verticali Y', -80, 80, 0.5, (value) => value.toFixed(1)],
    ['building-low-led-y', 'building-low-led-y-val', 'Sotto Y', -80, 80, 0.5, (value) => value.toFixed(1)],
    ['building-high-led-y', 'building-high-led-y-val', 'Sopra Y', -80, 80, 0.5, (value) => value.toFixed(1)],
    ['base-pad-led-brightness', 'base-pad-led-brightness-val', 'Marciapiedi brightness', 0, 3, 0.01],
    ['base-pad-led-thickness', 'base-pad-led-thickness-val', 'Marciapiedi spessore', 0.04, 3, 0.01],
    ['base-pad-led-offset', 'base-pad-led-offset-val', 'Marciapiedi offset', -6, 6, 0.01],
    ['base-pad-led-hue', 'base-pad-led-hue-val', 'Marciapiedi hue', -180, 180, 1, (value) => value.toFixed(0)],
  ].forEach((spec) => mountHiddenRange('led-glow-fx-city-controls', ...spec));

  appendRows('led-glow-fx-main-controls', [
    'main-led-brightness-ui',
    'main-led-hue-ui',
    'main-led-vertical-distance-ui',
    'main-led-thickness-ui',
    'main-led-vertical-length-ui',
    'main-led-vertical-y-ui',
    'main-led-horizontal-distance-ui',
    'main-led-horizontal-thickness-ui',
    'main-led-horizontal-radius-ui',
    'main-led-low-offset-ui',
    'main-led-low-y-ui',
    'main-led-high-offset-ui',
    'main-led-high-y-ui',
    'main-facade-led-brightness-ui',
    'main-facade-led-normal-ui',
    'main-facade-led-x-ui',
    'main-facade-led-y-ui',
    'main-facade-led-thickness-ui',
  ]);
  for (let index = 1; index <= 6; index += 1) {
    appendRows('led-glow-fx-main-controls', [
      `main-facade-led-seg-${index}-u-ui`,
      `main-facade-led-seg-${index}-y-ui`,
      `main-facade-led-seg-${index}-normal-ui`,
    ]);
  }
  appendElement('led-glow-fx-main-controls', 'main-facade-led-controls');
}
