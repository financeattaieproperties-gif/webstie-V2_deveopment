import React from 'react';
import { motion } from 'framer-motion';
import { Search, CalendarCheck, FileSignature, KeyRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Step {
  Icon: LucideIcon;
  title: string;
  desc: string;
}

const STEPS: Step[] = [
  { Icon: Search, title: 'Search Property', desc: 'Browse verified listings across Kabul by district, type and budget.' },
  { Icon: CalendarCheck, title: 'Schedule a Visit', desc: 'Book a viewing with one of our agents at a time that works for you.' },
  { Icon: FileSignature, title: 'Make an Offer', desc: 'We negotiate on your behalf and prepare the paperwork.' },
  { Icon: KeyRound, title: 'Move In', desc: 'Complete the transfer and get the keys to your new property.' },
];

export const HowItWorksSection = () => (
  <section className="section-padding" style={{ background: 'var(--color-brand-ivory)' }}>
    <div className="container-custom">
      <div className="text-center mb-16">
        <p className="text-xs font-bold uppercase tracking-[0.25em] mb-3 flex items-center justify-center gap-3"
          style={{ color: 'var(--color-brand-gold)' }}>
          <span className="inline-block w-8 h-px" style={{ background: 'var(--color-brand-gold)', opacity: 0.5 }} />
          The Process
          <span className="inline-block w-8 h-px" style={{ background: 'var(--color-brand-gold)', opacity: 0.5 }} />
        </p>
        <h2 className="font-heading font-bold text-brand-navy" style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)' }}>
          How It Works
        </h2>
        <p className="text-neutral-500 mt-3 max-w-lg mx-auto text-sm leading-relaxed">
          Four simple steps from first search to moving into your new home.
        </p>
      </div>

      <div className="relative grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
        {/* connecting line, desktop only */}
        <div
          className="hidden lg:block absolute left-[12.5%] right-[12.5%] top-8 h-px"
          style={{ background: 'repeating-linear-gradient(to right, rgba(2,14,58,0.18) 0 8px, transparent 8px 16px)' }}
          aria-hidden="true"
        />

        {STEPS.map(({ Icon, title, desc }, i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ delay: i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex flex-col items-center text-center gap-4"
          >
            <div
              className="relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center bg-white border-2 border-brand-gold/25 shadow-brand-md text-brand-gold group"
            >
              <Icon size={28} strokeWidth={2.2} className="text-brand-gold transition-transform group-hover:scale-110" />
              <span
                className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white shadow-xs"
                style={{ background: 'var(--color-brand-navy)' }}
              >
                {i + 1}
              </span>
            </div>
            <h3 className="font-heading font-bold text-brand-navy text-sm sm:text-base">{title}</h3>
            <p className="text-neutral-500 text-xs sm:text-sm leading-relaxed max-w-[180px]">{desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);
