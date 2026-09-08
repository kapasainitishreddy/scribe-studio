import React, { useRef, useEffect } from 'react';
import { TransformControls,  PerspectiveCamera, Html  } from '@react-three/drei';
import * as THREE from 'three';
import { Scene3DObject } from '../../../packages/project-model/src/types';
import { usePrevisStore } from '../../domain/previsStore';

import { SceneObjectTransformWrapper } from './SceneObjectTransformWrapper';

export const Camera3D: React.FC<{ object: Scene3DObject, onUpdateObject?: (id: string, updates: Partial<Scene3DObject>) => void }> = ({ object, onUpdateObject }) => {
  const camRef = useRef<THREE.PerspectiveCamera>(null);
  const activeCameraId = usePrevisStore(s => s.activeCameraId);
  const showFramingGuides = usePrevisStore(s => s.showFramingGuides);
  const selectedObjectId = usePrevisStore(s => s.selectedObjectId);

  const isActive = activeCameraId === object.id;
  const isSelected = selectedObjectId === object.id;

  const fov = object.cameraProps?.fov || 50;

  return (
    <SceneObjectTransformWrapper object={object} onUpdateObject={onUpdateObject}>
      <PerspectiveCamera ref={camRef} makeDefault={isActive} fov={fov} near={0.1} far={100} />
      
      {!isActive && (
        <group>
          <mesh castShadow>
            <boxGeometry args={[0.5, 0.4, 0.6]} />
            <meshStandardMaterial color={isSelected ? "#d49b54" : "#f59e0b"} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0, -0.45]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.3, 0.5, 16]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
        </group>
      )}

      {isActive && showFramingGuides && (
        <Html fullscreen zIndexRange={[100, 0]}>
          <div className="pointer-events-none w-full h-full flex items-center justify-center relative border-4 border-amber-500/30">
            <div className="absolute w-full h-px bg-white/20 top-1/3" />
            <div className="absolute w-full h-px bg-white/20 top-2/3" />
            <div className="absolute h-full w-px bg-white/20 left-1/3" />
            <div className="absolute h-full w-px bg-white/20 left-2/3" />
            <div className="absolute bottom-4 right-4 text-xs font-mono text-amber-500 bg-black/50 px-2 py-1 rounded">
              {object.label} (ACTIVE)
            </div>
          </div>
        </Html>
      )}
    </SceneObjectTransformWrapper>
  );
};
