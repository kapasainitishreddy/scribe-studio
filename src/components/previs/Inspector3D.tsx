import React from 'react';
import { usePrevisStore } from '../../domain/previsStore';
import { Scene3DObject } from '../../../packages/project-model/src/types';
import { Trash2, Move, RotateCw, Maximize, Eye, EyeOff } from 'lucide-react';
import { AnimationClipList } from './AnimationClipList';

export const Inspector3D: React.FC<{
  objects: Scene3DObject[];
  onUpdateObject: (id: string, updates: Partial<Scene3DObject>) => void;
  onDeleteObject: (id: string) => void;
}> = ({ objects, onUpdateObject, onDeleteObject }) => {
  const { selectedObjectId, transformMode, setTransformMode, environmentPreset, setEnvironmentPreset } = usePrevisStore();
  
  const selectedObject = objects.find(o => o.id === selectedObjectId);

  if (!selectedObject) {
    return (
      <div data-testid="inspector-3d-panel" className="flex flex-col h-full bg-[#0D1015] border-l border-[#262C36] p-4 text-xs">
        <h3 className="text-[10px] font-mono text-[#69717E] uppercase mb-4 tracking-wider">Environment Inspector</h3>
        <label className="text-[10px] uppercase text-[#69717E] mb-1 block">HDRI / Environment Preset</label>
        <select 
          className="w-full bg-[#12161D] border border-[#262C36] rounded-sm p-1.5 text-white mb-4"
          value={environmentPreset}
          onChange={(e) => setEnvironmentPreset(e.target.value)}
        >
          <option value="studio">Studio Neutral</option>
          <option value="sunset">Venice Sunset</option>
          <option value="park">Day Exterior</option>
          <option value="apartment">Interior</option>
          <option value="night">Night</option>
        </select>
        <p className="text-[10px] text-[#A0A7B2]">Select an object in the viewport or outliner to inspect its properties.</p>
      </div>
    );
  }

  const updateVec = (field: 'position' | 'rotation' | 'scale', axis: 'x' | 'y' | 'z', value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return;
    onUpdateObject(selectedObject.id, {
      [field]: { ...selectedObject[field], [axis]: num }
    });
  };

  return (
    <div data-testid="inspector-3d-panel" className="flex flex-col h-full bg-[#0D1015] border-l border-[#262C36] p-4 text-xs overflow-y-auto">
      <h3 className="text-[10px] font-mono text-[#69717E] uppercase mb-4 tracking-wider flex justify-between items-center">
        <span>{selectedObject.kind} Inspector</span>
        <button onClick={() => onDeleteObject(selectedObject.id)} className="text-[#F43F5E] hover:text-white p-1 rounded-sm hover:bg-[#F43F5E]/20">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </h3>

      <div className="space-y-4">
        <div>
          <label className="text-[10px] uppercase text-[#69717E] mb-1 block">Name</label>
          <input 
            type="text" 
            value={selectedObject.label} 
            onChange={(e) => onUpdateObject(selectedObject.id, { label: e.target.value })}
            className="w-full bg-[#12161D] border border-[#262C36] rounded-sm p-1 text-white"
          />
        </div>

        {selectedObject.kind === 'actor' && (
          <div>
            <label className="text-[10px] uppercase text-[#69717E] mb-1 block">Animation</label>
            <React.Suspense fallback={<div className="text-[10px] text-[#A0A7B2]">Loading animations...</div>}>
              <AnimationClipList 
                url={selectedObject.assetUrl || '/models/RobotExpressive.glb'} 
                current={selectedObject.animation || 'Idle'} 
                onChange={(val) => onUpdateObject(selectedObject.id, { animation: val })}
              />
            </React.Suspense>
          </div>
        )}

        {selectedObject.kind === 'camera' && (
          <div>
            <label className="text-[10px] uppercase text-[#69717E] mb-1 block">Lens (Focal Length)</label>
            <select 
              value={selectedObject.cameraProps?.fov ? Math.round(36 / (2 * Math.tan((selectedObject.cameraProps.fov * Math.PI / 180) / 2))) : '50'} 
              onChange={(e) => {
                const focalLength = parseFloat(e.target.value);
                const sensorWidth = 36;
                const fov = 2 * Math.atan(sensorWidth / (2 * focalLength)) * (180 / Math.PI);
                onUpdateObject(selectedObject.id, { cameraProps: { ...(selectedObject.cameraProps || { aspect: 16/9, near: 0.1, far: 100 }), fov } });
              }}
              className="w-full bg-[#12161D] border border-[#262C36] rounded-sm p-1 text-white"
            >
              <option value="18">18mm (Ultra Wide)</option>
              <option value="24">24mm (Wide)</option>
              <option value="35">35mm (Documentary)</option>
              <option value="50">50mm (Standard)</option>
              <option value="85">85mm (Portrait)</option>
              <option value="135">135mm (Telephoto)</option>
            </select>
          </div>
        )}

        {selectedObject.kind === 'light' && (
          <div>
            <label className="text-[10px] uppercase text-[#69717E] mb-1 block">Light Intensity</label>
            <input 
              type="range" min="0" max="10" step="0.1"
              value={selectedObject.lightProps?.intensity ?? 2} 
              onChange={(e) => onUpdateObject(selectedObject.id, { lightProps: { ...(selectedObject.lightProps || {}), intensity: parseFloat(e.target.value) } })}
              className="w-full mb-2"
            />
            <label className="text-[10px] uppercase text-[#69717E] mb-1 block">Light Color</label>
            <input 
              type="color" 
              value={selectedObject.color || '#ffffff'} 
              onChange={(e) => onUpdateObject(selectedObject.id, { color: e.target.value })}
              className="w-full bg-[#12161D] border border-[#262C36] rounded-sm h-8"
            />
          </div>
        )}

        <div className="border-t border-[#262C36] pt-4">
          <label className="text-[10px] uppercase text-[#69717E] mb-2 flex items-center space-x-2">
            <span>Transform Gizmo</span>
          </label>
          <div className="flex space-x-1 mb-4">
            <button onClick={() => setTransformMode('translate')} className={`flex-1 p-1.5 rounded-sm flex justify-center items-center ${transformMode === 'translate' ? 'bg-[#D49B54] text-black' : 'bg-[#12161D] text-[#A0A7B2]'}`}><Move className="w-3.5 h-3.5" /></button>
            <button onClick={() => setTransformMode('rotate')} className={`flex-1 p-1.5 rounded-sm flex justify-center items-center ${transformMode === 'rotate' ? 'bg-[#D49B54] text-black' : 'bg-[#12161D] text-[#A0A7B2]'}`}><RotateCw className="w-3.5 h-3.5" /></button>
            <button onClick={() => setTransformMode('scale')} className={`flex-1 p-1.5 rounded-sm flex justify-center items-center ${transformMode === 'scale' ? 'bg-[#D49B54] text-black' : 'bg-[#12161D] text-[#A0A7B2]'}`}><Maximize className="w-3.5 h-3.5" /></button>
          </div>

          <div className="space-y-2">
            {['position', 'rotation', 'scale'].map((field) => (
              <div key={field} className="flex items-center space-x-2">
                <span className="w-12 text-[10px] text-[#69717E] capitalize">{field}</span>
                {['x', 'y', 'z'].map((axis) => {
                  const val = (selectedObject as any)[field]?.[axis] || 0;
                  return (
                    <input 
                      key={axis}
                      data-testid={`input-${field}-${axis}`}
                      type="number"
                      step={field === 'rotation' ? 0.1 : 0.5}
                      value={val.toFixed(2)}
                      onChange={(e) => updateVec(field as any, axis as any, e.target.value)}
                      className="w-12 bg-[#12161D] border border-[#262C36] rounded-sm p-1 text-[10px] text-white text-center font-mono"
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
