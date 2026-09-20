export function mountSideFacadeLedControls(controlEls) {
  // getElementById dichiara HTMLElement: qui gli id sono cursori (<input>), e il cast lo dice (2026-09-20).
  function mountExistingRange(target, inputId, outputId, label, min, max, step) {
    const input = /** @type {HTMLInputElement} */ (document.getElementById(inputId));
    const output = document.getElementById(outputId);
    if (!target || !input || !output) return null;
    const storedValue = input.value;
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.type = 'range';
    input.value = storedValue;
    input.removeAttribute('hidden');
    output.removeAttribute('hidden');
    output.textContent = Number(input.value).toFixed(2);
    const row = document.createElement('label');
    row.className = 'control-row';
    row.innerHTML = `<span class="control-head"><span>${label}</span></span>`;
    row.querySelector('.control-head').appendChild(output);
    row.appendChild(input);
    target.appendChild(row);
    return { input, output };
  }

  function createRange(target, inputId, outputId, label, min, max, step, value = 0) {
    if (!target) return null;
    let input = /** @type {HTMLInputElement} */ (document.getElementById(inputId));
    let output = document.getElementById(outputId);
    if (!input) {
      input = document.createElement('input');
      input.id = inputId;
      input.type = 'range';
      input.value = String(value);
    }
    if (!output) {
      output = document.createElement('output');
      output.id = outputId;
    }
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    output.textContent = Number(input.value).toFixed(2);
    const row = document.createElement('label');
    row.className = 'control-row';
    row.innerHTML = `<span class="control-head"><span>${label}</span></span>`;
    row.querySelector('.control-head').appendChild(output);
    row.appendChild(input);
    target.appendChild(row);
    return { input, output };
  }

  const mainTarget = document.getElementById('main-facade-led-controls');
  mountExistingRange(mainTarget, 'main-facade-led-z-ui', 'main-facade-led-z-ui-val', 'Mio centrale Z', -40, 40, 0.01);

  const target = document.getElementById('side-facade-led-controls');
  [
    ['building-facade-led-normal', 'building-facade-led-normal-val', 'Fuori facciata', -20, 30, 0.01],
    ['building-facade-led-x', 'building-facade-led-x-val', 'X speculare', -40, 40, 0.01],
    ['building-facade-led-y', 'building-facade-led-y-val', 'Asse Y', -60, 60, 0.01],
    ['building-facade-led-z', 'building-facade-led-z-val', 'Asse Z', -40, 40, 0.01],
  ].forEach(([inputId, outputId, label, min, max, step]) => mountExistingRange(target, inputId, outputId, label, min, max, step));

  if (!target) return;
  const section = document.createElement('div');
  section.className = 'control-section';
  section.textContent = 'Pezzi centrali 12 palazzi';
  target.appendChild(section);
  controlEls.buildingFacadeLedSegmentControls = Array.from({ length: 6 }, (_, index) => {
    const n = index + 1;
    const u = createRange(target, `building-facade-led-seg-${n}-u`, `building-facade-led-seg-${n}-u-val`, `Pezzo ${n} laterale`, -30, 30, 0.01);
    const y = createRange(target, `building-facade-led-seg-${n}-y`, `building-facade-led-seg-${n}-y-val`, `Pezzo ${n} Y`, -40, 40, 0.01);
    const normal = createRange(target, `building-facade-led-seg-${n}-normal`, `building-facade-led-seg-${n}-normal-val`, `Pezzo ${n} fuori`, -20, 30, 0.01);
    return { u: u.input, uVal: u.output, y: y.input, yVal: y.output, normal: normal.input, normalVal: normal.output };
  });
}
