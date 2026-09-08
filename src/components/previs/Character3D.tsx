import React, { useEffect, useMemo } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { SkeletonUtils } from 'three-stdlib';
import * as THREE from 'three';
import { MeshoptDecoder } from 'meshoptimizer';
import { Scene3DObject } from '../../../packages/project-model/src/types';
import { usePrevisStore } from '../../domain/previsStore';

import { SceneObjectTransformWrapper } from './SceneObjectTransformWrapper';

export const Character3D: React.FC<{ object: Scene3DObject, onUpdateObject?: (id: string, updates: Partial<Scene3DObject>) => void }> = ({ object, onUpdateObject }) => {
  const assetUrl = object.assetUrl || '/models/RobotExpressive.glb';
  const { scene, animations } = useGLTF(assetUrl, true, true, (loader: any) => {
    loader.setMeshoptDecoder(MeshoptDecoder);
  }) as any;
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { actions } = useAnimations(animations, clone);

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

  return (
    <SceneObjectTransformWrapper object={object} onUpdateObject={onUpdateObject}>
      <primitive object={clone} />
    </SceneObjectTransformWrapper>
  );
};

useGLTF.preload('/models/RobotExpressive.glb');
