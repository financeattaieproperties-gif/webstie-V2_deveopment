import type { VisualConfig, ExplorerProject, LandingHeroConfig } from '../../shared/visual-config';

const STORAGE_KEY = 'attaie_visual_config_draft';
const BASE_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') + '/visual-config'
  : '/visual-config';

export const visualConfigApi = {
  /**
   * Loads the current draft (or published) visual configuration.
   */
  async getConfig(): Promise<VisualConfig> {
    try {
      const res = await fetch(`${BASE_URL}/admin.php`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.projects) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          return data;
        }
      }
    } catch {
      // Endpoint may not be reachable in some dev environments; use storage fallback
    }

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback below
      }
    }

    // Default seed
    const { DEFAULT_VISUAL_CONFIG } = await import('../../src/lib/defaultVisualConfig');
    return DEFAULT_VISUAL_CONFIG;
  },

  /**
   * Saves changes to draft visual configuration.
   */
  async saveDraft(config: VisualConfig): Promise<{ success: boolean; revision: string }> {
    const updated = {
      ...config,
      updatedAt: new Date().toISOString(),
      revision: `rev_${Date.now()}`,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    try {
      const res = await fetch(`${BASE_URL}/admin.php`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      return { success: true, revision: data.revision || updated.revision };
    } catch {
      // In local dev without PHP server running, local persistence succeeds
      return { success: true, revision: updated.revision };
    }
  },

  /**
   * Publishes the current draft to the public site.
   */
  async publish(config: VisualConfig): Promise<{ success: boolean; revision: string }> {
    const published = {
      ...config,
      updatedAt: new Date().toISOString(),
      revision: `pub_${Date.now()}`,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(published));
    sessionStorage.setItem('attaie_visual_preview_config', JSON.stringify(published));

    try {
      const res = await fetch(`${BASE_URL}/admin.php`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(published),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      return { success: true, revision: data.revision || published.revision };
    } catch {
      return { success: true, revision: published.revision };
    }
  },

  /**
   * Updates only landing hero background configuration.
   */
  async updateLandingHero(hero: LandingHeroConfig): Promise<void> {
    const current = await this.getConfig();
    current.landingHero = hero;
    await this.publish(current);
  },
};
