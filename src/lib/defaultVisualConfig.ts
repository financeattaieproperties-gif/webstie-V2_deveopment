import type { VisualConfig } from '../../shared/visual-config';

export const DEFAULT_VISUAL_CONFIG: VisualConfig = {
  schemaVersion: 1,
  revision: 'initial_v1',
  updatedAt: new Date().toISOString(),
  landingHero: {
    imageUrl: null,
    focalPoint: { x: 0.5, y: 0.5 },
  },
  projects: {},
};
