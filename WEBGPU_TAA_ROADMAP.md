# WebGPU / TAA Roadmap

## Current Live Baseline

- WebGL2 renderer with cinematic look and Temporal AA enabled by default.
- Desktop profile: TAA quality.
- Mobile profile: TAA lite, lower history weight for less ghosting during touch motion.
- Rollback: `?taa=0`.
- A/B profiles: `?taa.profile=quality` and `?taa.profile=lite`.

## Next Rendering Step

1. Add optional per-object or per-layer velocity data for the runner, crowd, camera, and high-contrast facade elements.
2. Feed velocity into TAA rejection so moving silhouettes use less history than static architecture.
3. Keep the current WebGL2 TAA as the fallback path.

## WebGPU Candidate Path

1. Move TAA resolve into a compute-style pipeline with explicit history, velocity, and luminance neighborhood buffers.
2. Evaluate WebGPU MSAA/TAA composition to reduce post chain bandwidth on high-DPR mobile.
3. Keep WebGL2 production default until WebGPU is stable across Safari iOS, Chrome Android, and desktop Chromium.

## Promotion Gates

- No visible ghost trail on runner, crowd, facade numbers, vertical neon, and wet-floor reflections.
- Mobile Safari must hold the approved FPS band versus `?taa=0`.
- Benchmark JSON must record profile, AA mode, render resolution, and WebGPU/WebGL path.
- A rollback URL must remain available for every visual AA change.
