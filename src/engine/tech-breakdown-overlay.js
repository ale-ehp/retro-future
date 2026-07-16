const TRUEY = new Set(['1', 'true', 'on', 'yes']);

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function rounded(value, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(number(value) * factor) / factor;
}

function kCount(value) {
  return `${Math.round(number(value) / 1000)}k`;
}

export function techBreakdownRequestedFromParams(params) {
  const raw = params?.get?.('techBreakdown') ?? params?.get?.('tech');
  return TRUEY.has(String(raw || '').trim().toLowerCase());
}

export function formatTechBreakdownRows(stats = {}) {
  const passes = Array.isArray(stats.composerActivePasses) && stats.composerActivePasses.length
    ? stats.composerActivePasses.join(' -> ')
    : 'direct';
  const skyBake = stats.skyBake || {};
  const hexRoad = stats.hexRoad || {};
  const temporalAa = stats.temporalAa || {};
  const webgpu = stats.webgpu || {};
  const fxDisabled = Array.isArray(stats.fxDisabled) && stats.fxDisabled.length
    ? stats.fxDisabled.join(', ')
    : 'none';
  const visibleBatches = number(hexRoad.lodVisibleBatches);
  const hiddenBatches = number(hexRoad.lodHiddenBatches);
  const totalBatches = visibleBatches + hiddenBatches;

  return [
    {
      label: 'FPS',
      value: `${rounded(stats.fps, 1)} / ${stats.bottleneck || 'n/a'}`,
    },
    {
      label: 'Frame',
      value: `${rounded(stats.rollingFrameMs, 1)}ms (${rounded(stats.rollingUpdateMs, 1)}u + ${rounded(stats.rollingRenderMs, 1)}r)`,
    },
    {
      label: 'Pipeline',
      value: passes,
    },
    {
      label: 'Scene',
      value: `${number(stats.drawCalls)} draws | ${kCount(stats.triangles)} tris | ${number(stats.textures)} tex`,
    },
    {
      label: 'Sky bake',
      value: skyBake.active
        ? `${skyBake.spread ? 'spread' : 'full'} 1f/${number(skyBake.faceStride, 1)} · face ${number(skyBake.lastRenderedFace, -1)} · cycle ${number(skyBake.cycles)}`
        : 'inactive',
    },
    {
      label: 'TAA',
      value: temporalAa.enabled
        ? `${temporalAa.profile || 'quality'} · history ${rounded(temporalAa.historyBlend, 2)} · ${temporalAa.validHistory ? 'valid' : 'warming'}`
        : 'off',
    },
    {
      label: 'WebGPU',
      value: webgpu.roadmap || 'compute TAA + motion vectors',
    },
    {
      label: 'LOD',
      value: totalBatches > 0
        ? `${visibleBatches}/${totalBatches} batches | saved ${kCount(hexRoad.lodSavedTriangles)} tris`
        : 'n/a',
    },
    {
      label: 'FX off',
      value: fxDisabled,
    },
  ];
}

export function createTechBreakdownOverlay({
  doc = document,
  getStats = () => ({}),
  minUpdateMs = 180,
} = {}) {
  const root = doc.createElement('section');
  root.id = 'tech-breakdown-overlay';
  root.className = 'tech-breakdown-overlay';
  root.setAttribute('aria-label', 'Tech breakdown');
  root.innerHTML = '<div class="tech-breakdown-title">Render pipeline</div><dl></dl>';
  doc.body.appendChild(root);
  const list = root.querySelector('dl');
  let lastUpdate = -Infinity;

  function update(now = performance.now()) {
    if (now - lastUpdate < minUpdateMs) return;
    lastUpdate = now;
    const rows = formatTechBreakdownRows(getStats() || {});
    list.replaceChildren(...rows.map((row) => {
      const wrapper = doc.createElement('div');
      const dt = doc.createElement('dt');
      const dd = doc.createElement('dd');
      dt.textContent = row.label;
      dd.textContent = row.value;
      wrapper.append(dt, dd);
      return wrapper;
    }));
  }

  function dispose() {
    root.remove();
  }

  update(0);
  return { root, update, dispose };
}
