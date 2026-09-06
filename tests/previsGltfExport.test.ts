import { describe, it, expect } from "vitest";
import * as THREE from "three";
import {
  buildThreeSceneFromBlocking,
  exportScenePrevisGLB,
  exportScenePrevisGLTF
} from "../packages/production-engine/src/previsExporter";
import type { Scene3DObject } from "../packages/project-model/src/types";

describe("Three.js GLTFExporter Previs & 3D Blocking Export", () => {
  const sampleBlockingObjects: Scene3DObject[] = [
    {
      id: "obj-maya-1",
      sceneNumber: 18,
      label: "Maya Lin (Blocking Token)",
      kind: "actor",
      position: { x: 0, y: 0.9, z: 0 },
      color: "#d49b54",
      notes: "Marks start at doorway"
    },
    {
      id: "obj-marcus-1",
      sceneNumber: 18,
      label: "Marcus Sterling (Blocking Token)",
      kind: "actor",
      position: { x: 2.5, y: 0.9, z: -1.2 },
      color: "#3b82f6",
      notes: "Facing console"
    },
    {
      id: "obj-cam-1",
      sceneNumber: 18,
      label: "Camera A (24mm Anamorphic)",
      kind: "camera",
      position: { x: -3.0, y: 1.5, z: 4.0 },
      color: "#0ea5e9",
      notes: "Slow tracking dolly"
    },
    {
      id: "obj-prop-console",
      sceneNumber: 18,
      label: "Halon Fire Console",
      kind: "prop",
      position: { x: 2.8, y: 0.6, z: -1.0 },
      color: "#64748b",
      notes: "Override terminal"
    }
  ];

  it("builds a populated Three.js Scene containing blocking tokens, cameras, lights, and production metadata", () => {
    const scene = buildThreeSceneFromBlocking(18, sampleBlockingObjects, {
      projectId: "proj-101",
      projectTitle: "The Zero Protocol",
      revisionId: "rev-blue",
      scribeVersion: "1.0.0"
    });

    expect(scene).toBeInstanceOf(THREE.Scene);
    expect(scene.name).toBe("Scene_18_Previs");
    expect(scene.userData.projectId).toBe("proj-101");
    expect(scene.userData.sceneNumber).toBe(18);

    // Verify cameras and lights exist
    const cameras = scene.children.filter((c) => c instanceof THREE.Camera);
    expect(cameras.length).toBeGreaterThan(0);
    expect(cameras[0].name).toBe("Director_Camera_A");
    expect(cameras[0].userData.lens).toBe("35mm Anamorphic");

    const lights = scene.children.filter((c) => c instanceof THREE.Light);
    expect(lights.length).toBe(2); // Key light + Ambient light

    // Verify blocking meshes
    const meshes = scene.children.filter((c) => c instanceof THREE.Mesh);
    expect(meshes.length).toBeGreaterThanOrEqual(4); // Stage floor + actor/prop tokens
  });

  it("exports 3D blocking scene to binary .glb format producing a valid ArrayBuffer", async () => {
    const scene = buildThreeSceneFromBlocking(18, sampleBlockingObjects, {
      projectId: "proj-101",
      revisionId: "rev-blue"
    });

    const glbBuffer = await exportScenePrevisGLB(scene, {
      binary: true,
      includeCameras: true,
      includeLights: true
    });

    expect(glbBuffer).toBeInstanceOf(ArrayBuffer);
    expect(glbBuffer.byteLength).toBeGreaterThan(500);

    // Verify glTF 2.0 binary header magic: 0x46546C67 ("glTF")
    const view = new DataView(glbBuffer);
    const magic = view.getUint32(0, true);
    expect(magic).toBe(0x46546c67); // "glTF" in little-endian
    const version = view.getUint32(4, true);
    expect(version).toBe(2);
  });

  it("exports 3D blocking scene to human-readable .gltf JSON format", async () => {
    const scene = buildThreeSceneFromBlocking(18, sampleBlockingObjects);
    const gltfJson = await exportScenePrevisGLTF(scene);

    expect(typeof gltfJson).toBe("string");
    const parsed = JSON.parse(gltfJson);

    expect(parsed).toHaveProperty("asset");
    expect(parsed.asset.version).toBe("2.0");
    expect(parsed).toHaveProperty("nodes");
    expect(parsed.nodes.length).toBeGreaterThanOrEqual(4);
  });

  it("gracefully fails when attempting to export an empty 3D scene", async () => {
    const emptyScene = new THREE.Scene();
    await expect(exportScenePrevisGLB(emptyScene)).rejects.toThrow(
      "Cannot export an empty 3D scene: zero objects found."
    );
  });

  it("verifies sample project contains rich 3D blocking objects for Scenes 1, 2, 3, and 4", async () => {
    const { createSampleProject } = await import("../packages/project-model/src/sampleProject");
    const project = createSampleProject();

    expect(project.scene3DObjects).toBeDefined();
    expect(project.scene3DObjects.length).toBeGreaterThanOrEqual(20);

    // Verify every scene (1, 2, 3, 4) has blocking objects
    for (const sceneNum of [1, 2, 3, 4]) {
      const sceneObjects = project.scene3DObjects.filter((o) => o.sceneNumber === sceneNum);
      expect(sceneObjects.length).toBeGreaterThanOrEqual(5);

      // Verify each scene has at least an actor, camera, and light or prop
      const hasActor = sceneObjects.some((o) => o.kind === "actor");
      const hasCamera = sceneObjects.some((o) => o.kind === "camera");
      expect(hasActor).toBe(true);
      expect(hasCamera).toBe(true);

      // Verify Three.js scene builds successfully for this scene
      const threeScene = buildThreeSceneFromBlocking(sceneNum, sceneObjects, {
        projectId: project.id,
        projectTitle: project.title,
        sceneNumber: sceneNum
      });
      expect(threeScene).toBeInstanceOf(THREE.Scene);
      expect(threeScene.children.length).toBeGreaterThan(5);

      // Verify GLB export generates a valid binary buffer
      const glb = await exportScenePrevisGLB(threeScene);
      expect(glb.byteLength).toBeGreaterThan(500);
    }
  });
});
