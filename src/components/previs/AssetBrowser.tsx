import React, { useState } from 'react';
import { usePrevisStore } from '../../domain/previsStore';
import { User, Box, Video, Lightbulb } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Scene3DObject } from '../../../packages/project-model/src/types';
import { ASSET_LIBRARY, AssetManifestEntry } from '../../data/previsAssetManifest';

export const AssetBrowser: React.FC<{
  onAddObject: (obj: Scene3DObject) => void;
  sceneNumber: number;
}> = ({ onAddObject, sceneNumber }) => {
  const [filter, setFilter] = useState<'all' | 'actor' | 'prop' | 'camera' | 'light'>('all');
  const [search, setSearch] = useState('');
  const setSelectedObjectId = usePrevisStore(s => s.setSelectedObjectId);

  const filtered = ASSET_LIBRARY.filter(a => {
    if (filter !== 'all' && a.kind !== filter) return false;
    if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleAdd = (asset: AssetManifestEntry) => {
    const base: Scene3DObject = {
      id: uuidv4(),
      sceneNumber,
      kind: asset.kind,
      label: asset.name,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      assetUrl: asset.url,
      color: '#ffffff'
    };
    onAddObject(base);
    setTimeout(() => setSelectedObjectId(base.id), 50); // Give React time to mount the object so ref works
  };

  return (
    <div data-testid="asset-browser-panel" className="flex flex-col h-full bg-[#0D1015] border-r border-[#262C36] select-none">
      <div className="p-3 border-b border-[#262C36]">
        <input 
          type="text" 
          placeholder="Search assets..." 
          className="w-full bg-[#12161D] border border-[#262C36] rounded-sm px-2 py-1 text-xs text-white"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex gap-1 mt-2">
          {['all', 'actor', 'prop', 'camera', 'light'].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-2 py-1 text-[10px] uppercase font-mono rounded-sm transition-colors ${filter === f ? 'bg-[#D49B54] text-black font-bold' : 'bg-[#171C24] text-[#A0A7B2] hover:bg-[#202736]'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 grid grid-cols-2 gap-2 content-start">
        {filtered.map(asset => (
          <button
            key={asset.id}
            data-testid={`asset-card-${asset.id}`}
            onClick={() => handleAdd(asset)}
            className="flex flex-col items-center justify-center p-4 bg-[#12161D] border border-[#262C36] hover:border-[#D49B54] rounded-sm transition-all group"
          >
            {asset.kind === 'actor' && <User className="w-6 h-6 text-[#A0A7B2] group-hover:text-[#D49B54]" />}
            {asset.kind === 'camera' && <Video className="w-6 h-6 text-[#A0A7B2] group-hover:text-[#D49B54]" />}
            {asset.kind === 'light' && <Lightbulb className="w-6 h-6 text-[#A0A7B2] group-hover:text-[#D49B54]" />}
            {asset.kind === 'prop' && <Box className="w-6 h-6 text-[#A0A7B2] group-hover:text-[#D49B54]" />}
            <span className="mt-2 text-[10px] font-mono text-[#69717E] group-hover:text-white uppercase truncate w-full text-center">{asset.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
