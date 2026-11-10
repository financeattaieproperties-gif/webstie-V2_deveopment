import React, { useEffect, useState } from 'react';
import { getPublishedVisualConfig } from '../../lib/visualConfigService';
import stitchHeroImg from '../../assets/images/stitch_hero_kabul_panorama.jpg';
import type { LandingHeroConfig } from '../../../shared/visual-config';

export const LandingHeroBackground: React.FC = () => {
  const [heroConfig, setHeroConfig] = useState<LandingHeroConfig | null>(null);

  useEffect(() => {
    getPublishedVisualConfig().then((cfg) => {
      if (cfg && cfg.landingHero) {
        setHeroConfig(cfg.landingHero);
      }
    });
  }, []);

  const activeImageUrl = heroConfig?.imageUrl || stitchHeroImg;
  const focalX = heroConfig?.focalPoint?.x ?? 0.85; // default object-right-top
  const focalY = heroConfig?.focalPoint?.y ?? 0.15;

  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      <img
        src={activeImageUrl}
        alt="Attaie Properties — Modern Real Estate in Kabul, Afghanistan"
        style={{
          objectPosition: `${(focalX * 100).toFixed(1)}% ${(focalY * 100).toFixed(1)}%`,
        }}
        className="w-full h-full object-cover transition-opacity duration-700"
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(90deg, rgba(245,247,251,0.96) 0%, rgba(245,247,251,0.88) 38%, rgba(245,247,251,0.28) 68%, rgba(245,247,251,0.05) 100%)',
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-32"
        style={{
          background:
            'linear-gradient(to top, var(--color-brand-cream) 10%, rgba(245,247,251,0) 100%)',
        }}
      />
    </div>
  );
};

export default LandingHeroBackground;
