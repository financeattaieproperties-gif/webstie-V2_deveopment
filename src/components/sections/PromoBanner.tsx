import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ArrowRight, Building2 } from 'lucide-react';
import defaultExteriorImg from '../../assets/images/project_exterior_elevation_1793995966183.jpg';
import categoryProjectsImg from '../../assets/images/category_master_projects_1794037429266.jpg';
import categoryCommercialImg from '../../assets/images/category_commercial_plaza_1794037429778.jpg';
import categoryHousesImg from '../../assets/images/category_houses_villa_1794037428658.jpg';
import stitchHeroImg from '../../assets/images/stitch_hero_kabul_panorama.jpg';

export interface PromoProjectCover {
  imageUrl: string;
  projectName?: string;
  projectLocation?: string;
}

export interface PromoBannerProps {
  eyebrow?: string;
  title: string;
  description: string;
  bullets?: string[];
  ctaLabel: string;
  ctaHref: string;
  image?: string;
  projectCovers?: PromoProjectCover[];
  imageSide?: 'left' | 'right';
}

const DEFAULT_PROJECT_COVERS: PromoProjectCover[] = [
  {
    imageUrl: defaultExteriorImg,
    projectName: 'Kabul Plaza Saljuqi',
    projectLocation: 'Shahr-e-Naw, Kabul',
  },
  {
    imageUrl: categoryProjectsImg,
    projectName: 'Attaie Signature Towers',
    projectLocation: 'Wazir Akbar Khan, Kabul',
  },
  {
    imageUrl: categoryCommercialImg,
    projectName: 'Shahr-e-Naw Executive Center',
    projectLocation: 'Park Road, Shahr-e-Naw, Kabul',
  },
  {
    imageUrl: categoryHousesImg,
    projectName: 'Attaie Courtyard Residences',
    projectLocation: 'Karte 4, Kabul',
  },
  {
    imageUrl: stitchHeroImg,
    projectName: 'Attaie Skyline Development',
    projectLocation: 'Central Kabul',
  },
];

const STORAGE_INDEX_KEY = 'attaie_promo_cover_rotation_idx';

export const PromoBanner = ({
  eyebrow,
  title,
  description,
  bullets,
  ctaLabel,
  ctaHref,
  image,
  projectCovers,
  imageSide = 'right',
}: PromoBannerProps) => {
  const availableCovers: PromoProjectCover[] = React.useMemo(() => {
    if (projectCovers && projectCovers.length > 0) {
      // Combine dynamic project covers with curated exterior covers so there are always multiple distinct images to rotate through
      const seen = new Set<string>();
      const combined: PromoProjectCover[] = [];
      for (const item of [...projectCovers, ...DEFAULT_PROJECT_COVERS]) {
        if (item.imageUrl && !seen.has(item.imageUrl)) {
          seen.add(item.imageUrl);
          combined.push(item);
        }
      }
      return combined.length > 0 ? combined : DEFAULT_PROJECT_COVERS;
    }
    if (image) {
      return [{ imageUrl: image }, ...DEFAULT_PROJECT_COVERS];
    }
    return DEFAULT_PROJECT_COVERS;
  }, [projectCovers, image]);

  // Rotate to a new project exterior cover image upon each customer login / page visit
  const [coverIndex, setCoverIndex] = useState<number>(() => {
    try {
      const prevRaw = window.localStorage.getItem(STORAGE_INDEX_KEY);
      const prevIdx = prevRaw !== null ? parseInt(prevRaw, 10) : -1;
      const nextIdx = Number.isNaN(prevIdx) ? 0 : prevIdx + 1;
      window.localStorage.setItem(STORAGE_INDEX_KEY, String(nextIdx));
      return nextIdx;
    } catch {
      return 0;
    }
  });

  // Also listen for auth/login storage events so if a user logs in during the session, the cover rotates immediately
  useEffect(() => {
    const handleStorageOrLogin = (e: StorageEvent) => {
      if (!e.key || e.key.includes('login') || e.key.includes('auth') || e.key.includes('user')) {
        setCoverIndex((prev) => {
          const next = prev + 1;
          try {
            window.localStorage.setItem(STORAGE_INDEX_KEY, String(next));
          } catch {
            // ignore storage errors
          }
          return next;
        });
      }
    };
    window.addEventListener('storage', handleStorageOrLogin);
    return () => window.removeEventListener('storage', handleStorageOrLogin);
  }, []);

  const activeCover =
    availableCovers[Math.abs(coverIndex) % availableCovers.length] || availableCovers[0];

  return (
    <section className="section-padding" style={{ background: 'var(--color-brand-cream)' }}>
      <div className="container-custom">
        <div
          className="relative rounded-3xl overflow-hidden grid grid-cols-1 lg:grid-cols-2 border border-brand-navy/15"
          style={{ background: 'var(--color-brand-navy)', boxShadow: 'var(--shadow-xl)' }}
        >
          {/* Full-Card Project Exterior Cover Image Background */}
          <AnimatePresence mode="wait">
            <motion.img
              key={activeCover.imageUrl}
              src={activeCover.imageUrl}
              alt={activeCover.projectName || 'Attaie Properties Exterior Project Cover'}
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
              loading="lazy"
            />
          </AnimatePresence>

          {/* Layered contrast gradient scrim over the background cover image so content & image both shine */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                imageSide === 'left'
                  ? 'linear-gradient(90deg, rgba(2,14,58,0.30) 0%, rgba(2,14,58,0.78) 45%, rgba(2,14,58,0.94) 100%)'
                  : 'linear-gradient(90deg, rgba(2,14,58,0.94) 0%, rgba(2,14,58,0.78) 55%, rgba(2,14,58,0.30) 100%)',
            }}
          />

          <div className="absolute inset-0 islamic-pattern opacity-15 pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className={`relative z-10 p-10 sm:p-14 flex flex-col justify-center ${
              imageSide === 'left' ? 'lg:order-2' : ''
            }`}
          >
            {eyebrow && (
              <p
                className="text-xs font-bold uppercase tracking-[0.25em] mb-4"
                style={{ color: 'var(--color-brand-gold-lt)' }}
              >
                {eyebrow}
              </p>
            )}
            <h2
              className="font-heading font-bold text-white leading-tight mb-4 drop-shadow-sm"
              style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)' }}
            >
              {title}
            </h2>
            <p className="text-white/80 text-sm leading-relaxed mb-6 max-w-md">{description}</p>

            {bullets && bullets.length > 0 && (
              <ul className="flex flex-col gap-2.5 mb-8">
                {bullets.map((b) => (
                  <li key={b} className="flex items-center gap-2.5 text-white/95 text-sm font-medium">
                    <CheckCircle2 size={16} className="text-brand-gold shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
            )}

            <a
              href={ctaHref}
              className="inline-flex items-center gap-2 self-start px-6 py-3.5 rounded-xl font-bold text-sm text-white transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
              style={{ background: 'var(--color-brand-gold)', boxShadow: 'var(--gold-glow-md)' }}
            >
              {ctaLabel}
              <ArrowRight size={16} />
            </a>
          </motion.div>

          {/* Visual Exterior Showcase Half of the Card */}
          <div
            className={`relative z-10 min-h-[280px] p-6 sm:p-8 flex flex-col justify-end ${
              imageSide === 'left' ? 'lg:order-1' : ''
            }`}
          >
            {activeCover.projectName && (
              <div className="self-start inline-flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-brand-navy/80 backdrop-blur-md border border-white/15 text-white shadow-lg">
                <div className="w-8 h-8 rounded-xl bg-brand-gold/25 border border-brand-gold/40 flex items-center justify-center text-white shrink-0">
                  <Building2 size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white leading-tight">
                    {activeCover.projectName}
                  </p>
                  {activeCover.projectLocation && (
                    <p className="text-[11px] text-white/75">{activeCover.projectLocation}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};


