import React, { useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { 
  OrbitControls, 
  TransformControls, 
  Grid, 
  Environment,
  Sky,
  ContactShadows
} from '@react-three/drei';
import { 
  Box, Camera, User, Lightbulb, Trash2, Sliders, Move, RefreshCw 
} from 'lucide-react';
import type { Project, Scene3DObject } from '../../packages/project-model/src/types';
import { usePrevisStore } from '../domain/previsStore';
import { Character3D } from './previs/Character3D';
import { Camera3D } from './previs/Camera3D';
import { Light3D } from './previs/Light3D';
import { Prop3D } from './previs/Prop3D';
import { AssetBrowser } from './previs/AssetBrowser';
import { Inspector3D } from './previs/Inspector3D';

interface Scene3DStudioProps {
  project: Project;
  selectedSceneNumber: number;
  onSelectScene: (sceneNum: number) => void;
  onAddObject: (obj: Scene3DObject) => void;
  onUpdateObject: (id: string, updates: Partial<Scene3DObject>) => void;
  onDeleteObject: (id: string) => void;
}

const PrevisScene: React.FC<{
  objects: Scene3DObject[];
  onUpdateObject: (id: string, updates: Partial<Scene3DObject>) => void;
}> = ({ objects, onUpdateObject }) => {
  const selectedObjectId = usePrevisStore(s => s.selectedObjectId);
  const transformMode = usePrevisStore(s => s.transformMode);
  const activeCameraId = usePrevisStore(s => s.activeCameraId);
  const environmentPreset = usePrevisStore(s => s.environmentPreset);

  return (
    <>
      <Environment preset={environmentPreset as any} background blur={0.04} />
      
      {objects.map((obj) => {
        switch (obj.kind) {
          case 'actor': return <Character3D key={obj.id} object={obj} onUpdateObject={onUpdateObject} />;
          case 'camera': return <Camera3D key={obj.id} object={obj} onUpdateObject={onUpdateObject} />;
          case 'light': return <Light3D key={obj.id} object={obj} onUpdateObject={onUpdateObject} />;
          default: return <Prop3D key={obj.id} object={obj} onUpdateObject={onUpdateObject} />;
        }
      })}

      <Grid infiniteGrid fadeDistance={40} sectionColor="#1e2638" cellColor="#1e2638" />
      <ContactShadows position={[0, -0.01, 0]} opacity={0.4} scale={40} blur={2} far={10} />
      
      {!activeCameraId && (
        <OrbitControls makeDefault />
      )}
    </>
  );
};

export const Scene3DStudio: React.FC<Scene3DStudioProps> = ({
  project,
  selectedSceneNumber,
  onSelectScene,
  onAddObject,
  onUpdateObject,
  onDeleteObject
}) => {
  const { 
    selectedObjectId, setSelectedObjectId,
    transformMode, setTransformMode,
    activeCameraId, setActiveCameraId
  } = usePrevisStore();

  const sceneObjects = (project.scene3DObjects || []).filter(
    (o) => o.sceneNumber === selectedSceneNumber
  );

  const selectedObject = sceneObjects.find(o => o.id === selectedObjectId);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      switch (e.key.toLowerCase()) {
        case 'w': setTransformMode('translate'); break;
        case 'e': setTransformMode('rotate'); break;
        case 'r': setTransformMode('scale'); break;
        case 'delete':
        case 'backspace':
          if (selectedObjectId) {
            onDeleteObject(selectedObjectId);
            setSelectedObjectId(null);
          }
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedObjectId, setTransformMode, onDeleteObject, setSelectedObjectId]);

  const handleCreateObject = (kind: Scene3DObject["kind"]) => {
    const id = `obj-${kind}-${Date.now()}`;
    const newObj: Scene3DObject = {
      id,
      sceneNumber: selectedSceneNumber,
      label: `New ${kind}`,
      kind,
      position: { x: 0, y: kind === 'actor' ? 0.9 : 0.5, z: 0 },
      color: "#ffffff"
    };
    onAddObject(newObj);
    setSelectedObjectId(id);
  };

  return (
    <div className="w-full h-full flex bg-[#0a0c10] text-[#A0A7B2]">
      {/* Left Panel: Asset Browser */}
      <div className="w-64 border-r border-[#262C36] bg-[#0D1015] flex flex-col">
        <AssetBrowser onAddObject={onAddObject} sceneNumber={selectedSceneNumber} />
      </div>

      {/* Center Panel: Canvas */}
      <div className="flex-1 relative flex flex-col">
        {/* Top Toolbar */}
        <div className="h-12 border-b border-[#262C36] bg-[#0D1015] flex items-center justify-between px-4">
          <div className="flex items-center space-x-4 text-sm">
            <span>Scene {selectedSceneNumber}</span>
          </div>
          <div className="flex items-center space-x-2 bg-[#12161D] p-1 rounded border border-[#262C36]">
            <button onClick={() => setTransformMode('translate')} className={`p-1.5 rounded ${transformMode === 'translate' ? 'bg-[#D49B54]/20 text-[#D49B54]' : ''}`} title="Translate (W)"><Move size={14}/></button>
            <button onClick={() => setTransformMode('rotate')} className={`p-1.5 rounded ${transformMode === 'rotate' ? 'bg-[#D49B54]/20 text-[#D49B54]' : ''}`} title="Rotate (E)"><RefreshCw size={14}/></button>
            <button onClick={() => setTransformMode('scale')} className={`p-1.5 rounded ${transformMode === 'scale' ? 'bg-[#D49B54]/20 text-[#D49B54]' : ''}`} title="Scale (R)"><Sliders size={14}/></button>
          </div>
          {activeCameraId && (
            <button onClick={() => setActiveCameraId(null)} className="px-3 py-1 bg-red-500/20 text-red-400 rounded text-xs border border-red-500/30 font-semibold">
              Exit Camera View
            </button>
          )}
        </div>
        
        {/* 3D Viewport */}
        <div className="flex-1 bg-[#090B0E]">
          <Canvas shadows>
            <Suspense fallback={null}>
              <PrevisScene objects={sceneObjects} onUpdateObject={onUpdateObject} />
            </Suspense>
          </Canvas>
        </div>
      </div>

      {/* Right Panel: Properties */}
      <div className="w-64 border-l border-[#262C36] bg-[#0D1015] flex flex-col">
        <Inspector3D objects={sceneObjects} onUpdateObject={onUpdateObject} onDeleteObject={onDeleteObject} />
      </div>
    </div>
  );
};
