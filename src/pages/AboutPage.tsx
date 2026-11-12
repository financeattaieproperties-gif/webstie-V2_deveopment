import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  MapPin,
  Phone,
  Mail,
  Award,
  Users,
  Home,
  ShieldCheck,
  Building2,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import {
  Footer,
  OFFICIAL_SOCIAL_LINKS,
  FacebookIcon,
  YoutubeIcon,
} from '../components/layout/Footer';
import { getBranches, type Branch } from '../lib/dbService';
import { SeoHead } from '../components/seo/SeoHead';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { useTranslation } from 'react-i18next';
import stitchHeroImg from '../assets/images/stitch_hero_kabul_panorama.jpg';
import defaultExteriorImg from '../assets/images/project_exterior_elevation_1793995966183.jpg';
import categoryCommercialImg from '../assets/images/category_commercial_plaza_1794037429778.jpg';
import categoryProjectsImg from '../assets/images/category_master_projects_1794037429266.jpg';
import stitchVillaImg from '../assets/images/stitch_villa_exterior.jpg';

gsap.registerPlugin(ScrollTrigger);

const stats = [
  { icon: Home, value: '500+', label: 'Verified Properties Listed' },
  { icon: Users, value: '1,200+', label: 'Families & Investors Served' },
  { icon: Award, value: '10+ Years', label: 'Operating Across Kabul' },
];

const BRAND_STORY_CHAPTERS = [
  {
    year: '2015',
    number: '01.',
    title: 'Founding in Wazir Akbar Khan',
    summary:
      'Attaie Properties was established on Street #13, Wazir Akbar Khan with a clear mandate: bring legal title verification (Qabala Sharaee) and transparent pricing to Kabul’s residential market.',
  },
  {
    year: '2018',
    number: '02.',
    title: 'Diaspora & Diplomatic Advisory Desk',
    summary:
      'Expanded to serve overseas Afghan families in Europe, North America, and the Gulf with remote video inspections, power-of-attorney documentation support, and escrow-backed closings.',
  },
  {
    year: '2022',
    number: '03.',
    title: 'Signature Multi-Unit Developments',
    summary:
      'Partnered with Kabul’s premier structural engineering firms to represent multi-story residential and commercial plazas in Shahr-e-Naw, Ansari Square, and Karte Parwan.',
  },
  {
    year: '2026',
    number: '04.',
    title: 'Digital Real Estate & Interactive Masterplan Platform',
    summary:
      'Launched interactive 3D floor plan inspection, neighborhood Google Maps routing, and real-time unit inventory tracking for modern buyers across Afghanistan’s capital.',
  },
];

const MILESTONE_SLIDES = [
  {
    year: '2015 — Wazir Akbar Khan HQ',
    title: 'Diplomatic Quarter Flagship Office',
    caption: 'Establishing our primary advisory headquarters on Street #13, Wazir Akbar Khan.',
    image: stitchHeroImg,
  },
  {
    year: '2019 — Executive Residences',
    title: 'Karte Parwan & Darulaman Villa Portfolio',
    caption: 'Curating private walled family compounds and executive residences across Kabul.',
    image: stitchVillaImg,
  },
  {
    year: '2023 — Commercial Landmarks',
    title: 'Shahr-e-Naw Grade-A Retail & Office Plazas',
    caption: 'Structuring high-yield commercial real estate opportunities in Ansari Square.',
    image: categoryCommercialImg,
  },
  {
    year: '2026 — Signature Towers',
    title: 'Residential & Multi-Tower Developments',
    caption: 'Seismic-grade modern apartment living with 24/7 solar-hybrid microgrids.',
    image: defaultExteriorImg,
  },
  {
    year: '2026 — Masterplan Engineering',
    title: 'Next-Generation Urban Horizon',
    caption: 'Connecting local families and global Afghan diaspora investors with verified developments.',
    image: categoryProjectsImg,
  },
];

const FALLBACK_BRANCHES: Branch[] = [
  {
    id: 1,
    name: 'Wazir Akbar Khan Headquarters',
    address: 'Street #13, Wazir Akbar Khan, Kabul, Afghanistan',
    phone: '+93 782 222 279',
    email: 'info@attaieproperties.com',
  },
  {
    id: 2,
    name: 'Shahr-e-Naw Development Sales Office',
    address: 'Ansari Square, Shahr-e-Naw, Kabul, Afghanistan',
    phone: '+93 782 222 279',
    email: 'sales@attaieproperties.com',
  },
];

export default function AboutPage() {
  const { t } = useTranslation();
  const [branches, setBranches] = useState<Branch[]>(FALLBACK_BRANCHES);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [activeStoryIdx, setActiveStoryIdx] = useState(0);

  const pinnedStorySectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getBranches()
      .then((list) => {
        if (Array.isArray(list) && list.length > 0) {
          setBranches(list);
        } else {
          setBranches(FALLBACK_BRANCHES);
        }
      })
      .catch(() => setBranches(FALLBACK_BRANCHES))
      .finally(() => setBranchesLoading(false));
  }, []);

  // GSAP Pinned / Scroll-Triggered Brand Story Choreography
  useEffect(() => {
    if (!pinnedStorySectionRef.current) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      const chapters = pinnedStorySectionRef.current?.querySelectorAll('[data-brand-chapter]');
      if (!chapters || chapters.length === 0) return;

      chapters.forEach((chapterEl, idx) => {
        gsap.fromTo(
          chapterEl,
          { opacity: 0.35, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 0.55,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: chapterEl,
              start: 'top 75%',
              end: 'bottom 45%',
              onEnter: () => setActiveStoryIdx(idx),
              onEnterBack: () => setActiveStoryIdx(idx),
            },
          }
        );
      });
    }, pinnedStorySectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <main className="min-h-screen bg-brand-cream flex flex-col">
      <SeoHead />
      <Navbar />

      {/* Hero */}
      <section className="relative pt-36 pb-20 bg-brand-navy overflow-hidden">
        <div className="absolute inset-0 islamic-pattern opacity-20" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand-gold/40 to-transparent" />
        <div className="container-custom relative z-10 text-center">
          <div className="flex justify-center mb-4">
            <Breadcrumbs
              variant="light"
              items={[{ label: t('nav.about', 'About Us') }]}
              className="w-auto"
            />
          </div>
          <p className="text-brand-gold text-xs font-bold uppercase tracking-[0.3em] mb-4">
            Kabul, Afghanistan
          </p>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
            About Attaie Properties
          </h1>
          <p className="text-white/70 max-w-2xl mx-auto text-lg leading-relaxed">
            Kabul’s premier real estate agency and development partner — trusted by Afghan families,
            diplomatic missions, and the global diaspora for over a decade.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-neutral-100">
        <div className="container-custom py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 tabular-nums">
            {stats.map(({ icon: Icon, value, label }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center text-center gap-3"
              >
                <div className="w-14 h-14 rounded-2xl bg-brand-gold/10 flex items-center justify-center">
                  <Icon size={26} className="text-brand-gold" />
                </div>
                <p className="text-3xl font-display font-bold text-brand-navy">{value}</p>
                <p className="text-neutral-500 text-sm font-medium">{label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* GSAP Pinned Brand Story + 21st.dev Editorial Sections */}
      <section ref={pinnedStorySectionRef} className="container-custom py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Sticky / Pinned Left Narrative Anchor */}
          <div className="lg:col-span-5 lg:sticky lg:top-28 bg-brand-navy text-white rounded-2xl p-8 md:p-10 shadow-brand-xl relative overflow-hidden">
            <div className="absolute inset-0 islamic-pattern opacity-15 pointer-events-none" />
            <div className="relative z-10">
              <span className="eyebrow inline-block mb-3">OUR BRAND STORY</span>
              <h2 className="text-3xl font-display font-bold text-white leading-tight mb-4">
                A Decade of Verified Trust in Afghanistan’s Capital
              </h2>
              <p className="text-white/70 text-sm leading-relaxed mb-6">
                Attaie Properties was founded with a single mission: to make buying, selling, and
                investing in Kabul real estate transparent, legally verified, and straightforward.
              </p>

              <div className="p-4 rounded-xl bg-white/10 border border-white/15 mb-6">
                <p className="text-xs font-bold text-brand-gold uppercase tracking-wider mb-1">
                  Active Chapter · {BRAND_STORY_CHAPTERS[activeStoryIdx]?.year}
                </p>
                <p className="text-base font-bold text-white">
                  {BRAND_STORY_CHAPTERS[activeStoryIdx]?.title}
                </p>
              </div>

              <div className="space-y-2.5 text-xs text-white/80">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-brand-gold shrink-0" />
                  <span>100% Title-Verified Listings (Qabala Sharaee &amp; Customary Deeds)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-brand-gold shrink-0" />
                  <span>Trilingual Legal &amp; Advisory Team (Dari, Pashto, English)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-brand-gold shrink-0" />
                  <span>Direct Developer Representation with Zero Hidden Commissions</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Scroll-Scrubbed Editorial Timeline Chapters */}
          <div className="lg:col-span-7 space-y-6">
            {BRAND_STORY_CHAPTERS.map((ch, idx) => {
              const isCurrent = idx === activeStoryIdx;
              return (
                <div
                  key={ch.year}
                  data-brand-chapter
                  onMouseEnter={() => setActiveStoryIdx(idx)}
                  className={`rounded-2xl p-7 md:p-8 bg-white transition-all duration-300 border ${
                    isCurrent
                      ? 'border-brand-gold shadow-brand-lg'
                      : 'border-brand-navy/8 shadow-brand-sm'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 mb-3 tabular-nums">
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-gold">
                      {ch.number} Milestone
                    </span>
                    <span className="px-3 py-1 rounded-lg bg-brand-navy text-white text-xs font-bold">
                      {ch.year}
                    </span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-display font-bold text-brand-navy mb-2.5">
                    {ch.title}
                  </h3>
                  <p className="text-neutral-600 text-sm md:text-base leading-relaxed">
                    {ch.summary}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Swiper Milestone Images Carousel */}
      <section className="py-16 bg-white border-y border-neutral-200/70">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <span className="eyebrow">ARCHITECTURAL MILESTONES</span>
              <h2 className="text-3xl font-display font-bold text-brand-navy mt-1">
                Shaping Kabul’s Residential &amp; Commercial Skyline
              </h2>
            </div>
            <p className="text-sm text-neutral-500 max-w-md">
              Swipe through key architectural milestones across Wazir Akbar Khan, Shahr-e-Naw, and
              Karte Parwan.
            </p>
          </div>

          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            spaceBetween={24}
            slidesPerView={1}
            navigation
            pagination={{ clickable: true }}
            autoplay={{ delay: 5000, disableOnInteraction: true }}
            breakpoints={{
              640: { slidesPerView: 1.4 },
              1024: { slidesPerView: 2.2 },
            }}
            className="pb-12"
          >
            {MILESTONE_SLIDES.map((slide) => (
              <SwiperSlide key={slide.title}>
                <div className="group rounded-2xl overflow-hidden bg-brand-navy border border-brand-navy/10 shadow-brand-md">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <img
                      src={slide.image}
                      alt={slide.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/90 via-brand-navy/30 to-transparent" />
                    <div className="absolute bottom-4 left-5 right-5 text-white">
                      <span className="text-xs font-bold uppercase tracking-wider text-brand-gold">
                        {slide.year}
                      </span>
                      <h3 className="text-xl font-display font-bold text-white mt-0.5">
                        {slide.title}
                      </h3>
                      <p className="text-xs text-white/75 mt-1 line-clamp-2">{slide.caption}</p>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>

      {/* Admin-managed branch directory */}
      <section className="container-custom py-16">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-gold mb-2">
            Find us
          </p>
          <h2 className="text-2xl md:text-3xl font-display font-bold text-brand-navy">
            Our Kabul Branches
          </h2>
        </div>
        {branchesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5" aria-label="Loading branches">
            {[0, 1].map((item) => (
              <div key={item} className="h-36 rounded-2xl bg-white animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {branches.map((branch) => (
              <motion.article
                key={branch.id}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="rounded-2xl border border-brand-navy/8 bg-white p-6 shadow-brand-sm hover:border-brand-gold/35 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-gold/10">
                    <Building2 size={20} className="text-brand-gold" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-brand-navy">{branch.name}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-neutral-600">
                      {branch.address}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                      {branch.phone && (
                        <a
                          className="inline-flex items-center gap-2 font-semibold text-brand-navy hover:text-brand-gold"
                          href={`tel:${branch.phone.replace(/[^\d+]/g, '')}`}
                        >
                          <Phone size={15} />
                          {branch.phone}
                        </a>
                      )}
                      {branch.email && (
                        <a
                          className="inline-flex items-center gap-2 font-semibold text-brand-navy hover:text-brand-gold"
                          href={`mailto:${branch.email}`}
                        >
                          <Mail size={15} />
                          {branch.email}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </section>

      {/* Contact strip */}
      <section className="bg-brand-navy mt-auto">
        <div className="container-custom py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-8 border-b border-white/10">
            {[
              {
                icon: MapPin,
                label: 'Address',
                value: 'Street #13, Wazir Akbar Khan, Kabul, Afghanistan',
              },
              { icon: Phone, label: 'Phone', value: '+93 782 222 279', href: 'tel:+93782222279' },
              {
                icon: Mail,
                label: 'Email',
                value: 'info@attaieproperties.com',
                href: 'mailto:info@attaieproperties.com',
              },
            ].map(({ icon: Icon, label, value, href }) => (
              <div key={label} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-brand-gold/15 flex items-center justify-center shrink-0">
                  <Icon size={18} className="text-brand-gold" />
                </div>
                <div>
                  <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-1">
                    {label}
                  </p>
                  {href ? (
                    <a
                      href={href}
                      className="text-white hover:text-brand-gold transition-colors text-sm font-medium"
                    >
                      {value}
                    </a>
                  ) : (
                    <p className="text-white text-sm font-medium">{value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Official Facebook & YouTube Channels row */}
          <div className="pt-8">
            <p className="text-brand-gold text-xs font-bold uppercase tracking-widest mb-4">
              Follow Our Official Facebook &amp; YouTube Channels
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {OFFICIAL_SOCIAL_LINKS.map((social) => {
                const Icon = social.platform === 'facebook' ? FacebookIcon : YoutubeIcon;
                return (
                  <a
                    key={social.url}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between gap-3 p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-brand-gold/40 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-brand-gold/15 flex items-center justify-center shrink-0 text-brand-gold group-hover:bg-brand-gold group-hover:text-white transition-colors">
                        <Icon size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider leading-none mb-1">
                          {social.label}
                        </p>
                        <p
                          className="text-xs font-semibold text-white group-hover:text-brand-gold transition-colors truncate"
                          dir="auto"
                        >
                          {social.name}
                        </p>
                      </div>
                    </div>
                    <ExternalLink
                      size={14}
                      className="text-white/40 group-hover:text-brand-gold shrink-0 transition-colors"
                    />
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
