import * as THREE from 'three';

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
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `,
};
