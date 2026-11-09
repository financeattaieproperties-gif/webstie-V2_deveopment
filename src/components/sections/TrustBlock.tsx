import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Award, CheckCircle2 } from 'lucide-react';

export const TrustBlock = () => (
  <section className="section-padding" style={{ background: 'var(--color-brand-cream)' }}>
    <div className="container-custom">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-3xl p-10 flex flex-col justify-center overflow-hidden"
          style={{ background: 'var(--color-brand-navy)' }}
        >
          <div className="absolute inset-0 islamic-pattern opacity-40" />
          <div className="relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-gold/30 to-brand-gold/15 border border-brand-gold/40 flex items-center justify-center text-brand-gold-lt mb-5 shadow-gold-sm">
              <ShieldCheck size={28} strokeWidth={2.2} />
            </div>
            <p className="text-white font-heading font-bold text-2xl mb-2">Verified Property Transactions</p>
            <p className="text-white/65 text-sm leading-relaxed">
              Every listing represented by Attaie Properties goes through title verification, direct owner consultation, and transparent valuation for buyers in Kabul and the Afghan diaspora.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.55, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-3xl p-10 flex flex-col justify-center bg-white border border-brand-navy/10"
          style={{ boxShadow: 'var(--shadow-md)' }}
        >
          <div className="w-14 h-14 rounded-2xl bg-brand-gold/15 border border-brand-gold/25 flex items-center justify-center text-brand-gold mb-5 shadow-2xs">
            <Award size={28} strokeWidth={2.2} />
          </div>
          <p className="text-brand-navy font-heading font-bold text-2xl mb-3">Our Commitment</p>
          <ul className="space-y-3 text-sm text-neutral-600">
            <li className="flex items-center gap-2.5">
              <CheckCircle2 size={18} strokeWidth={2.4} className="text-brand-gold shrink-0" />
              Direct, transparent communication from inquiry to closing
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 size={18} strokeWidth={2.4} className="text-brand-gold shrink-0" />
              Dedicated on-ground visits and video walkthroughs
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 size={18} strokeWidth={2.4} className="text-brand-gold shrink-0" />
              Complete legal &amp; documentation guidance in Kabul
            </li>
          </ul>
        </motion.div>
      </div>
    </div>
  </section>
);

