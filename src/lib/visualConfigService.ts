import type { VisualConfig, ExplorerProject } from '../../shared/visual-config';
import { DEFAULT_VISUAL_CONFIG } from './defaultVisualConfig';

let cachedConfig: VisualConfig | null = null;
let fetchPromise: Promise<VisualConfig> | null = null;

/**
 * Fetches the active published visual configuration.
 * Always falls back gracefully to DEFAULT_VISUAL_CONFIG if the endpoint is not yet initialized.
 */
export async function getPublishedVisualConfig(): Promise<VisualConfig> {
  if (cachedConfig) return cachedConfig;
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    try {
      // Check local storage override first (useful for admin preview mode)
      const previewJson = sessionStorage.getItem('attaie_visual_preview_config');
      if (previewJson) {
        const parsed = JSON.parse(previewJson) as VisualConfig;
        if (parsed && parsed.projects) {
          cachedConfig = parsed;
          return parsed;
        }
      }

      // Check published file/endpoint
      const res = await fetch('/visual-config/read.php', {
        headers: { Accept: 'application/json' },
      });

      if (res.ok) {
        const data = (await res.json()) as VisualConfig;
        if (data && data.projects) {
          cachedConfig = data;
          return data;
        }
      }
    } catch {
      // Network or file absent — fallback silently
    }

    // Safe fallback to our verified default configuration
    cachedConfig = DEFAULT_VISUAL_CONFIG;
    return DEFAULT_VISUAL_CONFIG;
  })();

  return fetchPromise;
}

/**
 * Gets visual configuration for a specific project by ID.
 */
export async function getProjectVisualConfig(projectId: number): Promise<ExplorerProject | null> {
  const config = await getPublishedVisualConfig();
  return config.projects[projectId] || null;
}

/**
 * Invalidate cached visual configuration (e.g. after admin updates).
 */
export function invalidateVisualConfigCache(): void {
  cachedConfig = null;
  fetchPromise = null;
}
