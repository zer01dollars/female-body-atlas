# Femora Atlas

Interactive 3D explorer of **stylized female anatomy**. Orbit the figure, toggle organ systems, isolate a structure, and pull the body into an exploded inventory.

Femora Atlas is an educational web app — a conceptual counterpart to male-reference anatomy viewers such as [Human Atlas](https://github.com/ashemag/human-atlas), built independently with procedural meshes rather than BodyParts3D data.

**Not for medical or diagnostic use.**

## Features

- Orbit, zoom, and pan with damped `OrbitControls`
- Click / tap to select (drag to orbit does not select)
- Highlight + floating name on the selected structure
- System checkboxes: skeletal, muscular, circulatory, respiratory, digestive, urinary, reproductive, nervous
- Presets: **All**, **Skeleton**, **Organs**, **Reproductive**
- Search by structure name, id, or system
- Isolate mode fades everything except the selection
- Explode toggle offsets parts outward from the body center
- Detail panel on desktop; bottom sheet on small screens
- Optional translucent female silhouette for proportion context
- Educational disclaimer in the footer

## Stack

Vite + React 19 + TypeScript + Three.js + React Three Fiber + Drei + Tailwind CSS.

## Run locally

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

```bash
npm run build    # production bundle in dist/
npm run preview  # serve the built dist
```

## Deploy

The app is a static site. `vercel.json` rewrites all routes to `index.html`. Point any static host at `dist/` after `npm run build`.

## Models

All geometry is **procedural and stylized** — capsules, ellipsoids, and simple solids arranged in adult female proportions (narrower shoulders, wider pelvis, mammary tissue, internal reproductive organs). It is not a scan, not BodyParts3D, and not a complete anatomical atlas.

See [ATTRIBUTION.md](./ATTRIBUTION.md).

## License

[MIT](./LICENSE) for application code.
