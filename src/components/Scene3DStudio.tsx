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

  const selectedObject = objects.find(o => o.id === selectedObjectId);

  return (
    <>
      <Sky sunPosition={[10, 20, 10]} turbidity={0.1} rayleigh={0.5} />
      <ambientLight intensity={0.5} />
      
      {objects.map((obj) => {
        switch (obj.kind) {
          case 'actor': return <Character3D key={obj.id} object={obj} />;
          case 'camera': return <Camera3D key={obj.id} object={obj} />;
          case 'light': return <Light3D key={obj.id} object={obj} />;
          default: return <Prop3D key={obj.id} object={obj} />;
        }
      })}

      {selectedObject && !activeCameraId && (
        <TransformControls 
          object={undefined} 
          mode={transformMode}
          position={[selectedObject.position.x, selectedObject.position.y, selectedObject.position.z]}
          onMouseUp={(e: any) => {
            if (e?.target?.object) {
              const { x, y, z } = e.target.object.position;
              onUpdateObject(selectedObject.id, { position: { x, y, z } });
            }
          }}
        />
      )}

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
      {/* Left Panel: Outliner */}
      <div className="w-64 border-r border-[#262C36] bg-[#0D1015] flex flex-col">
        <div className="p-3 border-b border-[#262C36] font-semibold text-[#F0F2F5]">
          Scene Outliner
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {sceneObjects.map(obj => (
            <div 
              key={obj.id}
              onClick={() => setSelectedObjectId(obj.id)}
              className={`px-2 py-1.5 mb-1 rounded cursor-pointer text-sm flex items-center justify-between ${
                selectedObjectId === obj.id ? 'bg-[#D49B54]/20 text-[#D49B54]' : 'hover:bg-[#12161D]'
              }`}
            >
              <div className="flex items-center space-x-2">
                {obj.kind === 'actor' && <User size={14} />}
                {obj.kind === 'camera' && <Camera size={14} />}
                {obj.kind === 'light' && <Lightbulb size={14} />}
                {obj.kind === 'prop' && <Box size={14} />}
                <span>{obj.label}</span>
              </div>
              
              {obj.kind === 'camera' && (
                <button 
                  onClick={(e) => { e.stopPropagation(); setActiveCameraId(activeCameraId === obj.id ? null : obj.id); }}
                  className={`p-1 rounded ${activeCameraId === obj.id ? 'bg-[#D49B54] text-black' : 'hover:bg-[#262C36]'}`}
                >
                  <Camera size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="p-3 border-t border-[#262C36] grid grid-cols-2 gap-2">
          <button onClick={() => handleCreateObject('actor')} className="p-1.5 bg-[#12161D] hover:bg-[#171C24] rounded border border-[#262C36] text-xs flex items-center justify-center gap-1"><User size={12}/> Actor</button>
          <button onClick={() => handleCreateObject('camera')} className="p-1.5 bg-[#12161D] hover:bg-[#171C24] rounded border border-[#262C36] text-xs flex items-center justify-center gap-1"><Camera size={12}/> Cam</button>
          <button onClick={() => handleCreateObject('light')} className="p-1.5 bg-[#12161D] hover:bg-[#171C24] rounded border border-[#262C36] text-xs flex items-center justify-center gap-1"><Lightbulb size={12}/> Light</button>
          <button onClick={() => handleCreateObject('prop')} className="p-1.5 bg-[#12161D] hover:bg-[#171C24] rounded border border-[#262C36] text-xs flex items-center justify-center gap-1"><Box size={12}/> Prop</button>
        </div>
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
        <div className="p-3 border-b border-[#262C36] font-semibold text-[#F0F2F5]">
          Properties
        </div>
        <div className="flex-1 p-4">
          {selectedObject ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-[#69717E] block mb-1">Name</label>
                <input 
                  type="text" 
                  value={selectedObject.label}
                  onChange={(e) => onUpdateObject(selectedObject.id, { label: e.target.value })}
                  className="w-full bg-[#12161D] border border-[#262C36] rounded px-2 py-1 text-sm text-[#F0F2F5] focus:outline-none focus:border-[#D49B54]"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-[#69717E] block mb-1">X</label>
                  <input type="number" step="0.1" value={selectedObject.position.x.toFixed(2)} readOnly className="w-full bg-[#171C24] border border-[#262C36] rounded px-2 py-1 text-xs text-[#A0A7B2]" />
                </div>
                <div>
                  <label className="text-xs text-[#69717E] block mb-1">Y</label>
                  <input type="number" step="0.1" value={selectedObject.position.y.toFixed(2)} readOnly className="w-full bg-[#171C24] border border-[#262C36] rounded px-2 py-1 text-xs text-[#A0A7B2]" />
                </div>
                <div>
                  <label className="text-xs text-[#69717E] block mb-1">Z</label>
                  <input type="number" step="0.1" value={selectedObject.position.z.toFixed(2)} readOnly className="w-full bg-[#171C24] border border-[#262C36] rounded px-2 py-1 text-xs text-[#A0A7B2]" />
                </div>
              </div>
              <button 
                onClick={() => {
                  onDeleteObject(selectedObject.id);
                  setSelectedObjectId(null);
                }}
                className="w-full mt-4 flex items-center justify-center space-x-2 px-3 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded border border-red-500/20 transition-colors text-sm"
              >
                <Trash2 size={14} />
                <span>Delete Object</span>
              </button>
            </div>
          ) : (
            <div className="text-sm text-[#69717E] text-center mt-10">
              Select an object to view its properties
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
