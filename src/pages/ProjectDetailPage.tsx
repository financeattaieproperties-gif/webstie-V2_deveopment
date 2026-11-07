import React, { Suspense, lazy, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import {
  MapPin,
  ArrowLeft,
  Calendar,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { getProject, type Project } from '@/lib/dbService';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { WhatsAppButton } from '@/components/ui/WhatsAppButton';
import { ClickToCallButton } from '@/components/ui/ClickToCallButton';
import { ProjectUnitsSection } from '@/components/project/ProjectUnitsSection';
import { PaymentPlanComparisonCard } from '@/components/project/PaymentPlanComparisonCard';
import { MapSkeleton } from '@/components/map/MapSkeleton';
import fallbackProjectHeroImg from '@/assets/images/project_exterior_elevation_1793995966183.jpg';
import fallbackAptImg from '@/assets/images/stitch_apartment_interior.jpg';
import fallbackHouseImg from '@/assets/images/category_master_projects_1794037429266.jpg';

const PremiumProjectExplorer = lazy(() =>
  import('@/components/project/PremiumProjectExplorer').then((m) => ({
    default: m.PremiumProjectExplorer,
  }))
);
const AttaieGoogleMap = lazy(() =>
  import('@/components/map/AttaieGoogleMap').then((m) => ({ default: m.AttaieGoogleMap }))
);

const FALLBACK_SHOWCASE_PROJECT: Project = {
  id: 1,
  name: 'Kabul Plaza Saljuqi',
  location: 'Shahr-e-Naw, District 10, Kabul, Afghanistan',
  delivery_date: 'Q4 2027',
  status: 'In Progress',
  available_units: 24,
  total_units: 31,
  image_url: '/assets/kabul-plaza-saljuqi/building_exterior_cover.png',
  gallery_images: [
    '/assets/kabul-plaza-saljuqi/building_exterior_cover.png',
    '/assets/kabul-plaza-saljuqi/building_exterior_sunset.png',
    '/assets/kabul-plaza-saljuqi/floor_typical_2_to_10_furnished_masterplan.png',
    '/assets/kabul-plaza-saljuqi/floor_11_vip_furnished_masterplan.png',
    '/assets/kabul-plaza-saljuqi/floor_01_commercial_furnished_masterplan.png',
  ],
  video_url: null,
  masterplan_image: '/assets/kabul-plaza-saljuqi/floor_typical_2_to_10_furnished_masterplan.png',
  description:
    'Kabul Plaza Saljuqi offers modern 3, 4, and 5-bedroom luxury apartments with separate guest rooms (Mehmankhana) in the prime commercial and residential heart of Shahr-e-Naw, Kabul. Featuring 11 stories with a 1st floor commercial supermarket, 2nd to 10th typical residential floors (Units A, B, C), and 11th floor VIP penthouse terrace residences. Built with reinforced seismic-resistant concrete, dual elevators, underground car parking ramp, central heating, and 24/7 solar backup.',
  created_at: '2026-01-01',
};

const PROJECT_FEATURES = [
  'Seismic-resistant concrete structure',
  '24/7 Security & CCTV surveillance',
  'Underground heated parking',
  'High-speed passenger & service elevators',
  'Dedicated backup solar & generator system',
  'Central heating & acoustic double glazing',
];

const FALLBACK_PROJECTS: Record<number, Project> = {
  1: FALLBACK_SHOWCASE_PROJECT,
  2: {
    id: 2,
    name: 'Moon Residency',
    location: 'Kart-e-Char, District 3, Kabul, Afghanistan',
    delivery_date: 'Q3 2027',
    status: 'Under Construction',
    available_units: 28,
    total_units: 36,
    image_url: '/assets/moon-residency/building_exterior_cover.png',
    gallery_images: [
      '/assets/moon-residency/building_exterior_cover.png',
      '/assets/moon-residency/floor_typical_2_to_10_furnished_masterplan.png',
      '/assets/moon-residency/floor_01_commercial_furnished_masterplan.png',
    ],
    video_url: null,
    masterplan_image: '/assets/moon-residency/floor_typical_2_to_10_furnished_masterplan.png',
    description:
      'Moon Residency by Kabul Plaza Developments is an architectural residential landmark on the main boulevard of Kart-e-Char, Kabul. Featuring 10 floors with a 1st floor commercial shopping galleria (525 m²) and 2nd to 10th typical residential floors with four distinct apartment typologies (Units 01, 02, 03, 04) per floor. Built with seismic-rated reinforced concrete, dual passenger elevators, underground car parking ramp, central heating, and 24/7 backup power.',
    created_at: '2026-01-20',
  },
  3: {
    id: 3,
    name: 'Kabul Plaza Burj',
    location: 'Ansari Square, Shahr-e-Naw, Kabul, Afghanistan',
    delivery_date: 'Q2 2028',
    status: 'Under Construction',
    available_units: 42,
    total_units: 60,
    image_url: '/assets/kabul-plaza-burj/building_exterior_cover.png',
    gallery_images: [
      '/assets/kabul-plaza-burj/building_exterior_cover.png',
      '/assets/kabul-plaza-burj/floor_typical_furnished_masterplan.png',
      '/assets/kabul-plaza-burj/floor_01_mall_furnished_masterplan.png',
      '/assets/kabul-plaza-burj/floor_03_studios_furnished_masterplan.png',
      '/assets/kabul-plaza-burj/floor_05_garden_furnished_masterplan.png',
      '/assets/kabul-plaza-burj/floor_15_penthouse_furnished_masterplan.png',
    ],
    video_url: null,
    masterplan_image: '/assets/kabul-plaza-burj/floor_typical_furnished_masterplan.png',
    description:
      'Kabul Plaza Burj is a landmark 15-story tower at Ansari Square in Shahr-e-Naw, Kabul. It integrates a 2-level commercial shopping galleria (Kabul Mall, 63 premier retail shops), 3rd & 4th floor executive studio residences (28 studios), 5th floor private garden terrace, 6th to 14th typical luxury residential floors offering 6 expansive apartments per floor (3+1 and 4+1 layouts from 171.66 m² to 279.46 m²), and 15th-floor grand VIP penthouse suites (1212.7 m²). Engineered with reinforced seismic damping concrete, 3 high-speed elevators, multi-level underground parking, central climate control, and uninterrupted 24/7 backup power.',
    created_at: '2026-01-25',
  },
  4: {
    id: 4,
    name: 'Kabul Plaza 12',
    location: 'Main Boulevard, Kart-e-Char, Kabul, Afghanistan',
    delivery_date: 'Q1 2028',
    status: 'Under Construction',
    available_units: 16,
    total_units: 24,
    image_url: '/assets/kabul-plaza-12/building_exterior_cover.png',
    gallery_images: [
      '/assets/kabul-plaza-12/building_exterior_cover.png',
      '/assets/kabul-plaza-12/floor_typical_furnished_masterplan.png',
      '/assets/kabul-plaza-12/floor_01_commercial_furnished_masterplan.png',
      '/assets/kabul-plaza-12/floor_04_09_furnished_masterplan.png',
      '/assets/kabul-plaza-12/floor_10_penthouse_furnished_masterplan.png',
    ],
    video_url: null,
    masterplan_image: '/assets/kabul-plaza-12/floor_typical_furnished_masterplan.png',
    description:
      'Kabul Plaza 12 is a 10-story mixed-use development situated on the main boulevard of Kart-e-Char, Kabul. Featuring a 1st floor commercial shopping center (310 m²), a 2nd floor business level (316.12 m²), 3rd to 8th typical residential floors with symmetrical 3+1 luxury residences (158.06 m² each with private guest Mehmankhana), 4th & 9th floor terrace apartments (157.25 m²), and a 10th floor exclusive rooftop penthouse residence (179.96 m²). Designed with seismic-resistant frame, dual elevators, underground car park, and solar backup.',
    created_at: '2026-01-28',
  },
  5: {
    id: 5,
    name: 'Kabul Plaza 09 (ABC)',
    location: 'Haj o Awqaf, Shahr-e-Naw, Kabul, Afghanistan',
    delivery_date: 'Q4 2027',
    status: 'Under Construction',
    available_units: 11,
    total_units: 18,
    image_url: '/assets/kabul-plaza-abc/building_exterior_cover.png',
    gallery_images: [
      '/assets/kabul-plaza-abc/building_exterior_cover.png',
      '/assets/kabul-plaza-abc/floor_typical_furnished_masterplan.png',
      '/assets/kabul-plaza-abc/floor_01_commercial_furnished_masterplan.png',
      '/assets/kabul-plaza-abc/floor_duplex_furnished_masterplan.png',
    ],
    video_url: null,
    masterplan_image: '/assets/kabul-plaza-abc/floor_typical_furnished_masterplan.png',
    description:
      'Kabul Plaza ABC (Kabul Plaza 09) is an exclusive boutique residential tower located in the prestigious Haj o Awqaf / Shahr-e-Naw district of Kabul. Offering 9 stories including 1st floor commercial retail (170 m²), 2nd to 7th typical floors featuring two spacious 4+1 bedroom residences per floor (175.08 m² and 167.68 m²), and dramatic 8th & 9th floor two-story Duplex Penthouses (346.8 m² and 332.8 m² with private green sky-roof terraces). Built with premium imported finishes, earthquake-engineered structural frame, high-speed elevator, and 24/7 security.',
    created_at: '2026-02-01',
  },
};

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const isRtl = i18n.language === 'fa';

  useEffect(() => {
    const numericId = Number(id) || 1;
    setLoading(true);
    getProject(numericId)
      .then((data) => {
        if (data && typeof data === 'object' && 'name' in data) {
          setProject(data);
        } else if (FALLBACK_PROJECTS[numericId]) {
          setProject(FALLBACK_PROJECTS[numericId]);
        } else {
          setProject(null);
        }
      })
      .catch(() => {
        setProject(FALLBACK_PROJECTS[numericId] || null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-24 pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-pulse space-y-6">
            <div className="h-96 bg-gray-200 rounded-xl" />
            <div className="h-8 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-200 rounded w-1/3" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-24 pb-16 flex items-center justify-center">
          <div className="text-center">
            <p className="text-2xl font-bold text-brand-navy mb-4">
              Project not found
            </p>
            <Link to="/projects">
              <Button variant="primary">{t('property.backToList', 'Back to Projects')}</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const name = project.name;
  const location = project.location;
  const description = project.description;

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>{name} | Attaie Properties</title>
        <meta name="description" content={description?.slice(0, 155) ?? `${name} – ${location}`} />
        <link rel="canonical" href={`https://attaieproperties.af/projects/${project.id}`} />
        <meta property="og:title" content={`${name} | Attaie Properties`} />
        <meta property="og:description" content={description?.slice(0, 155) ?? ''} />
        {project.image_url && <meta property="og:image" content={project.image_url} />}
      </Helmet>

      <Navbar />

      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/projects"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-brand-gold mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            {t('property.backToList', 'Back to Projects')}
          </Link>

          {/* Interactive 50/50 Elevation + X-Ray Split Project Explorer */}
          <Suspense
            fallback={
              <div className="w-full h-[520px] rounded-3xl bg-brand-navy/5 border border-brand-navy/10 animate-pulse my-6 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-10 h-10 rounded-full border-2 border-brand-gold border-t-transparent animate-spin mb-3" />
                <p className="text-xs font-bold uppercase tracking-wider text-brand-navy">
                  Loading Interactive Elevation &amp; X-Ray Explorer…
                </p>
              </div>
            }
          >
            <PremiumProjectExplorer
              projectId={project.id}
              projectName={name}
              projectLocation={location}
              deliveryDate={project.delivery_date}
              initialExteriorUrl={
                project.image_url ||
                (project.id === 2
                  ? '/assets/moon-residency/building_exterior_cover.png'
                  : project.id === 3
                  ? '/assets/kabul-plaza-burj/building_exterior_cover.png'
                  : project.id === 4
                  ? '/assets/kabul-plaza-12/building_exterior_cover.png'
                  : project.id === 5
                  ? '/assets/kabul-plaza-abc/building_exterior_cover.png'
                  : '/assets/kabul-plaza-saljuqi/building_exterior_cover.png')
              }
              initialTechnicalPlanUrl={
                project.id === 2
                  ? '/assets/moon-residency/apt_01_technical.png'
                  : project.id === 3
                  ? '/assets/kabul-plaza-burj/apt_burj_a_technical.png'
                  : project.id === 4
                  ? '/assets/kabul-plaza-12/apt_typical_a_technical.png'
                  : project.id === 5
                  ? '/assets/kabul-plaza-abc/apt_a_technical.png'
                  : '/assets/kabul-plaza-saljuqi/apt_typical_a_technical.png'
              }
              initialFurnishedPlanUrl={
                project.id === 2
                  ? '/assets/moon-residency/apt_01_furnished.png'
                  : project.id === 3
                  ? '/assets/kabul-plaza-burj/apt_burj_a_furnished.png'
                  : project.id === 4
                  ? '/assets/kabul-plaza-12/apt_typical_a_furnished.png'
                  : project.id === 5
                  ? '/assets/kabul-plaza-abc/apt_a_furnished.png'
                  : '/assets/kabul-plaza-saljuqi/apt_typical_a_furnished.png'
              }
            />
          </Suspense>

          {/* Main Project Details + Pre-Sale Payment Plans (Inquiry Form Removed) */}
          <div className="flex flex-col gap-10">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <span className="inline-flex items-center rounded-full bg-brand-gold/10 text-brand-gold border border-brand-gold/30 px-3 py-1 text-xs font-bold uppercase tracking-wider">
                  {project.status}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-brand-navy mb-2">
                {name}
              </h1>

              <div className="flex items-center gap-1.5 text-gray-500 text-sm mb-6">
                <MapPin className="w-4 h-4 text-brand-gold shrink-0" />
                <span>{location}</span>
              </div>

              {/* Stats row */}
              <div className="flex flex-wrap gap-6 py-4 px-5 bg-brand-ivory rounded-xl mb-6 text-sm text-brand-navy">
                {project.delivery_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-brand-gold" />
                    <div>
                      <p className="text-xs text-gray-500">{t('projects.completionDate', 'Completion Date')}</p>
                      <p className="font-semibold">{project.delivery_date}</p>
                    </div>
                  </div>
                )}
                {project.total_units !== null && (
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-brand-gold" />
                    <div>
                      <p className="text-xs text-gray-500">{t('projects.units', 'Total Units')}</p>
                      <p className="font-semibold">
                        {project.available_units} Available / {project.total_units} Total
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              {description && (
                <div className="mb-8">
                  <h2 className="text-lg font-bold text-brand-navy mb-3">
                    {t('property.description', 'Project Overview')}
                  </h2>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                    {description}
                  </p>
                </div>
              )}

              {/* Interactive Framer Motion Pre-Sale Payment Plan Comparison Card */}
              <motion.section
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45 }}
                className="mb-10"
              >
                <PaymentPlanComparisonCard
                  projectName={name}
                  initialPrice={125000}
                  isRtl={isRtl}
                />
              </motion.section>

              {/* Features */}
              <div className="mb-8">
                <h2 className="text-lg font-bold text-brand-navy mb-4">
                  {t('property.features', 'Project Features & Amenities')}
                </h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {PROJECT_FEATURES.map((feat, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="w-4 h-4 text-brand-gold shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Render Gallery (Swiper) */}
              {project.gallery_images && project.gallery_images.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-lg font-bold text-brand-navy mb-4">
                    Architectural Render Gallery
                  </h2>
                  <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                    <Swiper
                      modules={[Navigation, Pagination, Autoplay]}
                      spaceBetween={16}
                      slidesPerView={1}
                      navigation
                      pagination={{ clickable: true }}
                      autoplay={{ delay: 4500, disableOnInteraction: true }}
                      breakpoints={{
                        640: { slidesPerView: 2 },
                      }}
                      className="p-2 bg-gray-50"
                    >
                      {project.gallery_images.map((imgUrl, idx) => (
                        <SwiperSlide key={idx}>
                          <div className="aspect-video rounded-xl overflow-hidden bg-gray-200">
                            <img
                              src={imgUrl}
                              alt={`${name} render ${idx + 1}`}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                              loading="lazy"
                            />
                          </div>
                        </SwiperSlide>
                      ))}
                    </Swiper>
                  </div>
                </div>
              )}

              {/* Direct Contact Actions */}
              <div className="flex flex-wrap gap-3 pt-4">
                <WhatsAppButton />
                <ClickToCallButton />
              </div>

              {/* Project Apartments & Units Inventory */}
              <ProjectUnitsSection projectId={project.id} projectName={name} />

              {/* Interactive Google Maps Development Location & Neighborhood Explorer */}
              <motion.section
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="mt-12 pt-10 border-t border-gray-200"
              >
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-5">
                  <div>
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <div className="w-1 h-5 bg-brand-gold rounded-full" />
                      <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-gold">
                        Spatial Location &amp; Surroundings
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-brand-navy">
                      Development Location, Neighborhood &amp; Commute Map
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Inspect the exact location pin for <span className="font-semibold text-brand-navy">{name}</span> in {location || 'Kabul'}, explore nearby schools, clinics, and banks, or calculate driving and walking routes.
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-brand-ivory border border-brand-navy/10 text-xs font-semibold text-brand-navy self-start sm:self-auto shrink-0">
                    <MapPin className="w-4 h-4 text-brand-gold shrink-0" />
                    <span>{location || 'Kabul, Afghanistan'}</span>
                  </div>
                </div>

                <Suspense
                  fallback={<MapSkeleton heightClass="h-[460px]" label="Loading Development Location Map…" />}
                >
                  <AttaieGoogleMap
                    mode="single-property"
                    defaultRegionQuery={location || 'Shahr-e-Naw, Kabul, Afghanistan'}
                    items={[
                      {
                        id: `project-${project.id}`,
                        title: name,
                        locationQuery: location || `${name}, Kabul, Afghanistan`,
                        priceDisplay:
                          project.available_units !== null
                            ? `${project.available_units} Units Available`
                            : project.delivery_date
                            ? `Delivery: ${project.delivery_date}`
                            : 'Pre-Sale Open',
                        type: 'Development Project',
                        status: project.status,
                        imageUrl: project.image_url || fallbackProjectHeroImg,
                      },
                    ]}
                    heightClass="h-[460px]"
                    showNeighborhoodTools={true}
                    showDirections={true}
                  />
                </Suspense>
              </motion.section>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
export default ProjectDetailPage;
