import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { SkeletonUtils } from 'three-stdlib';
import { MeshoptDecoder } from 'meshoptimizer';
import { Scene3DObject } from '../../../packages/project-model/src/types';
import { usePrevisStore } from '../../domain/previsStore';
import { SceneObjectTransformWrapper } from './SceneObjectTransformWrapper';

const PropModel: React.FC<{ url: string }> = ({ url }) => {
  const { scene } = useGLTF(url, true, true, (loader: any) => {
    loader.setMeshoptDecoder(MeshoptDecoder);
  }) as any;
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  return <primitive object={clone} />;
};

export const Prop3D: React.FC<{ object: Scene3DObject, onUpdateObject?: (id: string, updates: Partial<Scene3DObject>) => void }> = ({ object, onUpdateObject }) => {
  return (
    <SceneObjectTransformWrapper object={object} onUpdateObject={onUpdateObject}>
      {object.assetUrl ? (
        <React.Suspense fallback={<mesh><boxGeometry args={[0.5,0.5,0.5]} /><meshStandardMaterial color="#333" /></mesh>}>
          <PropModel url={object.assetUrl} />
        </React.Suspense>
      ) : (
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.8, 0.8, 0.8]} />
          <meshStandardMaterial color={object.color || "#8b5cf6"} />
        </mesh>
      )}
    </SceneObjectTransformWrapper>
  );
};
