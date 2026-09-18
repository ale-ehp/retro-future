// Risolutore di moduli per i test in node.
//
// I moduli di src/ importano three con lo specifier nudo `three` e gli addon con
// `three/addons/...`. Nel browser li risolve la importmap dichiarata in index.html;
// node non legge le importmap, quindi senza questo hook ogni test che tocca un
// modulo di scena muore con ERR_MODULE_NOT_FOUND.
//
// L'hook mappa gli stessi specifier agli stessi file vendorizzati sotto vendor/:
// e' l'equivalente node della importmap di index.html. Nessun import applicativo
// viene toccato e nessuna dipendenza va installata.
//
// Va caricato con `node --import ./test/resolve-three.mjs`, gia' cablato in
// `npm test`. Se cambia la importmap di index.html va aggiornata anche la tabella
// qui sotto: il test in test/importmap.test.mjs fallisce se le due divergono.
import { registerHooks } from 'node:module';

const REPO_ROOT = new URL('../', import.meta.url);

/** Stessi specifier della importmap di index.html, stesse destinazioni. */
export const THREE_IMPORT_MAP = {
  'three': 'vendor/three.module.min.js',
  'three/addons/postprocessing/EffectComposer.js': 'vendor/EffectComposer.js',
  'three/addons/postprocessing/RenderPass.js': 'vendor/RenderPass.js',
  'three/addons/postprocessing/UnrealBloomPass.js': 'vendor/UnrealBloomPass.js',
  'three/addons/postprocessing/FXAAPass.js': 'vendor/FXAAPass.js',
  'three/addons/postprocessing/ShaderPass.js': 'vendor/ShaderPass.js',
  'three/addons/loaders/GLTFLoader.js': 'vendor/GLTFLoader.js',
  'three/addons/utils/SkeletonUtils.js': 'vendor/SkeletonUtils.js',
};

registerHooks({
  resolve(specifier, context, nextResolve) {
    const target = THREE_IMPORT_MAP[specifier];
    if (target) return { url: new URL(target, REPO_ROOT).href, shortCircuit: true };
    return nextResolve(specifier, context);
  },
});
