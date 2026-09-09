export interface AssetManifestEntry {
  id: string;
  name: string;
  kind: 'actor' | 'prop' | 'camera' | 'light';
  category?: 'character' | 'animal' | 'furniture' | 'set-piece' | 'environment' | 'equipment';
  url?: string;
  thumbnail?: string;
  license?: string;
  credit?: string;
}

export const ASSET_LIBRARY: AssetManifestEntry[] = [
  { id: 'robot-fallback', name: 'Robot (Fallback)', kind: 'actor', category: 'character', url: '/models/RobotExpressive.glb', license: 'CC0', credit: 'Quaternius' },
  { id: 'soldier', name: 'Soldier', kind: 'actor', category: 'character', url: '/models/characters/Soldier.glb', license: 'CC0', credit: 'Quaternius' },
  { id: 'horse', name: 'Horse', kind: 'actor', category: 'animal', url: '/models/characters/Horse.glb', license: 'CC0', credit: 'Google / Three.js' },
  { id: 'flamingo', name: 'Flamingo', kind: 'actor', category: 'animal', url: '/models/characters/Flamingo.glb', license: 'CC0', credit: 'Google / Three.js' },
  { id: 'xbot', name: 'XBot', kind: 'actor', category: 'character', url: '/models/characters/Xbot.glb', license: 'CC-BY', credit: 'Mixamo' },
  { id: 'michelle', name: 'Michelle', kind: 'actor', category: 'character', url: '/models/characters/Michelle.glb', license: 'CC-BY', credit: 'Mixamo' },
  { id: 'cam-35', name: '35mm Camera', kind: 'camera', category: 'equipment' },
  { id: 'light-point', name: 'Point Light', kind: 'light', category: 'equipment' },
  { id: 'prop-chair', name: 'Chair', kind: 'prop', category: 'furniture', url: '/models/props/SheenChair.glb', license: 'CC0' },
  { id: 'prop-mug', name: 'Mug', kind: 'prop', category: 'set-piece', url: '/models/props/coffeeMug.glb', license: 'CC0' },
  { id: 'prop-table', name: 'Table', kind: 'prop', category: 'furniture', url: 'procedural:table' },
  { id: 'prop-bench', name: 'Bench', kind: 'prop', category: 'furniture', url: 'procedural:bench' },
  { id: 'prop-couch', name: 'Couch', kind: 'prop', category: 'furniture', url: 'procedural:couch' },
  { id: 'prop-lamp', name: 'Lamp', kind: 'prop', category: 'furniture', url: 'procedural:lamp' },
  { id: 'prop-crate', name: 'Crate', kind: 'prop', category: 'set-piece', url: 'procedural:crate' },
  { id: 'prop-floor', name: 'Floor', kind: 'prop', category: 'environment', url: 'procedural:floor' },
  { id: 'prop-wall', name: 'Wall', kind: 'prop', category: 'environment', url: 'procedural:wall' },
  { id: 'prop-doorway', name: 'Doorway', kind: 'prop', category: 'environment', url: 'procedural:doorway' },
  { id: 'prop-window', name: 'Window', kind: 'prop', category: 'environment', url: 'procedural:window' },
];
