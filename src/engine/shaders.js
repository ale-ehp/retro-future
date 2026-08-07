import * as THREE from 'three';

const TRUEY = new Set(['1', 'true', 'on', 'yes']);
const FALSEY = new Set(['0', 'false', 'off', 'no']);

export function cinematicLookRequestedFromParams(params) {
  const explicit = params?.get?.('look.cinematic');
  if (explicit != null) return TRUEY.has(String(explicit).trim().toLowerCase());
  const alias = params?.get?.('cinematicLook');
  if (alias != null) return TRUEY.has(String(alias).trim().toLowerCase());
  const look = String(params?.get?.('look') || '').trim().toLowerCase();
  if (look === 'cinematic') return true;
  if (look === 'classic' || look === 'raw' || FALSEY.has(look)) return false;
  return true;
}

// L'encode di output, tone mapping piu' conversione a sRGB, deve stare nell'UNICO
// pass che presenta a schermo: farlo prima significa far lavorare i pass successivi
// su valori gia' non lineari. Ogni shader della catena porta un marcatore al posto
// suo, e chi costruisce i pass decide a chi darlo.
const OUTPUT_ENCODE_MARKER = '/*__TRON_OUTPUT_ENCODE__*/';
const OUTPUT_ENCODE_GLSL = '#include <tonemapping_fragment>\n      #include <colorspace_fragment>';

/** Copia dello shader con l'encode finale acceso o spento. */
export function withOutputEncode(shader, enabled) {
  return {
    ...shader,
    fragmentShader: shader.fragmentShader.replaceAll(
      OUTPUT_ENCODE_MARKER,
      enabled ? OUTPUT_ENCODE_GLSL : '',
    ),
  };
}

/** True se lo shader, cosi' com'e', scrive il colore gia' codificato. */
export function shaderEncodesOutput(shader) {
  return shader.fragmentShader.includes('<colorspace_fragment>');
}

/**
 * ?pipeline=linear accende la catena corretta dal punto di vista del colore:
 * il TAA accumula prima del grade, su dati lineari e con history a 16 bit, e
 * l'encode passa all'ultimo pass. Di default resta spento, perche' il look
 * attuale e' stato tarato sulla catena esistente e correggerla cambia l'immagine.
 */
export function linearPipelineRequestedFromParams(params) {
  const raw = params?.get?.('pipeline') ?? params?.get?.('fx.pipeline');
  const value = String(raw || '').trim().toLowerCase();
  return value === 'linear' || TRUEY.has(value);
}

export const TRON_CINEMATIC_LOOK_SHADER = {
  name: 'TronCinematicLook',
  uniforms: {
    tDiffuse: { value: null },
    resolution: { value: new THREE.Vector2(1, 1) },
    time: { value: 0 },
    intensity: { value: 0.42 },
    grainStrength: { value: 0.032 },
    chromaticStrength: { value: 0.72 },
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
    uniform vec2 resolution;
    uniform float time;
    uniform float intensity;
    uniform float grainStrength;
    uniform float chromaticStrength;
    varying vec2 vUv;

    float tronFilmRandom(vec2 p) {
      return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453123);
    }

    float tronLuma(vec3 color) {
      return dot(color, vec3(0.299, 0.587, 0.114));
    }

    vec3 tronCinematicGrade(vec3 color, float amount) {
      float luma = tronLuma(color);
      vec3 contrast = (color - 0.5) * 1.08 + 0.5;
      vec3 cyanBias = color * vec3(0.94, 1.03, 1.08) + vec3(0.0, 0.004, 0.012);
      vec3 lifted = mix(contrast, cyanBias, 0.35);
      vec3 softShoulder = lifted / (lifted + vec3(0.22));
      softShoulder *= 1.18;
      vec3 graded = mix(lifted, softShoulder, smoothstep(0.48, 1.0, luma) * 0.34);
      return mix(color, graded, amount);
    }

    void main() {
      vec2 texel = 1.0 / max(resolution, vec2(1.0));
      vec2 centered = vUv * 2.0 - 1.0;
      float radiusSq = dot(centered, centered);
      float vignette = mix(0.82, 1.0, 1.0 - smoothstep(0.20, 0.98, radiusSq));
      vec2 chromaDir = normalize(centered + vec2(0.0001, -0.0001));
      vec2 chromaOffset = chromaDir * texel * chromaticStrength * smoothstep(0.10, 0.92, radiusSq);

      vec3 center = texture2D(tDiffuse, vUv).rgb;
      vec3 color = center;
      color.r = texture2D(tDiffuse, vUv + chromaOffset).r;
      color.b = texture2D(tDiffuse, vUv - chromaOffset).b;
      color = tronCinematicGrade(color, intensity);
      color *= mix(1.0, vignette, intensity * 0.45);

      float grain = tronFilmRandom(vUv * resolution + vec2(time * 59.0, time * 17.0));
      float grainMask = smoothstep(0.02, 0.92, tronLuma(color));
      color += (grain - 0.5) * grainStrength * intensity * grainMask;

      gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
      /*__TRON_OUTPUT_ENCODE__*/
    }
  `,
};

export const TRON_FSR_UPSCALE_SHADER = {
  name: 'TronFsrLikeUpscale',
  uniforms: {
    tDiffuse: { value: null },
    sourceResolution: { value: new THREE.Vector2(1, 1) },
    sharpness: { value: 0 },
    upscaleActive: { value: 0 },
    // fast-path gate: when 1 (default) and upscale+sharpen are both off, skip the 10 extra texture
    // taps and emit the tonemapped center tap (mathematically identical to the full path in that config).
    // Set to 0 to force the original full body (used only for A/B pixel verification).
    fsrFastPath: { value: 1 },
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
    uniform vec2 sourceResolution;
    uniform float sharpness;
    uniform float upscaleActive;
    uniform float fsrFastPath;
    varying vec2 vUv;

    float tronLuma(vec3 color) {
      return dot(color, vec3(0.299, 0.587, 0.114));
    }

    vec3 tronRcasLikeSharpen(vec3 center, vec3 north, vec3 south, vec3 east, vec3 west, float amount) {
      vec3 localMin = min(center, min(min(north, south), min(east, west)));
      vec3 localMax = max(center, max(max(north, south), max(east, west)));
      vec3 neighborAverage = (north + south + east + west) * 0.25;
      vec3 detail = center - neighborAverage;
      vec3 range = max(localMax - localMin, vec3(0.001));
      float lumaRange = max(max(range.r, range.g), range.b);
      float lumaCenter = tronLuma(center);
      float lumaNeighbors = tronLuma(neighborAverage);
      float edgeLimiter = smoothstep(0.01, 0.24, abs(lumaCenter - lumaNeighbors));
      float adaptiveAmount = amount * mix(0.32, 1.0, edgeLimiter) * clamp(lumaRange * 3.0, 0.15, 1.0);
      vec3 sharpened = center + detail * adaptiveAmount;
      return clamp(sharpened, localMin - range * 0.08, localMax + range * 0.08);
    }

    void main() {
      vec4 center = texture2D(tDiffuse, vUv);
      vec3 color;
      if (fsrFastPath > 0.5 && upscaleActive < 0.5 && sharpness <= 0.0) {
        // default config: edgeStrength collapses to 0 (mix -> center) and rcasAmount is 0
        // (sharpen returns center), so the full body reduces exactly to the center tap here.
        color = center.rgb;
      } else {
        vec2 texel = 1.0 / max(sourceResolution, vec2(1.0));
        vec3 north = texture2D(tDiffuse, vUv + vec2(0.0, texel.y)).rgb;
        vec3 south = texture2D(tDiffuse, vUv - vec2(0.0, texel.y)).rgb;
        vec3 east = texture2D(tDiffuse, vUv + vec2(texel.x, 0.0)).rgb;
        vec3 west = texture2D(tDiffuse, vUv - vec2(texel.x, 0.0)).rgb;
        vec3 northEast = texture2D(tDiffuse, vUv + texel).rgb;
        vec3 northWest = texture2D(tDiffuse, vUv + vec2(-texel.x, texel.y)).rgb;
        vec3 southEast = texture2D(tDiffuse, vUv + vec2(texel.x, -texel.y)).rgb;
        vec3 southWest = texture2D(tDiffuse, vUv - texel).rgb;

        float lN = tronLuma(north);
        float lS = tronLuma(south);
        float lE = tronLuma(east);
        float lW = tronLuma(west);
        float lNE = tronLuma(northEast);
        float lNW = tronLuma(northWest);
        float lSE = tronLuma(southEast);
        float lSW = tronLuma(southWest);
        vec2 edge = vec2((lNW + 2.0 * lW + lSW) - (lNE + 2.0 * lE + lSE),
                         (lSW + 2.0 * lS + lSE) - (lNW + 2.0 * lN + lNE));
        float edgeStrength = clamp(length(edge) * 1.35, 0.0, 1.0) * upscaleActive;
        vec2 edgeDir = normalize(edge + vec2(0.0001));
        vec2 tangent = vec2(-edgeDir.y, edgeDir.x);

        vec3 alongA = texture2D(tDiffuse, vUv + tangent * texel * 0.65).rgb;
        vec3 alongB = texture2D(tDiffuse, vUv - tangent * texel * 0.65).rgb;
        vec3 edgeAware = center.rgb * 0.54 + (alongA + alongB) * 0.23;
        vec3 reconstructed = mix(center.rgb, edgeAware, edgeStrength);

        float rcasAmount = clamp(sharpness, 0.0, 1.25);
        color = tronRcasLikeSharpen(reconstructed, north, south, east, west, rcasAmount);
      }
      gl_FragColor = vec4(clamp(color, 0.0, 1.0), center.a);
      /*__TRON_OUTPUT_ENCODE__*/
    }
  `,
};
