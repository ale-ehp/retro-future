// I materiali del rivelo: colori, opacita' di base e il registro che li tiene.
//
// Perche' stanno in un file loro (2026-09-21): city-reveal-wireframe.js era 1.235 righe e
// teneva insieme tre mestieri. Qui c'e' solo il primo: quali materiali esistono, con quale
// opacita' nascono, come si ritrovano tutti insieme quando l'alpha del fronte cambia.
// Nessuna geometria, nessun frame, nessuno stato che si muove.
//
// Il registro `cityRevealWireMaterials` esiste perche' l'alpha del fronte si applica a
// TUTTI i materiali del filo insieme: senza un elenco unico bisognerebbe ricordarsene uno
// per uno, ed e' il genere di elenco che si dimentica di aggiornare.
//
// `userData.defaultBaseOpacity` tiene il valore di nascita: i cursori del pannello possono
// cambiare `baseOpacity`, e questo permette di tornare indietro.
//
// I materiali delle bande di dissolvenza si creano alla prima richiesta e restano in
// cache: sono otto per la strada e dieci per la griglia, e nascerebbero dentro il rivelo,
// cioe' nella finestra con meno margine di tutta la demo.
import * as THREE from 'three';
import { GRID_BLOCK } from './boulevard-constants.js';

export const cityRevealWireMaterials = [];
export const cityRevealWireColor = 0x62f7ff;
const cityRevealWireCoreColor = 0xe8feff;
export const CITY_REVEAL_ROAD_FADE_BANDS = 8;
export const CITY_REVEAL_ROAD_FADE_MAX_OPACITY = 0.42;
export const CITY_REVEAL_ROAD_GRID_BASE_OPACITY = 0.58;
export const CITY_REVEAL_ROAD_GRID_FADE_BANDS = 10;
// Quanto vicino a un bordo della strada un segmento conta come perimetro: sotto questa
// soglia lo shader non lo disegna, altrimenti la griglia raddoppia le righe sul bordo.
export const CITY_REVEAL_ROAD_PERIMETER_EPS = 0.05;
export const cityRevealRoadFadeMaterials = [];
const cityRevealRoadGridFadeMaterials = new Map();
export const cityRevealSolidMat = new THREE.MeshBasicMaterial({
  color: 0x000000,
  transparent: true,
  opacity: 1,
  depthWrite: true,
  depthTest: true,
  toneMapped: false,
  polygonOffset: true,
  polygonOffsetFactor: 1,
  polygonOffsetUnits: 1,
});

function registerCityRevealWireMaterial(material, baseOpacity) {
  material.transparent = true;
  material.opacity = baseOpacity;
  material.depthWrite = false;
  material.depthTest = true;
  material.toneMapped = false;
  material.userData.baseOpacity = baseOpacity;
  material.userData.defaultBaseOpacity = baseOpacity;
  cityRevealWireMaterials.push(material);
  return material;
}

export const cityRevealWireMat = registerCityRevealWireMaterial(new THREE.LineBasicMaterial({
  color: cityRevealWireColor,
  blending: THREE.AdditiveBlending,
}), 0.62);
export const cityRevealWireDimMat = registerCityRevealWireMaterial(new THREE.LineBasicMaterial({
  color: cityRevealWireColor,
  blending: THREE.NormalBlending,
}), 0.30);
export const cityRevealWireCoreMat = registerCityRevealWireMaterial(new THREE.LineBasicMaterial({
  color: cityRevealWireCoreColor,
  blending: THREE.AdditiveBlending,
}), 0.42);
export const cityRevealRoadGridMat = registerCityRevealWireMaterial(new THREE.LineBasicMaterial({
  color: cityRevealWireColor,
  blending: THREE.AdditiveBlending,
}), CITY_REVEAL_ROAD_GRID_BASE_OPACITY);
cityRevealRoadGridMat.userData.cityRevealRoadGridMaterial = true;
cityRevealRoadGridMat.depthTest = true;
export const cityRevealRoadGridShaderMat = registerCityRevealWireMaterial(new THREE.ShaderMaterial({
  uniforms: {
    uColor: { value: new THREE.Color(cityRevealWireColor) },
    uOpacity: { value: CITY_REVEAL_ROAD_GRID_BASE_OPACITY },
    uXSpacing: { value: GRID_BLOCK },
    uZSpacing: { value: GRID_BLOCK },
    uRoadHalfW: { value: 1 },
    uRoadMinZ: { value: -1 },
    uRoadMaxZ: { value: 1 },
    uFadeWidth: { value: 1 },
    uPerimeterEps: { value: CITY_REVEAL_ROAD_PERIMETER_EPS },
  },
  vertexShader: `
    varying vec3 vWorldPosition;

    void main() {
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `,
  fragmentShader: `
    uniform vec3 uColor;
    uniform float uOpacity;
    uniform float uXSpacing;
    uniform float uZSpacing;
    uniform float uRoadHalfW;
    uniform float uRoadMinZ;
    uniform float uRoadMaxZ;
    uniform float uFadeWidth;
    uniform float uPerimeterEps;
    varying vec3 vWorldPosition;

    float gridLine(vec2 coord) {
      vec2 derivative = max(fwidth(coord), vec2(0.0001));
      vec2 grid = abs(fract(coord - 0.5) - 0.5) / derivative;
      return 1.0 - min(min(grid.x, grid.y), 1.0);
    }

    void main() {
      vec2 gridCoord = vec2(vWorldPosition.x / uXSpacing, vWorldPosition.z / uZSpacing);
      float line = gridLine(gridCoord);
      float xOverflow = max(0.0, abs(vWorldPosition.x) - uRoadHalfW) / max(uFadeWidth, 0.001);
      float zOverflow = max(0.0, max(uRoadMinZ - vWorldPosition.z, vWorldPosition.z - uRoadMaxZ)) / max(uFadeWidth, 0.001);
      float fade = clamp(1.0 - max(xOverflow, zOverflow), 0.0, 1.0);
      float roadEdgeX = abs(abs(vWorldPosition.x) - uRoadHalfW);
      float roadEdgeZ = min(abs(vWorldPosition.z - uRoadMinZ), abs(vWorldPosition.z - uRoadMaxZ));
      float perimeterMask = smoothstep(uPerimeterEps, uPerimeterEps * 3.0, min(roadEdgeX, roadEdgeZ));
      float alpha = line * fade * perimeterMask * uOpacity;
      if (alpha <= 0.002) discard;
      gl_FragColor = vec4(uColor, alpha);
    }
  `,
  transparent: true,
  depthWrite: false,
  depthTest: true,
  blending: THREE.AdditiveBlending,
  toneMapped: false,
  // Niente `extensions: { derivatives }`: three r184 (WebGL 2) non lo legge piu' (2026-09-20).
}), CITY_REVEAL_ROAD_GRID_BASE_OPACITY);
cityRevealRoadGridShaderMat.userData.cityRevealRoadGridMaterial = true;
cityRevealRoadGridShaderMat.userData.cityRevealRoadGridShaderMaterial = true;
cityRevealRoadGridShaderMat.depthTest = true;

export function cityRevealRoadGridMaterialForBand(band) {
  const safeBand = THREE.MathUtils.clamp(Math.round(band), 1, CITY_REVEAL_ROAD_GRID_FADE_BANDS);
  if (safeBand >= CITY_REVEAL_ROAD_GRID_FADE_BANDS) return cityRevealRoadGridMat;
  if (!cityRevealRoadGridFadeMaterials.has(safeBand)) {
    const opacityScale = safeBand / CITY_REVEAL_ROAD_GRID_FADE_BANDS;
    const material = registerCityRevealWireMaterial(new THREE.LineBasicMaterial({
      color: cityRevealWireColor,
      blending: THREE.AdditiveBlending,
    }), CITY_REVEAL_ROAD_GRID_BASE_OPACITY * opacityScale);
    material.userData.cityRevealRoadGridMaterial = true;
    material.depthTest = true;
    cityRevealRoadGridFadeMaterials.set(safeBand, material);
  }
  return cityRevealRoadGridFadeMaterials.get(safeBand);
}
export function cityRevealRoadFadeMaterial(index) {
  if (!cityRevealRoadFadeMaterials[index]) {
    const t = 1 - index / Math.max(1, CITY_REVEAL_ROAD_FADE_BANDS);
    const material = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: CITY_REVEAL_ROAD_FADE_MAX_OPACITY * t * t,
      depthWrite: true,
      depthTest: true,
      toneMapped: false,
    });
    cityRevealRoadFadeMaterials[index] = material;
  }
  return cityRevealRoadFadeMaterials[index];
}
