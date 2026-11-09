import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Home, KeyRound, Building2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { SectionHeader } from '../ui/SectionHeader';

interface Service {
  title: string;
  desc: string;
  href: string;
  image: string;
  Icon: LucideIcon;
}

const SERVICES: Service[] = [
  {
    title: 'Buy a Property',
    desc: 'Find the right home or investment that fits your budget and lifestyle.',
    href: '/properties?listingType=sale',
    image: 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=700&q=80',
    Icon: Home,
  },
  {
    title: 'Rent a Property',
    desc: 'Discover rental homes and offices across Kabul with flexible terms.',
    href: '/properties?listingType=rent',
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=700&q=80',
    Icon: KeyRound,
  },
  {
    title: 'Sell Your Property',
    desc: 'Get the best price with our market expertise and buyer network.',
    href: '/contact',
    image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=700&q=80',
    Icon: Building2,
  },
];

export const ServicesSection = () => (
  <section className="section-padding" style={{ background: 'var(--color-brand-ivory)' }}>
    <div className="container-custom">
      <SectionHeader
        eyebrow="What We Offer"
        title="Our Services"
        subtitle="Complete real estate support, from first search to closing."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {SERVICES.map((s, i) => {
          const ServiceIcon = s.Icon;
          return (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="group rounded-2xl overflow-hidden bg-white/70 backdrop-blur-sm border border-white/70"
              style={{ boxShadow: 'var(--shadow-sm)' }}
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <img
                  src={s.image}
                  alt=""
                  aria-hidden="true"
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute top-3 left-3 w-10 h-10 rounded-xl bg-white/95 backdrop-blur-md border border-white/60 shadow-md flex items-center justify-center text-brand-gold group-hover:bg-brand-gold group-hover:text-white transition-all">
                  <ServiceIcon size={20} strokeWidth={2.2} />
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-heading font-bold text-brand-navy text-lg mb-2">{s.title}</h3>
                <p className="text-neutral-500 text-sm leading-relaxed mb-4">{s.desc}</p>
                <a
                  href={s.href}
                  className="inline-flex items-center gap-2 text-brand-navy font-semibold text-sm group/link hover:text-brand-gold transition-colors duration-200"
                >
                  <span>Learn More</span>
                  <ArrowRight size={16} strokeWidth={2.4} className="transition-transform duration-200 group-hover/link:translate-x-1.5" />
                </a>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  </section>
);
