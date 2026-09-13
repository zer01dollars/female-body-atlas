# Attribution

## This project

Femora Atlas application code is original and released under the MIT License.

## 3D geometry — HuBMAP Female Reference

Interactive meshes are derived from the **HuBMAP 3D Reference Organ Set for Female v1.5** (united female GLB), optimized for the web (mesh simplification + Meshopt compression).

- Asset: `3d-vh-f-united.glb` → shipped as `public/models/female-atlas.glb`
- Source CDN: https://cdn.humanatlas.io/digital-objects/ref-organ/united-female/v1.5/assets/3d-vh-f-united.glb
- DOI: https://doi.org/10.48539/HBM352.BTSQ.586
- License: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
- Credit: HuBMAP Consortium / Human Reference Atlas

When redistributing the geometry, retain CC BY 4.0 attribution to HuBMAP.

## Naming enrichment — BodyParts3D / FMA

Structure display names and search aliases are enriched, where English labels match, using the BodyParts3D / Anatomography FMA parts list (`isa_parts_list_e.txt`) from [DBCLS](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/desc.html) (CC BY 4.0).

**Important:** Official BodyParts3D 4.0 polygon data describes an adult **male**. This app does **not** redistribute BodyParts3D meshes. Female geometry comes from HuBMAP.

## Conceptual inspiration

Browser anatomy explorers such as [Human Atlas](https://github.com/ashemag/human-atlas) (male BodyParts3D viewer) inspired the interaction pattern (systems, search, isolate, explode). Femora Atlas does **not** copy that source code.

## Fonts

- [Cormorant Garamond](https://fonts.google.com/specimen/Cormorant+Garamond) and [Outfit](https://fonts.google.com/specimen/Outfit) via Google Fonts.

## Disclaimer

Nothing in Femora Atlas is medical advice. Descriptions are short educational summaries for spatial learning only. Not for clinical or diagnostic use.
