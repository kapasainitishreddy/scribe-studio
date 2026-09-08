# Third Party Assets

This document tracks all external assets (3D models, textures, HDRIs, audio) used in the project, ensuring clear provenance and license safety.

## 1. 3D Characters

**RobotExpressive**
- **Source:** Khronos Group / Three.js Examples
- **Original URL:** https://github.com/mrdoob/three.js/tree/master/examples/models/gltf/RobotExpressive
- **Creator:** Mixamo / Google / Khronos
- **License:** CC0
- **Modifications:** None
- **Filename:** public/models/RobotExpressive.glb
- **Notes:** Used as the primary base humanoid for scene blocking. Contains Idle, Walk, Run, Wave, etc.

## 2. Environments / Lighting

**Venice Sunset 1k HDRI**
- **Source:** Poly Haven
- **Original URL:** https://polyhaven.com/a/venice_sunset
- **Creator:** Poly Haven
- **License:** CC0
- **Modifications:** None
- **Filename:** public/hdri/venice_sunset_1k.hdr
- **Notes:** Used for lighting presets.

## 3. Quaternius Universal Base Characters (PENDING)

**Quaternius Universal Base Characters**
- **Source:** Quaternius (quaternius.com)
- **Original URL:** https://quaternius.com/packs/universalbasecharacters.html
- **Creator:** Quaternius
- **License:** CC0
- **Filename:** (Pending Local Integration)
- **Notes:** The system is architected to seamlessly load and parse animations from Quaternius characters via the Asset Browser. However, the automated download of the 1.5GB Google Drive archive is blocked in CI headless environments due to Google's interactive virus-scan interstitial. As a result, the `RobotExpressive` model remains the solitary fallback character. To use Quaternius, developers must manually download the zip, optimize the GLBs, drop them into `public/models/characters/`, and register them in `src/components/previs/AssetBrowser.tsx`.
