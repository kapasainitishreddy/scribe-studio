import React from 'react';
import * as THREE from 'three';
import { Scene3DObject } from '../../../packages/project-model/src/types';
import { usePrevisStore } from '../../domain/previsStore';

export const Prop3D: React.FC<{ object: Scene3DObject }> = ({ object }) => {
  const selectedObjectId = usePrevisStore(s => s.selectedObjectId);
  const isSelected = selectedObjectId === object.id;

  return (
    <group position={[object.position.x, object.position.y, object.position.z]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial color={object.color || "#8b5cf6"} />
      </mesh>
      
      {isSelected && (
        <mesh>
          <boxGeometry args={[0.85, 0.85, 0.85]} />
          <meshBasicMaterial color="#d49b54" wireframe />
        </mesh>
      )}
    </group>
  );
};
