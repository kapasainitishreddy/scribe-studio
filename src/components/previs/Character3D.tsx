import React, { useEffect, useMemo } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { SkeletonUtils } from 'three-stdlib';
import * as THREE from 'three';
import { Scene3DObject } from '../../../packages/project-model/src/types';
import { usePrevisStore } from '../../domain/previsStore';

export const Character3D: React.FC<{ object: Scene3DObject }> = ({ object }) => {
  const { scene, animations } = useGLTF('/models/RobotExpressive.glb', true) as any;
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { actions } = useAnimations(animations, clone);
  const selectedObjectId = usePrevisStore(s => s.selectedObjectId);

  useEffect(() => {
    const animName = 'Idle';
    if (actions && actions[animName]) {
      actions[animName].reset().fadeIn(0.5).play();
    }
    return () => {
      if (actions && actions[animName]) {
        actions[animName].fadeOut(0.5);
      }
    };
  }, [actions]);

  useEffect(() => {
    clone.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [clone]);

  const isSelected = selectedObjectId === object.id;

  return (
    <group position={[object.position.x, object.position.y, object.position.z]}>
      <primitive object={clone} scale={0.5} />
      {isSelected && (
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.5, 0.6, 32]} />
          <meshBasicMaterial color="#d49b54" side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
};

useGLTF.preload('/models/RobotExpressive.glb');
