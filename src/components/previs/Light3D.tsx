import React from 'react';
import * as THREE from 'three';
import { Scene3DObject } from '../../../packages/project-model/src/types';
import { usePrevisStore } from '../../domain/previsStore';
import { SceneObjectTransformWrapper } from './SceneObjectTransformWrapper';

export const Light3D: React.FC<{ object: Scene3DObject, onUpdateObject?: (id: string, updates: Partial<Scene3DObject>) => void }> = ({ object, onUpdateObject }) => {
  const selectedObjectId = usePrevisStore(s => s.selectedObjectId);
  const isSelected = selectedObjectId === object.id;
  const color = object.color || '#ffffff';
  const intensity = object.lightProps?.intensity ?? 2;

  return (
    <SceneObjectTransformWrapper object={object} onUpdateObject={onUpdateObject}>
      <pointLight color={color} intensity={intensity} distance={20} castShadow />
      <mesh>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshBasicMaterial color={isSelected ? "#d49b54" : color} wireframe={!isSelected} />
      </mesh>
    </SceneObjectTransformWrapper>
  );
};
