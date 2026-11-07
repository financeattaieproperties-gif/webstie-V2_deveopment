import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useTranslation } from 'react-i18next';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { InquiryForm } from '../components/forms/InquiryForm';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import {
  MapPin,
  Bed,
  Bath,
  Maximize2,
  Building,
  ArrowLeft,
  ShieldCheck,
  Calculator,
  FileText,
  Sparkles,
} from 'lucide-react';
import { getProperty, type Property } from '../lib/dbService';
import { ClickToCallButton } from '../components/ui/ClickToCallButton';
import { VisitRequestDialog } from '../components/forms/VisitRequestDialog';
import { SeoHead } from '../components/seo/SeoHead';
import { buildPropertySeo } from '../lib/seoConfig';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { MapSkeleton } from '../components/map/MapSkeleton';
import stitchInteriorImg from '../assets/images/stitch_apartment_interior.jpg';
import stitchHeroImg from '../assets/images/stitch_hero_kabul_panorama.jpg';
import stitchVillaImg from '../assets/images/stitch_villa_exterior.jpg';

const ImageGallery = lazy(() =>
  import('../components/property/ImageGallery').then((m) => ({ default: m.ImageGallery }))
);
const VideoPlayer = lazy(() =>
  import('../components/property/VideoPlayer').then((m) => ({ default: m.VideoPlayer }))
);
const AttaieGoogleMap = lazy(() =>
  import('../components/map/AttaieGoogleMap').then((m) => ({ default: m.AttaieGoogleMap }))
);

gsap.registerPlugin(ScrollTrigger);

const FALLBACK_DETAIL_PROPERTY: Property = {
  id: 101,
  serial_number: 'ATP-101',
  title: 'Wazir Akbar Khan Luxury Residence',
  price: 185000,
  location: 'Street 10, Wazir Akbar Khan, Kabul',
  beds: 4,
  baths: 3,
  area: 220,
  floor: 5,
  status: 'available',
  type: 'Apartment',
  listing_type: 'sale',
  image_url: stitchInteriorImg,
  gallery_images: [stitchInteriorImg, stitchHeroImg, stitchVillaImg],
  video_url: null,
  floor_plan_url: null,
  three_d_plan_url: null,
  description:
    'Sunlit luxury 4-bedroom residence in Street 10, Wazir Akbar Khan featuring panoramic Hindu Kush mountain views, imported Turkish marble flooring, formal Mehmankhana guest suite, central heating, and 24/7 solar-hybrid backup power.',
  created_at: '2026-02-01T08:00:00Z',
};

type DetailTab = 'overview' | 'specs' | 'payment';

export default function PropertyDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const propertyId = Number(id) || 101;

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visitOpen, setVisitOpen] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState<DetailTab>('overview');
  const [downPaymentPct, setDownPaymentPct] = useState(30);
  const [installmentMonths, setInstallmentMonths] = useState(24);

  const detailPanelsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getProperty(propertyId)
      .then((data) => {
        if (data && typeof data === 'object' && 'title' in data) {
          setProperty(data);
        } else {
          setError('Property not found');
          setProperty(null);
        }
      })
      .catch(() => {
        setError('Property not found');
        setProperty(null);
      })
      .finally(() => setLoading(false));
  }, [propertyId]);

  // GSAP Image & Detail Panel Reveal
  useEffect(() => {
    if (!property || !detailPanelsRef.current) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      const blocks = detailPanelsRef.current?.querySelectorAll('[data-gsap-detail]');
      if (blocks && blocks.length > 0) {
        gsap.fromTo(
          blocks,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.1,
            ease: 'power3.out',
          }
        );
      }
    }, detailPanelsRef);

    return () => ctx.revert();
  }, [property]);

  const allImages: string[] = property
    ? property.gallery_images && property.gallery_images.length > 0
      ? property.gallery_images
      : property.image_url
      ? [property.image_url]
      : [stitchInteriorImg, stitchHeroImg]
    : [];

  const seo = buildPropertySeo(property, id);

  const breadcrumbItems = [
    { label: t('nav.properties', 'Properties'), href: '/properties' },
    ...(property?.type
      ? [{ label: property.type, href: `/properties?type=${encodeURIComponent(property.type)}` }]
      : []),
    { label: property?.title || t('breadcrumbs.propertyDetails', 'Property Details') },
  ];

  const totalPrice = property?.price || 185000;
  const downPaymentAmount = Math.round((totalPrice * downPaymentPct) / 100);
  const remainingBalance = Math.max(0, totalPrice - downPaymentAmount);
  const monthlyInstallment =
    installmentMonths > 0 ? Math.round(remainingBalance / installmentMonths) : 0;

  return (
    <main className="min-h-screen bg-brand-cream flex flex-col">
      <SeoHead seo={property ? seo : undefined} context={{ property }} />
      <Navbar />

      {/* Top hierarchy bar */}
      <header className="bg-brand-navy pt-24 pb-4 border-b border-white/10">
        <div className="container-custom">
          <Breadcrumbs variant="light" items={breadcrumbItems} />
        </div>
      </header>

      {/* Swiper Fullscreen Gallery + GSAP Image Reveal */}
      <div>
        {loading ? (
          <div className="w-full h-[58vh] min-h-[420px] bg-neutral-200 animate-pulse" />
        ) : allImages.length > 0 ? (
          <div className="relative">
            <Suspense
              fallback={
                <div className="w-full h-[58vh] min-h-[420px] bg-neutral-200 animate-pulse flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full border-2 border-brand-gold border-t-transparent animate-spin" />
                </div>
              }
            >
              <ImageGallery images={allImages} alt={property?.title ?? 'Property'} />
            </Suspense>
            <div className="absolute top-5 left-0 right-0 z-20 container-custom pointer-events-none">
              <Link
                to="/properties"
                className="pointer-events-auto inline-flex items-center gap-2 text-white hover:text-brand-gold transition-colors text-xs font-bold bg-brand-navy/80 backdrop-blur-md border border-white/15 px-3.5 py-2 rounded-xl shadow-lg"
              >
                <ArrowLeft size={15} />
                <span>Back to Properties</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="w-full h-[58vh] min-h-[420px] bg-brand-navy flex items-center justify-center">
            <span className="text-white/30 text-sm">No images available</span>
          </div>
        )}
      </div>

      {/* Motion.dev Gallery-to-Detail Transition Container */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="container-custom pt-8 pb-16 flex-grow"
        ref={detailPanelsRef}
      >
        <Breadcrumbs items={breadcrumbItems} className="mb-6" />

        {error && (
          <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>
        )}

        {loading && (
          <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-40 w-full" />
          </div>
        )}

        {property && (
          <div className="flex flex-col lg:flex-row gap-12">
            <div className="flex-1 min-w-0">
              <div data-gsap-detail className="flex flex-wrap items-center gap-2 mb-4">
                <Badge status={property.status} />
                <Badge type={property.type} />
                {property.serial_number && (
                  <span className="font-mono text-xs font-bold text-brand-gold px-2.5 py-1 rounded-lg bg-brand-gold/10 tabular-nums">
                    Ref. {property.serial_number}
                  </span>
                )}
              </div>

              <h1
                data-gsap-detail
                className="text-3xl md:text-4xl font-display font-bold text-brand-navy"
              >
                {property.title}
              </h1>
              <motion.div
                className="h-[2px] bg-brand-gold rounded-full mt-2 mb-6"
                initial={{ scaleX: 0, originX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              />

              <div data-gsap-detail className="flex flex-wrap items-end justify-between gap-4 mb-6">
                <div>
                  <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1">
                    {property.listing_type === 'rent' ? 'Monthly Rent' : 'Verified Sale Price'}
                  </p>
                  <p className="text-4xl font-bold text-brand-gold tabular-nums">
                    {property.listing_type === 'rent'
                      ? `$${property.price.toLocaleString()} / mo`
                      : `$${property.price.toLocaleString()}`}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <ClickToCallButton />
                  <button
                    type="button"
                    onClick={() => setVisitOpen(true)}
                    className="rounded-xl bg-brand-navy px-5 py-3 text-sm font-bold text-white hover:bg-brand-navy-light transition-colors cursor-pointer"
                  >
                    {t('visitDialog.requestVisitBtn')}
                  </button>
                </div>
              </div>

              {/* Spec badges */}
              <div
                data-gsap-detail
                className="flex flex-wrap gap-3 py-6 border-y border-neutral-200 mb-8 tabular-nums"
              >
                {property.beds != null && (
                  <motion.div
                    whileHover={{ scale: 1.04, y: -2 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    className="flex items-center gap-2 text-neutral-700 bg-brand-ivory px-4 py-2 rounded-xl cursor-default"
                  >
                    <Bed size={20} className="text-brand-gold" />
                    <span className="font-bold">{property.beds}</span> Beds
                  </motion.div>
                )}
                {property.baths != null && (
                  <motion.div
                    whileHover={{ scale: 1.04, y: -2 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    className="flex items-center gap-2 text-neutral-700 bg-brand-ivory px-4 py-2 rounded-xl cursor-default"
                  >
                    <Bath size={20} className="text-brand-gold" />
                    <span className="font-bold">{property.baths}</span> Baths
                  </motion.div>
                )}
                {property.area != null && (
                  <motion.div
                    whileHover={{ scale: 1.04, y: -2 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    className="flex items-center gap-2 text-neutral-700 bg-brand-ivory px-4 py-2 rounded-xl cursor-default"
                  >
                    <Maximize2 size={20} className="text-brand-gold" />
                    <span className="font-bold">{property.area}</span> m²
                  </motion.div>
                )}
                {property.floor != null && (
                  <motion.div
                    whileHover={{ scale: 1.04, y: -2 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    className="flex items-center gap-2 text-neutral-700 bg-brand-ivory px-4 py-2 rounded-xl cursor-default"
                  >
                    <Building size={20} className="text-brand-gold" />
                    Floor <span className="font-bold ml-1">{property.floor}</span>
                  </motion.div>
                )}
                <motion.div
                  whileHover={{ scale: 1.04, y: -2 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  className="flex items-center gap-2 text-neutral-700 bg-brand-ivory px-4 py-2 rounded-xl cursor-default"
                >
                  <MapPin size={20} className="text-brand-gold" />
                  <span className="font-bold">{property.location}</span>
                </motion.div>
              </div>

              {/* 21st.dev Interactive Detail Panels with Motion.dev Tab Transitions */}
              <div
                data-gsap-detail
                className="bg-white rounded-2xl border border-brand-navy/8 p-6 md:p-8 mb-8 shadow-brand-md"
              >
                <div className="flex flex-wrap items-center gap-2 pb-5 mb-6 border-b border-neutral-100">
                  {[
                    { id: 'overview' as const, label: 'Property Overview', icon: FileText },
                    {
                      id: 'specs' as const,
                      label: 'Verification & Specs',
                      icon: ShieldCheck,
                    },
                    ...(property.listing_type !== 'rent'
                      ? [
                          {
                            id: 'payment' as const,
                            label: 'Installment Estimator',
                            icon: Calculator,
                          },
                        ]
                      : []),
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const active = activeDetailTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveDetailTab(tab.id)}
                        className={`relative inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                          active
                            ? 'bg-brand-navy text-white'
                            : 'bg-brand-ivory text-neutral-600 hover:text-brand-navy'
                        }`}
                      >
                        <Icon size={14} className={active ? 'text-brand-gold' : ''} />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                <AnimatePresence mode="wait">
                  {activeDetailTab === 'overview' && (
                    <motion.div
                      key="overview"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.22 }}
                    >
                      <h2 className="text-xl font-bold text-brand-navy mb-3">
                        Architectural Description
                      </h2>
                      <p className="text-neutral-600 leading-relaxed text-base md:text-lg">
                        {property.description ||
                          'Verified Kabul residence represented by Attaie Properties with full legal documentation and private viewing availability.'}
                      </p>
                    </motion.div>
                  )}

                  {activeDetailTab === 'specs' && (
                    <motion.div
                      key="specs"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.22 }}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-4 tabular-nums"
                    >
                      {[
                        {
                          label: 'Title & Deed Verification',
                          value: 'Qabala Sharaee / Verified Clear Title',
                        },
                        {
                          label: 'Property Classification',
                          value: `${property.type} (${
                            property.listing_type === 'rent' ? 'For Rent' : 'For Sale'
                          })`,
                        },
                        {
                          label: 'Total Living Area',
                          value: property.area ? `${property.area} m²` : 'Standard Layout',
                        },
                        {
                          label: 'Power & Water Infrastructure',
                          value: '24/7 Solar-Hybrid Backup & Filtered Water',
                        },
                        {
                          label: 'Security & Access',
                          value: 'Guarded Entrance & Dedicated Parking',
                        },
                        {
                          label: 'Listing Reference',
                          value: property.serial_number || `ATP-${property.id}`,
                        },
                      ].map((row) => (
                        <div
                          key={row.label}
                          className="p-4 rounded-xl bg-brand-cream border border-brand-navy/6"
                        >
                          <p className="text-xs font-semibold text-neutral-500 mb-1">{row.label}</p>
                          <p className="text-sm font-bold text-brand-navy">{row.value}</p>
                        </div>
                      ))}
                    </motion.div>
                  )}

                  {activeDetailTab === 'payment' && (
                    <motion.div
                      key="payment"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.22 }}
                      className="space-y-6 tabular-nums"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <div className="flex justify-between text-xs font-bold text-brand-navy mb-2">
                            <span>Down Payment ({downPaymentPct}%)</span>
                            <span className="text-brand-gold">
                              ${downPaymentAmount.toLocaleString()}
                            </span>
                          </div>
                          <input
                            type="range"
                            min={15}
                            max={80}
                            step={5}
                            value={downPaymentPct}
                            onChange={(e) => setDownPaymentPct(Number(e.target.value))}
                            className="w-full accent-brand-gold cursor-pointer"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between text-xs font-bold text-brand-navy mb-2">
                            <span>Installment Plan</span>
                            <span className="text-brand-gold">{installmentMonths} Months</span>
                          </div>
                          <input
                            type="range"
                            min={6}
                            max={48}
                            step={6}
                            value={installmentMonths}
                            onChange={(e) => setInstallmentMonths(Number(e.target.value))}
                            className="w-full accent-brand-gold cursor-pointer"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-brand-navy text-white">
                        <div>
                          <p className="text-[11px] text-white/60 uppercase">Initial Deposit</p>
                          <p className="text-lg font-bold text-white">
                            ${downPaymentAmount.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-white/60 uppercase">Financed Balance</p>
                          <p className="text-lg font-bold text-white">
                            ${remainingBalance.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] text-brand-gold uppercase font-bold">
                            Est. Monthly Installment
                          </p>
                          <p className="text-xl font-extrabold text-brand-gold">
                            ${monthlyInstallment.toLocaleString()} / mo
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Video player */}
              {property.video_url && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className="mb-8"
                >
                  <Suspense fallback={<div className="w-full aspect-video bg-neutral-900 rounded-2xl animate-pulse" />}>
                    <VideoPlayer url={property.video_url} title={property.title} />
                  </Suspense>
                </motion.div>
              )}

              {/* Interactive Google Map & Neighborhood Explorer */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="mt-8"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-1 h-5 bg-brand-gold rounded-full" />
                  <h2 className="text-xl font-bold text-brand-navy">
                    Location, Neighborhood &amp; Commute Map
                  </h2>
                </div>
                <Suspense fallback={<MapSkeleton heightClass="h-[460px]" label="Loading Neighborhood Map…" />}>
                  <AttaieGoogleMap
                    mode="single-property"
                    items={[
                      {
                        id: property.id,
                        title: property.title,
                        locationQuery: property.location || 'Kabul, Afghanistan',
                        priceDisplay:
                          property.listing_type === 'rent'
                            ? `$${property.price.toLocaleString()} / mo`
                            : `$${property.price.toLocaleString()}`,
                        type: property.type,
                        status: property.status,
                        beds: property.beds,
                        baths: property.baths,
                        area: property.area,
                        imageUrl: property.image_url,
                      },
                    ]}
                    heightClass="h-[460px]"
                    showNeighborhoodTools={true}
                    showDirections={true}
                  />
                </Suspense>
              </motion.div>
            </div>

            {/* 21st.dev Sticky Inquiry UI Sidebar */}
            <aside className="w-full lg:w-96 shrink-0">
              <div className="sticky top-28 space-y-4">
                <div className="p-4 rounded-2xl bg-brand-navy text-white flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Sparkles size={16} className="text-brand-gold shrink-0" />
                    <span className="text-xs font-semibold">
                      Direct Advisor Response within 2 Hours
                    </span>
                  </div>
                  <span className="text-xs font-mono text-brand-gold font-bold tabular-nums">
                    {property.serial_number || `ATP-${property.id}`}
                  </span>
                </div>
                <InquiryForm propertyId={String(property.id)} propertyName={property.title} />
              </div>
            </aside>
          </div>
        )}
      </motion.div>

      {property && visitOpen && (
        <VisitRequestDialog
          target={{ label: property.title, propertyId: property.id }}
          onClose={() => setVisitOpen(false)}
        />
      )}

      <Footer />
    </main>
  );
}
