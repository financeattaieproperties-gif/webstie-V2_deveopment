/**
 * Shared Visual Configuration Data Contracts
 * Framework-agnostic TypeScript types shared across the public site and admin CRM.
 * ZERO database schema changes; stored in isolated JSON files.
 */

export interface NormalizedPoint {
  x: number; // 0.0 to 1.0
  y: number; // 0.0 to 1.0
}

export interface NormalizedRect {
  x: number;      // 0.0 to 1.0
  y: number;      // 0.0 to 1.0
  width: number;  // 0.0 to 1.0
  height: number; // 0.0 to 1.0
}

export interface ImageAsset {
  id: string;
  url: string;
  width?: number;
  height?: number;
  digest?: string;
}

export interface PlanPair {
  id: string;
  twoDUrl: string;
  furnishedUrl: string;
  legendUrl?: string | null;
  label?: {
    en: string;
    fa: string;
  };
}

export interface LightLayer {
  id: string;
  alphaMaskUrl?: string | null;
  bounds?: NormalizedRect;
  windowPolygons?: NormalizedPoint[][];
  color?: string; // e.g. 'rgba(255, 214, 138, 0.72)'
  glowBlurPx?: number;
}

export interface ApartmentPlacement {
  id: string;
  unitNumber: string;
  title?: {
    en: string;
    fa: string;
  } | null;
  polygon: NormalizedPoint[];
  labelAnchor: NormalizedPoint;
  areaSqm: number;
  beds: number;
  baths: number;
  priceUsd?: number | null;
  status: 'available' | 'reserved' | 'sold' | 'rented';
  plan: PlanPair;
  description?: {
    en: string;
    fa: string;
  } | null;
}

export interface ExplorerFloor {
  id: string;
  floorNumbers: number[]; // Single floor [4] or duplex group [8, 9]
  label: {
    en: string;
    fa: string;
  };
  kind: 'residential' | 'commercial' | 'amenity' | 'duplex' | 'penthouse';
  hitRegions: NormalizedPoint[][]; // Exterior photograph clickable/hoverable polygon bounds
  lightLayers: LightLayer[];       // Realistic warm interior window lighting
  masterplan: PlanPair;            // 2D and Furnished floorplate masterplan
  apartments: ApartmentPlacement[];
}

export interface ExplorerProject {
  projectId: number;
  projectName: string;
  exteriorImageUrl: string;
  floors: ExplorerFloor[];
}

export interface LandingHeroConfig {
  imageUrl: string | null;
  focalPoint: NormalizedPoint; // e.g. { x: 0.5, y: 0.5 }
}

export interface VisualConfig {
  schemaVersion: 1;
  revision: string;
  updatedAt: string;
  landingHero: LandingHeroConfig;
  projects: Record<number, ExplorerProject>;
}
