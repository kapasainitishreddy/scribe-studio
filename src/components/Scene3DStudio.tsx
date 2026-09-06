import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import {
  Box,
  Camera,
  User,
  Lightbulb,
  Layers,
  Trash2,
  Eye,
  Compass,
  CheckCircle,
  Clapperboard,
  Sliders,
  Move,
  Download,
  Sparkles,
  RefreshCw,
  Video,
  Car
} from "lucide-react";
import type { Project, Scene3DObject } from "../../packages/project-model/src/types";
import { parseScreenplay } from "../../packages/screenplay-core/src/fountain";
import { exportScenePrevisGLB, buildThreeSceneFromBlocking } from "../../packages/production-engine/src/previsExporter";
import { cinemaAudio } from "../utils/cinemaAudio";

interface Scene3DStudioProps {
  project: Project;
  selectedSceneNumber: number;
  onSelectScene: (sceneNum: number) => void;
  onAddObject: (obj: Scene3DObject) => void;
  onUpdateObject: (id: string, updates: Partial<Scene3DObject>) => void;
  onDeleteObject: (id: string) => void;
}

type ViewAngle = "orbit" | "director" | "top-down";

export const Scene3DStudio: React.FC<Scene3DStudioProps> = ({
  project,
  selectedSceneNumber,
  onSelectScene,
  onAddObject,
  onUpdateObject,
  onDeleteObject
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [viewAngle, setViewAngle] = useState<ViewAngle>("orbit");
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [copiedStatus, setCopiedStatus] = useState(false);
  const [isExportingGLB, setIsExportingGLB] = useState(false);

  // Filter 3D objects for the selected scene
  const sceneObjects = (project.scene3DObjects || []).filter(
    (o) => o.sceneNumber === selectedSceneNumber
  );

  // Sync selected object ID when scene changes
  useEffect(() => {
    const exists = sceneObjects.some((o) => o.id === selectedObjectId);
    if (!exists) {
      setSelectedObjectId(sceneObjects[0]?.id || null);
    }
  }, [selectedSceneNumber, sceneObjects, selectedObjectId]);

  const selectedObject = sceneObjects.find((o) => o.id === selectedObjectId) || sceneObjects[0] || null;

  const parsed = parseScreenplay(project.screenplayText);
  const currentScene = parsed.scenes.find((s) => s.number === selectedSceneNumber) || parsed.scenes[0];

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshesMapRef = useRef<Map<string, THREE.Group>>(new Map());

  // Initialize Three.js Stage with ResizeObserver
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0c10);
    sceneRef.current = scene;

    // Fog for depth & cinematic atmosphere
    scene.fog = new THREE.FogExp2(0x0a0c10, 0.032);

    // Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    cameraRef.current = camera;
    camera.position.set(0, 6, 9);
    camera.lookAt(0, 1, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // Studio Grid Floor
    const grid = new THREE.GridHelper(24, 24, 0xd49b54, 0x1e2638);
    grid.position.y = 0;
    scene.add(grid);

    // Studio Stage Floor Disc
    const floorGeo = new THREE.CircleGeometry(12, 64);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0e1117,
      roughness: 0.85,
      metalness: 0.15
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff5e6, 1.3);
    dirLight.position.set(6, 11, 7);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const accentLight = new THREE.PointLight(0x38bdf8, 2.2, 18);
    accentLight.position.set(-5, 4, -3);
    scene.add(accentLight);

    // Mouse Drag Rotation
    let isDragging = false;
    let prevMousePos = { x: 0, y: 0 };
    let spherical = { radius: 11, phi: Math.PI / 3, theta: Math.PI / 4 };

    const updateCameraFromSpherical = () => {
      if (viewAngle !== "orbit") return;
      camera.position.x = spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
      camera.position.y = spherical.radius * Math.cos(spherical.phi);
      camera.position.z = spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);
      camera.lookAt(0, 1, 0);
    };
    updateCameraFromSpherical();

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging || viewAngle !== "orbit") return;
      const deltaX = e.clientX - prevMousePos.x;
      const deltaY = e.clientY - prevMousePos.y;
      prevMousePos = { x: e.clientX, y: e.clientY };

      spherical.theta -= deltaX * 0.008;
      spherical.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, spherical.phi - deltaY * 0.008));
      updateCameraFromSpherical();
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      if (viewAngle !== "orbit") return;
      e.preventDefault();
      spherical.radius = Math.max(4, Math.min(22, spherical.radius + e.deltaY * 0.01));
      updateCameraFromSpherical();
    };

    const dom = renderer.domElement;
    dom.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    dom.addEventListener("wheel", onWheel, { passive: false });

    // Handle Resize with ResizeObserver & window fallback
    const updateSize = (w: number, h: number) => {
      if (w <= 0 || h <= 0 || !camera || !renderer) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        updateSize(w, h);
      }
    });
    resizeObserver.observe(container);

    const handleResize = () => {
      if (!container) return;
      updateSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    // Initial kick to ensure layout pass sets dimensions
    requestAnimationFrame(() => {
      if (container) updateSize(container.clientWidth, container.clientHeight);
    });

    // Render loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      dom.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
      renderer.dispose();
    };
  }, []);

  // Update Camera View Angle Mode
  useEffect(() => {
    const camera = cameraRef.current;
    if (!camera) return;

    if (viewAngle === "top-down") {
      camera.position.set(0, 16, 0.001);
      camera.lookAt(0, 0, 0);
    } else if (viewAngle === "director") {
      const directorCam = sceneObjects.find((o) => o.kind === "camera");
      if (directorCam) {
        camera.position.set(directorCam.position.x, directorCam.position.y + 0.3, directorCam.position.z);
        const targetActor = sceneObjects.find((o) => o.kind === "actor");
        if (targetActor) {
          camera.lookAt(targetActor.position.x, targetActor.position.y, targetActor.position.z);
        } else {
          camera.lookAt(0, 1, 0);
        }
      } else {
        camera.position.set(-2, 1.6, 4);
        camera.lookAt(0, 1, 0);
      }
    } else {
      camera.position.set(5, 6, 8);
      camera.lookAt(0, 1, 0);
    }
  }, [viewAngle, sceneObjects]);

  // Sync 3D Meshes with sceneObjects
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    meshesMapRef.current.forEach((group) => {
      scene.remove(group);
    });
    meshesMapRef.current.clear();

    sceneObjects.forEach((obj) => {
      const group = new THREE.Group();
      group.position.set(obj.position.x, obj.position.y, obj.position.z);

      const colorHex = parseInt(obj.color.replace("#", ""), 16) || 0x3b82f6;

      if (obj.kind === "actor") {
        // Actor Humanoid: Cylinder body + sphere head
        const bodyGeo = new THREE.CylinderGeometry(0.25, 0.35, 1.2, 16);
        const bodyMat = new THREE.MeshStandardMaterial({
          color: colorHex,
          roughness: 0.4,
          metalness: 0.1
        });
        const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
        bodyMesh.castShadow = true;
        group.add(bodyMesh);

        const headGeo = new THREE.SphereGeometry(0.22, 16, 16);
        const headMat = new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.5 });
        const headMesh = new THREE.Mesh(headGeo, headMat);
        headMesh.position.y = 0.8;
        headMesh.castShadow = true;
        group.add(headMesh);

        // Direction visor
        const visorGeo = new THREE.BoxGeometry(0.2, 0.08, 0.15);
        const visorMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
        const visorMesh = new THREE.Mesh(visorGeo, visorMat);
        visorMesh.position.set(0, 0.82, 0.18);
        group.add(visorMesh);
      } else if (obj.kind === "camera") {
        // Cinema Camera Mesh
        const bodyGeo = new THREE.BoxGeometry(0.5, 0.4, 0.6);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3, metalness: 0.5 });
        const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
        bodyMesh.castShadow = true;
        group.add(bodyMesh);

        const lensGeo = new THREE.ConeGeometry(0.3, 0.5, 16);
        const lensMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.2 });
        const lensMesh = new THREE.Mesh(lensGeo, lensMat);
        lensMesh.rotation.x = Math.PI / 2;
        lensMesh.position.z = -0.45;
        group.add(lensMesh);

        // View Frustum wireframe
        const frustumGeo = new THREE.ConeGeometry(1.2, 2.5, 4, 1, true);
        const frustumMat = new THREE.MeshBasicMaterial({
          color: 0xf59e0b,
          wireframe: true,
          transparent: true,
          opacity: 0.35
        });
        const frustumMesh = new THREE.Mesh(frustumGeo, frustumMat);
        frustumMesh.rotation.x = -Math.PI / 2;
        frustumMesh.position.z = -1.6;
        group.add(frustumMesh);
      } else if (obj.kind === "prop") {
        // Prop: Sci-Fi Console or Cargo Crate
        const boxGeo = new THREE.BoxGeometry(0.8, 1.2, 0.8);
        const boxMat = new THREE.MeshStandardMaterial({
          color: colorHex,
          roughness: 0.3,
          metalness: 0.4
        });
        const boxMesh = new THREE.Mesh(boxGeo, boxMat);
        boxMesh.castShadow = true;
        group.add(boxMesh);

        const stripGeo = new THREE.BoxGeometry(0.82, 0.05, 0.82);
        const stripMat = new THREE.MeshBasicMaterial({ color: 0x60a5fa });
        const stripMesh = new THREE.Mesh(stripGeo, stripMat);
        stripMesh.position.y = 0.2;
        group.add(stripMesh);
      } else if (obj.kind === "vehicle") {
        // Vehicle / Transport
        const fuselageGeo = new THREE.BoxGeometry(2.4, 0.8, 1.4);
        const fuselageMat = new THREE.MeshStandardMaterial({
          color: colorHex,
          roughness: 0.3,
          metalness: 0.6
        });
        const fuselageMesh = new THREE.Mesh(fuselageGeo, fuselageMat);
        fuselageMesh.castShadow = true;
        group.add(fuselageMesh);

        const canopyGeo = new THREE.BoxGeometry(0.9, 0.4, 0.9);
        const canopyMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.7 });
        const canopyMesh = new THREE.Mesh(canopyGeo, canopyMat);
        canopyMesh.position.set(0.6, 0.45, 0);
        group.add(canopyMesh);

        const rotorGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.04, 16);
        const rotorMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8, wireframe: true });
        const rotorMesh = new THREE.Mesh(rotorGeo, rotorMat);
        rotorMesh.position.y = 0.6;
        group.add(rotorMesh);
      } else if (obj.kind === "light") {
        // Light fixture indicator
        const lightGeo = new THREE.SphereGeometry(0.25, 16, 16);
        const lightMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
        const lightMesh = new THREE.Mesh(lightGeo, lightMat);
        group.add(lightMesh);

        const pointLight = new THREE.PointLight(colorHex, 1.8, 10);
        group.add(pointLight);
      }

      // Selection ring indicator
      if (obj.id === selectedObjectId) {
        const ringGeo = new THREE.RingGeometry(0.5, 0.68, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0xd49b54,
          side: THREE.DoubleSide
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = -Math.PI / 2;
        ringMesh.position.y = -obj.position.y + 0.02;
        group.add(ringMesh);
      }

      scene.add(group);
      meshesMapRef.current.set(obj.id, group);
    });
  }, [sceneObjects, selectedObjectId]);

  const handleCreateObject = (kind: Scene3DObject["kind"]) => {
    const id = `obj-${kind}-${Date.now()}`;
    const colors: Record<string, string> = {
      actor: "#3b82f6",
      camera: "#f59e0b",
      prop: "#8b5cf6",
      light: "#facc15",
      vehicle: "#ef4444"
    };

    const newObj: Scene3DObject = {
      id,
      sceneNumber: selectedSceneNumber,
      label: `New ${kind.charAt(0).toUpperCase() + kind.slice(1)}`,
      kind,
      position: {
        x: (Math.random() - 0.5) * 4,
        y: kind === "actor" ? 0.9 : kind === "camera" ? 1.4 : kind === "vehicle" ? 1.2 : 0.8,
        z: (Math.random() - 0.5) * 4
      },
      color: colors[kind] || "#3b82f6",
      notes: "Placed via 3D Previs Studio"
    };

    cinemaAudio.playCameraShutter();
    onAddObject(newObj);
    setSelectedObjectId(id);
  };

  // 1-Click Auto-Block from Screenplay Script
  const handleAutoBlockFromScript = () => {
    if (!currentScene) return;
    cinemaAudio.playCameraShutter();
    const sceneNum = selectedSceneNumber;

    const charNames: string[] = [];
    const sceneLineIds = new Set(currentScene.lineIds || []);
    parsed.lines.forEach((l) => {
      if (sceneLineIds.has(l.id) && l.kind === "character" && l.text) {
        const name = l.text.trim().replace(/\s*\(.*?\)/g, "").toUpperCase();
        if (name && !charNames.includes(name)) charNames.push(name);
      }
    });
    if (charNames.length === 0) {
      Object.keys(project.characters || {}).forEach((k) => {
        const c = project.characters[k];
        if (c && c.name && !charNames.includes(c.name.toUpperCase())) {
          charNames.push(c.name.toUpperCase());
        }
      });
    }

    const colors = ["#3b82f6", "#10b981", "#ec4899", "#8b5cf6"];
    let actorIndex = 0;

    charNames.slice(0, 3).forEach((name, idx) => {
      const angle = (idx * (2 * Math.PI)) / Math.max(charNames.length, 2);
      const radius = 1.6;
      onAddObject({
        id: `auto-actor-${sceneNum}-${idx}-${Date.now()}`,
        sceneNumber: sceneNum,
        label: `${name} (Actor)`,
        kind: "actor",
        position: {
          x: Math.cos(angle) * radius,
          y: 0.9,
          z: Math.sin(angle) * radius
        },
        color: colors[actorIndex % colors.length],
        notes: `Extracted from dialogue in ${currentScene.heading}`
      });
      actorIndex++;
    });

    // Primary Camera
    onAddObject({
      id: `auto-cam-${sceneNum}-${Date.now()}`,
      sceneNumber: sceneNum,
      label: "Camera A (35mm Master)",
      kind: "camera",
      position: { x: 0, y: 1.4, z: 3.8 },
      color: "#f59e0b",
      notes: "Anamorphic master wide framing actors"
    });

    // Key Light
    onAddObject({
      id: `auto-key-${sceneNum}-${Date.now()}`,
      sceneNumber: sceneNum,
      label: "Key Fill Light (Warm)",
      kind: "light",
      position: { x: -3.0, y: 3.5, z: 2.0 },
      color: "#fde047",
      notes: "Three-point lighting key fixture"
    });

    // Scene Asset Prop
    onAddObject({
      id: `auto-prop-${sceneNum}-${Date.now()}`,
      sceneNumber: sceneNum,
      label: "Scene Stage Asset",
      kind: "prop",
      position: { x: 0, y: 0.8, z: -0.5 },
      color: "#8b5cf6",
      notes: `Set dressing for ${currentScene.heading}`
    });
  };

  const handleApplyPreset = (presetType: "two-shot" | "low-angle" | "noir-lights" | "top-down") => {
    cinemaAudio.playDirectorChime(true);
    if (presetType === "two-shot") {
      onAddObject({
        id: `preset-cam-ots-${Date.now()}`,
        sceneNumber: selectedSceneNumber,
        label: "Camera B (Over-The-Shoulder 50mm)",
        kind: "camera",
        position: { x: -1.2, y: 1.5, z: 2.5 },
        color: "#f59e0b",
        notes: "Framing tight past actor's shoulder"
      });
    } else if (presetType === "low-angle") {
      onAddObject({
        id: `preset-cam-low-${Date.now()}`,
        sceneNumber: selectedSceneNumber,
        label: "Camera C (24mm Low-Angle Hero)",
        kind: "camera",
        position: { x: 0.8, y: 0.6, z: 2.8 },
        color: "#f59e0b",
        notes: "Upward hero angle tracking action"
      });
    } else if (presetType === "noir-lights") {
      onAddObject({
        id: `preset-light-rim-${Date.now()}`,
        sceneNumber: selectedSceneNumber,
        label: "Cyan Edge Backlight",
        kind: "light",
        position: { x: 3.5, y: 3.2, z: -2.5 },
        color: "#38bdf8",
        notes: "Cool cyan edge backlight for dramatic separation"
      });
    } else if (presetType === "top-down") {
      setViewAngle("top-down");
    }
  };

  const handleCopyBlockingSummary = () => {
    const lines = [
      `=== SCENE ${selectedSceneNumber} 3D BLOCKING & PREVIS SUMMARY ===`,
      `Heading: ${currentScene?.heading || "N/A"}`,
      `Total Placed Entities: ${sceneObjects.length}`,
      ""
    ];
    sceneObjects.forEach((o) => {
      lines.push(`• [${o.kind.toUpperCase()}] ${o.label}: pos(x: ${o.position.x.toFixed(1)}, y: ${o.position.y.toFixed(1)}, z: ${o.position.z.toFixed(1)})`);
      if (o.notes) lines.push(`  Notes: ${o.notes}`);
    });
    navigator.clipboard.writeText(lines.join("\n"));
    setCopiedStatus(true);
    setTimeout(() => setCopiedStatus(false), 2000);
  };

  const handleExportGLB = async () => {
    setIsExportingGLB(true);
    cinemaAudio.playCameraShutter();
    try {
      const sceneToExport = sceneRef.current || buildThreeSceneFromBlocking(selectedSceneNumber, sceneObjects, {
        projectId: project.id,
        projectTitle: project.title,
        sceneNumber: selectedSceneNumber,
        sceneSlugline: currentScene?.heading || `Scene ${selectedSceneNumber}`,
        scribeVersion: "1.0.0"
      });

      const buffer = await exportScenePrevisGLB(sceneToExport, {
        binary: true,
        includeCameras: true,
        includeLights: true
      });

      const blob = new Blob([buffer], { type: "model/gltf-binary" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `SCRIBE_SCENE_${selectedSceneNumber}_PREVIS.glb`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      cinemaAudio.playDirectorChime(true);
    } catch (err) {
      console.error("GLB export failed:", err);
      cinemaAudio.playDirectorChime(false);
    } finally {
      setIsExportingGLB(false);
    }
  };

  return (
    <div className="w-full h-full min-h-0 flex-1 flex overflow-hidden bg-[#0a0c10] select-none">
      {/* 3D Viewport Area */}
      <div className="flex-1 flex flex-col relative min-h-0 overflow-hidden">
        {/* Top Viewport Control Bar */}
        <div className="h-12 border-b border-[#232836] bg-[#0e1117]/95 backdrop-blur px-4 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Scene</span>
            <select
              value={selectedSceneNumber}
              onChange={(e) => onSelectScene(Number(e.target.value))}
              className="bg-[#141822] text-[#d49b54] border border-[#272e40] rounded px-2.5 py-1 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              {parsed.scenes.map((s) => (
                <option key={s.number} value={s.number}>
                  Scene {s.number}: {s.heading}
                </option>
              ))}
            </select>
            <span className="text-xs text-slate-400 font-mono bg-[#141822] px-2 py-0.5 rounded border border-[#202634]">
              {sceneObjects.length} 3D entities
            </span>
          </div>

          {/* Camera View Mode Toggles */}
          <div className="flex items-center space-x-1 bg-[#141822] p-1 rounded-lg border border-[#202634]">
            <button
              onClick={() => setViewAngle("orbit")}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs transition-colors cursor-pointer ${
                viewAngle === "orbit"
                  ? "bg-[#d49b54]/20 text-[#d49b54] font-semibold border border-[#d49b54]/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>3D Orbit</span>
            </button>

            <button
              onClick={() => setViewAngle("director")}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs transition-colors cursor-pointer ${
                viewAngle === "director"
                  ? "bg-[#d49b54]/20 text-[#d49b54] font-semibold border border-[#d49b54]/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Director POV</span>
            </button>

            <button
              onClick={() => setViewAngle("top-down")}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs transition-colors cursor-pointer ${
                viewAngle === "top-down"
                  ? "bg-[#d49b54]/20 text-[#d49b54] font-semibold border border-[#d49b54]/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Plan (Top-Down)</span>
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyBlockingSummary}
              className="flex items-center space-x-1 px-2.5 py-1 bg-[#141822] hover:bg-[#1b212f] border border-[#232a3b] text-slate-300 rounded text-xs transition-colors cursor-pointer"
            >
              {copiedStatus ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Clapperboard className="w-3.5 h-3.5 text-[#d49b54]" />
                  <span>Copy Notes</span>
                </>
              )}
            </button>
            <button
              onClick={handleExportGLB}
              disabled={isExportingGLB}
              className="flex items-center space-x-1.5 px-3 py-1 bg-[#D49B54] hover:bg-[#E3AF69] text-black font-extrabold rounded text-xs transition-all shadow cursor-pointer active:scale-95"
              title="Export industry-standard glTF/GLB with cameras, lights, and production metadata"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExportingGLB ? "Exporting GLB..." : "Export 3D Previs (.GLB)"}</span>
            </button>
          </div>
        </div>

        {/* WebGL Canvas Container */}
        <div ref={mountRef} className="flex-1 w-full h-full min-h-[360px] cursor-grab active:cursor-grabbing relative" />

        {/* Hollywood Camera HUD Reticle & Metadata Overlay */}
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 z-10 pt-16">
          {/* Top HUD Stats */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 bg-black/75 backdrop-blur px-2.5 py-1 rounded border border-white/10 text-[10px] font-mono text-slate-300 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[#d49b54] font-bold">REC</span>
              <span className="text-slate-600">|</span>
              <span>CAM A</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-200 font-semibold">35mm T2.0</span>
              <span className="text-slate-600">|</span>
              <span>2.39:1 SCOPE</span>
              <span className="text-slate-600">|</span>
              <span className="text-emerald-400 font-semibold">24.00 FPS</span>
            </div>

            <div className="bg-black/75 backdrop-blur px-2.5 py-1 rounded border border-white/10 text-[10px] font-mono text-[#d49b54] uppercase font-semibold shadow-lg">
              {viewAngle === "orbit" ? "3D Free Orbit View" : viewAngle === "director" ? "Director POV (A-Cam)" : "Plan View (Top-Down)"}
            </div>
          </div>

          {/* Center Crosshair & Framing Safe Guides (Shown in Director POV) */}
          {viewAngle === "director" && (
            <div className="self-center my-auto relative w-72 h-40 border border-amber-400/25 flex items-center justify-center pointer-events-none">
              <div className="w-8 h-px bg-amber-400/50" />
              <div className="h-8 w-px bg-amber-400/50 absolute" />
              <div className="absolute inset-2 border border-white/10" />
              <span className="absolute bottom-1 right-1.5 text-[8px] font-mono text-amber-400/40">90% SAFE ACTION</span>
            </div>
          )}

          {/* Bottom Viewport Hint Overlay */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 bg-black/75 backdrop-blur border border-[#232836] px-3 py-1.5 rounded-md text-[11px] text-slate-400 shadow-lg">
              <Move className="w-3.5 h-3.5 text-[#d49b54]" />
              <span>Left-drag to rotate • Wheel to zoom • Select entity on right to edit coordinates</span>
            </div>

            <div className="text-[10px] font-mono text-slate-400 bg-black/75 backdrop-blur px-2.5 py-1.5 rounded border border-white/10 shadow-lg">
              STAGE: {currentScene?.heading || `SCENE ${selectedSceneNumber}`}
            </div>
          </div>
        </div>
      </div>

      {/* Right-Hand Inspector & Entity Palette */}
      <div className="w-84 border-l border-[#232836] bg-[#0e1117] flex flex-col shrink-0">
        {/* Header */}
        <div className="p-3 border-b border-[#232836] flex items-center justify-between bg-[#12161f]">
          <div className="flex items-center space-x-2">
            <Box className="w-4 h-4 text-[#d49b54]" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Stage Blocking
            </span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-[#d49b54]/10 text-[#d49b54] border border-[#d49b54]/30 font-mono">
            Three.js WebGL
          </span>
        </div>

        {/* 1-Click Auto-Block from Script Button */}
        <div className="p-3 border-b border-[#232836] bg-[#141822]">
          <button
            onClick={handleAutoBlockFromScript}
            className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-[#d49b54]/20 to-amber-500/10 hover:from-[#d49b54]/30 hover:to-amber-500/20 border border-[#d49b54]/40 text-[#d49b54] font-semibold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-sm active:scale-95"
            title="Automatically place actors, camera and key lighting based on current screenplay scene text"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>⚡ Auto-Block Scene from Script</span>
          </button>
        </div>

        {/* Quick Add Entity Bar */}
        <div className="p-3 border-b border-[#232836] bg-[#12161f]">
          <div className="text-[11px] font-semibold text-slate-400 mb-2">Place Stage Entity:</div>
          <div className="grid grid-cols-4 gap-1.5">
            <button
              onClick={() => handleCreateObject("actor")}
              className="flex flex-col items-center justify-center p-2 rounded bg-[#181d28] hover:bg-[#202736] border border-[#273044] text-xs text-blue-300 transition-colors cursor-pointer"
            >
              <User className="w-3.5 h-3.5 mb-1 text-blue-400" />
              <span className="text-[10px]">Actor</span>
            </button>
            <button
              onClick={() => handleCreateObject("camera")}
              className="flex flex-col items-center justify-center p-2 rounded bg-[#181d28] hover:bg-[#202736] border border-[#273044] text-xs text-amber-300 transition-colors cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5 mb-1 text-amber-400" />
              <span className="text-[10px]">Camera</span>
            </button>
            <button
              onClick={() => handleCreateObject("prop")}
              className="flex flex-col items-center justify-center p-2 rounded bg-[#181d28] hover:bg-[#202736] border border-[#273044] text-xs text-violet-300 transition-colors cursor-pointer"
            >
              <Box className="w-3.5 h-3.5 mb-1 text-violet-400" />
              <span className="text-[10px]">Prop</span>
            </button>
            <button
              onClick={() => handleCreateObject("light")}
              className="flex flex-col items-center justify-center p-2 rounded bg-[#181d28] hover:bg-[#202736] border border-[#273044] text-xs text-yellow-300 transition-colors cursor-pointer"
            >
              <Lightbulb className="w-3.5 h-3.5 mb-1 text-yellow-400" />
              <span className="text-[10px]">Light</span>
            </button>
          </div>
        </div>

        {/* Objects List & Inspector */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            <span>Scene {selectedSceneNumber} Entities ({sceneObjects.length})</span>
          </div>

          {sceneObjects.length === 0 ? (
            <div className="text-center py-8 px-4 rounded-lg bg-[#12161f] border border-[#202634] space-y-3">
              <p className="text-xs text-slate-400">
                No 3D objects placed for Scene {selectedSceneNumber} yet.
              </p>
              <button
                onClick={handleAutoBlockFromScript}
                className="w-full py-1.5 px-3 rounded bg-[#d49b54] hover:bg-[#e3af69] text-black font-extrabold text-xs transition-all shadow cursor-pointer"
              >
                ⚡ Auto-Block from Script
              </button>
            </div>
          ) : (
            sceneObjects.map((obj) => {
              const isSelected = obj.id === selectedObjectId;
              return (
                <div
                  key={obj.id}
                  onClick={() => setSelectedObjectId(obj.id)}
                  className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-[#1c2230] border-[#d49b54]/60 shadow-sm"
                      : "bg-[#141822] border-[#222938] hover:bg-[#181d28]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2 font-medium">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: obj.color }}
                      />
                      <span className="text-slate-200">{obj.label}</span>
                    </div>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#0a0c10] text-slate-400">
                      {obj.kind}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>
                      X: {obj.position.x.toFixed(1)} | Y: {obj.position.y.toFixed(1)} | Z: {obj.position.z.toFixed(1)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteObject(obj.id);
                        if (selectedObjectId === obj.id) setSelectedObjectId(null);
                      }}
                      className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                      title="Delete Object"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}

          {/* Selected Object Detail Inspector */}
          {selectedObject && (
            <div className="mt-4 p-3 bg-[#141822] rounded-lg border border-[#273044] space-y-3 shadow-md">
              <div className="flex items-center justify-between border-b border-[#232b3d] pb-2">
                <div className="flex items-center space-x-1.5">
                  <Sliders className="w-3.5 h-3.5 text-[#d49b54]" />
                  <span className="text-xs font-semibold text-slate-200">Entity Inspector</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">{selectedObject.id}</span>
              </div>

              {/* Label */}
              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase">Label</label>
                <input
                  type="text"
                  value={selectedObject.label}
                  onChange={(e) => onUpdateObject(selectedObject.id, { label: e.target.value })}
                  className="mt-1 w-full bg-[#0a0c10] border border-[#273044] rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-[#d49b54]"
                />
              </div>

              {/* Position Coordinate Sliders */}
              <div className="space-y-2">
                <div className="text-[10px] font-semibold text-slate-400 uppercase">Coordinates (X, Y, Z)</div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono text-red-400 w-3">X</span>
                  <input
                    type="range"
                    min="-6"
                    max="6"
                    step="0.1"
                    value={selectedObject.position.x}
                    onChange={(e) =>
                      onUpdateObject(selectedObject.id, {
                        position: { ...selectedObject.position, x: parseFloat(e.target.value) }
                      })
                    }
                    className="flex-1 accent-[#d49b54]"
                  />
                  <span className="text-[10px] font-mono text-slate-300 w-8 text-right">
                    {selectedObject.position.x.toFixed(1)}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono text-emerald-400 w-3">Y</span>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.1"
                    value={selectedObject.position.y}
                    onChange={(e) =>
                      onUpdateObject(selectedObject.id, {
                        position: { ...selectedObject.position, y: parseFloat(e.target.value) }
                      })
                    }
                    className="flex-1 accent-[#d49b54]"
                  />
                  <span className="text-[10px] font-mono text-slate-300 w-8 text-right">
                    {selectedObject.position.y.toFixed(1)}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono text-blue-400 w-3">Z</span>
                  <input
                    type="range"
                    min="-6"
                    max="6"
                    step="0.1"
                    value={selectedObject.position.z}
                    onChange={(e) =>
                      onUpdateObject(selectedObject.id, {
                        position: { ...selectedObject.position, z: parseFloat(e.target.value) }
                      })
                    }
                    className="flex-1 accent-[#d49b54]"
                  />
                  <span className="text-[10px] font-mono text-slate-300 w-8 text-right">
                    {selectedObject.position.z.toFixed(1)}
                  </span>
                </div>
              </div>

              {/* Director Notes */}
              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase">Director Previs Notes</label>
                <textarea
                  rows={2}
                  value={selectedObject.notes || ""}
                  onChange={(e) => onUpdateObject(selectedObject.id, { notes: e.target.value })}
                  placeholder="e.g. Maya turns abruptly when alarm sirens trigger..."
                  className="mt-1 w-full bg-[#0a0c10] border border-[#273044] rounded p-1.5 text-xs text-slate-200 focus:outline-none focus:border-[#d49b54] resize-none"
                />
              </div>
            </div>
          )}

          {/* Director Quick Presets */}
          <div className="mt-4 pt-3 border-t border-[#232836]">
            <div className="text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-wider">
              Director Blocking Presets:
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => handleApplyPreset("two-shot")}
                className="p-2 rounded bg-[#141822] hover:bg-[#1b212f] border border-[#222938] text-xs text-slate-300 transition-colors flex flex-col items-start cursor-pointer"
              >
                <span className="font-semibold text-slate-200 text-[11px]">+ Two-Shot OTS</span>
                <span className="text-[10px] text-amber-400 font-mono">50mm Camera</span>
              </button>

              <button
                onClick={() => handleApplyPreset("low-angle")}
                className="p-2 rounded bg-[#141822] hover:bg-[#1b212f] border border-[#222938] text-xs text-slate-300 transition-colors flex flex-col items-start cursor-pointer"
              >
                <span className="font-semibold text-slate-200 text-[11px]">+ Hero Low-Angle</span>
                <span className="text-[10px] text-amber-400 font-mono">24mm Wide</span>
              </button>

              <button
                onClick={() => handleApplyPreset("noir-lights")}
                className="p-2 rounded bg-[#141822] hover:bg-[#1b212f] border border-[#222938] text-xs text-slate-300 transition-colors flex flex-col items-start cursor-pointer"
              >
                <span className="font-semibold text-slate-200 text-[11px]">+ Noir Edge Rim</span>
                <span className="text-[10px] text-cyan-400 font-mono">Cyan Accent</span>
              </button>

              <button
                onClick={() => handleApplyPreset("top-down")}
                className="p-2 rounded bg-[#141822] hover:bg-[#1b212f] border border-[#222938] text-xs text-slate-300 transition-colors flex flex-col items-start cursor-pointer"
              >
                <span className="font-semibold text-slate-200 text-[11px]">Plan View</span>
                <span className="text-[10px] text-slate-400 font-mono">Top-Down Grid</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
