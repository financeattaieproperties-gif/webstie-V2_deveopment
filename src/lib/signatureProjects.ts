import type { Project } from './dbService';

// New V2 catalogs start empty; only published API records supply real projects.
export const SIGNATURE_PROJECTS: Project[] = [];

export function resolveSignatureProjects(projects?: Project[] | null): Project[] {
  return Array.isArray(projects) ? projects : [];
}
