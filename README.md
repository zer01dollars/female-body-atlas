# Femora Atlas

Interactive 3D explorer of **female anatomy** built on the HuBMAP *3D Reference Organ Set for Female v1.5*. Orbit a full-bleed viewport, toggle organ systems, isolate a structure, explode the inventory, search 800+ named meshes, and adjust best-effort **body attribute** morph sliders.

**Not for medical or diagnostic use.**

## Live demo

[https://zer01dollars.github.io/female-body-atlas/](https://zer01dollars.github.io/female-body-atlas/)

## Features

- Full-window WebGL canvas — floating overlay chrome (top bar, collapsible left drawer, detail sheet) does not shrink the viewport
- Camera auto-fits the whole female reference on load
- Orbit / zoom / pan with damped controls; click to select (drag does not select)
- 888 HuBMAP meshes mapped to systems: skeletal, muscular, circulatory, respiratory, digestive, urinary, reproductive, nervous, lymphatic, integumentary
- Presets: **All**, **Skeleton**, **Organs**, **Reproductive**
- Search by structure name, mesh id, system, or FMA id (where enriched)
- Isolate + explode (radial offset from body centroid)
- Body attributes (best-effort on matching nodes): musculature, chest/mammary scale, height; hair / butt / arm sliders appear only if meshes exist
- Studio lighting + physical materials
- Dark educational UI

## Stack

Vite + React 19 + TypeScript + Three.js + React Three Fiber + Drei + Tailwind CSS.

## Run locally

```bash
npm install
npm run dev
```

```bash
npm run build    # production bundle in dist/
npm run preview  # serve the built dist
```

GitHub Pages base path is `/female-body-atlas/` (`vite.config.ts`).

## Models

- **Shipped:** `public/models/female-atlas.glb` — optimized (simplify + Meshopt), ~32 MB, browser-friendly
- **Source (not in git):** HuBMAP united female GLB (~202 MB). See [ATTRIBUTION.md](./ATTRIBUTION.md).
- Official BodyParts3D 4.0 geometry is adult **male** only; this project uses HuBMAP female reference meshes instead, with BodyParts3D FMA naming for search enrichment where labels match.

### Re-optimize from the raw GLB

```bash
npx gltf-transform optimize \
  .raw-models/3d-vh-f-united.glb \
  public/models/female-atlas.glb \
  --compress meshopt --meshopt-level high \
  --flatten false --join false --instance false \
  --simplify true --simplify-ratio 0.15 --simplify-error 0.001 \
  --texture-compress false --palette false
```

## License

[MIT](./LICENSE) for application code. Geometry remains [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) HuBMAP — see [ATTRIBUTION.md](./ATTRIBUTION.md).
