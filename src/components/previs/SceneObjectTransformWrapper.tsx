import React, { useRef, useEffect } from 'react';
import { TransformControls } from '@react-three/drei';
import { usePrevisStore } from '../../domain/previsStore';
import { Scene3DObject } from '../../../packages/project-model/src/types';
import * as THREE from 'three';

export const SceneObjectTransformWrapper: React.FC<{
  object: Scene3DObject;
  onUpdateObject?: (id: string, updates: Partial<Scene3DObject>) => void;
  children: React.ReactNode;
}> = ({ object, onUpdateObject, children }) => {
  const groupRef = useRef<THREE.Group>(null);
  const selectedObjectId = usePrevisStore(s => s.selectedObjectId);
  const setSelectedObjectId = usePrevisStore(s => s.setSelectedObjectId);
  const transformMode = usePrevisStore(s => s.transformMode);
  const setOrbitEnabled = usePrevisStore(s => s.setOrbitEnabled);
  
  const isSelected = selectedObjectId === object.id;

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.set(object.position.x, object.position.y, object.position.z);
      if (object.rotation) groupRef.current.rotation.set(object.rotation.x, object.rotation.y, object.rotation.z);
      if (object.scale) groupRef.current.scale.set(object.scale.x, object.scale.y, object.scale.z);
    }
  }, [object.position, object.rotation, object.scale]);

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    setSelectedObjectId(object.id);
  };

  return (
    <>
      <group ref={groupRef} onClick={handlePointerDown} onPointerDown={handlePointerDown}>
        {children}
        {isSelected && (
          <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.5, 0.6, 32]} />
            <meshBasicMaterial color="#d49b54" side={THREE.DoubleSide} />
          </mesh>
        )}
      </group>
      
      {isSelected && (
        <TransformControls
          object={groupRef as any}
          mode={transformMode}
          onMouseDown={() => setOrbitEnabled(false)}
          onMouseUp={(e: any) => {
            setOrbitEnabled(true);
            if (groupRef.current && onUpdateObject) {
              const p = groupRef.current.position;
              const r = groupRef.current.rotation;
              const s = groupRef.current.scale;
              onUpdateObject(object.id, {
                position: { x: p.x, y: p.y, z: p.z },
                rotation: { x: r.x, y: r.y, z: r.z },
                scale: { x: s.x, y: s.y, z: s.z }
              });
            }
          }}
        />
      )}
    </>
  );
};
