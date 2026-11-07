import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ShieldCheck, Layers, Sun, Compass, ArrowRight } from 'lucide-react';
import exteriorImg from '../../assets/images/project_exterior_elevation_1793995966183.jpg';
import furnishedPlanImg from '../../assets/images/floorplan_furnished_3d_1793995968986.jpg';
import technicalBlueprintImg from '../../assets/images/floorplan_technical_blueprint_1793995969202.jpg';

gsap.registerPlugin(ScrollTrigger);

const STORY_CHAPTERS = [
  {
    id: 'elevation',
    number: '01.',
    title: 'Seismic-Grade Reinforced Concrete & Facade Engineering',
    subtitle: 'Engineered for Kabul’s Mountain Basin',
    description:
      'Every signature tower represented by Attaie Properties undergoes multi-stage structural verification, deep-foundation soil testing, and thermal double-glazed travertine facade detailing built for Kabul’s cuatro-season climate.',
    metricValue: 'Zone-4',
    metricLabel: 'Seismic Structural Standard',
    image: exteriorImg,
    layerBadge: 'Exterior Elevation Render',
    icon: ShieldCheck,
  },
  {
    id: 'spatial',
    number: '02.',
    title: 'Dual-Zone Afghan Hospitality & Private Family Living',
    subtitle: 'Dedicated Mehmankhana Reception Architecture',
    description:
      'Floor plates are thoughtfully zoned with dual entryways — separating formal Mehmankhana guest reception halls from private family living quarters, sunlit bedrooms, and panoramic wrap-around terraces.',
    metricValue: '175–420 m²',
    metricLabel: 'Floor Plate Configurations',
    image: furnishedPlanImg,
    layerBadge: '3D Furnished Spatial Plan',
    icon: Layers,
  },
  {
    id: 'autonomy',
    number: '03.',
    title: '24/7 Solar-Hybrid Power, Deep-Well Filtration & Security',
    subtitle: 'Self-Sustaining Residential Infrastructure',
    description:
      'Modern developments integrate rooftop solar-hybrid microgrids, dedicated deep-well water purification systems, heated underground parking, and biometric diplomatic-grade perimeter security.',
    metricValue: '99.8%',
    metricLabel: 'Utility & Power Continuity',
    image: technicalBlueprintImg,
    layerBadge: 'Technical CAD Blueprint',
    icon: Sun,
  },
] as const;

export function ArchitecturalStorytellingSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsContainerRef = useRef<HTMLDivElement>(null);
  const visualFrameRef = useRef<HTMLDivElement>(null);
  const [activeChapterIdx, setActiveChapterIdx] = useState(0);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      if (headerRef.current) {
        gsap.fromTo(
          headerRef.current.children,
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            stagger: 0.1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: headerRef.current,
              start: 'top 85%',
            },
          }
        );
      }

      if (cardsContainerRef.current) {
        const chapterNodes = cardsContainerRef.current.querySelectorAll('[data-story-chapter]');
        gsap.fromTo(
          chapterNodes,
          { opacity: 0, x: -24 },
          {
            opacity: 1,
            x: 0,
            duration: 0.65,
            stagger: 0.14,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: cardsContainerRef.current,
              start: 'top 82%',
            },
          }
        );
      }

      if (visualFrameRef.current) {
        gsap.fromTo(
          visualFrameRef.current,
          { opacity: 0, scale: 0.96, y: 20 },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: visualFrameRef.current,
              start: 'top 82%',
            },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const currentChapter = STORY_CHAPTERS[activeChapterIdx] ?? STORY_CHAPTERS[0];

  return (
    <section
      ref={sectionRef}
      className="py-20 bg-brand-navy text-white relative overflow-hidden"
    >
      <div className="absolute inset-0 islamic-pattern opacity-15 pointer-events-none" />
      <div className="container-custom relative z-10">
        {/* Section Header */}
        <div
          ref={headerRef}
          className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12"
        >
          <div className="max-w-2xl">
            <span className="eyebrow inline-block mb-3 tracking-[0.22em]">
              ARCHITECTURAL STORYTELLING
            </span>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white leading-tight">
              Engineered for Kabul’s Horizon &amp; Generational Living
            </h2>
          </div>
          <p className="text-white/65 text-sm md:text-base max-w-md leading-relaxed">
            Explore how every signature development in our portfolio combines structural resilience,
            authentic Afghan spatial privacy, and self-sustaining infrastructure.
          </p>
        </div>

        {/* 2-Column Interactive Storytelling Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: 3 Interactive Architectural Chapters */}
          <div ref={cardsContainerRef} className="lg:col-span-6 flex flex-col justify-between gap-4">
            {STORY_CHAPTERS.map((chapter, index) => {
              const Icon = chapter.icon;
              const isActive = index === activeChapterIdx;

              return (
                <button
                  key={chapter.id}
                  type="button"
                  data-story-chapter
                  onClick={() => setActiveChapterIdx(index)}
                  onMouseEnter={() => setActiveChapterIdx(index)}
                  className={`text-left w-full rounded-2xl p-6 transition-all duration-300 cursor-pointer border ${
                    isActive
                      ? 'bg-white/10 border-brand-gold shadow-gold-sm'
                      : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-white/25'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-colors ${
                          isActive
                            ? 'bg-brand-gold text-white'
                            : 'bg-white/10 text-white/70'
                        }`}
                      >
                        <Icon size={17} />
                      </span>
                      <div>
                        <span className="text-xs font-bold text-brand-gold tracking-wider">
                          {chapter.number} {chapter.subtitle}
                        </span>
                        <h3 className="text-lg font-display font-bold text-white mt-0.5">
                          {chapter.title}
                        </h3>
                      </div>
                    </div>
                    <div className="text-right shrink-0 hidden sm:block tabular-nums">
                      <div className="text-base font-extrabold text-brand-gold">
                        {chapter.metricValue}
                      </div>
                      <div className="text-[11px] text-white/55">{chapter.metricLabel}</div>
                    </div>
                  </div>
                  <p className="text-sm text-white/70 leading-relaxed pl-12">
                    {chapter.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Right Column: Interactive Architectural Layer Viewport */}
          <div
            ref={visualFrameRef}
            className="lg:col-span-6 relative rounded-2xl overflow-hidden border border-white/15 bg-brand-navy-deep min-h-[420px] flex flex-col justify-between"
          >
            <AnimatePresence mode="wait">
              <motion.img
                key={currentChapter.id}
                src={currentChapter.image}
                alt={currentChapter.title}
                referrerPolicy="no-referrer"
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </AnimatePresence>

            <div className="absolute inset-0 bg-gradient-to-t from-brand-navy-deep/90 via-brand-navy-deep/25 to-transparent pointer-events-none" />

            {/* Top Layer Switcher Controls */}
            <div className="relative z-10 p-5 flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-navy/85 backdrop-blur-md border border-white/15 text-xs font-bold text-white">
                <Compass size={14} className="text-brand-gold" />
                <span>{currentChapter.layerBadge}</span>
              </span>

              <div className="flex items-center gap-1.5 bg-brand-navy/85 backdrop-blur-md p-1 rounded-xl border border-white/15">
                {STORY_CHAPTERS.map((ch, idx) => (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => setActiveChapterIdx(idx)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                      idx === activeChapterIdx
                        ? 'bg-brand-gold text-white'
                        : 'text-white/70 hover:text-white'
                    }`}
                  >
                    {ch.number}
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom Caption Overlay */}
            <div className="relative z-10 p-6 md:p-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-brand-gold mb-1">
                  {currentChapter.metricValue} · {currentChapter.metricLabel}
                </p>
                <h4 className="text-xl font-display font-bold text-white">
                  {currentChapter.title}
                </h4>
              </div>
              <Link
                to="/projects"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-brand-navy hover:bg-brand-gold hover:text-white font-bold text-xs transition-colors shrink-0 whitespace-nowrap"
              >
                <span>Inspect Developments</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
