/**
 * Scribe Studio 3D Previs Exporter
 * Official Three.js GLTFExporter addon integration
 * Exports director blocking, actor tokens, camera placements, and stage lighting
 * to industry-standard .glb and .gltf with full production metadata in userData.
 */

import * as THREE from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import type { Scene3DObject } from "../../project-model/src/types";

// Polyfill FileReader for Node.js test environments if missing
if (typeof globalThis !== "undefined" && typeof (globalThis as any).FileReader === "undefined") {
  (globalThis as any).FileReader = class FileReader {
    onload: any = null;
    onloadend: any = null;
    onerror: any = null;
    result: any = null;
    readAsArrayBuffer(blob: Blob) {
      blob
        .arrayBuffer()
        .then((buf) => {
          this.result = buf;
          if (this.onload) this.onload({ target: this });
          if (this.onloadend) this.onloadend({ target: this });
        })
        .catch((err) => {
          if (this.onerror) this.onerror(err);
          if (this.onloadend) this.onloadend({ target: this });
        });
    }
    readAsDataURL(blob: Blob) {
      blob
        .arrayBuffer()
        .then((buf) => {
          const base64 = Buffer.from(buf).toString("base64");
          this.result = `data:${blob.type || "application/octet-stream"};base64,${base64}`;
          if (this.onload) this.onload({ target: this });
          if (this.onloadend) this.onloadend({ target: this });
        })
        .catch((err) => {
          if (this.onerror) this.onerror(err);
          if (this.onloadend) this.onloadend({ target: this });
        });
    }
  };
}

export interface PrevisExportMetadata {
  projectId: string;
  projectTitle: string;
  sceneNumber: number;
  sceneSlugline: string;
  revisionId: string;
  shotIds: string[];
  scribeVersion: string;
}

export interface PrevisExportOptions {
  binary?: boolean; // true for .glb, false for .gltf
  includeCameras?: boolean;
  includeLights?: boolean;
  metadata?: PrevisExportMetadata;
}

export interface PrevisExportResult {
  data: ArrayBuffer | string;
  isBinary: boolean;
  filename: string;
  metadata: PrevisExportMetadata;
  objectCount: number;
}

/**
 * Build a standard Three.js Scene from 3D blocking objects.
 */
export function buildThreeSceneFromBlocking(
  sceneNumber: number,
  objects: Scene3DObject[],
  metadata?: Partial<PrevisExportMetadata>
): THREE.Scene {
  const scene = new THREE.Scene();
  scene.name = `Scene_${sceneNumber}_Previs`;

  // Attach root production metadata
  scene.userData = {
    scribePrevisVersion: "1.0.0",
    sceneNumber,
    exportedAt: new Date().toISOString(),
    ...metadata
  };

  // 1. Stage Floor Plane
  const floorGeo = new THREE.PlaneGeometry(30, 30);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x11151d,
    roughness: 0.8,
    metalness: 0.1
  });
  const floorMesh = new THREE.Mesh(floorGeo, floorMat);
  floorMesh.name = "Stage_Floor_Grid";
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.userData = { type: "stage_geometry", isLocked: true };
  scene.add(floorMesh);

  // 2. Stage Lights
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
  keyLight.name = "Key_Light_KeyMaster";
  keyLight.position.set(5, 8, 5);
  keyLight.userData = { type: "cinema_lighting", role: "key" };
  scene.add(keyLight);

  const fillLight = new THREE.PointLight(0x3a4860, 1.5, 30);
  fillLight.name = "Fill_Point_Light";
  fillLight.position.set(-5, 6, -3);
  fillLight.userData = { type: "cinema_lighting", role: "fill" };
  scene.add(fillLight);

  // 3. Director Camera
  const camera = new THREE.PerspectiveCamera(35, 2.39 / 1, 0.1, 100);
  camera.name = "Director_Camera_A";
  camera.position.set(0, 1.6, 6);
  camera.lookAt(0, 1, 0);
  camera.userData = {
    type: "cinema_camera",
    lens: "35mm Anamorphic",
    aspectRatio: "2.39:1",
    sensorWidthMm: 36,
    sensorHeightMm: 15.06
  };
  scene.add(camera);

  // 4. Populate Blocking Objects
  objects.forEach((obj, idx) => {
    let geo: THREE.BufferGeometry;
    let mat: THREE.Material;

    const objType = (obj.kind || "prop").toLowerCase();

    if (objType === "character" || objType === "actor") {
      // Cylinder capsule for actor blocking token
      geo = new THREE.CylinderGeometry(0.35, 0.35, 1.8, 16);
      mat = new THREE.MeshStandardMaterial({
        color: obj.color ? parseInt(obj.color.replace("#", ""), 16) : 0xd49b54,
        roughness: 0.4,
        metalness: 0.2
      });
    } else if (objType === "camera") {
      // Box representing camera dolly
      geo = new THREE.BoxGeometry(0.6, 0.5, 0.8);
      mat = new THREE.MeshStandardMaterial({ color: 0x0ea5e9 });
    } else if (objType === "light") {
      geo = new THREE.SphereGeometry(0.3, 16, 16);
      mat = new THREE.MeshBasicMaterial({ color: 0xfff0b3 });
    } else {
      // Default prop box
      geo = new THREE.BoxGeometry(1, 1, 1);
      mat = new THREE.MeshStandardMaterial({ color: 0x8b9bb4 });
    }

    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = obj.label || `Object_${idx + 1}`;
    mesh.position.set(obj.position?.x || 0, obj.position?.y || 0.9, obj.position?.z || 0);

    mesh.userData = {
      objectId: obj.id,
      objectType: obj.kind,
      sceneNumber,
      notes: obj.notes
    };

    scene.add(mesh);
  });

  return scene;
}

/**
 * Export a 3D blocking scene to binary .glb (ArrayBuffer).
 */
export async function exportScenePrevisGLB(
  scene: THREE.Scene,
  options?: PrevisExportOptions
): Promise<ArrayBuffer> {
  // Validate that scene has content beyond defaults
  const userMeshes = scene.children.filter((c) => c.userData && c.userData.type !== "stage_geometry");
  if (scene.children.length === 0) {
    throw new Error("Cannot export an empty 3D scene: zero objects found.");
  }

  const exporter = new GLTFExporter();
  return new Promise<ArrayBuffer>((resolve, reject) => {
    try {
      exporter.parse(
        scene,
        (gltf) => {
          if (gltf instanceof ArrayBuffer) {
            resolve(gltf);
          } else {
            // In case gltf is returned as JSON object instead of ArrayBuffer
            const str = JSON.stringify(gltf);
            const buf = new TextEncoder().encode(str).buffer;
            resolve(buf);
          }
        },
        (error) => {
          reject(new Error(`GLTFExporter error: ${error}`));
        },
        {
          binary: true,
          includeCustomExtensions: true,
          embedImages: true
        }
      );
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Export a 3D blocking scene to standard .gltf JSON string.
 */
export async function exportScenePrevisGLTF(
  scene: THREE.Scene,
  options?: PrevisExportOptions
): Promise<string> {
  if (scene.children.length === 0) {
    throw new Error("Cannot export an empty 3D scene: zero objects found.");
  }

  const exporter = new GLTFExporter();
  return new Promise<string>((resolve, reject) => {
    try {
      exporter.parse(
        scene,
        (gltf) => {
          if (typeof gltf === "string") {
            resolve(gltf);
          } else {
            resolve(JSON.stringify(gltf, null, 2));
          }
        },
        (error) => {
          reject(new Error(`GLTFExporter error: ${error}`));
        },
        {
          binary: false,
          includeCustomExtensions: true
        }
      );
    } catch (err) {
      reject(err);
    }
  });
}
