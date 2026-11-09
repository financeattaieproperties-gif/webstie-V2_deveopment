import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, ArrowUpRight } from 'lucide-react';
import { SectionHeader } from '../ui/SectionHeader';
const wazirAkbarKhanAttachedImg = '/assets/aistudio/image_2026-11-07_145116957_784694df.png';
const shahrENawAttachedImg = '/assets/aistudio/images__3__ba0d2d31.jpg';
const karte4AttachedImg = '/assets/aistudio/image_012cf284.png';
const taimaniAttachedImg = '/assets/aistudio/F4_13_-_Photo_552c711f.jpg';

interface District {
  name: string;
  subtitle: string;
  landmark: string;
  image: string;
}

const DISTRICTS: District[] = [
  {
    name: 'Wazir Akbar Khan',
    subtitle: 'Diplomatic & Residential District',
    landmark: 'Wazir Akbar Khan & Bibi Mahro Hill, Kabul',
    image: wazirAkbarKhanAttachedImg,
  },
  {
    name: 'Shahr-e-Naw',
    subtitle: 'Commercial & Urban Center',
    landmark: 'Shahr-e-Naw Skyline & Commercial Core, Kabul',
    image: shahrENawAttachedImg,
  },
  {
    name: 'Karte 4',
    subtitle: 'Established Family Neighborhood',
    landmark: 'Karte 4 Residential & Cultural District, Kabul',
    image: karte4AttachedImg,
  },
  {
    name: 'Taimani',
    subtitle: 'Residential & Retail Hub',
    landmark: 'Project Taimani Residential Blocks, Kabul',
    image: taimaniAttachedImg,
  },
];

export const PopularLocationsSection = () => (
  <section className="section-padding" style={{ background: 'var(--color-brand-cream)' }}>
    <div className="container-custom">
      <SectionHeader
        eyebrow="Where to Look"
        title="Popular Districts"
        subtitle="The Kabul neighborhoods our clients ask for most."
        cta={{ label: 'Explore all districts', href: '/properties' }}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {DISTRICTS.map((d, i) => (
          <motion.a
            key={d.name}
            href={`/properties?search=${encodeURIComponent(d.name)}`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -6 }}
            className="group relative rounded-2xl overflow-hidden p-7 flex flex-col justify-between min-h-[240px] bg-brand-navy border border-brand-navy/15 hover:border-brand-gold/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 transition-colors"
            style={{ boxShadow: 'var(--shadow-md)' }}
          >
            {/* Real Kabul District Background Photography */}
            <img
              src={d.image}
              alt={d.landmark}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700 ease-out"
            />

            {/* Multi-stop dark contrast scrim for crisp legibility */}
            <div
              className="absolute inset-0 pointer-events-none transition-opacity duration-300"
              style={{
                background:
                  'linear-gradient(180deg, rgba(2,14,58,0.45) 0%, rgba(2,14,58,0.55) 45%, rgba(2,14,58,0.92) 100%)',
              }}
            />

            <div className="relative z-10 flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-brand-navy/90 backdrop-blur-md border border-white/25 flex items-center justify-center text-brand-gold shadow-md group-hover:bg-brand-gold group-hover:text-white group-hover:border-brand-gold transition-all">
                <MapPin size={22} strokeWidth={2.2} />
              </div>
              <span className="w-10 h-10 rounded-full bg-black/45 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/90 group-hover:text-white group-hover:bg-brand-gold group-hover:border-brand-gold transition-all shadow-sm">
                <ArrowUpRight
                  size={19}
                  strokeWidth={2.2}
                  className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                />
              </span>
            </div>

            <div className="relative z-10 mt-10">
              <p className="font-heading font-bold text-white text-xl leading-tight drop-shadow-sm">
                {d.name}
              </p>
              <p className="text-white/85 text-xs font-medium mt-1 drop-shadow-xs">
                {d.subtitle}
              </p>
            </div>
          </motion.a>
        ))}
      </div>
    </div>
  </section>
);


