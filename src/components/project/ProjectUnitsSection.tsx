import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bed,
  Bath,
  Maximize2,
  Building2,
  Layers,
  X,
  CheckCircle2,
  CreditCard,
  Compass,
  Sparkles,
  Eye,
} from 'lucide-react';
import { getProjectUnits, type ProjectUnit } from '@/lib/dbService';
import { Badge } from '@/components/ui/Badge';
import { PaymentPlanComparisonCard } from '@/components/project/PaymentPlanComparisonCard';
import fallbackAptImg1 from '@/assets/images/stitch_apartment_interior.jpg';
import fallbackAptImg2 from '@/assets/images/stitch_villa_exterior.jpg';
import fallbackAptImg3 from '@/assets/images/category_master_projects_1794037429266.jpg';

interface ProjectUnitsSectionProps {
  projectId: string | number;
  projectName: string;
}

const FALLBACK_UNITS: ProjectUnit[] = [
  {
    id: 901,
    project_id: 1,
    unit_number: '1st Floor — Unit A',
    title: '3+1 Bedroom Commercial Podium Residence',
    floor: 1,
    beds: 3,
    baths: 3,
    area: 177,
    price: 132000,
    currency: 'USD',
    status: 'available',
    image_url: '/assets/kabul-plaza-saljuqi/apt_1st_a_furnished.png',
    description:
      'Direct podium floor residence featuring 3 bedrooms plus an independent formal Guest Room (Mehmankhana), 3 full bathrooms, modern open-concept kitchen, 150.7 m² net usable area (176.8 m² total), and instant access to the 1st floor commercial supermarket.',
  },
  {
    id: 902,
    project_id: 1,
    unit_number: 'Typical Floor — Unit A',
    title: '3+1 Bedroom Sunlit Corner Residence',
    floor: 4,
    beds: 3,
    baths: 3,
    area: 173,
    price: 138000,
    currency: 'USD',
    status: 'available',
    image_url: '/assets/kabul-plaza-saljuqi/apt_typical_a_furnished.png',
    description:
      'Available on Floors 2 through 10. Offers 3 bedrooms plus a formal guest reception room (Mehmankhana), full-width 7.6m balcony with city views, master suite with en-suite bath, and double-glazed soundproof curtain glazing. 160.8 m² net area (173.2 m² total).',
  },
  {
    id: 903,
    project_id: 1,
    unit_number: 'Typical Floor — Unit B',
    title: '5+1 Bedroom Grand Family Residence',
    floor: 6,
    beds: 5,
    baths: 4,
    area: 243,
    price: 195000,
    currency: 'USD',
    status: 'available',
    image_url: '/assets/kabul-plaza-saljuqi/apt_typical_b_furnished.png',
    description:
      'Flagship multi-generational family suite on Floors 2 through 10. Features 5 bedrooms, separate formal guest room (Mehmankhana), dual balconies, 4 bathrooms, expansive living hall (6.3m × 4.8m), and closed chef kitchen. 225.6 m² net area (243 m² total).',
  },
  {
    id: 904,
    project_id: 1,
    unit_number: 'Typical Floor — Unit C',
    title: '4+1 Bedroom Modern Panorama Apartment',
    floor: 7,
    beds: 4,
    baths: 3,
    area: 203,
    price: 162000,
    currency: 'USD',
    status: 'available',
    image_url: '/assets/kabul-plaza-saljuqi/apt_typical_c_furnished.png',
    description:
      'Well-proportioned 4-bedroom plus formal guest salon (Mehmankhana) residence on Floors 2 through 10. Enjoys 3 bathrooms, private front balcony, custom wardrobes, central heating ducts, and high-speed elevator access. 188.5 m² net area (203 m² total).',
  },
  {
    id: 905,
    project_id: 1,
    unit_number: '11th Floor VIP — Unit A',
    title: 'VIP 4+1 Residence with Private Terrace',
    floor: 11,
    beds: 4,
    baths: 4,
    area: 253,
    price: 215000,
    currency: 'USD',
    status: 'available',
    image_url: '/assets/kabul-plaza-saljuqi/apt_11th_vip_a_furnished.png',
    description:
      'Executive 11th floor VIP penthouse suite with private open-air terrace (7.3m × 4.4m), 4 bedrooms, dedicated guest reception room, 4 full bathrooms, expansive salon hall, and panoramic views over Shahr-e-Naw and the Kabul mountains. 234 m² net area (252.6 m² total).',
  },
  {
    id: 906,
    project_id: 1,
    unit_number: '11th Floor VIP — Unit B',
    title: 'Executive VIP Penthouse with Grand Terrace',
    floor: 11,
    beds: 4,
    baths: 4,
    area: 348,
    price: 285000,
    currency: 'USD',
    status: 'available',
    image_url: '/assets/kabul-plaza-saljuqi/apt_11th_vip_b_furnished.png',
    description:
      'The crown jewel of Kabul Plaza Saljuqi. Enormous 15.8m × 8.3m private outdoor terrace overlooking the Kabul cityscape, 4 bedrooms, formal guest suite, luxury master bathroom, show kitchen, and 2 reserved basement parking stalls. 322.1 m² net area (347.7 m² total).',
  },
];

const MOON_RESIDENCY_UNITS: ProjectUnit[] = [
  {
    id: 921,
    project_id: 2,
    unit_number: 'Apartment (01)',
    title: '3+1 Bedroom Corner Residence — Moon Residency',
    floor: 3,
    beds: 3,
    baths: 2,
    area: 131,
    price: 98000,
    currency: 'USD',
    status: 'available',
    image_url: '/assets/moon-residency/apt_01_furnished.png',
    description:
      'Moon Residency contemporary 3-bedroom plus formal Guest Room (Mehmankhana) residence. Features 118.76 m² net usable area (130.75 m² total area), central family living hall (6.6m × 3.9m), 2 bathrooms, modern closed kitchen, and private balcony. Available across typical floors 2 to 10.',
  },
  {
    id: 922,
    project_id: 2,
    unit_number: 'Apartment (02)',
    title: '4+1 Bedroom Grand Family Residence — Moon Residency',
    floor: 4,
    beds: 4,
    baths: 3,
    area: 212,
    price: 158000,
    currency: 'USD',
    status: 'available',
    image_url: '/assets/moon-residency/apt_02_furnished.png',
    description:
      'Expansive multi-generational family suite on typical floors 2 to 10. Offers 4 bedrooms, separate formal guest salon (6.2m × 4.0m), 3 full bathrooms, spacious hall (11.3m × 4.8m), chef kitchen with pantry, and dual balconies. 193.6 m² net usable area (212.45 m² total area).',
  },
  {
    id: 923,
    project_id: 2,
    unit_number: 'Apartment (03)',
    title: '3+1 Bedroom Sunlit Residence — Moon Residency',
    floor: 5,
    beds: 3,
    baths: 2,
    area: 131,
    price: 102000,
    currency: 'USD',
    status: 'available',
    image_url: '/assets/moon-residency/apt_03_furnished.png',
    description:
      'Symmetric East-facing residence featuring 3 bedrooms plus dedicated guest reception room (6.0m × 3.5m), 2 bathrooms, sunlit balcony, high acoustic insulation double-glazing, and elevator access. 118.76 m² net area (130.75 m² total).',
  },
  {
    id: 924,
    project_id: 2,
    unit_number: 'Apartment (04)',
    title: '4+1 Bedroom Modern Panorama Suite — Moon Residency',
    floor: 6,
    beds: 4,
    baths: 3,
    area: 212,
    price: 165000,
    currency: 'USD',
    status: 'available',
    image_url: '/assets/moon-residency/apt_04_furnished.png',
    description:
      'Flagship 4-bedroom plus formal guest salon (Mehmankhana) residence. Enjoys 3 bathrooms, large living and dining hall, custom oak carpentry, seismic-grade concrete frame, and 24/7 solar hybrid power backup. 193.6 m² net area (212.45 m² total area).',
  },
];

const KABUL_PLAZA_BURJ_UNITS: ProjectUnit[] = [
  {
    id: 931,
    project_id: 3,
    unit_number: 'Apartment (A)',
    title: '3+1 Bedroom Luxury Residence — Kabul Plaza Burj',
    floor: 6,
    beds: 3,
    baths: 2,
    area: 172,
    price: 148000,
    currency: 'USD',
    status: 'available',
    image_url: '/assets/kabul-plaza-burj/apt_burj_a_furnished.png',
    description:
      'Kabul Plaza Burj contemporary 3-bedroom plus formal Guest Salon (Mehmankhana) residence on floors 6 to 14. Net usable area 152.5 m² (171.66 m² total), expansive living hall (7.65m × 5.3m), 2 bathrooms, modern kitchen, and scenic view over Shahr-e-Naw.',
  },
  {
    id: 932,
    project_id: 3,
    unit_number: 'Apartment (B)',
    title: '4+1 Bedroom Corner Family Residence — Kabul Plaza Burj',
    floor: 7,
    beds: 4,
    baths: 3,
    area: 247,
    price: 215000,
    currency: 'USD',
    status: 'available',
    image_url: '/assets/kabul-plaza-burj/apt_burj_b_furnished.png',
    description:
      'Expansive multi-generational family corner suite on floors 6 to 14. Net usable area 224 m² (247.38 m² total), 4 spacious bedrooms, separate formal guest room, 3 luxury bathrooms, and wrap-around balconies with skyline views.',
  },
  {
    id: 933,
    project_id: 3,
    unit_number: 'Apartment (C)',
    title: '4+1 Bedroom Grand Residence — Kabul Plaza Burj',
    floor: 8,
    beds: 4,
    baths: 3,
    area: 255,
    price: 222000,
    currency: 'USD',
    status: 'available',
    image_url: '/assets/kabul-plaza-burj/apt_burj_c_furnished.png',
    description:
      'Grand executive residence offering 232 m² net area (255.45 m² total). Features 4 bedrooms, independent Mehmankhana, chef kitchen with custom cabinetry, 3 bathrooms, double glazing, and high-speed elevator access.',
  },
  {
    id: 934,
    project_id: 3,
    unit_number: 'Apartment (D)',
    title: '4+1 Bedroom Flagship Panorama Suite — Kabul Plaza Burj',
    floor: 10,
    beds: 4,
    baths: 4,
    area: 279,
    price: 245000,
    currency: 'USD',
    status: 'available',
    image_url: '/assets/kabul-plaza-burj/apt_burj_d_furnished.png',
    description:
      'Flagship premier residence in Kabul Plaza Burj. 254 m² net area (279.46 m² total) with 4 bedrooms, formal reception salon, 4 full bathrooms, dual balconies, panoramic mountain vistas, and 2 designated basement parking spots.',
  },
  {
    id: 935,
    project_id: 3,
    unit_number: 'Apartment (E)',
    title: '3+1 Bedroom Executive Residence — Kabul Plaza Burj',
    floor: 11,
    beds: 3,
    baths: 2,
    area: 186,
    price: 160000,
    currency: 'USD',
    status: 'available',
    image_url: '/assets/kabul-plaza-burj/apt_burj_e_furnished.png',
    description:
      'Modern 3+1 executive apartment on floors 6 to 14. Net usable area 167 m² (185.73 m² total), 3 bedrooms, private guest salon, open dining area, 2 bathrooms, central heating ducts, and acoustic insulation.',
  },
  {
    id: 936,
    project_id: 3,
    unit_number: 'Apartment (F)',
    title: '3+1 Bedroom Sunlit Boulevard Suite — Kabul Plaza Burj',
    floor: 12,
    beds: 3,
    baths: 2,
    area: 179,
    price: 155000,
    currency: 'USD',
    status: 'available',
    image_url: '/assets/kabul-plaza-burj/apt_burj_f_furnished.png',
    description:
      'Sun-drenched South-facing 3-bedroom plus Mehmankhana suite. 161 m² net area (178.69 m² total), 2 bathrooms, contemporary open-concept kitchen, private balcony, and direct access to 1st & 2nd floor Kabul Mall.',
  },
];

const KABUL_PLAZA_12_UNITS: ProjectUnit[] = [
  {
    id: 941,
    project_id: 4,
    unit_number: 'Typical Floor — Unit A',
    title: '3+1 Bedroom Corner Residence — Kabul Plaza 12',
    floor: 3,
    beds: 3,
    baths: 3,
    area: 158,
    price: 128000,
    currency: 'USD',
    status: 'available',
    image_url: '/assets/kabul-plaza-12/apt_typical_a_furnished.png',
    description:
      'Available across typical floors 3, 5, 6, 7, and 8. Symmetrical 3-bedroom plus formal Guest Room (Mehmankhana) layout. Net usable area 146 m² (158.06 m² total), salon (6.25m × 5.0m), 3 full bathrooms, and front balcony overlooking Kart-e-Char.',
  },
  {
    id: 942,
    project_id: 4,
    unit_number: 'Typical Floor — Unit B',
    title: '3+1 Bedroom Boulevard Suite — Kabul Plaza 12',
    floor: 5,
    beds: 3,
    baths: 3,
    area: 158,
    price: 128000,
    currency: 'USD',
    status: 'available',
    image_url: '/assets/kabul-plaza-12/apt_typical_b_furnished.png',
    description:
      'East-facing 3-bedroom plus guest salon on floors 3 through 8. Net area 146 m² (158.06 m² total). Features master bedroom with en-suite bath, closed kitchen, modern corridor layout, and double-glazed soundproof windows.',
  },
  {
    id: 943,
    project_id: 4,
    unit_number: '4th & 9th Floor — Unit A',
    title: '3+1 Bedroom Terrace Residence — Kabul Plaza 12',
    floor: 4,
    beds: 3,
    baths: 3,
    area: 157,
    price: 132000,
    currency: 'USD',
    status: 'available',
    image_url: '/assets/kabul-plaza-12/apt_4th_9th_a_furnished.png',
    description:
      'Special 4th and 9th floor architectural terrace layout. Net usable area 145.2 m² (157.25 m² total). Enjoys deep private balcony, 3 bedrooms, formal Mehmankhana, 3 bathrooms, and modern kitchen.',
  },
  {
    id: 944,
    project_id: 4,
    unit_number: '4th & 9th Floor — Unit B',
    title: '3+1 Bedroom Panoramic Terrace Suite — Kabul Plaza 12',
    floor: 9,
    beds: 3,
    baths: 3,
    area: 157,
    price: 134000,
    currency: 'USD',
    status: 'available',
    image_url: '/assets/kabul-plaza-12/apt_4th_9th_b_furnished.png',
    description:
      'Upper-level 9th floor terrace apartment with unobstructed views across Kart-e-Char and the Kabul hills. 145.2 m² net area (157.25 m² total), 3 bedrooms, 3 bathrooms, and elevator foyer.',
  },
  {
    id: 945,
    project_id: 4,
    unit_number: '10th Floor Penthouse',
    title: 'Exclusive Rooftop Penthouse — Kabul Plaza 12',
    floor: 10,
    beds: 4,
    baths: 3,
    area: 180,
    price: 175000,
    currency: 'USD',
    status: 'available',
    image_url: '/assets/kabul-plaza-12/floor_10_penthouse_furnished_masterplan.png',
    description:
      'Single full-floor penthouse residence crowning Kabul Plaza 12 on the 10th floor. Total area 179.96 m² with private rooftop terrace, 4 bedrooms, 3 bathrooms, panoramic sky views, and private keycard elevator access.',
  },
];

const KABUL_PLAZA_ABC_UNITS: ProjectUnit[] = [
  {
    id: 951,
    project_id: 5,
    unit_number: 'Typical Floor — Unit A',
    title: '4+1 Bedroom Luxury Residence — Kabul Plaza ABC',
    floor: 3,
    beds: 4,
    baths: 3,
    area: 175,
    price: 152000,
    currency: 'USD',
    status: 'available',
    image_url: '/assets/kabul-plaza-abc/apt_a_furnished.png',
    description:
      'Available across typical floors 2 through 7 in Shahr-e-Naw Haj o Awqaf. 4 bedrooms plus an independent formal Guest Room (Mehmankhana). Net area 157.4 m² (175.08 m² total area), central family salon, 3 bathrooms, and dual balconies.',
  },
  {
    id: 952,
    project_id: 5,
    unit_number: 'Typical Floor — Unit B',
    title: '4+1 Bedroom Sunlit Family Suite — Kabul Plaza ABC',
    floor: 5,
    beds: 4,
    baths: 3,
    area: 168,
    price: 146000,
    currency: 'USD',
    status: 'available',
    image_url: '/assets/kabul-plaza-abc/apt_b_furnished.png',
    description:
      'East-facing 4-bedroom plus guest salon suite on floors 2 to 7. Net usable area 150.3 m² (167.68 m² total area). Features master suite with private bath, large dining hall, chef kitchen, and acoustic double glazing.',
  },
  {
    id: 953,
    project_id: 5,
    unit_number: '8th & 9th Duplex — Penthouse A',
    title: '6+1 Bedroom Two-Level Sky Penthouse — Kabul Plaza ABC',
    floor: 8,
    beds: 6,
    baths: 5,
    area: 347,
    price: 295000,
    currency: 'USD',
    status: 'available',
    image_url: '/assets/kabul-plaza-abc/apt_duplex_a_furnished.png',
    description:
      'Spectacular two-level duplex sky penthouse spanning the 8th and 9th floors. Total area 346.8 m² featuring 6 bedrooms, 5 bathrooms, internal open spiral staircase, double-height ceiling reception hall, and panoramic mountain views.',
  },
  {
    id: 954,
    project_id: 5,
    unit_number: '8th & 9th Duplex — Penthouse B',
    title: '6+1 Bedroom Sky Villa with Green Roof — Kabul Plaza ABC',
    floor: 8,
    beds: 6,
    baths: 5,
    area: 333,
    price: 285000,
    currency: 'USD',
    status: 'available',
    image_url: '/assets/kabul-plaza-abc/apt_duplex_b_furnished.png',
    description:
      'Flagship two-level sky villa on the 8th & 9th floors with a private open green roof terrace. Total area 332.8 m², 6 bedrooms, 5 bathrooms, formal Mehmankhana, chef kitchen with pantry, and 2 reserved basement parking stalls.',
  },
];

const statusBadgeMap: Record<
  ProjectUnit['status'],
  'available' | 'pending' | 'sold' | 'rented'
> = {
  available: 'available',
  reserved: 'pending',
  sold: 'sold',
  rented: 'rented',
};

export function ApartmentFullInfoModal({
  unit,
  projectName,
  onClose,
}: {
  unit: ProjectUnit;
  projectName: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const displayTitle = unit.title || `${projectName} — Unit ${unit.unit_number}`;
  const currency = unit.currency || 'USD';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.25 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden my-8 max-h-[90vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="relative h-60 sm:h-72 bg-brand-navy shrink-0 overflow-hidden">
          {unit.image_url ? (
            <img
              src={unit.image_url}
              alt={displayTitle}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-navy via-brand-navy-light to-brand-navy-deep">
              <Building2 className="w-16 h-16 text-white/20" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/20" />

          <button
            type="button"
            onClick={onClose}
            aria-label="Close apartment details"
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/55 text-white hover:bg-black/80 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-4 left-6 right-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-brand-gold text-white">
                  Unit {unit.unit_number}
                </span>
                <Badge status={statusBadgeMap[unit.status]} />
                <span className="text-xs text-white/80 font-medium">
                  {projectName}
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white leading-snug">
                {displayTitle}
              </h3>
            </div>

            <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2 text-right">
              <span className="text-[10px] uppercase tracking-widest text-white/75 block">
                Total Pre-Sale Price
              </span>
              <span className="text-xl font-extrabold text-white">
                {unit.price !== null
                  ? `${currency} ${Number(unit.price).toLocaleString()}`
                  : 'Price on Request'}
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Key Specifications Grid */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
              Apartment Specifications
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3.5">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                  <Layers className="w-4 h-4 text-brand-gold" />
                  Floor Level
                </div>
                <p className="text-base font-bold text-brand-navy">
                  {unit.floor !== null ? `Floor ${unit.floor}` : 'Standard'}
                </p>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3.5">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                  <Bed className="w-4 h-4 text-brand-gold" />
                  Bedrooms
                </div>
                <p className="text-base font-bold text-brand-navy">
                  {unit.beds !== null ? `${unit.beds} Bedrooms` : 'N/A'}
                </p>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3.5">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                  <Bath className="w-4 h-4 text-brand-gold" />
                  Bathrooms
                </div>
                <p className="text-base font-bold text-brand-navy">
                  {unit.baths !== null ? `${unit.baths} Bathrooms` : 'N/A'}
                </p>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3.5">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                  <Maximize2 className="w-4 h-4 text-brand-gold" />
                  Total Area
                </div>
                <p className="text-base font-bold text-brand-navy">
                  {unit.area !== null ? `${unit.area} m²` : '165 m²'}
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Architectural Floor Plan & Location Legend */}
          {(() => {
            const pid = Number(unit.project_id);
            const un = unit.unit_number.toLowerCase();

            let technicalPlan = '/assets/kabul-plaza-saljuqi/apt_typical_a_technical.png';
            let furnishedPlan = '/assets/kabul-plaza-saljuqi/apt_typical_a_furnished.png';
            let legendImg = '/assets/kabul-plaza-saljuqi/apt_typical_a_legend.png';

            // Project 3: Kabul Plaza Burj
            if (pid === 3 || un.includes('burj')) {
              if (un.includes('(b)')) {
                technicalPlan = '/assets/kabul-plaza-burj/apt_burj_b_technical.png';
                furnishedPlan = '/assets/kabul-plaza-burj/apt_burj_b_furnished.png';
                legendImg = '/assets/kabul-plaza-burj/apt_burj_b_legend.png';
              } else if (un.includes('(c)')) {
                technicalPlan = '/assets/kabul-plaza-burj/apt_burj_c_technical.png';
                furnishedPlan = '/assets/kabul-plaza-burj/apt_burj_c_furnished.png';
                legendImg = '/assets/kabul-plaza-burj/apt_burj_c_legend.png';
              } else if (un.includes('(d)')) {
                technicalPlan = '/assets/kabul-plaza-burj/apt_burj_d_technical.png';
                furnishedPlan = '/assets/kabul-plaza-burj/apt_burj_d_furnished.png';
                legendImg = '/assets/kabul-plaza-burj/apt_burj_d_legend.png';
              } else if (un.includes('(e)')) {
                technicalPlan = '/assets/kabul-plaza-burj/apt_burj_e_technical.png';
                furnishedPlan = '/assets/kabul-plaza-burj/apt_burj_e_furnished.png';
                legendImg = '/assets/kabul-plaza-burj/apt_burj_e_legend.png';
              } else if (un.includes('(f)')) {
                technicalPlan = '/assets/kabul-plaza-burj/apt_burj_f_technical.png';
                furnishedPlan = '/assets/kabul-plaza-burj/apt_burj_f_furnished.png';
                legendImg = '/assets/kabul-plaza-burj/apt_burj_f_legend.png';
              } else {
                technicalPlan = '/assets/kabul-plaza-burj/apt_burj_a_technical.png';
                furnishedPlan = '/assets/kabul-plaza-burj/apt_burj_a_furnished.png';
                legendImg = '/assets/kabul-plaza-burj/apt_burj_a_legend.png';
              }
            }
            // Project 4: Kabul Plaza 12
            else if (pid === 4 || un.includes('kabul plaza 12') || un.includes('kp12')) {
              if (un.includes('unit b') && (un.includes('4th') || un.includes('9th'))) {
                technicalPlan = '/assets/kabul-plaza-12/apt_4th_9th_b_technical.png';
                furnishedPlan = '/assets/kabul-plaza-12/apt_4th_9th_b_furnished.png';
                legendImg = '/assets/kabul-plaza-12/apt_4th_9th_b_legend.png';
              } else if (un.includes('unit a') && (un.includes('4th') || un.includes('9th'))) {
                technicalPlan = '/assets/kabul-plaza-12/apt_4th_9th_a_technical.png';
                furnishedPlan = '/assets/kabul-plaza-12/apt_4th_9th_a_furnished.png';
                legendImg = '/assets/kabul-plaza-12/apt_4th_9th_a_legend.png';
              } else if (un.includes('unit b')) {
                technicalPlan = '/assets/kabul-plaza-12/apt_typical_b_technical.png';
                furnishedPlan = '/assets/kabul-plaza-12/apt_typical_b_furnished.png';
                legendImg = '/assets/kabul-plaza-12/apt_typical_b_legend.png';
              } else if (un.includes('penthouse') || un.includes('10th')) {
                technicalPlan = '/assets/kabul-plaza-12/floor_typical_technical_masterplan.png';
                furnishedPlan = '/assets/kabul-plaza-12/floor_10_penthouse_furnished_masterplan.png';
                legendImg = '/assets/kabul-plaza-12/floor_04_09_furnished_masterplan.png';
              } else {
                technicalPlan = '/assets/kabul-plaza-12/apt_typical_a_technical.png';
                furnishedPlan = '/assets/kabul-plaza-12/apt_typical_a_furnished.png';
                legendImg = '/assets/kabul-plaza-12/apt_typical_a_legend.png';
              }
            }
            // Project 5: Kabul Plaza ABC / Kabul Plaza 09
            else if (pid === 5 || un.includes('abc') || un.includes('09')) {
              if (un.includes('duplex') && un.includes('b')) {
                technicalPlan = '/assets/kabul-plaza-abc/apt_duplex_b_technical.png';
                furnishedPlan = '/assets/kabul-plaza-abc/apt_duplex_b_furnished.png';
                legendImg = '/assets/kabul-plaza-abc/apt_duplex_b_legend.png';
              } else if (un.includes('duplex')) {
                technicalPlan = '/assets/kabul-plaza-abc/apt_duplex_a_technical.png';
                furnishedPlan = '/assets/kabul-plaza-abc/apt_duplex_a_furnished.png';
                legendImg = '/assets/kabul-plaza-abc/apt_duplex_a_legend.png';
              } else if (un.includes('unit b')) {
                technicalPlan = '/assets/kabul-plaza-abc/apt_b_technical.png';
                furnishedPlan = '/assets/kabul-plaza-abc/apt_b_furnished.png';
                legendImg = '/assets/kabul-plaza-abc/apt_b_legend.png';
              } else {
                technicalPlan = '/assets/kabul-plaza-abc/apt_a_technical.png';
                furnishedPlan = '/assets/kabul-plaza-abc/apt_a_furnished.png';
                legendImg = '/assets/kabul-plaza-abc/apt_a_legend.png';
              }
            }
            // Project 2: Moon Residency
            else if (pid === 2 || un.includes('moon') || un.includes('(01)') || un.includes('(02)') || un.includes('(03)') || un.includes('(04)')) {
              if (un.includes('02')) {
                technicalPlan = '/assets/moon-residency/apt_02_technical.png';
                furnishedPlan = '/assets/moon-residency/apt_02_furnished.png';
                legendImg = '/assets/moon-residency/apt_02_legend.png';
              } else if (un.includes('03')) {
                technicalPlan = '/assets/moon-residency/apt_03_technical.png';
                furnishedPlan = '/assets/moon-residency/apt_03_furnished.png';
                legendImg = '/assets/moon-residency/apt_03_legend.png';
              } else if (un.includes('04')) {
                technicalPlan = '/assets/moon-residency/apt_04_technical.png';
                furnishedPlan = '/assets/moon-residency/apt_04_furnished.png';
                legendImg = '/assets/moon-residency/apt_04_legend.png';
              } else {
                technicalPlan = '/assets/moon-residency/apt_01_technical.png';
                furnishedPlan = '/assets/moon-residency/apt_01_furnished.png';
                legendImg = '/assets/moon-residency/apt_01_legend.png';
              }
            }
            // Project 1: Kabul Plaza Saljuqi (default)
            else if (un.includes('1st') || un.includes('commercial')) {
              technicalPlan = '/assets/kabul-plaza-saljuqi/apt_1st_a_technical.png';
              furnishedPlan = '/assets/kabul-plaza-saljuqi/apt_1st_a_furnished.png';
              legendImg = '/assets/kabul-plaza-saljuqi/apt_1st_a_legend.png';
            } else if (un.includes('11th') && un.includes('b')) {
              technicalPlan = '/assets/kabul-plaza-saljuqi/apt_11th_vip_b_technical.png';
              furnishedPlan = '/assets/kabul-plaza-saljuqi/apt_11th_vip_b_furnished.png';
              legendImg = '/assets/kabul-plaza-saljuqi/apt_11th_vip_b_legend.png';
            } else if (un.includes('11th')) {
              technicalPlan = '/assets/kabul-plaza-saljuqi/apt_11th_vip_a_technical.png';
              furnishedPlan = '/assets/kabul-plaza-saljuqi/apt_11th_vip_a_furnished.png';
              legendImg = '/assets/kabul-plaza-saljuqi/apt_11th_vip_a_legend.png';
            } else if (un.includes('unit b') || un.includes('5+1')) {
              technicalPlan = '/assets/kabul-plaza-saljuqi/apt_typical_b_technical.png';
              furnishedPlan = '/assets/kabul-plaza-saljuqi/apt_typical_b_furnished.png';
              legendImg = '/assets/kabul-plaza-saljuqi/apt_typical_b_legend.png';
            } else if (un.includes('unit c') || un.includes('4+1')) {
              technicalPlan = '/assets/kabul-plaza-saljuqi/apt_typical_c_technical.png';
              furnishedPlan = '/assets/kabul-plaza-saljuqi/apt_typical_c_furnished.png';
              legendImg = '/assets/kabul-plaza-saljuqi/apt_typical_c_legend.png';
            }

            return (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-brand-navy flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-brand-gold" />
                    Architectural Layout Plan &amp; Masterplan Position
                  </h4>
                  <span className="text-[11px] font-semibold text-gray-500">
                    High-Precision Aligned Scale
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  {/* Aligned Floor Plan Preview */}
                  <div className="md:col-span-8 bg-white border border-gray-200 rounded-lg p-2 overflow-hidden flex items-center justify-center min-h-[220px]">
                    <img
                      src={furnishedPlan}
                      alt={`${unit.unit_number} Furnished Plan`}
                      className="max-h-56 w-auto object-contain mx-auto"
                      loading="lazy"
                    />
                  </div>

                  {/* Masterplan Location Legend */}
                  <div className="md:col-span-4 bg-white border border-gray-200 rounded-lg p-3 text-center flex flex-col items-center justify-center">
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Masterplan Location Legend
                    </p>
                    <img
                      src={legendImg}
                      alt="Apartment Location in Masterplan"
                      className="max-h-40 w-auto object-contain rounded border border-gray-100 bg-gray-50 p-1"
                      loading="lazy"
                    />
                    <p className="text-[10px] text-gray-400 mt-2">
                      Highlighted zone shows unit position on the floor plate
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Full Description & Architectural Highlights */}
          <div className="bg-brand-cream/60 rounded-xl p-4 border border-gray-200/80">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-navy mb-2 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-brand-gold" />
              Residence Overview & Highlights
            </h4>
            <p className="text-sm text-gray-700 leading-relaxed mb-3">
              {unit.description ||
                `Unit ${unit.unit_number} in ${projectName} is engineered to contemporary structural standards with abundant natural daylight, high-insulation acoustic glazing, independent heating infrastructure, and premium interior finishes.`}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-gray-200/70 text-xs text-gray-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Reinforced seismic-grade concrete structure</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>24/7 high-speed elevator & backup power</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Dedicated underground parking & storage</span>
              </div>
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-brand-gold shrink-0" />
                <span>Status: {unit.status.toUpperCase()}</span>
              </div>
            </div>
          </div>

          {/* Interactive Pre-Sale Payment Plan Comparison for this Apartment */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="w-4 h-4 text-brand-gold" />
              <h4 className="text-sm font-bold text-brand-navy">
                Available Pre-Sale Payment Plans for Unit {unit.unit_number}
              </h4>
            </div>

            <PaymentPlanComparisonCard
              projectName={`${projectName} — Unit ${unit.unit_number}`}
              initialPrice={unit.price !== null ? Number(unit.price) : 125000}
              compact
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function ProjectUnitsSection({ projectId, projectName }: ProjectUnitsSectionProps) {
  const [units, setUnits] = useState<ProjectUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'available' | 'reserved' | 'sold'>('all');
  const [selectedUnit, setSelectedUnit] = useState<ProjectUnit | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    const numericId = Number(projectId) || 1;
    const projectFallbackList =
      numericId === 2
        ? MOON_RESIDENCY_UNITS
        : numericId === 3
        ? KABUL_PLAZA_BURJ_UNITS
        : numericId === 4
        ? KABUL_PLAZA_12_UNITS
        : numericId === 5
        ? KABUL_PLAZA_ABC_UNITS
        : FALLBACK_UNITS;
    getProjectUnits(numericId)
      .then((res) => {
        if (!mounted) return;
        if (res.items && res.items.length > 0) {
          setUnits(res.items);
        } else {
          setUnits(
            projectFallbackList.map((u) => ({
              ...u,
              project_id: numericId,
            }))
          );
        }
      })
      .catch(() => {
        if (!mounted) return;
        setUnits(
          projectFallbackList.map((u) => ({
            ...u,
            project_id: numericId,
          }))
        );
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [projectId]);

  if (loading) {
    return (
      <div className="py-8">
        <div className="h-8 w-56 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-44 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const filteredUnits = filter === 'all' ? units : units.filter((u) => u.status === filter);
  const availableCount = units.filter((u) => u.status === 'available').length;

  return (
    <div className="mt-10 pt-10 border-t border-gray-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-brand-navy flex items-center gap-2">
            <Building2 className="w-5 h-5 text-brand-gold" />
            Available Apartments & Units
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {availableCount} of {units.length} units currently available in {projectName} — click any apartment card to open full specifications & payment plans
          </p>
        </div>

        {/* Status filter pills */}
        <div className="flex flex-wrap gap-1.5 bg-gray-100 p-1 rounded-xl self-start">
          {(['all', 'available', 'reserved', 'sold'] as const).map((statusKey) => (
            <button
              key={statusKey}
              type="button"
              onClick={() => setFilter(statusKey)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                filter === statusKey
                  ? 'bg-brand-navy text-white shadow-sm'
                  : 'text-gray-600 hover:text-brand-navy'
              }`}
            >
              {statusKey === 'all' ? `All (${units.length})` : statusKey}
            </button>
          ))}
        </div>
      </div>

      {filteredUnits.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-8 text-center text-gray-500 text-sm">
          No units match the selected status filter.
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredUnits.map((unit) => {
              const displayTitle = unit.title || `${projectName} — Unit ${unit.unit_number}`;
              return (
                <motion.div
                  layout
                  key={unit.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedUnit(unit)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedUnit(unit);
                    }
                  }}
                  initial={{ opacity: 0, y: 14, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.25 }}
                  className="group bg-white rounded-xl border border-gray-200 hover:border-brand-gold/60 p-5 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-brand-gold"
                >
                  <div>
                    {unit.image_url && (
                      <div className="relative mb-3 -mx-5 -mt-5 h-44 overflow-hidden rounded-t-xl bg-gray-100 border-b border-gray-100">
                        <img
                          src={unit.image_url}
                          alt={displayTitle}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                        <span className="absolute bottom-2.5 right-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur-xs px-2.5 py-1 text-[11px] font-semibold text-brand-navy shadow-xs">
                          <Eye className="w-3.5 h-3.5 text-brand-gold" />
                          View Full Details
                        </span>
                      </div>
                    )}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <span className="inline-block text-xs font-bold uppercase tracking-wider text-brand-gold bg-brand-gold/10 px-2.5 py-0.5 rounded-md mb-1">
                          Unit {unit.unit_number}
                        </span>
                        <h3 className="font-bold text-brand-navy text-base group-hover:text-brand-gold transition-colors">
                          {displayTitle}
                        </h3>
                      </div>
                      <Badge status={statusBadgeMap[unit.status]} />
                    </div>

                    {/* Specs row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-3 my-2 border-y border-gray-100 text-xs text-gray-600">
                      {unit.floor !== null && (
                        <div className="flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-brand-gold shrink-0" />
                          <span>Floor {unit.floor}</span>
                        </div>
                      )}
                      {unit.beds !== null && (
                        <div className="flex items-center gap-1.5">
                          <Bed className="w-3.5 h-3.5 text-brand-gold shrink-0" />
                          <span>{unit.beds} Beds</span>
                        </div>
                      )}
                      {unit.baths !== null && (
                        <div className="flex items-center gap-1.5">
                          <Bath className="w-3.5 h-3.5 text-brand-gold shrink-0" />
                          <span>{unit.baths} Baths</span>
                        </div>
                      )}
                      {unit.area !== null && (
                        <div className="flex items-center gap-1.5">
                          <Maximize2 className="w-3.5 h-3.5 text-brand-gold shrink-0" />
                          <span>{unit.area} m²</span>
                        </div>
                      )}
                    </div>

                    {unit.description && (
                      <p className="text-xs text-gray-500 line-clamp-2 mb-3">
                        {unit.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 mt-1">
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-gray-400 block">
                        Price
                      </span>
                      <span className="text-lg font-extrabold text-brand-navy">
                        {unit.price !== null
                          ? `${unit.currency || 'USD'} ${Number(unit.price).toLocaleString()}`
                          : 'Price on Request'}
                      </span>
                    </div>

                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-gold group-hover:translate-x-0.5 transition-transform">
                      Open Full Apartment Info →
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Full Apartment Information Modal */}
      <AnimatePresence>
        {selectedUnit && (
          <ApartmentFullInfoModal
            unit={selectedUnit}
            projectName={projectName}
            onClose={() => setSelectedUnit(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
