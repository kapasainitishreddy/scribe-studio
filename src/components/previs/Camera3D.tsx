import React, { useRef, useEffect } from 'react';
import { PerspectiveCamera, Line, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Scene3DObject } from '../../../packages/project-model/src/types';
import { SceneObjectTransformWrapper } from './SceneObjectTransformWrapper';
import { usePrevisStore } from '../../domain/previsStore';

export const Camera3D: React.FC<{
  object: Scene3DObject;
  onUpdateObject: (id: string, updates: Partial<Scene3DObject>) => void;
}> = ({ object, onUpdateObject }) => {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const activeCameraId = usePrevisStore(s => s.activeCameraId);
  const guides = usePrevisStore(s => s.framingGuides || 'none');
  const isActive = activeCameraId === object.id;

  useEffect(() => {
    if (cameraRef.current) {
      if (object.cameraProps?.fov) {
        cameraRef.current.fov = object.cameraProps.fov;
        cameraRef.current.updateProjectionMatrix();
      }
    }
  }, [object.cameraProps?.fov]);

  // Frame helpers
  const renderGuides = () => {
    if (!isActive) return null;
    
    // Renders HTML overlays over the entire viewport instead of 3D lines, which is simpler and pixel-perfect for framing
    return (
      <Html fullscreen zIndexRange={[100, 0]} style={{ pointerEvents: 'none' }}>
        {guides === 'thirds' && (
          <div className="absolute inset-0 border-4 border-yellow-500/50 pointer-events-none">
            <div className="absolute top-1/3 w-full border-t-2 border-white/30" />
            <div className="absolute top-2/3 w-full border-t-2 border-white/30" />
            <div className="absolute left-1/3 h-full border-l-2 border-white/30" />
            <div className="absolute left-2/3 h-full border-l-2 border-white/30" />
          </div>
        )}
        {guides === 'safe-area' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[90%] h-[90%] border-2 border-red-500/50" />
            <div className="absolute w-[80%] h-[80%] border-2 border-green-500/50" />
          </div>
        )}
      </Html>
    );
  };

  return (
    <SceneObjectTransformWrapper object={object} onUpdateObject={onUpdateObject}>
      <PerspectiveCamera
        ref={cameraRef}
        makeDefault={isActive}
        fov={object.cameraProps?.fov || 50}
        aspect={object.cameraProps?.aspect || 16/9}
        near={object.cameraProps?.near || 0.1}
        far={object.cameraProps?.far || 1000}
      />
      {!isActive && (
        <mesh>
          <boxGeometry args={[0.3, 0.3, 0.5]} />
          <meshStandardMaterial color={object.color || "#4f46e5"} wireframe />
        </mesh>
      )}
      {renderGuides()}
    </SceneObjectTransformWrapper>
  );
};
