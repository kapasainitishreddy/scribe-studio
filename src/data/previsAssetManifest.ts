export interface AssetManifestEntry {
  id: string;
  name: string;
  kind: 'actor' | 'prop' | 'camera' | 'light';
  url?: string;
  thumbnail?: string;
  license?: string;
  credit?: string;
}

export const ASSET_LIBRARY: AssetManifestEntry[] = [
  { id: 'robot-fallback', name: 'Robot (Fallback)', kind: 'actor', url: '/models/RobotExpressive.glb', license: 'CC0', credit: 'Quaternius' },
  { id: 'soldier', name: 'Soldier', kind: 'actor', url: '/models/characters/Soldier.glb', license: 'CC0', credit: 'Quaternius' },
  { id: 'horse', name: 'Horse', kind: 'actor', url: '/models/characters/Horse.glb', license: 'CC0', credit: 'Google / Three.js' },
  { id: 'flamingo', name: 'Flamingo', kind: 'actor', url: '/models/characters/Flamingo.glb', license: 'CC0', credit: 'Google / Three.js' },
  { id: 'xbot', name: 'XBot', kind: 'actor', url: '/models/characters/Xbot.glb', license: 'CC-BY', credit: 'Mixamo' },
  { id: 'michelle', name: 'Michelle', kind: 'actor', url: '/models/characters/Michelle.glb', license: 'CC-BY', credit: 'Mixamo' },
  { id: 'cam-35', name: '35mm Camera', kind: 'camera' },
  { id: 'light-point', name: 'Point Light', kind: 'light' },
  { id: 'prop-chair', name: 'Chair', kind: 'prop', url: '/models/props/SheenChair.glb', license: 'CC0' },
  { id: 'prop-mug', name: 'Mug', kind: 'prop', url: '/models/props/coffeeMug.glb', license: 'CC0' },
];
