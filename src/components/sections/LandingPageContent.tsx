import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  motion,
  AnimatePresence,
} from 'motion/react';
import {
  MapPin,
  Building2,
  Bed,
  CircleDollarSign,
  Search,
  ShieldCheck,
  Users,
  ArrowRight,
  ChevronDown,
  MessageCircle,
  Phone,
  RotateCcw,
  Check,
} from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { PromoBanner } from './PromoBanner';
import { PopularLocationsSection } from './PopularLocationsSection';
import { ServicesSection } from './ServicesSection';
import { HotDealsSection } from './HotDealsSection';
import { NewsletterBanner } from './NewsletterBanner';
import { PropertyCard } from '../ui/PropertyCard';
import { PropertyCardSkeleton } from '../ui/PropertyCardSkeleton';
import { SectionHeader } from '../ui/SectionHeader';
import { ClickToCallButton } from '../ui/ClickToCallButton';
import { ExpandingCards } from '../ui/expanding-cards';
import { mapProjectsToExpandingCards } from '../ui/demo';
import { getProperties, getProjects, type Property, type Project } from '../../lib/dbService';
import { SIGNATURE_PROJECTS } from '../../lib/signatureProjects';
import stitchHeroImg from '../../assets/images/stitch_hero_kabul_panorama.jpg';
import stitchInteriorImg from '../../assets/images/stitch_apartment_interior.jpg';
import stitchVillaImg from '../../assets/images/stitch_villa_exterior.jpg';
import { LandingHeroBackground } from './LandingHeroBackground';

const WHATSAPP_NUMBER = '93782222279';

const FALLBACK_SHOWCASE_PROPERTIES: Property[] = [
  {
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
    gallery_images: [stitchInteriorImg],
    video_url: null,
    floor_plan_url: null,
    three_d_plan_url: null,
    description:
      'Sunlit luxury 4-bedroom apartment featuring panoramic mountain views, marble flooring, and 24/7 solar-hybrid backup power.',
    created_at: '2026-02-01T08:00:00Z',
  },
  {
    id: 103,
    serial_number: 'ATP-103',
    title: 'Karte Parwan Panoramic Hillside Villa',
    price: 1800,
    location: 'Karte Parwan, District 2, Kabul',
    beds: 5,
    baths: 4,
    area: 420,
    floor: 2,
    status: 'available',
    type: 'Villa',
    listing_type: 'rent',
    image_url: stitchVillaImg,
    gallery_images: [stitchVillaImg],
    video_url: null,
    floor_plan_url: null,
    three_d_plan_url: null,
    description:
      'Executive residence with private landscaped courtyard, formal Mehmankhana reception hall, and diplomatic-grade security.',
    created_at: '2026-02-05T08:00:00Z',
  }
];

const FALLBACK_PREVIEW_PROJECTS: Project[] = SIGNATURE_PROJECTS;

const FEATURED_PROPERTIES_LIMIT = 6;
const FEATURED_PROJECTS_LIMIT = 8;

function toPropertyCardProps(p: Property) {
  return {
    id: String(p.id),
    serialNumber: p.serial_number,
    title: p.title,
    price: p.price,
    location: p.location,
    beds: p.beds ?? undefined,
    baths: p.baths ?? undefined,
    area: p.area ?? undefined,
    floor: p.floor ?? undefined,
    status: p.status,
    type: p.type,
    listingType: p.listing_type,
    image: p.image_url,
    galleryImages: p.gallery_images,
  };
}

type FilterTab = 'All' | 'For Sale' | 'For Rent' | 'Commercial';
const FILTER_TABS: FilterTab[] = ['All', 'For Sale', 'For Rent', 'Commercial'];

const KABUL_LOCATIONS = [
  { label: 'All Kabul', value: '' },
  { label: 'Wazir Akbar Khan', value: 'Wazir Akbar Khan' },
  { label: 'Shahr-e-Naw', value: 'Shahr-e-Naw' },
  { label: 'Sherpur Enclave', value: 'Sherpur' },
  { label: 'Karte Parwan', value: 'Karte Parwan' },
  { label: 'Karte Char', value: 'Karte Char' },
  { label: 'Karte Se', value: 'Karte Se' },
  { label: 'Kolola Pushta', value: 'Kolola Pushta' },
  { label: 'Darulaman', value: 'Darulaman' },
  { label: 'Microrayan', value: 'Microrayan' },
  { label: 'Taimani', value: 'Taimani' },
];

const PROPERTY_TYPE_OPTIONS = [
  { label: 'All Types', value: '' },
  { label: 'Apartments', value: 'Apartment' },
  { label: 'Houses', value: 'House' },
  { label: 'Luxury Villas', value: 'Villa' },
  { label: 'Commercial Spaces', value: 'Commercial' },
  { label: 'Development Land', value: 'Land' },
];

const BEDROOM_OPTIONS = [
  { label: 'Any', value: '' },
  { label: 'Studio / 1 Bed', value: '1' },
  { label: '2+ Bedrooms', value: '2' },
  { label: '3+ Bedrooms', value: '3' },
  { label: '4+ Bedrooms', value: '4' },
  { label: '5+ Bedrooms', value: '5+' },
  { label: '6+ Bedrooms', value: '6+' },
];

const BUDGET_OPTIONS = [
  { label: 'Any Budget', value: '' },
  { label: 'Under $75,000', value: '75000' },
  { label: 'Up to $125,000', value: '125000' },
  { label: 'Up to $200,000', value: '200000' },
  { label: 'Up to $350,000', value: '350000' },
  { label: 'Up to $500,000', value: '500000' },
  { label: '$500,000+ Luxury', value: '1000000' },
];

interface HeroSelectOption {
  label: string;
  value: string;
}

function HeroCustomSelect({
  id,
  label,
  value,
  options,
  onChange,
  icon: Icon,
  hasRightDivider = false,
  colSpanClass = 'lg:col-span-3',
}: {
  id: string;
  label: string;
  value: string;
  options: HeroSelectOption[];
  onChange: (nextVal: string) => void;
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  hasRightDivider?: boolean;
  colSpanClass?: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  useEffect(() => {
    if (!open) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div
      ref={containerRef}
      className={`${colSpanClass} relative flex items-center gap-3 px-4 py-2 ${
        hasRightDivider ? 'lg:border-r border-neutral-200' : ''
      }`}
    >
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all ${
          open || value
            ? 'bg-brand-gold text-white shadow-gold-sm border border-brand-gold'
            : 'bg-brand-gold/15 text-brand-gold border border-brand-gold/25 shadow-2xs'
        }`}
      >
        <Icon size={20} strokeWidth={2.2} />
      </div>

      <div className="flex-1 min-w-0">
        <span
          id={`${id}-label`}
          className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider select-none"
        >
          {label}
        </span>
        <button
          id={id}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-labelledby={`${id}-label`}
          onClick={() => setOpen((prev) => !prev)}
          className="w-full flex items-center justify-between gap-2 text-left font-bold text-sm text-brand-navy hover:text-brand-gold focus:outline-none cursor-pointer pt-0.5 transition-colors group"
        >
          <span className="truncate">{selectedOption.label}</span>
          <ChevronDown
            size={16}
            strokeWidth={2.4}
            className={`text-brand-navy/60 shrink-0 transition-all duration-200 ${
              open ? 'rotate-180 text-brand-gold' : 'group-hover:text-brand-gold'
            }`}
          />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            role="listbox"
            aria-labelledby={`${id}-label`}
            className="absolute left-2 right-2 top-[calc(100%+10px)] z-50 rounded-2xl bg-white/98 backdrop-blur-xl border border-brand-navy/12 shadow-brand-xl p-1.5 max-h-56 overflow-y-auto custom-scrollbar"
          >
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.label}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'bg-brand-navy text-white shadow-xs'
                      : 'text-brand-navy hover:bg-brand-ivory hover:text-brand-gold'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check size={16} strokeWidth={2.5} className="text-brand-gold-lt shrink-0" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const LandingPageContent = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('All');
  const [properties, setProperties] = useState<Property[]>([]);
  const [projects, setProjects] = useState<Project[]>(FALLBACK_PREVIEW_PROJECTS);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  // Hero Search Bar state
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedBeds, setSelectedBeds] = useState('');
  const [selectedBudget, setSelectedBudget] = useState('');

  const activeSearchCriteriaCount = [
    selectedLocation,
    selectedType,
    selectedBeds,
    selectedBudget,
  ].filter(Boolean).length;

  useEffect(() => {
    Promise.all([
      getProperties().catch(() => null),
      getProjects().catch(() => null),
    ])
      .then(([props, projs]) => {
        if (Array.isArray(props) && props.length > 0) {
          setProperties(props.slice(0, FEATURED_PROPERTIES_LIMIT));
        } else {
          setProperties(FALLBACK_SHOWCASE_PROPERTIES);
        }

        if (Array.isArray(projs) && projs.length > 0) {
          setProjects(projs.slice(0, FEATURED_PROJECTS_LIMIT));
        } else {
          setProjects(FALLBACK_PREVIEW_PROJECTS.slice(0, FEATURED_PROJECTS_LIMIT));
        }
      })
      .finally(() => setLoadingFeatured(false));
  }, []);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (selectedLocation) params.set('search', selectedLocation);
    if (selectedType) params.set('type', selectedType);
    if (selectedType === 'Commercial') params.set('purpose', 'commercial');
    if (selectedBeds) params.set('beds', selectedBeds);
    if (selectedBudget) params.set('maxPrice', selectedBudget);
    const qs = params.toString();
    navigate(qs ? `/properties?${qs}` : '/properties');
  };

  const featuredProperties = properties.map(toPropertyCardProps);
  const expandingProjectItems = React.useMemo(
    () => mapProjectsToExpandingCards(projects),
    [projects]
  );

  const filteredProperties = featuredProperties.filter((p) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'For Sale') return p.listingType === 'sale';
    if (activeFilter === 'For Rent') return p.listingType === 'rent';
    if (activeFilter === 'Commercial') return p.type === 'Commercial';
    return true;
  });

  return (
    <>
      {/* ── 1. STITCH ARCHITECTURAL HERO SECTION + FLOATING SEARCH BAR ── */}
      <section className="relative z-30 pt-24 lg:pt-28 pb-12 bg-brand-cream">
        <div className="relative min-h-[540px] lg:min-h-[600px] flex flex-col justify-between">
          {/* Single Architectural Hero Background (Dynamic admin-configured or default) */}
          <LandingHeroBackground />

          {/* Left Column Hero Copy */}
          <div className="container-custom relative z-10 pt-10 lg:pt-16 pb-10">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-xl"
            >
              <span className="eyebrow inline-block mb-3 tracking-[0.22em]">
                Attaie Properties
              </span>

              <h1 className="font-display font-extrabold text-brand-navy text-display tracking-tight leading-[1.06] mb-5">
                Find Your
                <br />
                Ideal Property With Us
              </h1>

              <p className="text-neutral-600 text-base md:text-lg leading-relaxed max-w-md mb-7">
                Apartments, houses and investment opportunities in Kabul with the trust of Attaie
                Properties.
              </p>

              {/* 3 Trust Pillars with high-visibility icon badges */}
              <div className="flex flex-wrap items-center gap-6 pt-1">
                <div className="flex items-center gap-2.5 text-xs md:text-sm font-bold text-brand-navy">
                  <span className="w-10 h-10 rounded-xl bg-white border border-brand-navy/10 shadow-brand-sm text-brand-gold flex items-center justify-center shrink-0">
                    <ShieldCheck size={20} strokeWidth={2.2} />
                  </span>
                  <span>Trusted Company</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs md:text-sm font-bold text-brand-navy">
                  <span className="w-10 h-10 rounded-xl bg-white border border-brand-navy/10 shadow-brand-sm text-brand-gold flex items-center justify-center shrink-0">
                    <Building2 size={20} strokeWidth={2.2} />
                  </span>
                  <span>Quality Projects</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs md:text-sm font-bold text-brand-navy">
                  <span className="w-10 h-10 rounded-xl bg-white border border-brand-navy/10 shadow-brand-sm text-brand-gold flex items-center justify-center shrink-0">
                    <Users size={20} strokeWidth={2.2} />
                  </span>
                  <span>Professional Agents</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Floating Horizontal Search Card */}
          <div className="container-custom relative z-20 pb-2">
            <motion.form
              onSubmit={handleHeroSearch}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white rounded-2xl p-3 md:p-4 shadow-brand-xl border border-brand-navy/8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 lg:gap-0 items-center"
            >
              {/* 1. Location */}
              <HeroCustomSelect
                id="hero-location"
                label="Location"
                value={selectedLocation}
                options={KABUL_LOCATIONS}
                onChange={setSelectedLocation}
                icon={MapPin}
                hasRightDivider={true}
                colSpanClass="lg:col-span-3"
              />

              {/* 2. Property Type */}
              <HeroCustomSelect
                id="hero-type"
                label="Property Type"
                value={selectedType}
                options={PROPERTY_TYPE_OPTIONS}
                onChange={setSelectedType}
                icon={Building2}
                hasRightDivider={true}
                colSpanClass="lg:col-span-3"
              />

              {/* 3. Bedrooms */}
              <HeroCustomSelect
                id="hero-beds"
                label="Bedrooms"
                value={selectedBeds}
                options={BEDROOM_OPTIONS}
                onChange={setSelectedBeds}
                icon={Bed}
                hasRightDivider={true}
                colSpanClass="lg:col-span-2"
              />

              {/* 4. Budget */}
              <HeroCustomSelect
                id="hero-budget"
                label="Budget"
                value={selectedBudget}
                options={BUDGET_OPTIONS}
                onChange={setSelectedBudget}
                icon={CircleDollarSign}
                hasRightDivider={false}
                colSpanClass="lg:col-span-2"
              />

              {/* 5. Search CTA Button */}
              <div className="lg:col-span-2 pl-0 lg:pl-3">
                <button
                  type="submit"
                  className="w-full py-3.5 px-5 rounded-xl bg-brand-gold hover:bg-brand-gold-dark text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-gold-sm transition-all cursor-pointer whitespace-nowrap active:scale-[0.98]"
                >
                  <Search size={18} strokeWidth={2.4} />
                  <span>Search Properties</span>
                </button>
              </div>
            </motion.form>

            {/* Motion.dev Live Search Feedback Bar */}
            <AnimatePresence>
              {activeSearchCriteriaCount > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="mt-3 px-4 py-2.5 rounded-xl bg-brand-navy/90 backdrop-blur-md text-white text-xs flex flex-wrap items-center justify-between gap-3 shadow-brand-md"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-brand-gold">Active Search Filter:</span>
                    <span>
                      {[
                        selectedLocation || 'All Kabul',
                        selectedType || 'All Property Types',
                        selectedBeds ? `${selectedBeds}+ Beds` : null,
                        selectedBudget
                          ? `Up to $${Number(selectedBudget).toLocaleString()}`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLocation('');
                      setSelectedType('');
                      setSelectedBeds('');
                      setSelectedBudget('');
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors cursor-pointer"
                  >
                    <RotateCcw size={13} strokeWidth={2.2} />
                    <span>Reset</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* ── 2. SIGNATURE PROJECTS EXPANDING CARDS SECTION ── */}
      <section
        className="py-12 md:py-16 bg-brand-cream"
        data-testid="signature-projects-expanding-section"
      >
        <div className="container-custom">
          <SectionHeader
            eyebrow="Developments"
            title="Signature Projects"
            subtitle="Explore Kabul's most ambitious residential and commercial developments. Hover or click on a project card to unveil its story."
            cta={{ label: 'View all projects', href: '/projects' }}
          />
          <ExpandingCards items={expandingProjectItems} defaultActiveIndex={0} />
        </div>
      </section>

      {/* ── 3. LATEST PROPERTIES SECTION ─────────────────────────────────── */}
      <section className="py-12 md:py-16 bg-brand-cream">
        <div className="container-custom">
          {/* Header Row matching Stitch design */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-brand-navy">
              Latest Properties
            </h2>
            <Link
              to="/properties"
              className="inline-flex items-center gap-2 text-sm font-bold text-brand-gold hover:text-brand-gold-dark transition-colors group"
            >
              <span>View All Properties</span>
              <ArrowRight
                size={17}
                strokeWidth={2.4}
                className="group-hover:translate-x-1 transition-transform"
              />
            </Link>
          </div>

          {/* Interactive Filter Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-2 flex-wrap">
              {FILTER_TABS.map((tab) => {
                const isActive = tab === activeFilter;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveFilter(tab)}
                    className={`relative px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-brand-navy text-white shadow-brand-sm'
                        : 'bg-white text-neutral-600 border border-brand-navy/10 hover:border-brand-gold hover:text-brand-navy'
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Featured Listings: Default Swiper Carousel */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeFilter}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {loadingFeatured && filteredProperties.length === 0 ? (
                <div
                  role="status"
                  aria-busy="true"
                  aria-label="Loading featured properties"
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12"
                >
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <PropertyCardSkeleton key={idx} />
                  ))}
                </div>
              ) : filteredProperties.length > 0 ? (
                <Swiper
                  modules={[Navigation, Pagination, Autoplay]}
                  spaceBetween={24}
                  slidesPerView={1}
                  navigation
                  pagination={{ clickable: true }}
                  autoplay={{ delay: 5500, disableOnInteraction: true }}
                  breakpoints={{
                    640: { slidesPerView: 1.5 },
                    768: { slidesPerView: 2 },
                    1024: { slidesPerView: 3 },
                  }}
                  className="pb-12"
                >
                  {filteredProperties.map((prop) => (
                    <SwiperSlide key={prop.id} className="h-auto">
                      <PropertyCard {...prop} />
                    </SwiperSlide>
                  ))}
                </Swiper>
              ) : (
                <div className="py-16 text-center text-neutral-400 text-sm">
                  No properties match this filter.
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      <PromoBanner
        eyebrow="List With Us"
        title="List Your Property With Us"
        description="Get maximum visibility and the best value for your property, backed by our agents and marketing network."
        bullets={[
          'Free property evaluation',
          'Professional photography',
          'Targeted marketing',
          'Expert negotiation',
        ]}
        ctaLabel="List Your Property"
        ctaHref="/contact"
        imageSide="left"
        projectCovers={projects
          .filter((p) => Boolean(p.image_url))
          .map((p) => ({
            imageUrl: p.image_url as string,
            projectName: p.name,
            projectLocation: p.location,
          }))}
      />

      <PopularLocationsSection />

      <ServicesSection />

      <HotDealsSection />

      {/* ── CTA Strip ────────────────────────────────────────────────────── */}
      <section
        className="relative py-28 overflow-hidden"
        style={{ background: 'var(--color-brand-navy)' }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 70% 60% at 50% 100%, rgba(1,69,242,0.22) 0%, transparent 70%)',
          }}
        />
        <div className="absolute inset-0 islamic-pattern opacity-25 pointer-events-none" />
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background: 'linear-gradient(to right, transparent, rgba(1,69,242,0.5), transparent)',
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-px"
          style={{
            background: 'linear-gradient(to right, transparent, rgba(1,69,242,0.5), transparent)',
          }}
        />

        <div className="container-custom relative z-10 text-center">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-bold uppercase tracking-[0.3em] mb-5 flex items-center justify-center gap-3"
            style={{ color: 'var(--color-brand-gold)' }}
          >
            <span
              className="inline-block w-8 h-px"
              style={{ background: 'rgba(1,69,242,0.4)' }}
            />
            Get in Touch
            <span
              className="inline-block w-8 h-px"
              style={{ background: 'rgba(1,69,242,0.4)' }}
            />
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="font-heading font-bold text-white mb-6 leading-tight"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
          >
            Ready to Find Your
            <br />
            <span style={{ color: 'var(--color-brand-gold)' }}>Dream Property</span> in Kabul?
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.18 }}
            className="text-base mb-12 max-w-xl mx-auto leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.55)' }}
          >
            Our local experts know every district. Whether buying, renting, or investing — we'll
            find the right property for you.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.26 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <motion.a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              aria-label="Contact us via WhatsApp"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-bold text-base text-white transition-colors shadow-lg"
              style={{
                background: '#25D366',
                boxShadow: '0 8px 28px rgba(37,211,102,0.35)',
              }}
            >
              <MessageCircle size={22} strokeWidth={2.4} aria-hidden="true" /> WhatsApp Us
            </motion.a>
            <motion.a
              href="tel:+93782222279"
              aria-label="Call us"
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-bold text-base text-white transition-colors"
              style={{
                background: 'var(--color-brand-gold)',
                boxShadow: '0 8px 28px rgba(1,69,242,0.4)',
              }}
            >
              <Phone size={21} strokeWidth={2.4} aria-hidden="true" /> +93 782 222 279
            </motion.a>
            <ClickToCallButton className="px-8 py-4 rounded-2xl font-bold text-base" />
          </motion.div>
        </div>
      </section>

      <NewsletterBanner />
    </>
  );
};
