import React, { useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { MeshoptDecoder } from 'meshoptimizer';

export const AnimationClipList: React.FC<{ url: string, current: string, onChange: (val: string) => void }> = ({ url, current, onChange }) => {
  const { animations } = useGLTF(url, true, true, (loader: any) => {
    loader.setMeshoptDecoder(MeshoptDecoder);
  }) as any;

  if (!animations || animations.length === 0) {
    return <div className="text-[10px] text-[#A0A7B2]">No animations found in this asset.</div>;
  }

  return (
    <select 
      value={current} 
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-[#12161D] border border-[#262C36] rounded-sm p-1 text-white"
    >
      {animations.map((clip: any) => (
        <option key={clip.name} value={clip.name}>{clip.name}</option>
      ))}
    </select>
  );
};
