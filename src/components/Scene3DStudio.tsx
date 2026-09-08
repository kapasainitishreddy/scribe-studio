import React, { useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Environment, ContactShadows } from '@react-three/drei';
import { Box, Camera, User, Lightbulb, Trash2, Sliders, Move, RefreshCw } from 'lucide-react';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
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
      {!activeCameraId && <OrbitControls makeDefault />}
    </>
  );
};

export const Scene3DStudio: React.FC<Scene3DStudioProps> = ({
  project, selectedSceneNumber, onAddObject, onUpdateObject, onDeleteObject
}) => {
  const { 
    selectedObjectId, setSelectedObjectId,
    transformMode, setTransformMode,
    activeCameraId, setActiveCameraId
  } = usePrevisStore();

  const [leftTab, setLeftTab] = React.useState<'assets'|'outliner'>('assets');
  const [shots, setShots] = React.useState<string[]>([]);

  const sceneObjects = (project.scene3DObjects || []).filter(o => o.sceneNumber === selectedSceneNumber);

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

  const handleSaveShot = () => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    if (canvas) {
      setShots([...shots, canvas.toDataURL('image/webp')]);
    }
  };

  const handleAutoBlock = () => {
    const ext = project.extractions ? project.extractions[selectedSceneNumber] : null;
    let characters = ext?.charactersPresent || ['Actor 1', 'Actor 2'];
    if (characters.length === 0) characters = ['Actor 1'];
    
    onAddObject({ id: `cam-${Date.now()}`, sceneNumber: selectedSceneNumber, label: 'Main Camera', kind: 'camera', position: { x: 0, y: 1.5, z: 5 }, color: '50' });
    onAddObject({ id: `light1-${Date.now()}`, sceneNumber: selectedSceneNumber, label: 'Key Light', kind: 'light', position: { x: -3, y: 3, z: 3 }, color: '#ffffff', lightProps: { intensity: 3 } });
    onAddObject({ id: `light2-${Date.now()}`, sceneNumber: selectedSceneNumber, label: 'Fill Light', kind: 'light', position: { x: 3, y: 2, z: 2 }, color: '#dbeafe', lightProps: { intensity: 1.5 } });

    characters.forEach((char, idx) => {
      onAddObject({ 
        id: `actor-${char}-${Date.now() + idx}`, 
        sceneNumber: selectedSceneNumber, label: char, kind: 'actor', 
        position: { x: (idx - (characters.length-1)/2) * 1.5, y: 0, z: 0 }, color: '#ffffff',
        assetUrl: idx % 2 === 0 ? '/models/characters/Soldier.glb' : '/models/characters/Michelle.glb'
      });
    });

    if (ext?.props) {
      ext.props.forEach((prop, idx) => {
        onAddObject({ 
          id: `prop-${prop}-${Date.now() + idx}`, 
          sceneNumber: selectedSceneNumber, label: prop, kind: 'prop', 
          position: { x: (idx - (ext.props.length-1)/2) * 2, y: 0, z: -2 }, color: '#8b5cf6',
          assetUrl: '/models/props/coffeeMug.glb'
        });
      });
    }
  };

  return (
    <PanelGroup direction="vertical" className="w-full h-full bg-[#0a0c10] text-[#A0A7B2]">
      <Panel className="flex flex-col min-h-0">
        <PanelGroup direction="horizontal">
          {/* Left Panel: Tabs */}
          <Panel defaultSize={20} minSize={15} maxSize={30} className="flex flex-col bg-[#0D1015] border-r border-[#262C36]">
            <div className="flex border-b border-[#262C36] shrink-0">
              <button 
                onClick={() => setLeftTab('assets')} 
                className={`flex-1 py-2 text-xs font-semibold ${leftTab === 'assets' ? 'text-[#F0F2F5] border-b-2 border-[#D49B54]' : 'text-[#69717E] hover:text-[#A0A7B2]'}`}
              >ASSETS</button>
              <button 
                onClick={() => setLeftTab('outliner')} 
                className={`flex-1 py-2 text-xs font-semibold ${leftTab === 'outliner' ? 'text-[#F0F2F5] border-b-2 border-[#D49B54]' : 'text-[#69717E] hover:text-[#A0A7B2]'}`}
              >OUTLINER</button>
            </div>
            
            {leftTab === 'assets' ? (
              <AssetBrowser onAddObject={onAddObject} sceneNumber={selectedSceneNumber} />
            ) : (
              <div className="flex-1 overflow-y-auto p-2">
                {sceneObjects.map(obj => (
                  <div 
                    key={obj.id}
                    onClick={() => setSelectedObjectId(obj.id)}
                    className={`px-2 py-1.5 mb-1 rounded cursor-pointer text-sm flex items-center justify-between ${
                      selectedObjectId === obj.id ? 'bg-[#D49B54]/20 text-[#D49B54]' : 'hover:bg-[#12161D]'
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate pr-2">
                      {obj.kind === 'actor' && <User size={14} className="shrink-0" />}
                      {obj.kind === 'camera' && <Camera size={14} className="shrink-0" />}
                      {obj.kind === 'light' && <Lightbulb size={14} className="shrink-0" />}
                      {obj.kind === 'prop' && <Box size={14} className="shrink-0" />}
                      <span className="truncate">{obj.label}</span>
                    </div>
                    {obj.kind === 'camera' && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setActiveCameraId(activeCameraId === obj.id ? null : obj.id); }}
                        className={`p-1 rounded shrink-0 ${activeCameraId === obj.id ? 'bg-[#D49B54] text-black' : 'hover:bg-[#262C36]'}`}
                      >
                        <Camera size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <PanelResizeHandle className="w-px bg-[#262C36] hover:bg-[#D49B54] transition-colors cursor-col-resize shrink-0" />

          {/* Center Panel: Canvas */}
          <Panel className="relative flex flex-col bg-[#090B0E]">
            <div className="h-12 border-b border-[#262C36] bg-[#0D1015] flex items-center justify-between px-4 shrink-0">
              <div className="flex items-center space-x-4 text-sm">
                <span>Scene {selectedSceneNumber}</span>
                <button onClick={handleAutoBlock} className="px-2 py-1 bg-[#1A1F2B] border border-[#D49B54]/50 text-[#D49B54] text-[10px] rounded hover:bg-[#D49B54]/10 transition-colors uppercase font-mono">
                  Auto Block
                </button>
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
            
            <div className="flex-1 min-h-0 relative">
              <Canvas shadows gl={{ preserveDrawingBuffer: true }}>
                <Suspense fallback={null}>
                  <PrevisScene objects={sceneObjects} onUpdateObject={onUpdateObject} />
                </Suspense>
              </Canvas>
            </div>
          </Panel>

          <PanelResizeHandle className="w-px bg-[#262C36] hover:bg-[#D49B54] transition-colors cursor-col-resize shrink-0" />

          {/* Right Panel: Properties */}
          <Panel defaultSize={20} minSize={15} maxSize={30} className="flex flex-col bg-[#0D1015]">
            <Inspector3D objects={sceneObjects} onUpdateObject={onUpdateObject} onDeleteObject={onDeleteObject} />
          </Panel>
        </PanelGroup>
      </Panel>
      <PanelResizeHandle className="h-px bg-[#262C36] hover:bg-[#D49B54] transition-colors cursor-row-resize shrink-0" />
      <Panel defaultSize={20} minSize={10} maxSize={40} className="flex flex-col bg-[#0D1015]">
        <div className="p-2 border-b border-[#262C36] flex items-center justify-between shrink-0">
          <span className="text-xs font-semibold text-[#F0F2F5] uppercase tracking-wider">Shot Filmstrip</span>
          <button onClick={handleSaveShot} className="px-3 py-1 bg-[#D49B54] text-black text-xs font-bold rounded-sm hover:bg-[#E3AF69]">
            SAVE SHOT
          </button>
        </div>
        <div className="flex-1 overflow-x-auto p-4 flex gap-4 items-center">
          {shots.length === 0 ? (
            <div className="w-48 h-28 bg-[#12161D] border border-[#262C36] rounded flex items-center justify-center text-xs text-[#69717E] shrink-0">
              No shots captured
            </div>
          ) : (
            shots.map((img, i) => (
              <div key={i} className="w-48 h-28 bg-[#12161D] border border-[#D49B54] rounded flex-shrink-0 overflow-hidden relative group">
                <img src={img} className="w-full h-full object-cover" />
                <div className="absolute bottom-0 w-full bg-black/70 text-white text-[10px] p-1 font-mono">Shot {i + 1}</div>
              </div>
            ))
          )}
        </div>
      </Panel>
    </PanelGroup>
  );
};
