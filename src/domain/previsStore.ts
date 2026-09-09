import { create } from 'zustand';

interface PrevisState {
  selectedObjectId: string | null;
  transformMode: 'translate' | 'rotate' | 'scale';
  activeCameraId: string | null;
  showFramingGuides: boolean;
  framingGuides: 'none' | 'thirds' | 'safe-area';
  environmentPreset: string;
  setSelectedObjectId: (id: string | null) => void;
  setTransformMode: (mode: 'translate' | 'rotate' | 'scale') => void;
  setFramingGuides: (guides: 'none' | 'thirds' | 'safe-area') => void;
  setActiveCameraId: (id: string | null) => void;
  setShowFramingGuides: (show: boolean) => void;
  setEnvironmentPreset: (preset: string) => void;
}

export const usePrevisStore = create<PrevisState>((set) => ({
  selectedObjectId: null,
  transformMode: 'translate',
  activeCameraId: null,
  showFramingGuides: true,
  framingGuides: 'none',
  environmentPreset: 'city',
  setSelectedObjectId: (id) => set({ selectedObjectId: id }),
  setTransformMode: (mode) => set({ transformMode: mode }),
  setFramingGuides: (guides) => set({ framingGuides: guides }),
  setActiveCameraId: (id) => set({ activeCameraId: id }),
  setShowFramingGuides: (show) => set({ showFramingGuides: show }),
  setEnvironmentPreset: (preset) => set({ environmentPreset: preset }),
}));
