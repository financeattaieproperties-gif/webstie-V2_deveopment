import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, CheckCircle2 } from 'lucide-react';

export const NewsletterBanner = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setEmail('');
  };

  return (
    <section className="section-padding" style={{ background: 'var(--color-brand-cream)' }}>
      <div className="container-custom">
        <div
          className="relative rounded-3xl overflow-hidden grid grid-cols-1 lg:grid-cols-2"
          style={{ background: 'var(--color-brand-navy)', boxShadow: 'var(--shadow-xl)' }}
        >
          <div className="absolute inset-0 islamic-pattern opacity-25 pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 p-10 sm:p-14 flex flex-col justify-center"
          >
            <p className="text-xs font-bold uppercase tracking-[0.25em] mb-4" style={{ color: 'var(--color-brand-gold)' }}>
              Stay Updated
            </p>
            <h2 className="font-heading font-bold text-white leading-tight mb-4" style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)' }}>
              Get New Listings Before Anyone Else
            </h2>
            <p className="text-white/60 text-sm leading-relaxed mb-6 max-w-md">
              Subscribe for new properties and Kabul market updates, sent straight to your inbox.
            </p>

            {subscribed ? (
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <CheckCircle2 size={20} strokeWidth={2.4} className="text-brand-gold shrink-0" />
                Subscribed. Watch your inbox for new listings.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md">
                <label htmlFor="newsletter-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="newsletter-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 rounded-xl bg-white/10 text-white placeholder-white/40 border border-white/20 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
                  style={{ background: 'var(--color-brand-gold)', boxShadow: 'var(--gold-glow-md)' }}
                >
                  <span>Subscribe</span>
                  <Send size={16} strokeWidth={2.2} />
                </button>
              </form>
            )}
          </motion.div>

          <div className="relative min-h-[240px]">
            <img
              src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80"
              alt=""
              aria-hidden="true"
              className="w-full h-full object-cover absolute inset-0"
              loading="lazy"
            />
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(to left, transparent 60%, var(--color-brand-navy) 100%)' }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
