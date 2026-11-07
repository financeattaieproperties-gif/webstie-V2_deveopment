import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
} from 'motion/react';
import {
  SlidersHorizontal,
  RotateCcw,
  Upload,
  Building2,
  Eye,
  MoveHorizontal,
  X,
} from 'lucide-react';
import defaultExteriorImg from '../../assets/images/project_exterior_elevation_1793995966183.jpg';
import defaultTechnicalPlanImg from '../../assets/images/floorplan_technical_blueprint_1793995969202.jpg';
import defaultFurnishedPlanImg from '../../assets/images/floorplan_furnished_3d_1793995968986.jpg';

export interface ExplorerCustomAssets {
  exteriorUrl: string;
  technicalPlanUrl: string;
  furnishedPlanUrl: string;
  projectTitle?: string;
}

export interface PremiumProjectExplorerProps {
  projectId?: number | string;
  projectName?: string;
  projectLocation?: string;
  deliveryDate?: string | null;
  initialExteriorUrl?: string | null;
  initialTechnicalPlanUrl?: string | null;
  initialFurnishedPlanUrl?: string | null;
  onRequestVisit?: (unitLabel: string) => void;
}

interface FloorSpec {
  floor: number;
  label: string;
  elevationMeters: number;
  bandTopPct: number;
  bandHeightPct: number;
  totalUnits: number;
  availableUnits: number;
  reservedUnits: number;
  soldUnits: number;
  typologyId: 'type-a' | 'type-b' | 'penthouse';
  startingPriceUsd: number;
  status: 'available' | 'limited' | 'reserved' | 'sold';
}

interface RoomHotspot {
  id: string;
  nameEn: string;
  nameFa: string;
  areaSqm: number;
  dimensions: string;
  xPct: number;
  yPct: number;
  orientation: string;
  finishSpec: string;
  structuralNote: string;
}

interface UnitTypology {
  id: 'type-a' | 'type-b' | 'penthouse';
  code: string;
  name: string;
  nameFa: string;
  totalAreaSqm: number;
  balconyAreaSqm: number;
  beds: number;
  baths: number;
  hasMehmankhana: boolean;
  aspect: string;
  basePriceUsd: number;
  ceilingHeightM: number;
  rooms: RoomHotspot[];
}

const CUSTOM_ASSETS_STORAGE_KEY = 'attaie_custom_project_explorer_assets_v1';

const UNIT_TYPOLOGIES: Record<'type-a' | 'type-b' | 'penthouse', UnitTypology> = {
  'type-a': {
    id: 'type-a',
    code: 'TYPE A · RESIDENCE',
    name: '3-Bedroom + Formal Mehmankhana',
    nameFa: 'اپارتمان ۳ اتاقه + مهمان‌خانه مستقل',
    totalAreaSqm: 210,
    balconyAreaSqm: 12.5,
    beds: 3,
    baths: 3,
    hasMehmankhana: true,
    aspect: 'South-East / Mountain & Courtyard View',
    basePriceUsd: 168000,
    ceilingHeightM: 3.15,
    rooms: [
      {
        id: 'salon',
        nameEn: 'Family Living Salon',
        nameFa: 'صالون نشیمن خانوادگی',
        areaSqm: 57.8,
        dimensions: '6.80m × 8.50m',
        xPct: 24,
        yPct: 62,
        orientation: 'South Terrace Glazing',
        finishSpec: 'Herringbone Oak Parquet · Acoustic Cove Ceiling',
        structuralNote: 'Clear-span RC beam · 250×450mm perimeter columns',
      },
      {
        id: 'mehmankhana',
        nameEn: 'Formal Mehmankhana (Guest Reception)',
        nameFa: 'مهمان‌خانه رسمی با ورودی مجزا',
        areaSqm: 24.0,
        dimensions: '4.20m × 5.70m',
        xPct: 43,
        yPct: 66,
        orientation: 'South-Central',
        finishSpec: 'Hand-finished Travertine Threshold · Dual Pocket Doors',
        structuralNote: 'Direct foyer privacy separation from family wing',
      },
      {
        id: 'kitchen',
        nameEn: 'Closed & Open Dual Kitchen',
        nameFa: 'آشپزخانه مدرن با جزیره سنگ مرمر',
        areaSqm: 18.5,
        dimensions: '3.60m × 5.15m',
        xPct: 55,
        yPct: 31,
        orientation: 'North-Central',
        finishSpec: 'Calacatta Quartz Countertop · Dedicated Utility Balcony',
        structuralNote: 'Central wet-riser shaft + natural ventilation duct',
      },
      {
        id: 'master',
        nameEn: 'Master Bedroom Suite + Walk-In',
        nameFa: 'اتاق خواب ماستر با الماری و تشناب مستقل',
        areaSqm: 28.0,
        dimensions: '4.20m × 6.65m',
        xPct: 83,
        yPct: 27,
        orientation: 'East Morning Sun',
        finishSpec: 'En-suite 8.5 m² Marble Bath · 6.0 m² Walk-In Closet',
        structuralNote: 'Double-glazed thermal break aluminum curtain wall',
      },
      {
        id: 'bedroom-1',
        nameEn: 'Bedroom 2 (South Wing)',
        nameFa: 'اتاق خواب دوم (سمت آفتاب‌رخ)',
        areaSqm: 18.0,
        dimensions: '3.60m × 5.00m',
        xPct: 60,
        yPct: 64,
        orientation: 'South Daylight',
        finishSpec: 'Built-in Walnut Wardrobe · Shared 6.0 m² Bath',
        structuralNote: '200mm acoustic block partition wall',
      },
      {
        id: 'bedroom-2',
        nameEn: 'Bedroom 3 (Corner Suite)',
        nameFa: 'اتاق خواب سوم',
        areaSqm: 17.5,
        dimensions: '4.20m × 4.15m',
        xPct: 84,
        yPct: 68,
        orientation: 'South-East Corner',
        finishSpec: 'Adjacent 5.5 m² Bathroom · Full-Height Casement Windows',
        structuralNote: 'Corner shear-wall seismic reinforcement',
      },
      {
        id: 'terrace',
        nameEn: 'Landscaped Panorama Terrace',
        nameFa: 'بام‌تراس و بالکن سرتاسری',
        areaSqm: 12.5,
        dimensions: '1.80m × 6.95m',
        xPct: 30,
        yPct: 86,
        orientation: 'Full South Exposure',
        finishSpec: 'Non-slip Frost-Proof Porcelain · Integrated Planter Box',
        structuralNote: 'Cantilevered slab with thermal bridge insulation',
      },
    ],
  },
  'type-b': {
    id: 'type-b',
    code: 'TYPE B · EXECUTIVE',
    name: '2-Bedroom + Mehmankhana Corner',
    nameFa: 'اپارتمان ۲ اتاقه + مهمان‌خانه و بالکن',
    totalAreaSqm: 165,
    balconyAreaSqm: 9.8,
    beds: 2,
    baths: 2,
    hasMehmankhana: true,
    aspect: 'South-West / Sunset City View',
    basePriceUsd: 132000,
    ceilingHeightM: 3.1,
    rooms: [
      {
        id: 'salon',
        nameEn: 'Open Family Salon & Dining',
        nameFa: 'صالون نشیمن و غذاخوری',
        areaSqm: 46.5,
        dimensions: '6.20m × 7.50m',
        xPct: 26,
        yPct: 60,
        orientation: 'South-West Glazing',
        finishSpec: 'Natural Oak Plank · Recessed Linear Lighting',
        structuralNote: 'Post-tensioned flat slab · zero drop beams',
      },
      {
        id: 'mehmankhana',
        nameEn: 'Guest Mehmankhana Suite',
        nameFa: 'مهمان‌خانه مستقل',
        areaSqm: 21.0,
        dimensions: '4.00m × 5.25m',
        xPct: 44,
        yPct: 65,
        orientation: 'South',
        finishSpec: 'Acoustic Sliding Partition · Guest Powder Room Access',
        structuralNote: 'Dual-entry lobby vestibule',
      },
      {
        id: 'kitchen',
        nameEn: 'Enclosed Chef Kitchen',
        nameFa: 'آشپزخانه مجهز با تهویه طبیعی',
        areaSqm: 15.2,
        dimensions: '3.60m × 4.20m',
        xPct: 55,
        yPct: 32,
        orientation: 'North',
        finishSpec: 'Matte Anthracite Cabinetry · Turkish Granite Top',
        structuralNote: 'Dedicated utility laundry alcove (4.2 m²)',
      },
      {
        id: 'master',
        nameEn: 'Master Suite + En-suite Bath',
        nameFa: 'اتاق خواب ماستر',
        areaSqm: 26.5,
        dimensions: '4.20m × 6.30m',
        xPct: 82,
        yPct: 29,
        orientation: 'West Mountain View',
        finishSpec: 'Walk-in Dressing Room · Rain Shower En-suite',
        structuralNote: 'Triple-seal acoustic window frames',
      },
      {
        id: 'bedroom-1',
        nameEn: 'Second Bedroom',
        nameFa: 'اتاق خواب دوم',
        areaSqm: 16.8,
        dimensions: '3.60m × 4.65m',
        xPct: 62,
        yPct: 66,
        orientation: 'South',
        finishSpec: 'Full-Height Wardrobe · Balcony Access',
        structuralNote: 'Insulated exterior cavity wall',
      },
      {
        id: 'terrace',
        nameEn: 'Recessed Sky Balcony',
        nameFa: 'بالکن آفتاب‌رخ',
        areaSqm: 9.8,
        dimensions: '1.80m × 5.45m',
        xPct: 32,
        yPct: 86,
        orientation: 'South-West',
        finishSpec: 'Tempered Laminated Glass Balustrade',
        structuralNote: 'Integrated floor drainage channel',
      },
    ],
  },
  penthouse: {
    id: 'penthouse',
    code: 'SKY PENTHOUSE · LEVEL 11–12',
    name: '4-Bedroom Panorama Sky Residence',
    nameFa: 'پنت‌هاوس ۴ اتاقه با تخت‌بام اختصاصی',
    totalAreaSqm: 320,
    balconyAreaSqm: 38.0,
    beds: 4,
    baths: 4,
    hasMehmankhana: true,
    aspect: '360° Kabul Mountain & Paghman Panorama',
    basePriceUsd: 285000,
    ceilingHeightM: 3.6,
    rooms: [
      {
        id: 'salon',
        nameEn: 'Grand Double-Aspect Salon',
        nameFa: 'صالون بزرگ پنت‌هاوس',
        areaSqm: 78.0,
        dimensions: '8.20m × 9.50m',
        xPct: 25,
        yPct: 60,
        orientation: 'South & West Panorama',
        finishSpec: 'Bookmatched Marble Feature Wall · Smart Climate Zone',
        structuralNote: '3.60m clear ceiling height',
      },
      {
        id: 'mehmankhana',
        nameEn: 'Royal Mehmankhana Pavilion',
        nameFa: 'مهمان‌خانه تشریفاتی و تخت‌بام',
        areaSqm: 36.0,
        dimensions: '5.00m × 7.20m',
        xPct: 44,
        yPct: 65,
        orientation: 'South Terrace Direct Access',
        finishSpec: 'Custom Hand-Carved Cedar Ceiling Trim · Private Foyer',
        structuralNote: 'Direct elevator lobby access',
      },
      {
        id: 'kitchen',
        nameEn: 'Show Kitchen + Back Service Kitchen',
        nameFa: 'آشپزخانه سرد و گرم',
        areaSqm: 26.0,
        dimensions: '4.50m × 5.80m',
        xPct: 55,
        yPct: 30,
        orientation: 'North-East',
        finishSpec: 'Waterfall Marble Island · Pantry & Staff Utility',
        structuralNote: 'Dual exhaust & filtered fresh-air supply',
      },
      {
        id: 'master',
        nameEn: 'Presidential Master Wing',
        nameFa: 'سوئیت ماستر اختصاصی',
        areaSqm: 44.0,
        dimensions: '5.50m × 8.00m',
        xPct: 83,
        yPct: 28,
        orientation: 'East Sunrise Panorama',
        finishSpec: 'His & Hers Walk-In Closets · Freestanding Soaking Tub',
        structuralNote: 'Private east morning balcony',
      },
      {
        id: 'terrace',
        nameEn: 'Landscaped Takht-e-Bam Sky Garden',
        nameFa: 'تخت‌بام سرسبز اختصاصی با آلاچیق',
        areaSqm: 38.0,
        dimensions: '2.60m × 14.60m',
        xPct: 30,
        yPct: 86,
        orientation: 'Full Southern Horizon',
        finishSpec: 'Pergola Gazebo · Outdoor Kitchen & Heated Seating Area',
        structuralNote: 'Reinforced roof garden waterproofing membrane',
      },
    ],
  },
};

const TOWER_FLOORS: FloorSpec[] = [
  {
    floor: 12,
    label: 'Level 12 · Sky Penthouse North/South',
    elevationMeters: 41.5,
    bandTopPct: 9.5,
    bandHeightPct: 5.5,
    totalUnits: 2,
    availableUnits: 1,
    reservedUnits: 1,
    soldUnits: 0,
    typologyId: 'penthouse',
    startingPriceUsd: 295000,
    status: 'limited',
  },
  {
    floor: 11,
    label: 'Level 11 · Sky Penthouse Lower',
    elevationMeters: 37.8,
    bandTopPct: 15.2,
    bandHeightPct: 5.4,
    totalUnits: 2,
    availableUnits: 2,
    reservedUnits: 0,
    soldUnits: 0,
    typologyId: 'penthouse',
    startingPriceUsd: 285000,
    status: 'available',
  },
  {
    floor: 10,
    label: 'Level 10 · High-Zone Residence',
    elevationMeters: 34.4,
    bandTopPct: 21.0,
    bandHeightPct: 5.4,
    totalUnits: 4,
    availableUnits: 3,
    reservedUnits: 1,
    soldUnits: 0,
    typologyId: 'type-a',
    startingPriceUsd: 182000,
    status: 'available',
  },
  {
    floor: 9,
    label: 'Level 09 · High-Zone Residence',
    elevationMeters: 31.1,
    bandTopPct: 26.7,
    bandHeightPct: 5.4,
    totalUnits: 4,
    availableUnits: 2,
    reservedUnits: 1,
    soldUnits: 1,
    typologyId: 'type-a',
    startingPriceUsd: 178000,
    status: 'available',
  },
  {
    floor: 8,
    label: 'Level 08 · Panorama Residence',
    elevationMeters: 27.8,
    bandTopPct: 32.4,
    bandHeightPct: 5.4,
    totalUnits: 4,
    availableUnits: 4,
    reservedUnits: 0,
    soldUnits: 0,
    typologyId: 'type-a',
    startingPriceUsd: 174000,
    status: 'available',
  },
  {
    floor: 7,
    label: 'Level 07 · Mid-Rise Executive',
    elevationMeters: 24.5,
    bandTopPct: 38.1,
    bandHeightPct: 5.4,
    totalUnits: 4,
    availableUnits: 1,
    reservedUnits: 2,
    soldUnits: 1,
    typologyId: 'type-a',
    startingPriceUsd: 170000,
    status: 'limited',
  },
  {
    floor: 6,
    label: 'Level 06 · Mid-Rise Executive',
    elevationMeters: 21.2,
    bandTopPct: 43.8,
    bandHeightPct: 5.4,
    totalUnits: 4,
    availableUnits: 3,
    reservedUnits: 0,
    soldUnits: 1,
    typologyId: 'type-b',
    startingPriceUsd: 138000,
    status: 'available',
  },
  {
    floor: 5,
    label: 'Level 05 · Courtyard View',
    elevationMeters: 17.9,
    bandTopPct: 49.5,
    bandHeightPct: 5.4,
    totalUnits: 4,
    availableUnits: 2,
    reservedUnits: 2,
    soldUnits: 0,
    typologyId: 'type-b',
    startingPriceUsd: 135000,
    status: 'available',
  },
  {
    floor: 4,
    label: 'Level 04 · Courtyard View',
    elevationMeters: 14.6,
    bandTopPct: 55.2,
    bandHeightPct: 5.4,
    totalUnits: 4,
    availableUnits: 0,
    reservedUnits: 1,
    soldUnits: 3,
    typologyId: 'type-b',
    startingPriceUsd: 132000,
    status: 'reserved',
  },
  {
    floor: 3,
    label: 'Level 03 · Garden Canopy Residence',
    elevationMeters: 11.3,
    bandTopPct: 60.9,
    bandHeightPct: 5.4,
    totalUnits: 4,
    availableUnits: 2,
    reservedUnits: 1,
    soldUnits: 1,
    typologyId: 'type-a',
    startingPriceUsd: 168000,
    status: 'available',
  },
  {
    floor: 2,
    label: 'Level 02 · Podium Residence',
    elevationMeters: 8.0,
    bandTopPct: 66.6,
    bandHeightPct: 5.4,
    totalUnits: 4,
    availableUnits: 0,
    reservedUnits: 0,
    soldUnits: 4,
    typologyId: 'type-b',
    startingPriceUsd: 128000,
    status: 'sold',
  },
  {
    floor: 1,
    label: 'Level 01 · Grand Lobby & Concierge',
    elevationMeters: 4.5,
    bandTopPct: 72.5,
    bandHeightPct: 7.5,
    totalUnits: 2,
    availableUnits: 1,
    reservedUnits: 1,
    soldUnits: 0,
    typologyId: 'type-a',
    startingPriceUsd: 165000,
    status: 'limited',
  },
];

export const PremiumProjectExplorer: React.FC<PremiumProjectExplorerProps> = ({
  projectName = 'Attaie Signature Towers — Wazir Akbar Khan',
  projectLocation = 'Street 10, Wazir Akbar Khan, Kabul',
  deliveryDate = 'Q4 2027',
  initialExteriorUrl,
  initialTechnicalPlanUrl,
  initialFurnishedPlanUrl,
}) => {
  const [customAssets, setCustomAssets] = useState<ExplorerCustomAssets>(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_ASSETS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<ExplorerCustomAssets>;
        return {
          exteriorUrl: parsed.exteriorUrl || initialExteriorUrl || defaultExteriorImg,
          technicalPlanUrl: parsed.technicalPlanUrl || initialTechnicalPlanUrl || defaultTechnicalPlanImg,
          furnishedPlanUrl: parsed.furnishedPlanUrl || initialFurnishedPlanUrl || defaultFurnishedPlanImg,
        };
      }
    } catch {
      // ignore storage errors
    }
    return {
      exteriorUrl: initialExteriorUrl || defaultExteriorImg,
      technicalPlanUrl: initialTechnicalPlanUrl || defaultTechnicalPlanImg,
      furnishedPlanUrl: initialFurnishedPlanUrl || defaultFurnishedPlanImg,
    };
  });

  const [assetDrawerOpen, setAssetDrawerOpen] = useState(false);

  // Explorer State
  const [selectedFloorNum, setSelectedFloorNum] = useState<number>(8);
  const [hoveredFloorNum, setHoveredFloorNum] = useState<number | null>(null);
  const [selectedTypologyId, setSelectedTypologyId] = useState<'type-a' | 'type-b' | 'penthouse'>('type-a');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('salon');
  const [showDimensionPins, setShowDimensionPins] = useState<boolean>(true);

  // Default 50/50 X-Ray Split Slider
  const [splitPct, setSplitPct] = useState<number>(50);
  const splitContainerRef = useRef<HTMLDivElement>(null);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);
  const splitMotion = useMotionValue(50);
  const smoothSplit = useSpring(splitMotion, { stiffness: 320, damping: 32 });
  const clipPathRight = useTransform(smoothSplit, (v) => `inset(0 ${100 - v}% 0 0)`);
  const splitHandleLeft = useTransform(smoothSplit, (v) => `${v}%`);

  const activeFloor =
    TOWER_FLOORS.find((f) => f.floor === (hoveredFloorNum ?? selectedFloorNum)) || TOWER_FLOORS[4];
  const lockedFloor =
    TOWER_FLOORS.find((f) => f.floor === selectedFloorNum) || TOWER_FLOORS[4];
  const activeTypology = UNIT_TYPOLOGIES[selectedTypologyId];
  const activeRoom =
    activeTypology.rooms.find((r) => r.id === selectedRoomId) || activeTypology.rooms[0];

  const handleSelectFloor = (floorSpec: FloorSpec) => {
    setSelectedFloorNum(floorSpec.floor);
    setSelectedTypologyId(floorSpec.typologyId);
    const nextTypology = UNIT_TYPOLOGIES[floorSpec.typologyId];
    if (!nextTypology.rooms.some((r) => r.id === selectedRoomId)) {
      setSelectedRoomId(nextTypology.rooms[0].id);
    }
  };

  useEffect(() => {
    splitMotion.set(splitPct);
  }, [splitPct, splitMotion]);

  const updateSplitFromClientX = useCallback((clientX: number) => {
    if (!splitContainerRef.current) return;
    const rect = splitContainerRef.current.getBoundingClientRect();
    const rawPct = ((clientX - rect.left) / rect.width) * 100;
    const clamped = Math.max(4, Math.min(96, rawPct));
    setSplitPct(Math.round(clamped));
  }, []);

  useEffect(() => {
    if (!isDraggingSplit) return;
    const onMove = (e: MouseEvent) => updateSplitFromClientX(e.clientX);
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) updateSplitFromClientX(e.touches[0].clientX);
    };
    const onUp = () => setIsDraggingSplit(false);

    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchend', onUp);
    };
  }, [isDraggingSplit, updateSplitFromClientX]);

  const handleFileUpload = (
    slot: keyof Pick<ExplorerCustomAssets, 'exteriorUrl' | 'technicalPlanUrl' | 'furnishedPlanUrl'>,
    file: File | undefined
  ) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result) return;
      setCustomAssets((prev) => {
        const next = { ...prev, [slot]: result };
        try {
          localStorage.setItem(CUSTOM_ASSETS_STORAGE_KEY, JSON.stringify(next));
        } catch {
          // ignore if data URL exceeds localStorage quota
        }
        return next;
      });
    };
    reader.readAsDataURL(file);
  };

  const handleResetAssets = () => {
    const defaults: ExplorerCustomAssets = {
      exteriorUrl: initialExteriorUrl || defaultExteriorImg,
      technicalPlanUrl: initialTechnicalPlanUrl || defaultTechnicalPlanImg,
      furnishedPlanUrl: initialFurnishedPlanUrl || defaultFurnishedPlanImg,
    };
    setCustomAssets(defaults);
    try {
      localStorage.removeItem(CUSTOM_ASSETS_STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const unitPrice = lockedFloor.startingPriceUsd || activeTypology.basePriceUsd;

  return (
    <section
      id="interactive-project-explorer"
      className="my-12 rounded-2xl bg-brand-navy-deep text-white border border-white/10 overflow-hidden shadow-brand-xl"
    >
      {/* Top Studio Bar: Title + Elevation + X-Ray Split Indicator + Custom Asset Studio Button */}
      <div className="border-b border-white/10 bg-brand-navy px-5 py-5 sm:px-8">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-white/60 mb-1.5">
              <span className="font-semibold text-brand-gold-lt">Interactive Architectural Explorer</span>
              <span aria-hidden="true">·</span>
              <span>{projectLocation}</span>
              {deliveryDate && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>Delivery {deliveryDate}</span>
                </>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
              {projectName}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-brand-gold text-white text-xs font-bold shadow-sm">
              <SlidersHorizontal size={14} className="shrink-0" />
              <span>Elevation + 50/50 X-Ray Split</span>
            </div>

            <button
              type="button"
              onClick={() => setAssetDrawerOpen((v) => !v)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors whitespace-nowrap shrink-0 cursor-pointer inline-flex items-center gap-2 ${
                assetDrawerOpen
                  ? 'bg-white text-brand-navy border-white'
                  : 'bg-white/5 hover:bg-white/10 text-white border-white/15'
              }`}
            >
              <Upload size={14} />
              <span>Custom Project Images</span>
            </button>
          </div>
        </div>

        {/* Collapsible Custom Project Asset Uploader Drawer */}
        <AnimatePresence initial={false}>
          {assetDrawerOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-5 pt-5 border-t border-white/10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Load Your Project Exterior &amp; X-Ray Split Floor Plans
                    </h3>
                    <p className="text-xs text-white/65">
                      Upload local files or paste image URLs below to update the Elevation + 50/50 X-Ray Split stage.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleResetAssets}
                      className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold text-white/85 transition-colors whitespace-nowrap cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <RotateCcw size={13} />
                      <span>Reset Default Assets</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAssetDrawerOpen(false)}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white/75 cursor-pointer"
                      aria-label="Close Custom Images Drawer"
                    >
                      <X size={15} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(
                    [
                      {
                        key: 'exteriorUrl' as const,
                        title: '01. Exterior Building Elevation',
                        subtitle: 'Used in Tower Floor Selector',
                        value: customAssets.exteriorUrl,
                      },
                      {
                        key: 'technicalPlanUrl' as const,
                        title: '02. Left X-Ray Layer',
                        subtitle: '2D Architectural Plan Layer',
                        value: customAssets.technicalPlanUrl,
                      },
                      {
                        key: 'furnishedPlanUrl' as const,
                        title: '03. Right X-Ray Layer',
                        subtitle: 'Spatial Interior Plan Layer',
                        value: customAssets.furnishedPlanUrl,
                      },
                    ] as const
                  ).map((slot) => (
                    <div
                      key={slot.key}
                      className="rounded-xl bg-brand-navy-deep/90 border border-white/10 p-3.5 flex flex-col gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={slot.value}
                          alt={slot.title}
                          referrerPolicy="no-referrer"
                          className="w-16 h-12 rounded-lg object-cover border border-white/15 bg-brand-navy shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{slot.title}</p>
                          <p className="text-[11px] text-white/55 truncate">{slot.subtitle}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="px-3 py-1.5 rounded-lg bg-brand-gold hover:bg-brand-gold-dark text-white text-xs font-bold cursor-pointer transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5">
                          <Upload size={12} />
                          <span>Choose Image</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileUpload(slot.key, e.target.files?.[0])}
                          />
                        </label>
                        <input
                          type="url"
                          value={slot.value.startsWith('data:') ? '' : slot.value}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCustomAssets((prev) => ({ ...prev, [slot.key]: val }));
                          }}
                          placeholder="Or paste image URL…"
                          className="w-full min-w-0 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/15 text-xs text-white placeholder:text-white/35 focus:border-brand-gold focus:outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Shared KPI Telemetry Bar (No Book Viewing button) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 border-b border-white/10 bg-brand-navy-deep/70 divide-y lg:divide-y-0 lg:divide-x divide-white/10">
        <div className="px-5 py-3.5">
          <p className="text-[11px] text-white/55">Selected Floor Plate</p>
          <p className="text-base font-bold text-white mt-0.5 tabular-nums">
            Floor {String(lockedFloor.floor).padStart(2, '0')} · +{lockedFloor.elevationMeters}m
          </p>
        </div>
        <div className="px-5 py-3.5">
          <p className="text-[11px] text-white/55">Apartment Typology</p>
          <p className="text-base font-bold text-white mt-0.5 truncate">
            {activeTypology.totalAreaSqm} m² · {activeTypology.beds} Bed + Mehmankhana
          </p>
        </div>
        <div className="px-5 py-3.5">
          <p className="text-[11px] text-white/55">Floor Availability</p>
          <p className="text-base font-bold text-white mt-0.5 tabular-nums">
            {lockedFloor.availableUnits} Available · {lockedFloor.reservedUnits} Reserved
          </p>
        </div>
        <div className="px-5 py-3.5">
          <p className="text-[11px] text-white/55">Active Room Focus</p>
          <p className="text-base font-bold text-brand-gold-lt mt-0.5 truncate tabular-nums">
            {activeRoom.nameEn.split(' ')[0]} · {activeRoom.areaSqm} m²
          </p>
        </div>
        <div className="px-5 py-3.5 col-span-2 lg:col-span-1">
          <p className="text-[11px] text-white/55">Starting Valuation</p>
          <p className="text-base font-bold text-white mt-0.5 tabular-nums">
            ${unitPrice.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Elevation + 50/50 X-Ray Split Stage */}
      <div className="p-5 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-semibold text-brand-gold-lt">
              Interactive Tower Elevation &amp; 50/50 X-Ray Floor Plan Stage
            </p>
            <h3 className="text-xl font-bold text-white mt-1">
              Hover or select any residential floor on the tower facade, then drag the 50/50 X-Ray curtain across the floor plate
            </h3>
          </div>

          {/* 50/50 X-Ray Split Control Only */}
          <div className="flex items-center gap-1.5 bg-brand-navy p-1 rounded-xl border border-white/10 self-start">
            <button
              type="button"
              onClick={() => setSplitPct(50)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-brand-gold text-white transition-colors whitespace-nowrap cursor-pointer"
            >
              50/50 X-Ray Split ({splitPct}%)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left 5 Cols: Interactive Exterior Elevation Facade */}
          <div className="lg:col-span-5 flex flex-col rounded-xl bg-brand-navy border border-white/10 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-2">
                <Building2 size={15} className="text-brand-gold-lt" />
                <span>Exterior Elevation Selector</span>
              </span>
              <span className="text-white/60 tabular-nums">12 Stories · 42 Units</span>
            </div>

            <div className="relative flex-1 min-h-[440px] bg-brand-navy-deep overflow-hidden select-none">
              <img
                src={customAssets.exteriorUrl}
                alt={`${projectName} Exterior Elevation`}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-navy-deep/90 via-brand-navy-deep/20 to-brand-navy-deep/50" />

              {/* Interactive Horizontal Floor Bands Overlay */}
              <div className="absolute inset-x-6 inset-y-0">
                {TOWER_FLOORS.map((f) => {
                  const isSelected = f.floor === selectedFloorNum;
                  const isHovered = f.floor === hoveredFloorNum;
                  const isActive = isSelected || isHovered;
                  const isSoldOut = f.availableUnits === 0;

                  return (
                    <button
                      key={f.floor}
                      type="button"
                      onClick={() => handleSelectFloor(f)}
                      onMouseEnter={() => setHoveredFloorNum(f.floor)}
                      onMouseLeave={() => setHoveredFloorNum(null)}
                      style={{
                        top: `${f.bandTopPct}%`,
                        height: `${f.bandHeightPct}%`,
                      }}
                      className={`group absolute left-0 right-0 rounded-md transition-all duration-150 flex items-center justify-between px-3 cursor-pointer ${
                        isActive
                          ? 'bg-brand-gold/55 border border-white shadow-md'
                          : 'bg-brand-navy/20 hover:bg-brand-gold/35 border border-white/15'
                      }`}
                      aria-label={`Select Floor ${f.floor}`}
                    >
                      <span className="text-[11px] font-mono font-bold text-white drop-shadow tabular-nums">
                        F{String(f.floor).padStart(2, '0')}
                      </span>
                      <span className="text-[11px] font-semibold text-white drop-shadow tabular-nums">
                        {isSoldOut
                          ? 'Fully Reserved'
                          : `${f.availableUnits} of ${f.totalUnits} Open · $${(
                              f.startingPriceUsd / 1000
                            ).toFixed(0)}k`}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Bottom Active Floor Callout Bar */}
              <div className="absolute bottom-3 inset-x-3 rounded-xl bg-brand-navy-deep/95 backdrop-blur-md border border-white/15 p-3.5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-white">{activeFloor.label}</p>
                  <p className="text-[11px] text-white/65 mt-0.5 tabular-nums">
                    Elevation +{activeFloor.elevationMeters}m · {activeFloor.availableUnits} Available ·{' '}
                    {activeFloor.reservedUnits} Reserved · {activeFloor.soldUnits} Sold
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-brand-gold-lt tabular-nums shrink-0">
                  ${activeFloor.startingPriceUsd.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Right 7 Cols: Interactive 50/50 X-Ray Split Curtain + Room Pins */}
          <div className="lg:col-span-7 flex flex-col rounded-xl bg-brand-navy border border-white/10 overflow-hidden">
            {/* Typology Selector Bar */}
            <div className="px-4 py-3 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                {(Object.values(UNIT_TYPOLOGIES) as UnitTypology[]).map((typ) => {
                  const active = typ.id === selectedTypologyId;
                  return (
                    <button
                      key={typ.id}
                      type="button"
                      onClick={() => {
                        setSelectedTypologyId(typ.id);
                        setSelectedRoomId(typ.rooms[0].id);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                        active
                          ? 'bg-brand-gold text-white'
                          : 'bg-white/5 text-white/70 hover:text-white'
                      }`}
                    >
                      {typ.id === 'type-a'
                        ? 'Type A · 210 m²'
                        : typ.id === 'type-b'
                        ? 'Type B · 165 m²'
                        : 'Penthouse · 320 m²'}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-3 text-xs text-white/70">
                <button
                  type="button"
                  onClick={() => setShowDimensionPins((v) => !v)}
                  className="hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Eye size={14} className="text-brand-gold-lt" />
                  <span>{showDimensionPins ? 'Hide Room Pins' : 'Show Room Pins'}</span>
                </button>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">50/50 X-Ray Split: {splitPct}%</span>
              </div>
            </div>

            {/* Interactive Split-Curtain Canvas */}
            <div
              ref={splitContainerRef}
              onMouseDown={(e) => {
                setIsDraggingSplit(true);
                updateSplitFromClientX(e.clientX);
              }}
              onTouchStart={(e) => {
                setIsDraggingSplit(true);
                if (e.touches[0]) updateSplitFromClientX(e.touches[0].clientX);
              }}
              className="relative flex-1 min-h-[400px] bg-neutral-900 overflow-hidden select-none cursor-ew-resize"
            >
              {/* Base Layer */}
              <img
                src={customAssets.furnishedPlanUrl}
                alt={`${activeTypology.name} Spatial Layout`}
                referrerPolicy="no-referrer"
                draggable={false}
                className="w-full h-full object-contain bg-neutral-100"
              />

              {/* Top Clipped Layer */}
              <motion.div
                style={{ clipPath: clipPathRight }}
                className="absolute inset-0 pointer-events-none"
              >
                <img
                  src={customAssets.technicalPlanUrl}
                  alt={`${activeTypology.name} Structural Dimensions`}
                  referrerPolicy="no-referrer"
                  draggable={false}
                  className="w-full h-full object-contain bg-white"
                />
              </motion.div>

              {/* Corner Layer Badge */}
              <div className="absolute top-3 left-3 pointer-events-none px-2.5 py-1 rounded-md bg-brand-navy-deep/85 text-[11px] font-bold text-white border border-white/15">
                50/50 X-Ray Split View
              </div>

              {/* Interactive Room Pins */}
              {showDimensionPins &&
                activeTypology.rooms.map((room) => {
                  const isRoomSelected = room.id === activeRoom.id;
                  return (
                    <button
                      key={room.id}
                      type="button"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRoomId(room.id);
                      }}
                      style={{ left: `${room.xPct}%`, top: `${room.yPct}%` }}
                      className={`-translate-x-1/2 -translate-y-1/2 absolute z-20 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-transform duration-150 cursor-pointer flex items-center gap-1.5 shadow-md ${
                        isRoomSelected
                          ? 'bg-brand-gold text-white scale-110 ring-2 ring-white'
                          : 'bg-brand-navy-deep/90 text-white hover:scale-105 border border-white/25'
                      }`}
                    >
                      <span>{room.nameEn.split(' ')[0]}</span>
                      <span className="font-mono text-[10px] opacity-85 tabular-nums">
                        {room.areaSqm}m²
                      </span>
                    </button>
                  );
                })}

              {/* Draggable Vertical Curtain Divider Handle */}
              <motion.div
                style={{ left: splitHandleLeft }}
                className="absolute inset-y-0 z-30 -translate-x-1/2 w-0.5 bg-brand-gold pointer-events-none flex items-center justify-center"
              >
                <div className="w-9 h-9 rounded-full bg-brand-gold text-white shadow-lg border-2 border-white flex items-center justify-center">
                  <MoveHorizontal size={16} />
                </div>
              </motion.div>
            </div>

            {/* Selected Room Architectural Specification Strip */}
            <div className="p-4 bg-brand-navy-deep/90 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-bold text-white">{activeRoom.nameEn}</span>
                  <span aria-hidden="true" className="text-white/40">
                    ·
                  </span>
                  <span className="font-arabic text-brand-gold-lt">{activeRoom.nameFa}</span>
                  <span aria-hidden="true" className="text-white/40">
                    ·
                  </span>
                  <span className="font-mono text-white/80 tabular-nums">
                    {activeRoom.dimensions} ({activeRoom.areaSqm} m²)
                  </span>
                </div>
                <p className="text-xs text-white/65 mt-1">
                  {activeRoom.finishSpec} · {activeRoom.structuralNote}
                </p>
              </div>
              <div className="text-xs text-white/70 shrink-0 font-mono tabular-nums">
                Orientation: {activeRoom.orientation}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PremiumProjectExplorer;
