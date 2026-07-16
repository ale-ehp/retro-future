import {
  LinearFilter,
  NoBlending,
  ShaderMaterial,
  Vector2,
  WebGLRenderTarget,
} from 'three';
import { FullScreenQuad, Pass } from '../../Pass.js';

const TRUEY = new Set(['1', 'true', 'on', 'yes']);
const FALSEY = new Set(['0', 'false', 'off', 'no']);
const TAA_PROFILES = {
  quality: {
    profile: 'quality',
    stillHistoryBlend: 0.78,
    movingHistoryBlend: 0.42,
    clampStrength: 0.045,
  },
  lite: {
    profile: 'lite',
    stillHistoryBlend: 0.62,
    movingHistoryBlend: 0.28,
    clampStrength: 0.035,
  },
};

function clamp01(value) {
  return Math.min(1, Math.max(0, Number(value) || 0));
}

function smoothstep(edge0, edge1, value) {
  const x = clamp01((value - edge0) / Math.max(0.00001, edge1 - edge0));
  return x * x * (3 - 2 * x);
}

function halton(index, base) {
  let value = 0;
  let fraction = 1 / base;
  let i = index;
  while (i > 0) {
    value += fraction * (i % base);
    i = Math.floor(i / base);
    fraction /= base;
  }
  return value;
}

export function temporalAaRequestedFromParams(params) {
  const raw = params?.get?.('taa');
  if (raw != null) {
    const normalized = String(raw).trim().toLowerCase();
    if (FALSEY.has(normalized)) return false;
    if (TRUEY.has(normalized)) return true;
  }
  const aa = String(params?.get?.('aa') || '').trim().toLowerCase();
  if (aa === 'taa') return true;
  if (aa === 'fxaa' || aa === 'msaa' || aa === 'none' || FALSEY.has(aa)) return false;
  return true;
}

export function temporalAaSettingsFromParams(params, { mobile = false } = {}) {
  const enabled = temporalAaRequestedFromParams(params);
  const rawProfile = String(
    params?.get?.('taa.profile') ?? params?.get?.('taaProfile') ?? ''
  ).trim().toLowerCase();
  const profile = rawProfile === 'quality' || rawProfile === 'lite'
    ? rawProfile
    : (mobile ? 'lite' : 'quality');
  return {
    enabled,
    ...TAA_PROFILES[profile],
  };
}

export function temporalAaJitterForFrame(frameIndex, width = 1, height = 1) {
  const sample = (Math.max(0, Math.floor(frameIndex)) % 8) + 1;
  const x = halton(sample, 2) - 0.5;
  const y = halton(sample, 3) - 0.5;
  return {
    x: Math.max(-0.5, Math.min(0.5, x)),
    y: Math.max(-0.5, Math.min(0.5, y)),
    ndcX: (x * 2) / Math.max(1, width),
    ndcY: (y * 2) / Math.max(1, height),
  };
}

export function temporalAaHistoryBlend({
  stable = true,
  motionAmount = 0,
  stillBlend = 0.78,
  movingBlend = 0.42,
} = {}) {
  if (!stable) return 0;
  const motion = smoothstep(0.015, 0.22, motionAmount);
  return Number((stillBlend + (movingBlend - stillBlend) * motion).toFixed(3));
}

const ACCUMULATION_SHADER = {
  uniforms: {
    tDiffuse: { value: null },
    tHistory: { value: null },
    resolution: { value: new Vector2(1, 1) },
    historyBlend: { value: 0 },
    validHistory: { value: 0 },
    clampStrength: { value: 0.045 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform sampler2D tHistory;
    uniform vec2 resolution;
    uniform float historyBlend;
    uniform float validHistory;
    uniform float clampStrength;
    varying vec2 vUv;

    void main() {
      vec2 texel = 1.0 / max(resolution, vec2(1.0));
      vec4 current = texture2D(tDiffuse, vUv);
      vec3 history = texture2D(tHistory, vUv).rgb;

      vec3 minColor = current.rgb;
      vec3 maxColor = current.rgb;
      for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
          vec3 sampleColor = texture2D(tDiffuse, vUv + vec2(float(x), float(y)) * texel).rgb;
          minColor = min(minColor, sampleColor);
          maxColor = max(maxColor, sampleColor);
        }
      }

      vec3 range = max(maxColor - minColor, vec3(0.002));
      vec3 clampedHistory = clamp(
        history,
        minColor - range * clampStrength,
        maxColor + range * clampStrength
      );
      float blend = clamp(historyBlend * validHistory, 0.0, 0.92);
      vec3 color = mix(current.rgb, clampedHistory, blend);
      gl_FragColor = vec4(color, current.a);
    }
  `,
};

const COPY_SHADER = {
  uniforms: {
    tDiffuse: { value: null },
  },
  vertexShader: ACCUMULATION_SHADER.vertexShader,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    varying vec2 vUv;
    void main() {
      gl_FragColor = texture2D(tDiffuse, vUv);
    }
  `,
};

export class TemporalAaPass extends Pass {
  constructor({
    profile = 'quality',
    stillHistoryBlend = 0.78,
    movingHistoryBlend = 0.42,
    clampStrength = 0.045,
  } = {}) {
    super();
    this.name = 'TemporalAaPass';
    this.needsSwap = true;
    this.profile = profile;
    this.stillHistoryBlend = stillHistoryBlend;
    this.movingHistoryBlend = movingHistoryBlend;
    this.lastMotionAmount = 1;
    this.frameIndex = 0;
    this.validHistory = false;
    this.historyTarget = null;
    this.width = 1;
    this.height = 1;
    this.uniforms = {
      tDiffuse: { value: null },
      tHistory: { value: null },
      resolution: { value: new Vector2(1, 1) },
      historyBlend: { value: stillHistoryBlend },
      validHistory: { value: 0 },
      clampStrength: { value: clampStrength },
    };
    this.material = new ShaderMaterial({
      name: 'TronTemporalAaAccumulation',
      uniforms: this.uniforms,
      vertexShader: ACCUMULATION_SHADER.vertexShader,
      fragmentShader: ACCUMULATION_SHADER.fragmentShader,
    });
    this.copyUniforms = {
      tDiffuse: { value: null },
    };
    this.copyMaterial = new ShaderMaterial({
      name: 'TronTemporalAaCopy',
      uniforms: this.copyUniforms,
      vertexShader: COPY_SHADER.vertexShader,
      fragmentShader: COPY_SHADER.fragmentShader,
      blending: NoBlending,
      depthTest: false,
      depthWrite: false,
    });
    this.fsQuad = new FullScreenQuad(this.material);
  }

  setSize(width, height) {
    const nextWidth = Math.max(1, Math.round(width));
    const nextHeight = Math.max(1, Math.round(height));
    if (this.historyTarget && this.width === nextWidth && this.height === nextHeight) return;
    this.width = nextWidth;
    this.height = nextHeight;
    this.historyTarget?.dispose?.();
    this.historyTarget = new WebGLRenderTarget(nextWidth, nextHeight, {
      depthBuffer: false,
      stencilBuffer: false,
    });
    this.historyTarget.texture.name = 'tron-temporal-aa-history';
    this.historyTarget.texture.minFilter = LinearFilter;
    this.historyTarget.texture.magFilter = LinearFilter;
    this.uniforms.resolution.value.set(nextWidth, nextHeight);
    this.reset();
  }

  nextJitter() {
    const jitter = temporalAaJitterForFrame(this.frameIndex, this.width, this.height);
    this.frameIndex += 1;
    return jitter;
  }

  sync({ stable = true, motionAmount = 0 } = {}) {
    this.lastMotionAmount = motionAmount;
    const blend = temporalAaHistoryBlend({
      stable,
      motionAmount,
      stillBlend: this.stillHistoryBlend,
      movingBlend: this.movingHistoryBlend,
    });
    this.uniforms.historyBlend.value = blend;
    if (!stable) this.reset();
  }

  reset() {
    this.validHistory = false;
    this.uniforms.validHistory.value = 0;
  }

  render(renderer, writeBuffer, readBuffer) {
    if (!this.historyTarget) this.setSize(readBuffer.width, readBuffer.height);
    this.uniforms.tDiffuse.value = readBuffer.texture;
    this.uniforms.tHistory.value = this.historyTarget.texture;
    this.uniforms.validHistory.value = this.validHistory ? 1 : 0;
    this.fsQuad.material = this.material;
    renderer.setRenderTarget(writeBuffer);
    if (this.clear) renderer.clear(renderer.autoClearColor, renderer.autoClearDepth, renderer.autoClearStencil);
    this.fsQuad.render(renderer);

    this.copyUniforms.tDiffuse.value = writeBuffer.texture;
    this.fsQuad.material = this.copyMaterial;
    if (this.renderToScreen) {
      renderer.setRenderTarget(null);
      this.fsQuad.render(renderer);
    }
    renderer.setRenderTarget(this.historyTarget);
    this.fsQuad.render(renderer);
    this.validHistory = true;
    this.uniforms.validHistory.value = 1;
  }

  inspect() {
    return {
      enabled: this.enabled,
      width: this.width,
      height: this.height,
      frameIndex: this.frameIndex,
      validHistory: this.validHistory,
      profile: this.profile,
      stillHistoryBlend: this.stillHistoryBlend,
      movingHistoryBlend: this.movingHistoryBlend,
      historyBlend: this.uniforms.historyBlend.value,
      motionAmount: Number(this.lastMotionAmount.toFixed(3)),
      clampStrength: this.uniforms.clampStrength.value,
    };
  }

  dispose() {
    this.historyTarget?.dispose?.();
    this.material.dispose();
    this.copyMaterial.dispose();
    this.fsQuad.dispose();
  }
}
