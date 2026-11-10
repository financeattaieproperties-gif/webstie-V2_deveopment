import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useTranslation } from 'react-i18next';
import { MapPin, Calendar, Home, ArrowRight, Building2 } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { ProjectCard } from '../components/ui/ProjectCard';
import { ProjectCardSkeleton, ProjectSpotlightSkeleton } from '../components/ui/ProjectCardSkeleton';
import { Skeleton } from '../components/ui/Skeleton';
import { getProjects, type Project } from '../lib/dbService';
import { SeoHead } from '../components/seo/SeoHead';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import defaultExteriorImg from '../assets/images/project_exterior_elevation_1793995966183.jpg';
import defaultFurnishedPlanImg from '../assets/images/floorplan_furnished_3d_1793995968986.jpg';
import categoryProjectsImg from '../assets/images/category_master_projects_1794037429266.jpg';
import categoryCommercialImg from '../assets/images/category_commercial_plaza_1794037429778.jpg';

gsap.registerPlugin(ScrollTrigger);

const FILTER_STATUSES = ['All', 'Coming Soon', 'In Progress', 'Sold Out'] as const;

const FALLBACK_PROJECTS: Project[] = [];

export default function ProjectsPage() {
  const { t } = useTranslation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<(typeof FILTER_STATUSES)[number]>('All');

  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getProjects()
      .then((list) => {
        if (Array.isArray(list)) {
          setProjects(list);
        } else {
          setProjects([]);
        }
      })
      .catch(() => {
        setProjects([]);
      })
      .finally(() => setLoading(false));
  }, []);

  // GSAP Scroll Reveals on project cards
  useEffect(() => {
    if (loading || !gridRef.current) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      const cards = gridRef.current?.querySelectorAll('[data-project-card]');
      if (cards && cards.length > 0) {
        gsap.fromTo(
          cards,
          { opacity: 0, y: 28 },
          {
            opacity: 1,
            y: 0,
            duration: 0.65,
            stagger: 0.1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: gridRef.current,
              start: 'top 85%',
            },
          }
        );
      }
    }, gridRef);

    return () => ctx.revert();
  }, [loading, filter]);

  const visible =
    filter === 'All'
      ? projects
      : projects.filter(
          (project) =>
            (project.status === 'Under Construction' ? 'In Progress' : project.status) === filter
        );

  return (
    <main className="min-h-screen bg-brand-cream flex flex-col">
      <SeoHead context={{ filterStatus: filter }} />
      <Navbar />

      <section className="bg-brand-navy pt-36 pb-16 islamic-pattern relative overflow-hidden">
        <div className="container-custom relative z-10">
          <Breadcrumbs
            variant="light"
            items={[{ label: t('nav.projects', 'Projects') }]}
            className="mb-4"
          />
          <p className="text-brand-gold text-xs font-bold uppercase tracking-[.25em]">
            {t('projectsPage.eyebrow')}
          </p>
          <h1 className="mt-3 text-4xl md:text-5xl font-display font-bold text-white">
            {t('projectsPage.title')}
          </h1>
          <p className="mt-3 max-w-xl text-white/65 leading-relaxed">
            {t('projectsPage.subtitle')}
          </p>
        </div>
      </section>

      {/* Swiper Featured Developments Spotlight */}
      {(loading || projects.length > 0) && (
        <section className="container-custom pt-12">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div>
              <span className="eyebrow">Featured Developments</span>
              <h2 className="text-2xl font-display font-bold text-brand-navy mt-1">
                Kabul’s Flagship Multi-Unit Developments
              </h2>
            </div>
          </div>

          {loading ? (
            <ProjectSpotlightSkeleton />
          ) : (
            <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            spaceBetween={24}
            slidesPerView={1}
            navigation
            pagination={{ clickable: true }}
            autoplay={{ delay: 6000, disableOnInteraction: true }}
            className="rounded-2xl overflow-hidden shadow-brand-lg"
          >
            {projects.map((proj) => (
              <SwiperSlide key={`spotlight-${proj.id}`}>
                <div className="relative min-h-[340px] md:min-h-[380px] bg-brand-navy text-white grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
                  <div className="lg:col-span-6 p-8 md:p-12 flex flex-col justify-between relative z-10">
                    <div>
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-brand-gold text-white text-xs font-bold mb-4">
                        <Building2 size={13} />
                        <span>{proj.status}</span>
                      </div>
                      <h3 className="text-2xl md:text-3xl font-display font-bold text-white mb-3">
                        {proj.name}
                      </h3>
                      <p className="flex items-center gap-2 text-sm text-white/75 mb-4">
                        <MapPin size={15} className="text-brand-gold shrink-0" />
                        <span>{proj.location}</span>
                      </p>
                      {proj.description && (
                        <p className="text-sm text-white/70 leading-relaxed line-clamp-3 mb-6">
                          {proj.description}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4 pt-5 border-t border-white/15 tabular-nums">
                      <div className="flex items-center gap-5 text-xs">
                        {proj.available_units !== undefined && (
                          <span className="flex items-center gap-1.5 text-white/85 font-semibold">
                            <Home size={14} className="text-brand-gold" />
                            {proj.available_units} Units Open
                          </span>
                        )}
                        {proj.delivery_date && (
                          <span className="flex items-center gap-1.5 text-white/85 font-semibold">
                            <Calendar size={14} className="text-brand-gold" />
                            Delivery: {proj.delivery_date}
                          </span>
                        )}
                      </div>
                      <Link
                        to={`/projects/${proj.id}`}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-brand-navy hover:bg-brand-gold hover:text-white text-xs font-bold transition-colors whitespace-nowrap"
                      >
                        <span>Explore Masterplan</span>
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>

                  <div className="lg:col-span-6 relative min-h-[240px]">
                    <img
                      src={proj.image_url || defaultExteriorImg}
                      alt={proj.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-navy via-brand-navy/30 to-transparent hidden lg:block" />
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
          )}
        </section>
      )}

      {/* Editorial Project Cards Grid with Motion.dev Layout Transitions & GSAP Scroll Reveals */}
      <section className="container-custom py-14 flex-grow">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {FILTER_STATUSES.map((status) => {
              const active = filter === status;
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFilter(status)}
                  className={`relative rounded-xl px-4 py-2 text-sm font-bold transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? 'text-white'
                      : 'bg-white text-neutral-600 hover:text-brand-navy border border-brand-navy/10'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="projects-filter-pill"
                      className="absolute inset-0 bg-brand-navy rounded-xl"
                      transition={{ type: 'spring', stiffness: 360, damping: 28 }}
                    />
                  )}
                  <span className="relative z-10">{t(`projectsPage.filters.${status}`)}</span>
                </button>
              );
            })}
          </div>
          {loading ? (
            <Skeleton className="h-4 w-44 rounded bg-neutral-200" />
          ) : (
            <span className="text-xs font-bold text-neutral-500 tabular-nums">
              Showing {visible.length} of {projects.length} Developments
            </span>
          )}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={loading ? 'loading' : filter}
            ref={gridRef}
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
          >
            {loading ? (
              Array.from({ length: 6 }).map((_, idx) => <ProjectCardSkeleton key={idx} />)
            ) : visible.length ? (
              visible.map((project) => (
                <div key={project.id} data-project-card>
                  <ProjectCard
                    id={String(project.id)}
                    name={project.name}
                    location={project.location}
                    deliveryDate={project.delivery_date ?? undefined}
                    status={project.status}
                    availableUnits={project.available_units}
                    totalUnits={project.total_units}
                    description={project.description}
                    image={project.image_url || defaultExteriorImg}
                  />
                </div>
              ))
            ) : (
              <p className="text-neutral-500 col-span-full py-12 text-center">
                {t('projectsPage.empty')}
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </section>
      <Footer />
    </main>
  );
}
