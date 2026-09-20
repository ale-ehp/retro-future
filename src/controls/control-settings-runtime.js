import * as THREE from 'three';

export function setButtonFeedback(button, label = 'Salvato') {
  if (!button) return;
  const defaultText = button.dataset.defaultText || button.textContent;
  button.dataset.defaultText = defaultText;
  button.textContent = label;
  button.classList.add('saved');
  window.setTimeout(() => {
    button.textContent = defaultText;
    button.classList.remove('saved');
  }, 1200);
}

export function createControlSettingsRuntime(deps) {
  const {
    controlEls,
    CITY_REVEAL_DEFAULT_DELAY_MS,
    CITY_REVEAL_DEFAULT_FADE_MS,
    updateStartPositionLiveLabel,
    sanitizePlayerSpawn,
    sanitizeDroneLandingPose,
    updatePlayerSpawnLabel,
    applyPlayerSpawn,
    setPlayerSpawn,
    setDroneLandingPose,
  } = deps;

  const CONTROLS_VISIBILITY_KEY = 'tron-boulevard-controls-hidden';
  const TAB_STORAGE_PREFIX = 'tron-boulevard-tab:';
  const DEFAULT_SETTINGS_KEY = 'tron-boulevard-default-settings';
  // Salvataggio dei preset su file: e' un attrezzo di authoring, serve solo mentre
  // si lavora in locale con il server di appoggio in ascolto sulla 60093. In
  // produzione quel server non esiste, ma il ramo era comunque raggiungibile con
  // il tasto P (controls/keyboard.js -> captureLivePlayerSpawn), quindi un
  // visitatore che lo premeva faceva partire una POST verso la porta 60093 del
  // dominio pubblico, che falliva e lasciava un warning in console. Fuori da
  // localhost non si prova nemmeno: resta il salvataggio in localStorage.
  const LOCAL_AUTHORING_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '::1', '']);
  const PROJECT_SETTINGS_ENDPOINT = LOCAL_AUTHORING_HOSTS.has(location.hostname)
    ? `${location.protocol}//${location.hostname || '127.0.0.1'}:60093/save-settings`
    : null;
  const PROJECT_CANONICAL_SETTINGS_URL = new URL('boulevard-canonical-settings.json', location.href).href;
  const LOCKED_LED_POSITION_VALUES = Object.freeze({
    'main-led-vertical-distance-ui': 6.1,
    'main-led-thickness-ui': 2.28,
    'main-led-vertical-length-ui': 1.03,
    'main-led-vertical-y-ui': -43,
    'main-led-horizontal-distance-ui': 9.95,
    'main-led-horizontal-thickness-ui': 2.04,
    'main-led-horizontal-radius-ui': 1.15,
    'main-led-low-offset-ui': 0.1,
    'main-led-low-y-ui': -2,
    'main-led-high-offset-ui': 0.15,
    'main-led-high-y-ui': -33,
    'main-facade-led-normal-ui': 3.8,
    'main-facade-led-thickness-ui': 3,
    'main-facade-led-seg-1-u-ui': -3.7,
    'main-facade-led-seg-1-y-ui': 3.6,
    'main-facade-led-seg-1-normal-ui': -1,
    'main-facade-led-seg-2-u-ui': 0,
    'main-facade-led-seg-2-y-ui': 0,
    'main-facade-led-seg-2-normal-ui': -1.2,
    'main-facade-led-seg-3-u-ui': -1.3,
    'main-facade-led-seg-3-y-ui': -3.4,
    'main-facade-led-seg-3-normal-ui': -1,
    'main-facade-led-seg-4-u-ui': -4.9,
    'main-facade-led-seg-4-y-ui': -5.1,
    'main-facade-led-seg-4-normal-ui': -1,
    'main-facade-led-seg-5-u-ui': 4.7,
    'main-facade-led-seg-5-y-ui': 26.1,
    'main-facade-led-seg-5-normal-ui': -1.2,
    'main-facade-led-seg-6-u-ui': 5.2,
    'main-facade-led-seg-6-y-ui': 23.9,
    'main-facade-led-seg-6-normal-ui': -1.2,
  });

  function setupSettingsToggle() {
    const button = document.getElementById('settings-toggle');
    const controls = document.getElementById('hud-controls');
    if (!button || !controls) return;

    function setHidden(hidden, persist = true) {
      document.body.classList.toggle('controls-hidden', hidden);
      if (!hidden) updateStartPositionLiveLabel();
      button.textContent = hidden ? 'Settaggi' : 'Nascondi';
      button.setAttribute('aria-expanded', hidden ? 'false' : 'true');
      controls.setAttribute('aria-hidden', hidden ? 'true' : 'false');
      if (!persist) return;
      try {
        localStorage.setItem(CONTROLS_VISIBILITY_KEY, hidden ? 'true' : 'false');
      } catch {}
    }

    setHidden(true, false);
    button.addEventListener('click', () => {
      setHidden(!document.body.classList.contains('controls-hidden'));
    });
  }

  async function persistSettingsToProject(scope, settings, extra = {}) {
    if (!PROJECT_SETTINGS_ENDPOINT) return null;
    try {
      const payload = {
        demo: 'retro-future-boulevard',
        source: location.pathname,
        savedAt: new Date().toISOString(),
        scope,
        settings,
        ...extra,
      };
      const response = await fetch(PROJECT_SETTINGS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.ok === false) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }
      return result;
    } catch (error) {
      console.warn('TRON boulevard project JSON save failed', error);
      return null;
    }
  }

  function collectPanelSettings(panel) {
    const settings = {};
    panel.querySelectorAll('input[type="range"], input[type="checkbox"], select').forEach((input) => {
      settings[input.id] = input.type === 'checkbox' ? input.checked : (input.tagName === 'SELECT' ? input.value : Number(input.value));
    });
    return settings;
  }

  function collectAllControlSettings() {
    const settings = {};
    // querySelectorAll dichiara Element, che non ha ne' .type ne' .dataset: il cast dice che
    // cosa seleziona davvero il selettore (2026-09-20).
    /** @type {NodeListOf<HTMLInputElement | HTMLSelectElement>} */ (document.querySelectorAll('#hud-controls input[type="range"], #hud-controls input[type="checkbox"], #hud-controls select')).forEach((input) => {
      settings[input.id] = input.type === 'checkbox' ? input.checked : (input.tagName === 'SELECT' ? input.value : Number(input.value));
    });
    return settings;
  }

  function applyLockedLedPositionControls() {
    for (const [id, value] of Object.entries(LOCKED_LED_POSITION_VALUES)) {
      const input = document.getElementById(id);
      if (!input) continue;
      input.value = String(value);
      input.defaultValue = String(value);
      input.disabled = true;
      input.closest('.control-row')?.classList.add('is-locked');
    }
  }

  function applyControlSettings(settings, asDefault = false) {
    for (const [id, rawValue] of Object.entries(settings)) {
      const input = document.getElementById(id);
      if (!input) continue;
      if (input.tagName === 'SELECT') {
        const value = String(rawValue);
        const optionExists = Array.from(input.options).some((option) => option.value === value);
        if (!optionExists) continue;
        input.value = value;
        if (asDefault) input.dataset.defaultValue = value;
        continue;
      }
      if (input.type === 'checkbox') {
        input.checked = Boolean(rawValue);
        if (asDefault) input.defaultChecked = input.checked;
        const output = document.getElementById(`${input.id}-val`);
        if (output) output.textContent = input.checked ? 'on' : 'off';
        continue;
      }
      if (input.type !== 'range') continue;
      const min = Number(input.min);
      const max = Number(input.max);
      const numeric = Number(rawValue);
      if (!Number.isFinite(numeric)) continue;
      const value = THREE.MathUtils.clamp(numeric, min, max);
      input.value = String(value);
      if (asDefault) input.defaultValue = String(value);
    }
    applyLockedLedPositionControls();
  }

  function loadStoredControlDefaults() {
    const settings = {};
    try {
      const globalPayload = JSON.parse(localStorage.getItem(DEFAULT_SETTINGS_KEY) || 'null');
      if (globalPayload?.settings) Object.assign(settings, globalPayload.settings);
    } catch (error) {
      console.warn('Invalid TRON boulevard global defaults', error);
    }

    /** @type {NodeListOf<HTMLElement>} */ (document.querySelectorAll('#hud-controls .control-panel')).forEach((panel) => {
      try {
        const payload = JSON.parse(localStorage.getItem(`${TAB_STORAGE_PREFIX}${panel.dataset.panel}`) || 'null');
        if (payload?.settings) Object.assign(settings, payload.settings);
      } catch (error) {
        console.warn(`Invalid TRON boulevard defaults for ${panel.dataset.panel}`, error);
      }
    });

    applyControlSettings(settings, true);
  }

  async function loadProjectCanonicalDefaults() {
    try {
      const response = await fetch(PROJECT_CANONICAL_SETTINGS_URL, { cache: 'no-store' });
      if (!response.ok) return false;
      const payload = await response.json();
      if (!payload?.settings || typeof payload.settings !== 'object') return false;
      applyControlSettings(payload.settings, true);
      const nextSpawn = sanitizePlayerSpawn(payload.spawn);
      if (nextSpawn) {
        setPlayerSpawn(nextSpawn);
        updatePlayerSpawnLabel();
        applyPlayerSpawn(nextSpawn, false);
      }
      const nextLanding = sanitizeDroneLandingPose(payload.landing);
      if (nextLanding) setDroneLandingPose(nextLanding);
      return true;
    } catch (error) {
      console.warn('TRON boulevard canonical settings load failed', error);
      return false;
    }
  }

  function formatRevealDelaySeconds(seconds) {
    const roundedTenths = Math.round(seconds * 10) / 10;
    return Math.abs(seconds - roundedTenths) < 0.0001 ? seconds.toFixed(1) : seconds.toFixed(2);
  }

  function applyRetroFutureRevealTimingDefaults() {
    if (!controlEls.wireframeDelay) return;
    const delaySeconds = CITY_REVEAL_DEFAULT_DELAY_MS / 1000;
    controlEls.wireframeDelay.value = String(delaySeconds);
    controlEls.wireframeDelay.defaultValue = String(delaySeconds);
    if (controlEls.wireframeDelayVal) {
      controlEls.wireframeDelayVal.textContent = `${formatRevealDelaySeconds(delaySeconds)} s`;
    }
    if (controlEls.wireframeFade) {
      const fadeSeconds = CITY_REVEAL_DEFAULT_FADE_MS / 1000;
      controlEls.wireframeFade.value = String(fadeSeconds);
      controlEls.wireframeFade.defaultValue = String(fadeSeconds);
      if (controlEls.wireframeFadeVal) {
        controlEls.wireframeFadeVal.textContent = `${fadeSeconds.toFixed(1)} s`;
      }
    }
  }

  function applyFullResolutionFsrDefaults() {
    if (controlEls.fsrPreset) {
      controlEls.fsrPreset.value = 'off';
      controlEls.fsrPreset.dataset.defaultValue = 'off';
    }
    if (controlEls.fsrUpscaleEnabled) {
      controlEls.fsrUpscaleEnabled.value = 'off';
      controlEls.fsrUpscaleEnabled.dataset.defaultValue = 'off';
    }
    if (controlEls.fsrInternalScale) {
      controlEls.fsrInternalScale.value = '1';
      controlEls.fsrInternalScale.defaultValue = '1';
    }
    if (controlEls.fsrInternalScaleVal) controlEls.fsrInternalScaleVal.textContent = '100%';
  }

  function saveTabSettings(tabName, button) {
    const panel = document.querySelector(`#hud-controls .control-panel[data-panel="${tabName}"]`);
    if (!panel) return;
    const payload = {
      tab: tabName,
      savedAt: new Date().toISOString(),
      settings: collectPanelSettings(panel),
    };
    const text = JSON.stringify(payload, null, 2);
    localStorage.setItem(`${TAB_STORAGE_PREFIX}${tabName}`, text);
    navigator.clipboard?.writeText(text).catch(() => {});
    applyControlSettings(payload.settings, true);
    setButtonFeedback(button, 'Scheda salvata');
    const canonicalSettings = collectAllControlSettings();
    persistSettingsToProject('tab', payload.settings, { tab: tabName, savedAt: payload.savedAt }).then((result) => {
      if (result) setButtonFeedback(button, 'Scheda JSON salvata');
    });
    persistSettingsToProject('all-defaults', canonicalSettings, { tab: tabName, savedAt: payload.savedAt, sourceScope: 'tab-save' }).then((result) => {
      if (result) setButtonFeedback(button, 'Scheda + default JSON');
    });
  }

  function bindSaveButtons() {
    /** @type {NodeListOf<HTMLButtonElement>} */ (document.querySelectorAll('#hud-controls .save-tab-settings')).forEach((button) => {
      button.dataset.defaultText = button.textContent;
      button.addEventListener('click', () => saveTabSettings(button.dataset.saveTab, button));
    });
  }

  return {
    setupSettingsToggle,
    persistSettingsToProject,
    setButtonFeedback,
    applyControlSettings,
    loadStoredControlDefaults,
    loadProjectCanonicalDefaults,
    formatRevealDelaySeconds,
    applyRetroFutureRevealTimingDefaults,
    applyFullResolutionFsrDefaults,
    bindSaveButtons,
  };
}
