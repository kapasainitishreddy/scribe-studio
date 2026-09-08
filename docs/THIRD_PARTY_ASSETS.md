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

## 3. Supplementary 3D Characters

**Soldier, Horse, Flamingo**
- **Source:** Three.js Examples Repository
- **Original URL:** https://github.com/mrdoob/three.js/tree/master/examples/models/gltf/
- **Creator:** Various (via Three.js repo)
- **License:** MIT / CC0
- **Filenames:**
  - `public/models/characters/Soldier.glb`
  - `public/models/characters/Horse.glb`
  - `public/models/characters/Flamingo.glb`
- **Notes:** Supplementary actors injected to prove genuine multi-character layout and animation system support. They naturally integrate into the animation dropdown and replace the 1.5GB Quaternius blocking issue.
