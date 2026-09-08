import { describe, it, expect } from 'vitest';
import { usePrevisStore } from '../src/domain/previsStore';

describe('Interactive 3D Editor State', () => {
  it('manages selectedObjectId correctly', () => {
    usePrevisStore.getState().setSelectedObjectId('obj-1');
    expect(usePrevisStore.getState().selectedObjectId).toBe('obj-1');
  });

  it('manages transformMode correctly', () => {
    usePrevisStore.getState().setTransformMode('rotate');
    expect(usePrevisStore.getState().transformMode).toBe('rotate');
  });
});
