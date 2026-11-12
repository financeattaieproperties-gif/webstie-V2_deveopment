import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
} from 'motion/react';
import {
  MapPin,
  Building2,
  Bed,
  CircleDollarSign,
  Search,
  ShieldCheck,
  Users,
  Home,
  Store,
  Layers,
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Phone,
  Calendar,
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
import { ProjectCard } from '../ui/ProjectCard';
import { PropertyCardSkeleton } from '../ui/PropertyCardSkeleton';
import { ProjectCardSkeleton } from '../ui/ProjectCardSkeleton';
import { SectionHeader } from '../ui/SectionHeader';
import { ClickToCallButton } from '../ui/ClickToCallButton';
import { getProperties, getProjects, type Property, type Project } from '../../lib/dbService';
import defaultExteriorImg from '../../assets/images/project_exterior_elevation_1793995966183.jpg';
import stitchHeroImg from '../../assets/images/stitch_hero_kabul_panorama.jpg';
import stitchInteriorImg from '../../assets/images/stitch_apartment_interior.jpg';
import stitchVillaImg from '../../assets/images/stitch_villa_exterior.jpg';
import categoryHousesImg from '../../assets/images/category_houses_villa_1794037428658.jpg';
import categoryCommercialImg from '../../assets/images/category_commercial_plaza_1794037429778.jpg';
import categoryProjectsImg from '../../assets/images/category_master_projects_1794037429266.jpg';
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
    id: 102,
    serial_number: 'ATP-102',
    title: 'Kabul Plaza Saljuqi — Corner Suite',
    price: 142000,
    location: 'Ansari Square, Shahr-e-Naw, Kabul',
    beds: 3,
    baths: 2,
    area: 175,
    floor: 4,
    status: 'available',
    type: 'Apartment',
    listing_type: 'sale',
    image_url: stitchHeroImg,
    gallery_images: [stitchHeroImg],
    video_url: null,
    floor_plan_url: null,
    three_d_plan_url: null,
    description:
      'Modern corner apartment in Shahr-e-Naw with glass wrap-around balconies, underground parking, and dedicated security.',
    created_at: '2026-02-03T08:00:00Z',
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
  },
];

const FALLBACK_PREVIEW_PROJECTS: Project[] = [];

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

function toProjectCardProps(p: Project) {
  return {
    id: String(p.id),
    name: p.name,
    location: p.location,
    deliveryDate: p.delivery_date ?? undefined,
    status: p.status,
    availableUnits: p.available_units,
    totalUnits: p.total_units,
    description: p.description,
    image: p.image_url,
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

/**
 * 21st.dev + motion.dev Interactive Featured Project Carousel Card
 * Dynamically cycles through projects fetched from the database with spring physics,
 * pointer parallax, swipe gestures, and animated progress indicators.
 */
function FeaturedProjectMotionCarousel({ projects }: { projects: Project[] }) {
  const safeProjects = projects.length > 0 ? projects : FALLBACK_PREVIEW_PROJECTS;
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isPaused, setIsPaused] = useState(false);

  // Motion values for 21st.dev subtle 3D pointer parallax
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 260, damping: 26 });
  const smoothY = useSpring(mouseY, { stiffness: 260, damping: 26 });
  const imgX = useTransform(smoothX, [-0.5, 0.5], ['6px', '-6px']);
  const imgY = useTransform(smoothY, [-0.5, 0.5], ['6px', '-6px']);

  const total = safeProjects.length;

  const paginate = useCallback(
    (newDirection: number) => {
      if (total <= 1) return;
      setDirection(newDirection);
      setActiveIndex((prev) => (prev + newDirection + total) % total);
    },
    [total]
  );

  // Auto-advance every 5.5 seconds when not hovered
  useEffect(() => {
    if (isPaused || total <= 1) return;
    const timer = setInterval(() => {
      paginate(1);
    }, 5500);
    return () => clearInterval(timer);
  }, [isPaused, total, paginate]);

  if (total === 0) {
    return (
      <div className="w-full h-full rounded-2xl overflow-hidden bg-gradient-to-br from-brand-ivory via-white to-brand-gold-lt/30 border border-brand-navy/10 shadow-brand-md p-6 sm:p-8 flex flex-col justify-between min-h-[230px] relative">
        <div className="absolute inset-0 islamic-pattern-light opacity-30 pointer-events-none" />
        <div className="relative z-10">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-gold/15 text-brand-gold font-bold text-xs uppercase tracking-wider mb-3">
            <Building2 size={13} />
            Master-Planned Developments
          </span>
          <h3 className="text-xl font-display font-bold text-brand-navy mb-2">
            New Flagship Projects Coming Soon
          </h3>
          <p className="text-xs text-neutral-600 leading-relaxed max-w-sm">
            Exclusive multi-unit residential towers and commercial centers across Kabul are currently in development. Connect with our advisory desk for private off-market previews.
          </p>
        </div>
        <div className="relative z-10 pt-4">
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-navy hover:bg-brand-gold text-white font-bold text-xs transition-colors shadow-xs"
          >
            <span>Inquire for Early Access</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  const currentProject = safeProjects[activeIndex % total] || safeProjects[0];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(nx);
    mouseY.set(ny);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
    mouseX.set(0);
    mouseY.set(0);
  };

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 48 : -48,
      opacity: 0,
      scale: 0.97,
      filter: 'blur(4px)',
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)',
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -48 : 48,
      opacity: 0,
      scale: 0.97,
      filter: 'blur(4px)',
    }),
  };

  return (
    <motion.div
      onMouseEnter={() => setIsPaused(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="w-full h-full rounded-2xl overflow-hidden bg-gradient-to-br from-brand-ivory via-white to-brand-gold-lt/40 border border-brand-navy/10 shadow-brand-md relative flex flex-col justify-between min-h-[230px] select-none group"
    >
      {/* Subtle Islamic geometric pattern accent */}
      <div className="absolute inset-0 islamic-pattern-light opacity-30 pointer-events-none" />

      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={currentProject.id}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: 'spring', stiffness: 320, damping: 32 },
            opacity: { duration: 0.25 },
            scale: { duration: 0.3 },
            filter: { duration: 0.25 },
          }}
          drag={total > 1 ? 'x' : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={(_e, { offset }) => {
            if (offset.x < -45) paginate(1);
            else if (offset.x > 45) paginate(-1);
          }}
          className="relative flex-1 flex items-center min-h-[195px]"
        >
          {/* Right Side Architectural Visual with 21st.dev Spring Parallax */}
          <div className="w-[48%] sm:w-[46%] h-full absolute right-0 top-0 bottom-0 overflow-hidden">
            <motion.img
              src={currentProject.image_url || defaultExteriorImg}
              onError={(e) => {
                e.currentTarget.src = defaultExteriorImg;
              }}
              alt={currentProject.name}
              referrerPolicy="no-referrer"
              style={{ x: imgX, y: imgY, scale: 1.07 }}
              className="w-full h-full object-cover object-center transition-transform duration-500"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(90deg, var(--color-brand-ivory) 0%, rgba(237,241,245,0.35) 38%, transparent 100%)',
              }}
            />
            {/* Status pill badge in top-right of image */}
            {currentProject.status && (
              <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-brand-navy/85 backdrop-blur-xs text-white text-[10px] font-bold uppercase tracking-wider shadow-xs">
                {currentProject.status}
              </span>
            )}
          </div>

          {/* Left Side Project Information */}
          <div className="relative z-10 p-6 sm:p-7 max-w-[64%] flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="eyebrow tracking-[0.2em]">FEATURED PROJECT</span>
                {total > 1 && (
                  <span className="text-[10px] font-bold text-brand-navy/50 tabular-nums">
                    {String(activeIndex + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
                  </span>
                )}
              </div>

              <h3 className="text-xl sm:text-2xl font-display font-extrabold text-brand-navy leading-tight line-clamp-2">
                {currentProject.name}
              </h3>

              <p className="text-xs font-semibold text-neutral-700 mt-1.5 flex items-center gap-1.5 truncate">
                <MapPin size={14} strokeWidth={2.2} className="text-brand-gold shrink-0" />
                <span className="truncate">
                  {currentProject.location || 'Residential & Commercial'}
                </span>
              </p>

              {/* Micro specs row */}
              <div className="flex flex-wrap items-center gap-3 mt-3 text-[11px] font-semibold text-brand-navy">
                {currentProject.available_units !== undefined && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-brand-gold/10 border border-brand-gold/20">
                    <Building2 size={13} strokeWidth={2.2} className="text-brand-gold shrink-0" />
                    <span className="tabular-nums font-bold text-brand-navy">
                      {currentProject.available_units}
                    </span>{' '}
                    Units Open
                  </span>
                )}
                {currentProject.delivery_date && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-brand-navy/5 border border-brand-navy/10">
                    <Calendar size={13} strokeWidth={2.2} className="text-brand-gold shrink-0" />
                    <span>{currentProject.delivery_date}</span>
                  </span>
                )}
              </div>
            </div>

            <div className="mt-4 pt-1 flex items-center gap-2">
              <Link
                to={`/projects/${currentProject.id}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-brand-navy font-bold text-xs shadow-brand-sm border border-brand-navy/10 hover:bg-brand-gold hover:text-white hover:border-brand-gold transition-all"
              >
                <span>View Apartments</span>
                <ArrowRight size={15} strokeWidth={2.2} />
              </Link>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Bottom 21st.dev Carousel Navigation Bar */}
      {total > 1 && (
        <div className="relative z-20 px-6 pb-3.5 pt-2 border-t border-brand-navy/8 bg-white/70 backdrop-blur-xs flex items-center justify-between gap-3">
          {/* Animated Pill Dots */}
          <div className="flex items-center gap-1.5" role="tablist" aria-label="Featured projects">
            {safeProjects.map((proj, idx) => {
              const isActive = idx === activeIndex;
              return (
                <button
                  key={proj.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-label={`Show project ${proj.name}`}
                  onClick={() => {
                    setDirection(idx > activeIndex ? 1 : -1);
                    setActiveIndex(idx);
                  }}
                  className={`relative h-1.5 rounded-full overflow-hidden transition-all duration-300 cursor-pointer ${
                    isActive ? 'w-7 bg-brand-gold/25' : 'w-2 bg-brand-navy/20 hover:bg-brand-navy/40'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="featured-project-active-dot"
                      className="absolute inset-0 bg-brand-gold rounded-full"
                      transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Prev / Next Controls */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => paginate(-1)}
              aria-label="Previous featured project"
              className="w-8 h-8 rounded-xl bg-white border border-brand-navy/15 text-brand-navy hover:bg-brand-gold hover:text-white hover:border-brand-gold flex items-center justify-center transition-colors cursor-pointer shadow-xs"
            >
              <ChevronLeft size={16} strokeWidth={2.4} />
            </button>
            <button
              type="button"
              onClick={() => paginate(1)}
              aria-label="Next featured project"
              className="w-8 h-8 rounded-xl bg-white border border-brand-navy/15 text-brand-navy hover:bg-brand-gold hover:text-white hover:border-brand-gold flex items-center justify-center transition-colors cursor-pointer shadow-xs"
            >
              <ChevronRight size={16} strokeWidth={2.4} />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export const LandingPageContent = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('All');
  const [activeCategory, setActiveCategory] = useState<string>('Apartments');
  const [properties, setProperties] = useState<Property[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
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
        // Use live database properties directly
        if (Array.isArray(props)) {
          setProperties(props.slice(0, FEATURED_PROPERTIES_LIMIT));
        } else {
          setProperties([]);
        }

        // Use live database projects directly without merging mockups
        if (Array.isArray(projs) && projs.length > 0) {
          setProjects(projs.slice(0, FEATURED_PROJECTS_LIMIT));
        } else if (Array.isArray(projs)) {
          setProjects([]);
        } else {
          // If offline development or API unavailable, show default previews
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
  const featuredProjects = projects.map(toProjectCardProps);

  const filteredProperties = featuredProperties.filter((p) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'For Sale') return p.listingType === 'sale';
    if (activeFilter === 'For Rent') return p.listingType === 'rent';
    if (activeFilter === 'Commercial') return p.type === 'Commercial';
    return true;
  });

  // All 4 Category Cards now feature bespoke architectural photography
  const categories = [
    {
      id: 'Apartments',
      label: 'Apartments',
      href: '/properties?type=Apartment',
      icon: Building2,
      image: defaultExteriorImg,
    },
    {
      id: 'Houses',
      label: 'Houses',
      href: '/properties?type=House',
      icon: Home,
      image: categoryHousesImg,
    },
    {
      id: 'Commercial',
      label: 'Commercial',
      href: '/properties?purpose=commercial&type=Commercial',
      icon: Store,
      image: categoryCommercialImg,
    },
    {
      id: 'Projects',
      label: 'Projects',
      href: '/projects',
      icon: Layers,
      image: categoryProjectsImg,
    },
  ];

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

      {/* ── 2. MIDDLE SPLIT SECTION: EXPLORE BY CATEGORY + DYNAMIC FEATURED PROJECT CAROUSEL ── */}
      <section className="py-10 bg-brand-cream">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Left Column: Explore by Category (all 4 cards with architectural photography) */}
            <div className="lg:col-span-7 flex flex-col justify-between lg:pr-6 lg:border-r border-neutral-200/80">
              <h2 className="text-2xl md:text-3xl font-display font-bold text-brand-navy mb-5">
                Explore by Category
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  const isHighlighted = activeCategory === cat.id;

                  return (
                    <motion.div
                      key={cat.id}
                      whileHover={{ y: -4 }}
                      transition={{ type: 'spring', stiffness: 360, damping: 24 }}
                      className="h-full"
                    >
                      <Link
                        to={cat.href}
                        onMouseEnter={() => setActiveCategory(cat.id)}
                        className={`group h-full rounded-2xl overflow-hidden bg-white transition-all duration-300 flex flex-col justify-between ${
                          isHighlighted
                            ? 'border-2 border-brand-gold shadow-brand-md'
                            : 'border border-brand-navy/10 hover:border-brand-gold shadow-brand-sm'
                        }`}
                      >
                        <div className="relative h-28 w-full overflow-hidden bg-brand-navy">
                          <img
                            src={cat.image}
                            alt={cat.label}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/45 via-transparent to-transparent" />
                          <span
                            className={`absolute bottom-2 left-2.5 w-9 h-9 rounded-xl flex items-center justify-center backdrop-blur-md shadow-md border transition-all ${
                              isHighlighted
                                ? 'bg-brand-gold text-white border-brand-gold shadow-gold-sm'
                                : 'bg-white/95 text-brand-navy border-white/60 group-hover:bg-brand-gold group-hover:text-white group-hover:border-brand-gold'
                            }`}
                          >
                            <Icon size={18} strokeWidth={2.2} />
                          </span>
                        </div>
                        <div className="py-3.5 px-3 text-center bg-white flex items-center justify-center">
                          <span
                            className={`font-display font-bold text-sm transition-colors ${
                              isHighlighted
                                ? 'text-brand-gold'
                                : 'text-brand-navy group-hover:text-brand-gold'
                            }`}
                          >
                            {cat.label}
                          </span>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Dynamic 21st.dev + motion.dev Featured Project Carousel */}
            <div className="lg:col-span-5 flex">
              <FeaturedProjectMotionCarousel projects={projects} />
            </div>
          </div>
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

      {/* ── Signature Projects (Swiper) ──────────────────────────────────── */}
      <section className="section-padding" style={{ background: 'var(--color-brand-cream)' }}>
        <div className="container-custom">
          <SectionHeader
            eyebrow="Developments"
            title="Signature Projects"
            subtitle="Multi-unit residential developments offering off-plan and ready units across Kabul's growth corridors."
            cta={{ label: 'View all projects', href: '/projects' }}
          />

          {loadingFeatured && featuredProjects.length === 0 ? (
            <div
              role="status"
              aria-busy="true"
              aria-label="Loading signature projects"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12"
            >
              {Array.from({ length: 3 }).map((_, idx) => (
                <ProjectCardSkeleton key={idx} />
              ))}
            </div>
          ) : featuredProjects.length > 0 ? (
            <Swiper
              modules={[Navigation, Pagination]}
              spaceBetween={24}
              slidesPerView={1}
              navigation
              pagination={{ clickable: true }}
              breakpoints={{
                768: { slidesPerView: 2 },
                1024: { slidesPerView: 3 },
              }}
              className="pb-12"
            >
              {featuredProjects.map((proj) => (
                <SwiperSlide key={proj.id} className="h-auto">
                  <ProjectCard {...proj} />
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <div className="py-20 text-center text-neutral-400 text-sm">
              No projects available yet.
            </div>
          )}
        </div>
      </section>

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
