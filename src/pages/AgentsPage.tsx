import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import gsap from 'gsap';
import { ArrowUpRight, Phone, Mail, MessageCircle, ShieldCheck, Award } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { getAgents, type Agent } from '../lib/dbService';
import { SeoHead } from '../components/seo/SeoHead';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { useTranslation } from 'react-i18next';
import defaultExteriorImg from '../assets/images/project_exterior_elevation_1793995966183.jpg';
import stitchInteriorImg from '../assets/images/stitch_apartment_interior.jpg';
import stitchVillaImg from '../assets/images/stitch_villa_exterior.jpg';

const FALLBACK_AGENTS: Agent[] = [
  {
    id: 1,
    name: 'Ahmad Jawid Attaie',
    role: 'Managing Director & Senior Investment Advisor',
    background:
      'Over 12 years advising diplomatic missions, returning Afghan diaspora families, and institutional investors across Wazir Akbar Khan and Shahr-e-Naw.',
    portrait_url: defaultExteriorImg,
    phone: '+93 782 222 279',
    email: 'info@attaieproperties.com',
    whatsapp: '93782222279',
    published: true,
  },
  {
    id: 2,
    name: 'Farhad Saljuqi',
    role: 'Head of Residential Developments & Off-Plan Sales',
    background:
      'Specializes in multi-unit residential towers, Qabala Sharaee title verification, and structured installment plans for residential developments.',
    portrait_url: stitchInteriorImg,
    phone: '+93 782 222 279',
    email: 'sales@attaieproperties.com',
    whatsapp: '93782222279',
    published: true,
  },
  {
    id: 3,
    name: 'Mustafa Karimi',
    role: 'Senior Commercial & Diplomatic Leasing Specialist',
    background:
      'Leads executive villa leasing and Grade-A commercial retail acquisitions in Karte Parwan, Ansari Square, and Street 10 Wazir Akbar Khan.',
    portrait_url: stitchVillaImg,
    phone: '+93 782 222 279',
    email: 'leasing@attaieproperties.com',
    whatsapp: '93782222279',
    published: true,
  },
];

export default function AgentsPage() {
  const { t } = useTranslation();
  const [agents, setAgents] = useState<Agent[]>(FALLBACK_AGENTS);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<'All' | 'Residential' | 'Commercial' | 'Advisory'>('All');
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getAgents()
      .then((list) => {
        if (Array.isArray(list) && list.length > 0) {
          setAgents(list);
        } else {
          setAgents(FALLBACK_AGENTS);
        }
      })
      .catch(() => {
        setAgents(FALLBACK_AGENTS);
      })
      .finally(() => setLoading(false));
  }, []);

  // Minimal GSAP Header Reveal
  useEffect(() => {
    if (!headerRef.current) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.55, ease: 'power2.out' }
      );
    }, headerRef);
    return () => ctx.revert();
  }, []);

  const filteredAgents = agents.filter((agent) => {
    if (roleFilter === 'All') return true;
    const roleLower = `${agent.role} ${agent.background}`.toLowerCase();
    if (roleFilter === 'Residential') return roleLower.includes('residential') || roleLower.includes('villa');
    if (roleFilter === 'Commercial') return roleLower.includes('commercial') || roleLower.includes('leasing');
    if (roleFilter === 'Advisory') return roleLower.includes('advisor') || roleLower.includes('director');
    return true;
  });

  return (
    <main className="min-h-screen bg-brand-ivory flex flex-col">
      <SeoHead />
      <Navbar />

      <header className="relative bg-brand-navy pt-36 pb-16 overflow-hidden">
        <div className="absolute inset-0 islamic-pattern opacity-20" />
        <div ref={headerRef} className="container-custom relative z-10">
          <Breadcrumbs
            variant="light"
            items={[{ label: t('nav.agents', 'Our Agents') }]}
            className="mb-4"
          />
          <p className="text-brand-gold text-xs font-bold uppercase tracking-[0.25em] mb-3">
            Attaie Properties Advisory Team
          </p>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white">
            Meet Our Senior Property Advisors
          </h1>
          <p className="mt-4 max-w-xl text-white/65 leading-relaxed">
            Multilingual specialists in Dari, Pashto, and English guiding buyers, diaspora families,
            and institutional investors across Kabul’s prime districts.
          </p>
        </div>
      </header>

      {/* Swiper Agent Highlights Spotlight */}
      {!loading && agents.length > 0 && (
        <section className="container-custom pt-12">
          <div className="mb-5">
            <span className="eyebrow">Agent Highlights</span>
            <h2 className="text-2xl font-display font-bold text-brand-navy mt-1">
              Featured Senior Specialists
            </h2>
          </div>

          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            spaceBetween={24}
            slidesPerView={1}
            navigation
            pagination={{ clickable: true }}
            autoplay={{ delay: 5500, disableOnInteraction: true }}
            className="rounded-2xl overflow-hidden shadow-brand-md bg-white border border-brand-navy/8"
          >
            {agents.map((agent) => (
              <SwiperSlide key={`highlight-${agent.id}`}>
                <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch min-h-[300px]">
                  <div className="lg:col-span-4 relative min-h-[240px] bg-brand-navy">
                    <img
                      src={agent.portrait_url || defaultExteriorImg}
                      alt={agent.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/70 via-transparent to-transparent" />
                    <span className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-brand-gold text-white text-xs font-bold">
                      <Award size={13} />
                      <span>Verified Senior Advisor</span>
                    </span>
                  </div>

                  <div className="lg:col-span-8 p-6 md:p-10 flex flex-col justify-between">
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-brand-gold">
                          {agent.role}
                        </span>
                        <span className="text-xs text-neutral-500">
                          Dari · Pashto · English
                        </span>
                      </div>
                      <h3 className="text-2xl md:text-3xl font-display font-bold text-brand-navy mb-3">
                        {agent.name}
                      </h3>
                      <p className="text-neutral-600 text-sm md:text-base leading-relaxed mb-6">
                        {agent.background}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-neutral-100">
                      <div className="flex flex-wrap items-center gap-3">
                        {agent.phone && (
                          <a
                            href={`tel:${agent.phone.replace(/[^\d+]/g, '')}`}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-navy text-white text-xs font-bold hover:bg-brand-gold transition-colors whitespace-nowrap"
                          >
                            <Phone size={14} />
                            <span>{agent.phone}</span>
                          </a>
                        )}
                        {agent.whatsapp && (
                          <a
                            href={`https://wa.me/${agent.whatsapp.replace(/[^\d]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#25D366] text-white text-xs font-bold hover:opacity-90 transition-opacity whitespace-nowrap"
                          >
                            <MessageCircle size={14} />
                            <span>WhatsApp</span>
                          </a>
                        )}
                      </div>

                      <Link
                        to={`/agents/${agent.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-gold hover:text-brand-navy transition-colors"
                      >
                        <span>View Full Profile</span>
                        <ArrowUpRight size={15} />
                      </Link>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </section>
      )}

      {/* 21st.dev Profile Cards + Motion.dev Hover and Page Transitions */}
      <section className="container-custom py-14 md:py-16 flex-grow">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex flex-wrap gap-2">
            {(['All', 'Residential', 'Commercial', 'Advisory'] as const).map((tab) => {
              const active = roleFilter === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setRoleFilter(tab)}
                  className={`relative px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? 'text-white'
                      : 'bg-white text-neutral-600 hover:text-brand-navy border border-brand-navy/10'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="agent-role-pill"
                      className="absolute inset-0 bg-brand-navy rounded-xl"
                      transition={{ type: 'spring', stiffness: 360, damping: 28 }}
                    />
                  )}
                  <span className="relative z-10">{tab}</span>
                </button>
              );
            })}
          </div>
          <span className="text-xs font-bold text-neutral-500 tabular-nums">
            {filteredAgents.length} Specialists Available
          </span>
        </div>

        {loading ? (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7"
            aria-label="Loading agents"
          >
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="h-[380px] rounded-2xl bg-white animate-pulse" />
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={roleFilter}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7"
            >
              {filteredAgents.map((agent) => (
                <motion.div
                  key={agent.id}
                  layout
                  whileHover={{ y: -6 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                  className="group flex flex-col justify-between overflow-hidden rounded-2xl bg-white border border-brand-navy/8 shadow-brand-sm hover:shadow-brand-lg hover:border-brand-gold/35 transition-all"
                >
                  <div>
                    <Link
                      to={`/agents/${agent.id}`}
                      className="block relative aspect-[4/3.6] overflow-hidden bg-brand-navy"
                    >
                      <img
                        src={agent.portrait_url || defaultExteriorImg}
                        alt={agent.name}
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/75 via-transparent to-transparent" />
                      <span className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white text-brand-navy group-hover:bg-brand-gold group-hover:text-white transition-colors shadow-md">
                        <ArrowUpRight size={18} />
                      </span>
                      <span className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 text-xs font-bold text-white">
                        <ShieldCheck size={14} className="text-brand-gold" />
                        <span>Verified Specialist</span>
                      </span>
                    </Link>

                    <div className="px-6 pt-5 pb-4">
                      <p className="text-xs font-bold text-brand-gold uppercase tracking-wider mb-1">
                        {agent.role}
                      </p>
                      <Link to={`/agents/${agent.id}`}>
                        <h2 className="text-xl font-bold text-brand-navy group-hover:text-brand-gold transition-colors">
                          {agent.name}
                        </h2>
                      </Link>
                      {agent.background && (
                        <p className="mt-2.5 text-xs text-neutral-600 leading-relaxed line-clamp-3">
                          {agent.background}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="px-6 py-4 border-t border-neutral-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {agent.phone && (
                        <a
                          href={`tel:${agent.phone.replace(/[^\d+]/g, '')}`}
                          aria-label={`Call ${agent.name}`}
                          className="p-2 rounded-lg bg-brand-ivory text-brand-navy hover:bg-brand-gold hover:text-white transition-colors"
                        >
                          <Phone size={14} />
                        </a>
                      )}
                      {agent.email && (
                        <a
                          href={`mailto:${agent.email}`}
                          aria-label={`Email ${agent.name}`}
                          className="p-2 rounded-lg bg-brand-ivory text-brand-navy hover:bg-brand-gold hover:text-white transition-colors"
                        >
                          <Mail size={14} />
                        </a>
                      )}
                    </div>

                    <Link
                      to={`/agents/${agent.id}`}
                      className="text-xs font-bold text-brand-navy group-hover:text-brand-gold transition-colors"
                    >
                      View Advisor Profile →
                    </Link>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </section>

      <Footer />
    </main>
  );
}
