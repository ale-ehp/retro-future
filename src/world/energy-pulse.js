// ---------- Tron energy pulses: bright bands travelling along the boulevard edge lines ----------
// Injects a Z-axis travelling pulse into MeshBasic edge materials via onBeforeCompile, then advances
// the shared time uniform each frame so the bloom pass turns the moving band into flowing "current".
// Fully self-contained: no scene/camera/THREE deps. Owns its tuning state + the registered material
// list. main.js calls applyEdgePulseShader(material) at build time and updateEdgePulse(seconds) per tick.

const edgePulseState = {
  speed: -30,
  period: 42,
  intensity: 2.0,
};
const edgePulseMaterials = [];

export function applyEdgePulseShader(material) {
  // Inject a Z-axis travelling pulse into a MeshBasic edge material (same onBeforeCompile
  // pattern as the facade vertical reveal). The pulse brightens the cyan as it passes so the
  // bloom pass turns it into flowing energy. Tunable via edgePulseState.
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uEdgePulseTime = { value: 0 };
    shader.uniforms.uEdgePulseSpeed = { value: edgePulseState.speed };
    shader.uniforms.uEdgePulsePeriod = { value: edgePulseState.period };
    shader.uniforms.uEdgePulseIntensity = { value: edgePulseState.intensity };
    material.userData.edgePulseTimeUniform = shader.uniforms.uEdgePulseTime;
    // vEdgeAlong = signed distance along the strip's own length (world units, from its centre).
    // The instance's local Z axis is the strip direction, scaled by the strip length.
    shader.vertexShader = `varying float vEdgeAlong;\n${shader.vertexShader}`.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
#ifdef USE_INSTANCING
vEdgeAlong = position.z * length(instanceMatrix[2].xyz);
#else
vEdgeAlong = position.z;
#endif`
    );
    shader.fragmentShader = `uniform float uEdgePulseTime;
uniform float uEdgePulseSpeed;
uniform float uEdgePulsePeriod;
uniform float uEdgePulseIntensity;
varying float vEdgeAlong;
${shader.fragmentShader}`.replace(
      '#include <color_fragment>',
      `#include <color_fragment>
{
  // Energy scrolls ALONG each strip's length (current flowing through the wire).
  float edgeFlow = fract((vEdgeAlong - uEdgePulseTime * uEdgePulseSpeed) / max(uEdgePulsePeriod, 0.001));
  // sawtooth ramp -> a bright head with a trailing fade travelling along the strip.
  float edgeHead = smoothstep(0.0, 0.12, edgeFlow) * (1.0 - smoothstep(0.12, 1.0, edgeFlow));
  diffuseColor.rgb += diffuseColor.rgb * edgeHead * uEdgePulseIntensity;
}`
    );
  };
  material.customProgramCacheKey = () => 'tron-edge-energy-flow-v4';
  material.needsUpdate = true;
  edgePulseMaterials.push(material);
}

export function updateEdgePulse(timeSeconds) {
  for (const material of edgePulseMaterials) {
    if (material.userData.edgePulseTimeUniform) material.userData.edgePulseTimeUniform.value = timeSeconds;
  }
}
