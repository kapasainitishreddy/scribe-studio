import React, { useEffect, useMemo } from 'react';
import { TransformControls,  useGLTF, useAnimations  } from '@react-three/drei';
import { SkeletonUtils } from 'three-stdlib';
import * as THREE from 'three';
import { MeshoptDecoder } from 'meshoptimizer';
import { Scene3DObject } from '../../../packages/project-model/src/types';
import { usePrevisStore } from '../../domain/previsStore';

export const Character3D: React.FC<{ object: Scene3DObject, onUpdateObject?: (id: string, updates: Partial<Scene3DObject>) => void }> = ({ object, onUpdateObject }) => {
  const assetUrl = object.assetUrl || '/models/RobotExpressive.glb';
  const { scene, animations } = useGLTF(assetUrl, true, true, (loader: any) => {
    loader.setMeshoptDecoder(MeshoptDecoder);
  }) as any;
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { actions } = useAnimations(animations, clone);
  const selectedObjectId = usePrevisStore(s => s.selectedObjectId);

  useEffect(() => {
    const animName = object.animation || 'Idle';
    if (actions && actions[animName]) {
      actions[animName].reset().fadeIn(0.5).play();
    }
    return () => {
      if (actions && actions[animName]) {
        actions[animName].fadeOut(0.5);
      }
    };
  }, [actions, object.animation]);

  useEffect(() => {
    clone.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [clone]);

  const transformMode = usePrevisStore(s => s.transformMode);
  const groupRef = React.useRef<any>(null);
  const isSelected = selectedObjectId === object.id;

  return (
    <group 
      position={[object.position.x, object.position.y, object.position.z]}
      rotation={object.rotation ? [object.rotation.x, object.rotation.y, object.rotation.z] : [0, 0, 0]}
      scale={object.scale ? [object.scale.x, object.scale.y, object.scale.z] : [1, 1, 1]}
    >
      <primitive object={clone} />
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
