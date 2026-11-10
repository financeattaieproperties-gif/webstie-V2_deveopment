import type { ProjectUnit } from './dbService';
import defaultExteriorImg from '@/assets/images/project_exterior_elevation_1793995966183.jpg';
import defaultTechnicalPlanImg from '@/assets/images/floorplan_technical_blueprint_1793995969202.jpg';
import defaultFurnishedPlanImg from '@/assets/images/floorplan_furnished_3d_1793995968986.jpg';

export { defaultExteriorImg, defaultTechnicalPlanImg, defaultFurnishedPlanImg };

export interface FloorGroup {
  floor: number;
  label: string;
  elevationMeters: number;
  bandTopPct: number;
  bandHeightPct: number;
  units: ProjectUnit[];
  totalUnits: number;
  availableUnits: number;
  reservedUnits: number;
  soldUnits: number;
  startingPriceUsd: number;
  status: 'available' | 'limited' | 'reserved' | 'sold';
}

export interface RoomHotspot {
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

export interface UnitPlansResult {
  technicalPlan: string;
  furnishedPlan: string;
  legendImg?: string;
  masterplanImg?: string;
}

/**
 * Resolves high-resolution 2D Technical Blueprint and 3D Furnished Plan URLs
 * for any project unit, honoring admin uploads as well as matched project blueprints.
 */
export function resolveUnitPlans(
  unit?: Partial<ProjectUnit> | null,
  project?: {
    id?: number | string;
    image_url?: string | null;
    masterplan_image?: string | null;
  } | null
): UnitPlansResult {
  const pid = Number(unit?.project_id || project?.id || 1);
  const un = (unit?.unit_number || '').toLowerCase();
  const customImg = unit?.image_url;

  // Check for admin-specified technical plan URL directly or via encoded tag
  let customTechnicalPlan = unit?.technical_plan_url || undefined;
  if (!customTechnicalPlan && unit?.description && unit.description.includes('[TECHNICAL_PLAN:')) {
    const match = unit.description.match(/\[TECHNICAL_PLAN:\s*([^\]]+)\]/);
    if (match) customTechnicalPlan = match[1].trim();
  }

  let technicalPlan = customTechnicalPlan || defaultTechnicalPlanImg;
  let furnishedPlan = customImg || defaultFurnishedPlanImg;
  let legendImg: string | undefined = undefined;
  let masterplanImg: string | undefined = project?.masterplan_image || undefined;

  return {
    technicalPlan: customTechnicalPlan || project?.masterplan_image || defaultTechnicalPlanImg,
    furnishedPlan: customImg || defaultFurnishedPlanImg,
    legendImg: undefined,
    masterplanImg: project?.masterplan_image || undefined,
  };
}

/**
 * Builds dynamic floor groups from real project units entered by the admin,
 * or gracefully generates proportional floors if units are not yet assigned.
 */
export function buildFloorGroups(
  units: ProjectUnit[],
  projectId?: number | string,
  totalUnitsHint?: number
): FloorGroup[] {
  // Collect distinct floor numbers from units
  const floorMap = new Map<number, ProjectUnit[]>();

  units.forEach((u) => {
    const f = u.floor !== null && !isNaN(u.floor) ? Number(u.floor) : 1;
    if (!floorMap.has(f)) {
      floorMap.set(f, []);
    }
    floorMap.get(f)!.push(u);
  });

  // If units have defined floors, use those
  let floorNumbers = Array.from(floorMap.keys()).sort((a, b) => b - a);

  // If no floors found in units, derive clean proportional floors
  if (floorNumbers.length === 0) {
    let topFloor = 5;
    if (totalUnitsHint && totalUnitsHint > 0) {
      topFloor = Math.max(3, Math.min(20, Math.ceil(totalUnitsHint / 4)));
    }
    floorNumbers = Array.from({ length: topFloor }, (_, i) => topFloor - i);
  }

  const numFloors = floorNumbers.length;
  const topMarginPct = 9;
  const bottomMarginPct = 16;
  const availableHeightPct = 100 - topMarginPct - bottomMarginPct;

  // Calculate clean band height and spacing
  const rawBandHeight = availableHeightPct / Math.max(1, numFloors);
  const bandHeightPct = Math.max(3.8, Math.min(6.5, rawBandHeight * 0.86));
  const spacingPct =
    numFloors > 1
      ? (availableHeightPct - numFloors * bandHeightPct) / (numFloors - 1)
      : 0;

  return floorNumbers.map((floorNum, idx) => {
    const floorUnits = floorMap.get(floorNum) || [];
    const available = floorUnits.filter((u) => u.status === 'available').length;
    const reserved = floorUnits.filter((u) => u.status === 'reserved').length;
    const sold = floorUnits.filter((u) => u.status === 'sold').length;

    const totalUnits = floorUnits.length > 0 ? floorUnits.length : 4;
    const availableUnits = floorUnits.length > 0 ? available : Math.max(1, totalUnits - 1);
    const reservedUnits = floorUnits.length > 0 ? reserved : 1;
    const soldUnits = floorUnits.length > 0 ? sold : 0;

    let status: FloorGroup['status'] = 'available';
    if (availableUnits === 0 && reservedUnits > 0) status = 'reserved';
    else if (availableUnits === 0) status = 'sold';
    else if (availableUnits <= 1 && totalUnits > 1) status = 'limited';

    const minPrice =
      floorUnits.length > 0
        ? Math.min(...floorUnits.map((u) => u.price || 135000))
        : 125000 + floorNum * 4500;

    const elevationMeters = Number((floorNum * 3.35).toFixed(1));
    const bandTopPct = Number((topMarginPct + idx * (bandHeightPct + spacingPct)).toFixed(2));

    let label = `Level ${String(floorNum).padStart(2, '0')}`;
    if (floorNum === floorNumbers[0]) {
      label = `Level ${String(floorNum).padStart(2, '0')} · Sky Penthouse & Terrace`;
    } else if (floorNum === 1) {
      label = `Level 01 · Grand Commercial & Podium`;
    } else if (floorNum >= 8) {
      label = `Level ${String(floorNum).padStart(2, '0')} · High-Zone Panorama`;
    } else {
      label = `Level ${String(floorNum).padStart(2, '0')} · Typical Residential`;
    }

    return {
      floor: floorNum,
      label,
      elevationMeters,
      bandTopPct,
      bandHeightPct,
      units: floorUnits,
      totalUnits,
      availableUnits,
      reservedUnits,
      soldUnits,
      startingPriceUsd: minPrice,
      status,
    };
  });
}

/**
 * Generates interactive room hotspot pins for a selected unit plan
 */
export function getUnitRooms(unit?: Partial<ProjectUnit> | null): RoomHotspot[] {
  const area = unit?.area || 175;
  const beds = unit?.beds || 3;
  const baths = unit?.baths || 2;

  const salonArea = Number((area * 0.32).toFixed(1));
  const mehmankhanaArea = Number((area * 0.16).toFixed(1));
  const masterArea = Number((area * 0.18).toFixed(1));
  const kitchenArea = Number((area * 0.11).toFixed(1));
  const bed2Area = Number((area * 0.12).toFixed(1));
  const terraceArea = Number((area * 0.08).toFixed(1));

  return [
    {
      id: 'salon',
      nameEn: 'Family Living Salon',
      nameFa: 'صالون نشیمن خانوادگی',
      areaSqm: salonArea,
      dimensions: `${(Math.sqrt(salonArea) * 1.15).toFixed(2)}m × ${(
        Math.sqrt(salonArea) * 0.87
      ).toFixed(2)}m`,
      xPct: 26,
      yPct: 60,
      orientation: 'South-East Glazing / City Horizon',
      finishSpec: 'Herringbone Oak Parquet · Acoustic Ceiling · Recessed LED',
      structuralNote: 'Post-tensioned clear RC slab · 250×450mm shear columns',
    },
    {
      id: 'mehmankhana',
      nameEn: 'Formal Mehmankhana (Guest Salon)',
      nameFa: 'مهمان‌خانه مستقل با ورودی تشریفاتی',
      areaSqm: mehmankhanaArea,
      dimensions: `${(Math.sqrt(mehmankhanaArea) * 1.1).toFixed(2)}m × ${(
        Math.sqrt(mehmankhanaArea) * 0.9
      ).toFixed(2)}m`,
      xPct: 44,
      yPct: 65,
      orientation: 'South Facade Access',
      finishSpec: 'Hand-carved Cedar Threshold · Acoustic Double Pocket Doors',
      structuralNote: 'Direct foyer separation for family privacy integrity',
    },
    {
      id: 'kitchen',
      nameEn: 'Chef Kitchen & Pantry',
      nameFa: 'آشپزخانه مدرن با جزیره سنگ',
      areaSqm: kitchenArea,
      dimensions: `${(Math.sqrt(kitchenArea) * 1.1).toFixed(2)}m × ${(
        Math.sqrt(kitchenArea) * 0.9
      ).toFixed(2)}m`,
      xPct: 56,
      yPct: 32,
      orientation: 'North-Central Ventilation Shaft',
      finishSpec: 'Calacatta Quartz Countertops · High-Gloss Anthracite Millwork',
      structuralNote: 'Dual exhaust risers + isolated mechanical wet shaft',
    },
    {
      id: 'master',
      nameEn: 'Master Suite + En-suite Bath',
      nameFa: 'اتاق خواب ماستر با تشناب مستقل',
      areaSqm: masterArea,
      dimensions: `${(Math.sqrt(masterArea) * 1.2).toFixed(2)}m × ${(
        Math.sqrt(masterArea) * 0.83
      ).toFixed(2)}m`,
      xPct: 82,
      yPct: 29,
      orientation: 'East Morning Sun',
      finishSpec: `En-suite ${baths > 1 ? '6.5 m² Marble Bath' : 'Bath'} · Walk-in Wardrobe`,
      structuralNote: 'Double-glazed thermal break soundproof curtain wall',
    },
    ...(beds >= 3
      ? [
          {
            id: 'bedroom-2',
            nameEn: 'Bedroom 2 (Family Wing)',
            nameFa: 'اتاق خواب دوم',
            areaSqm: bed2Area,
            dimensions: `${(Math.sqrt(bed2Area) * 1.1).toFixed(2)}m × ${(
              Math.sqrt(bed2Area) * 0.9
            ).toFixed(2)}m`,
            xPct: 64,
            yPct: 66,
            orientation: 'South Daylight',
            finishSpec: 'Built-in Walnut Wardrobe · Shared Bathroom Access',
            structuralNote: '200mm acoustic block party-wall insulation',
          },
        ]
      : []),
    {
      id: 'terrace',
      nameEn: 'Panorama Sky Balcony',
      nameFa: 'بالکن آفتاب‌رخ سرتاسری',
      areaSqm: terraceArea,
      dimensions: `1.85m × ${(terraceArea / 1.85).toFixed(2)}m`,
      xPct: 32,
      yPct: 86,
      orientation: 'Full Southern Exposure',
      finishSpec: 'Frost-Proof Non-slip Porcelain · Tempered Safety Glass Balustrade',
      structuralNote: 'Cantilevered slab with thermal bridge insulation break',
    },
  ];
}
