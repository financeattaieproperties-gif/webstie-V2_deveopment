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

  let technicalPlan = defaultTechnicalPlanImg;
  let furnishedPlan = customImg || defaultFurnishedPlanImg;
  let legendImg: string | undefined = undefined;
  let masterplanImg: string | undefined = project?.masterplan_image || undefined;

  // Project 3: Kabul Plaza Burj (Ansari Sq, Shahr-e-Naw)
  if (pid === 3 || un.includes('burj')) {
    masterplanImg = '/assets/kabul-plaza-burj/floor_typical_furnished_masterplan.png';
    if (un.includes('(b)')) {
      technicalPlan = '/assets/kabul-plaza-burj/apt_burj_b_technical.png';
      furnishedPlan = customImg || '/assets/kabul-plaza-burj/apt_burj_b_furnished.png';
      legendImg = '/assets/kabul-plaza-burj/apt_burj_b_legend.png';
    } else if (un.includes('(c)')) {
      technicalPlan = '/assets/kabul-plaza-burj/apt_burj_c_technical.png';
      furnishedPlan = customImg || '/assets/kabul-plaza-burj/apt_burj_c_furnished.png';
      legendImg = '/assets/kabul-plaza-burj/apt_burj_c_legend.png';
    } else if (un.includes('(d)')) {
      technicalPlan = '/assets/kabul-plaza-burj/apt_burj_d_technical.png';
      furnishedPlan = customImg || '/assets/kabul-plaza-burj/apt_burj_d_furnished.png';
      legendImg = '/assets/kabul-plaza-burj/apt_burj_d_legend.png';
    } else if (un.includes('(e)')) {
      technicalPlan = '/assets/kabul-plaza-burj/apt_burj_e_technical.png';
      furnishedPlan = customImg || '/assets/kabul-plaza-burj/apt_burj_e_furnished.png';
      legendImg = '/assets/kabul-plaza-burj/apt_burj_e_legend.png';
    } else if (un.includes('(f)')) {
      technicalPlan = '/assets/kabul-plaza-burj/apt_burj_f_technical.png';
      furnishedPlan = customImg || '/assets/kabul-plaza-burj/apt_burj_f_furnished.png';
      legendImg = '/assets/kabul-plaza-burj/apt_burj_f_legend.png';
    } else {
      technicalPlan = '/assets/kabul-plaza-burj/apt_burj_a_technical.png';
      furnishedPlan = customImg || '/assets/kabul-plaza-burj/apt_burj_a_furnished.png';
      legendImg = '/assets/kabul-plaza-burj/apt_burj_a_legend.png';
    }
  }
  // Project 4: Kabul Plaza 12 (Kart-e-Char)
  else if (pid === 4 || un.includes('kabul plaza 12') || un.includes('kp12')) {
    masterplanImg = '/assets/kabul-plaza-12/floor_typical_furnished_masterplan.png';
    if (un.includes('unit b') && (un.includes('4th') || un.includes('9th'))) {
      technicalPlan = '/assets/kabul-plaza-12/apt_4th_9th_b_technical.png';
      furnishedPlan = customImg || '/assets/kabul-plaza-12/apt_4th_9th_b_furnished.png';
      legendImg = '/assets/kabul-plaza-12/apt_4th_9th_b_legend.png';
    } else if (un.includes('unit a') && (un.includes('4th') || un.includes('9th'))) {
      technicalPlan = '/assets/kabul-plaza-12/apt_4th_9th_a_technical.png';
      furnishedPlan = customImg || '/assets/kabul-plaza-12/apt_4th_9th_a_furnished.png';
      legendImg = '/assets/kabul-plaza-12/apt_4th_9th_a_legend.png';
    } else if (un.includes('unit b')) {
      technicalPlan = '/assets/kabul-plaza-12/apt_typical_b_technical.png';
      furnishedPlan = customImg || '/assets/kabul-plaza-12/apt_typical_b_furnished.png';
      legendImg = '/assets/kabul-plaza-12/apt_typical_b_legend.png';
    } else if (un.includes('penthouse') || un.includes('10th')) {
      technicalPlan = '/assets/kabul-plaza-12/floor_typical_technical_masterplan.png';
      furnishedPlan = customImg || '/assets/kabul-plaza-12/floor_10_penthouse_furnished_masterplan.png';
      legendImg = '/assets/kabul-plaza-12/floor_04_09_furnished_masterplan.png';
    } else {
      technicalPlan = '/assets/kabul-plaza-12/apt_typical_a_technical.png';
      furnishedPlan = customImg || '/assets/kabul-plaza-12/apt_typical_a_furnished.png';
      legendImg = '/assets/kabul-plaza-12/apt_typical_a_legend.png';
    }
  }
  // Project 5: Kabul Plaza ABC / Kabul Plaza 09
  else if (pid === 5 || un.includes('abc') || un.includes('09')) {
    masterplanImg = '/assets/kabul-plaza-abc/floor_typical_furnished_masterplan.png';
    if (un.includes('duplex') && un.includes('b')) {
      technicalPlan = '/assets/kabul-plaza-abc/apt_duplex_b_technical.png';
      furnishedPlan = customImg || '/assets/kabul-plaza-abc/apt_duplex_b_furnished.png';
      legendImg = '/assets/kabul-plaza-abc/apt_duplex_b_legend.png';
    } else if (un.includes('duplex')) {
      technicalPlan = '/assets/kabul-plaza-abc/apt_duplex_a_technical.png';
      furnishedPlan = customImg || '/assets/kabul-plaza-abc/apt_duplex_a_furnished.png';
      legendImg = '/assets/kabul-plaza-abc/apt_duplex_a_legend.png';
    } else if (un.includes('unit b')) {
      technicalPlan = '/assets/kabul-plaza-abc/apt_b_technical.png';
      furnishedPlan = customImg || '/assets/kabul-plaza-abc/apt_b_furnished.png';
      legendImg = '/assets/kabul-plaza-abc/apt_b_legend.png';
    } else {
      technicalPlan = '/assets/kabul-plaza-abc/apt_a_technical.png';
      furnishedPlan = customImg || '/assets/kabul-plaza-abc/apt_a_furnished.png';
      legendImg = '/assets/kabul-plaza-abc/apt_a_legend.png';
    }
  }
  // Project 2: Moon Residency (Kart-e-Char)
  else if (
    pid === 2 ||
    un.includes('moon') ||
    un.includes('(01)') ||
    un.includes('(02)') ||
    un.includes('(03)') ||
    un.includes('(04)')
  ) {
    masterplanImg = '/assets/moon-residency/floor_typical_2_to_10_furnished_masterplan.png';
    if (un.includes('02')) {
      technicalPlan = '/assets/moon-residency/apt_02_technical.png';
      furnishedPlan = customImg || '/assets/moon-residency/apt_02_furnished.png';
      legendImg = '/assets/moon-residency/apt_02_legend.png';
    } else if (un.includes('03')) {
      technicalPlan = '/assets/moon-residency/apt_03_technical.png';
      furnishedPlan = customImg || '/assets/moon-residency/apt_03_furnished.png';
      legendImg = '/assets/moon-residency/apt_03_legend.png';
    } else if (un.includes('04')) {
      technicalPlan = '/assets/moon-residency/apt_04_technical.png';
      furnishedPlan = customImg || '/assets/moon-residency/apt_04_furnished.png';
      legendImg = '/assets/moon-residency/apt_04_legend.png';
    } else {
      technicalPlan = '/assets/moon-residency/apt_01_technical.png';
      furnishedPlan = customImg || '/assets/moon-residency/apt_01_furnished.png';
      legendImg = '/assets/moon-residency/apt_01_legend.png';
    }
  }
  // Project 1: Kabul Plaza Saljuqi (Shahr-e-Naw)
  else if (pid === 1 || un.includes('saljuqi') || un.includes('plaza')) {
    masterplanImg = '/assets/kabul-plaza-saljuqi/floor_typical_2_to_10_furnished_masterplan.png';
    if (un.includes('1st') || un.includes('commercial')) {
      technicalPlan = '/assets/kabul-plaza-saljuqi/apt_1st_a_technical.png';
      furnishedPlan = customImg || '/assets/kabul-plaza-saljuqi/apt_1st_a_furnished.png';
      legendImg = '/assets/kabul-plaza-saljuqi/apt_1st_a_legend.png';
    } else if (un.includes('11th') && un.includes('b')) {
      technicalPlan = '/assets/kabul-plaza-saljuqi/apt_11th_vip_b_technical.png';
      furnishedPlan = customImg || '/assets/kabul-plaza-saljuqi/apt_11th_vip_b_furnished.png';
      legendImg = '/assets/kabul-plaza-saljuqi/apt_11th_vip_b_legend.png';
    } else if (un.includes('11th')) {
      technicalPlan = '/assets/kabul-plaza-saljuqi/apt_11th_vip_a_technical.png';
      furnishedPlan = customImg || '/assets/kabul-plaza-saljuqi/apt_11th_vip_a_furnished.png';
      legendImg = '/assets/kabul-plaza-saljuqi/apt_11th_vip_a_legend.png';
    } else if (un.includes('unit b') || un.includes('5+1')) {
      technicalPlan = '/assets/kabul-plaza-saljuqi/apt_typical_b_technical.png';
      furnishedPlan = customImg || '/assets/kabul-plaza-saljuqi/apt_typical_b_furnished.png';
      legendImg = '/assets/kabul-plaza-saljuqi/apt_typical_b_legend.png';
    } else if (un.includes('unit c') || un.includes('4+1')) {
      technicalPlan = '/assets/kabul-plaza-saljuqi/apt_typical_c_technical.png';
      furnishedPlan = customImg || '/assets/kabul-plaza-saljuqi/apt_typical_c_furnished.png';
      legendImg = '/assets/kabul-plaza-saljuqi/apt_typical_c_legend.png';
    } else {
      technicalPlan = '/assets/kabul-plaza-saljuqi/apt_typical_a_technical.png';
      furnishedPlan = customImg || '/assets/kabul-plaza-saljuqi/apt_typical_a_furnished.png';
      legendImg = '/assets/kabul-plaza-saljuqi/apt_typical_a_legend.png';
    }
  } else {
    // Generic custom project created by admin
    if (customImg) {
      furnishedPlan = customImg;
    }
    if (project?.masterplan_image) {
      technicalPlan = project.masterplan_image;
    }
  }

  return { technicalPlan, furnishedPlan, legendImg, masterplanImg };
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
  const pid = Number(projectId || 1);

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

  // If no floors found in units, derive standard floors for known projects or fallback
  if (floorNumbers.length === 0) {
    let topFloor = 8;
    if (pid === 3) topFloor = 15;
    else if (pid === 1) topFloor = 11;
    else if (pid === 2 || pid === 4) topFloor = 10;
    else if (pid === 5) topFloor = 9;
    else if (totalUnitsHint && totalUnitsHint > 0) {
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
