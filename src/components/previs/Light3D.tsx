import React, { useRef } from 'react';
import { Scene3DObject } from '../../../packages/project-model/src/types';
import { SceneObjectTransformWrapper } from './SceneObjectTransformWrapper';
import { usePrevisStore } from '../../domain/previsStore';
import * as THREE from 'three';

export const Light3D: React.FC<{
  object: Scene3DObject;
  onUpdateObject: (id: string, updates: Partial<Scene3DObject>) => void;
}> = ({ object, onUpdateObject }) => {
  const lightRef = useRef<THREE.Light>(null);
  const activeCameraId = usePrevisStore(s => s.activeCameraId);
  const type = object.lightProps?.type || 'point';

  return (
    <SceneObjectTransformWrapper object={object} onUpdateObject={onUpdateObject}>
      {type === 'point' && (
        <pointLight
          ref={lightRef as any}
          intensity={object.lightProps?.intensity ?? 2}
          color={object.color || '#ffffff'}
          distance={object.lightProps?.distance ?? 10}
          castShadow
        />
      )}
      {type === 'spot' && (
        <spotLight
          ref={lightRef as any}
          intensity={object.lightProps?.intensity ?? 2}
          color={object.color || '#ffffff'}
          distance={object.lightProps?.distance ?? 20}
          angle={object.lightProps?.angle ?? Math.PI / 6}
          penumbra={object.lightProps?.penumbra ?? 0.5}
          castShadow
        />
      )}
      {type === 'directional' && (
        <directionalLight
          ref={lightRef as any}
          intensity={object.lightProps?.intensity ?? 1}
          color={object.color || '#ffffff'}
          castShadow
        />
      )}
      {!activeCameraId && (
        <mesh>
          <octahedronGeometry args={[0.2, 0]} />
          <meshStandardMaterial color={object.color || "#ffcc00"} wireframe />
        </mesh>
      )}
    </SceneObjectTransformWrapper>
  );
};
