import React from 'react';
import * as THREE from 'three';
import { Scene3DObject } from '../../../packages/project-model/src/types';
import { usePrevisStore } from '../../domain/previsStore';

export const Light3D: React.FC<{ object: Scene3DObject }> = ({ object }) => {
  const selectedObjectId = usePrevisStore(s => s.selectedObjectId);
  const isSelected = selectedObjectId === object.id;
  const color = object.color || '#ffffff';

  return (
    <group position={[object.position.x, object.position.y, object.position.z]}>
      <pointLight color={color} intensity={2} distance={20} castShadow />
      
      <mesh>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshBasicMaterial color={isSelected ? "#d49b54" : color} wireframe={!isSelected} />
      </mesh>
    </group>
  );
};
