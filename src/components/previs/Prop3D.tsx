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


const ProceduralProp: React.FC<{ type: string, color?: string }> = ({ type, color = "#8b5cf6" }) => {
  switch (type) {
    case 'table':
      return (
        <group>
          <mesh position={[0, 0.75, 0]} castShadow receiveShadow><boxGeometry args={[1.5, 0.05, 0.8]} /><meshStandardMaterial color={color} /></mesh>
          <mesh position={[-0.7, 0.375, -0.35]} castShadow receiveShadow><boxGeometry args={[0.05, 0.75, 0.05]} /><meshStandardMaterial color={color} /></mesh>
          <mesh position={[0.7, 0.375, -0.35]} castShadow receiveShadow><boxGeometry args={[0.05, 0.75, 0.05]} /><meshStandardMaterial color={color} /></mesh>
          <mesh position={[-0.7, 0.375, 0.35]} castShadow receiveShadow><boxGeometry args={[0.05, 0.75, 0.05]} /><meshStandardMaterial color={color} /></mesh>
          <mesh position={[0.7, 0.375, 0.35]} castShadow receiveShadow><boxGeometry args={[0.05, 0.75, 0.05]} /><meshStandardMaterial color={color} /></mesh>
        </group>
      );
    case 'bench':
    case 'couch':
      return (
        <group>
          <mesh position={[0, 0.4, 0]} castShadow receiveShadow><boxGeometry args={[2, 0.1, 0.6]} /><meshStandardMaterial color={color} /></mesh>
          <mesh position={[0, 0.8, -0.25]} castShadow receiveShadow><boxGeometry args={[2, 0.4, 0.1]} /><meshStandardMaterial color={color} /></mesh>
          <mesh position={[-0.9, 0.2, 0]} castShadow receiveShadow><boxGeometry args={[0.1, 0.4, 0.5]} /><meshStandardMaterial color={color} /></mesh>
          <mesh position={[0.9, 0.2, 0]} castShadow receiveShadow><boxGeometry args={[0.1, 0.4, 0.5]} /><meshStandardMaterial color={color} /></mesh>
        </group>
      );
    case 'crate':
      return (
        <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.8, 0.8, 0.8]} />
          <meshStandardMaterial color={color} map={null} />
        </mesh>
      );
    case 'lamp':
      return (
        <group>
          <mesh position={[0, 0.05, 0]} castShadow receiveShadow><cylinderGeometry args={[0.15, 0.2, 0.1]} /><meshStandardMaterial color={color} /></mesh>
          <mesh position={[0, 0.8, 0]} castShadow receiveShadow><cylinderGeometry args={[0.02, 0.02, 1.5]} /><meshStandardMaterial color={color} /></mesh>
          <mesh position={[0, 1.6, 0]} castShadow receiveShadow><coneGeometry args={[0.3, 0.4, 16]} /><meshStandardMaterial color="#fef08a" /></mesh>
        </group>
      );
    case 'floor':
      return (
        <mesh position={[0, -0.01, 0]} receiveShadow>
          <planeGeometry args={[10, 10]} />
          <meshStandardMaterial color={color} />
        </mesh>
      );
    case 'wall':
      return (
        <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[4, 3, 0.1]} />
          <meshStandardMaterial color={color} />
        </mesh>
      );
    case 'doorway':
      return (
        <group>
          <mesh position={[-0.5, 1.1, 0]} castShadow receiveShadow><boxGeometry args={[0.1, 2.2, 0.1]} /><meshStandardMaterial color={color} /></mesh>
          <mesh position={[0.5, 1.1, 0]} castShadow receiveShadow><boxGeometry args={[0.1, 2.2, 0.1]} /><meshStandardMaterial color={color} /></mesh>
          <mesh position={[0, 2.25, 0]} castShadow receiveShadow><boxGeometry args={[1.1, 0.1, 0.1]} /><meshStandardMaterial color={color} /></mesh>
        </group>
      );
    case 'window':
      return (
        <group>
          <mesh position={[0, 1.5, 0]} castShadow receiveShadow><boxGeometry args={[1.5, 1.5, 0.05]} /><meshStandardMaterial color="#38bdf8" transparent opacity={0.3} /></mesh>
          <mesh position={[0, 1.5, 0]} castShadow receiveShadow><boxGeometry args={[1.6, 0.05, 0.1]} /><meshStandardMaterial color={color} /></mesh>
          <mesh position={[0, 1.5, 0]} castShadow receiveShadow><boxGeometry args={[0.05, 1.6, 0.1]} /><meshStandardMaterial color={color} /></mesh>
          <mesh position={[0, 0.7, 0]} castShadow receiveShadow><boxGeometry args={[1.6, 0.1, 0.1]} /><meshStandardMaterial color={color} /></mesh>
          <mesh position={[0, 2.3, 0]} castShadow receiveShadow><boxGeometry args={[1.6, 0.1, 0.1]} /><meshStandardMaterial color={color} /></mesh>
          <mesh position={[-0.8, 1.5, 0]} castShadow receiveShadow><boxGeometry args={[0.1, 1.6, 0.1]} /><meshStandardMaterial color={color} /></mesh>
          <mesh position={[0.8, 1.5, 0]} castShadow receiveShadow><boxGeometry args={[0.1, 1.6, 0.1]} /><meshStandardMaterial color={color} /></mesh>
        </group>
      );
    default:
      return (
        <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.8, 0.8, 0.8]} />
          <meshStandardMaterial color={color} />
        </mesh>
      );
  }
};

export const Prop3D: React.FC<{ object: Scene3DObject, onUpdateObject?: (id: string, updates: Partial<Scene3DObject>) => void }> = ({ object, onUpdateObject }) => {
  return (
    <SceneObjectTransformWrapper object={object} onUpdateObject={onUpdateObject}>
      {object.assetUrl && object.assetUrl.startsWith('/models/') ? (
        <React.Suspense fallback={<mesh><boxGeometry args={[0.5,0.5,0.5]} /><meshStandardMaterial color="#333" /></mesh>}>
          <PropModel url={object.assetUrl} />
        </React.Suspense>
      ) : (
        <ProceduralProp type={object.assetUrl ? object.assetUrl.replace('procedural:', '') : object.label.toLowerCase()} color={object.color} />
      )}
    </SceneObjectTransformWrapper>
  );
};
