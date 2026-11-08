import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion';
import {
  SlidersHorizontal,
  RotateCcw,
  Upload,
  Building2,
  Eye,
  MoveHorizontal,
  X,
  Layers,
  Bed,
  Bath,
  Maximize2,
  Calendar,
  CheckCircle2,
  Columns2,
  FileText,
  MessageCircle,
  Sparkles,
  ChevronRight,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getProjectUnits, type ProjectUnit } from '@/lib/dbService';
import {
  resolveUnitPlans,
  buildFloorGroups,
  getUnitRooms,
  defaultExteriorImg,
  defaultTechnicalPlanImg,
  defaultFurnishedPlanImg,
  type FloorGroup,
  type RoomHotspot,
} from '@/lib/projectExplorerUtils';
import { ApartmentFullInfoModal } from './ProjectUnitsSection';

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
  projectStatus?: string;
  initialExteriorUrl?: string | null;
  initialTechnicalPlanUrl?: string | null;
  initialFurnishedPlanUrl?: string | null;
  masterplanImageUrl?: string | null;
  units?: ProjectUnit[];
  onRequestVisit?: (unitLabel: string) => void;
  onSelectUnit?: (unit: ProjectUnit) => void;
}

const CUSTOM_ASSETS_STORAGE_KEY = 'attaie_custom_project_explorer_assets_v2';

export const PremiumProjectExplorer: React.FC<PremiumProjectExplorerProps> = ({
  projectId = 1,
  projectName = 'Attaie Signature Towers — Wazir Akbar Khan',
  projectLocation = 'Street 10, Wazir Akbar Khan, Kabul',
  deliveryDate = 'Q4 2027',
  projectStatus = 'In Progress',
  initialExteriorUrl,
  initialTechnicalPlanUrl,
  initialFurnishedPlanUrl,
  masterplanImageUrl,
  units: propUnits,
  onRequestVisit,
  onSelectUnit,
}) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'fa';
  const numericProjectId = Number(projectId) || 1;

  // 1. Live project units state (from props or API)
  const [internalUnits, setInternalUnits] = useState<ProjectUnit[]>(propUnits || []);
  const [loadingUnits, setLoadingUnits] = useState<boolean>(!propUnits || propUnits.length === 0);

  useEffect(() => {
    if (propUnits && propUnits.length > 0) {
      setInternalUnits(propUnits);
      setLoadingUnits(false);
      return;
    }

    let isMounted = true;
    setLoadingUnits(true);
    getProjectUnits(numericProjectId)
      .then((res) => {
        if (!isMounted) return;
        if (res.items && res.items.length > 0) {
          setInternalUnits(res.items);
        }
      })
      .catch(() => {
        // Fallbacks will be handled gracefully by buildFloorGroups
      })
      .finally(() => {
        if (isMounted) setLoadingUnits(false);
      });

    return () => {
      isMounted = false;
    };
  }, [propUnits, numericProjectId]);

  // 2. Dynamic Floor Groups derived from the project's actual data
  const floorGroups = useMemo<FloorGroup[]>(() => {
    return buildFloorGroups(internalUnits, numericProjectId);
  }, [internalUnits, numericProjectId]);

  // 3. Selection State
  const [selectedFloorNum, setSelectedFloorNum] = useState<number>(() => {
    return floorGroups[0]?.floor ?? 4;
  });
  const [hoveredFloorNum, setHoveredFloorNum] = useState<number | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('salon');
  const [showDimensionPins, setShowDimensionPins] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'split' | 'furnished' | 'technical' | 'side-by-side'>('split');
  const [modalUnit, setModalUnit] = useState<ProjectUnit | null>(null);
  const [assetDrawerOpen, setAssetDrawerOpen] = useState(false);

  // Keep selected floor valid when floorGroups change
  useEffect(() => {
    if (floorGroups.length > 0) {
      const exists = floorGroups.some((g) => g.floor === selectedFloorNum);
      if (!exists) {
        setSelectedFloorNum(floorGroups[0].floor);
      }
    }
  }, [floorGroups, selectedFloorNum]);

  // Active Floor Group
  const activeFloor = useMemo<FloorGroup>(() => {
    const target = hoveredFloorNum ?? selectedFloorNum;
    return (
      floorGroups.find((f) => f.floor === target) ||
      floorGroups[0] || {
        floor: 1,
        label: 'Level 01',
        elevationMeters: 3.5,
        bandTopPct: 50,
        bandHeightPct: 6,
        units: [],
        totalUnits: 4,
        availableUnits: 3,
        reservedUnits: 1,
        soldUnits: 0,
        startingPriceUsd: 135000,
        status: 'available',
      }
    );
  }, [floorGroups, hoveredFloorNum, selectedFloorNum]);

  const lockedFloor = useMemo<FloorGroup>(() => {
    return (
      floorGroups.find((f) => f.floor === selectedFloorNum) ||
      floorGroups[0] ||
      activeFloor
    );
  }, [floorGroups, selectedFloorNum, activeFloor]);

  // Available units on currently locked floor
  const floorUnits = useMemo<ProjectUnit[]>(() => {
    if (lockedFloor.units && lockedFloor.units.length > 0) {
      return lockedFloor.units;
    }
    // Synthesize fallback units for this floor level if database has no units for it yet
    return [
      {
        id: lockedFloor.floor * 100 + 1,
        project_id: numericProjectId,
        unit_number: `Floor ${lockedFloor.floor} — Unit A`,
        title: '3+1 Bedroom Luxury Residence',
        floor: lockedFloor.floor,
        beds: 3,
        baths: 3,
        area: 173,
        price: lockedFloor.startingPriceUsd,
        currency: 'USD',
        status: 'available',
        image_url: null,
        description: `Sunlit residence on Floor ${lockedFloor.floor} with private guest salon (Mehmankhana), double glazing, and city views.`,
      },
      {
        id: lockedFloor.floor * 100 + 2,
        project_id: numericProjectId,
        unit_number: `Floor ${lockedFloor.floor} — Unit B`,
        title: '4+1 Bedroom Family Corner Suite',
        floor: lockedFloor.floor,
        beds: 4,
        baths: 3,
        area: 215,
        price: lockedFloor.startingPriceUsd + 28000,
        currency: 'USD',
        status: 'available',
        image_url: null,
        description: `Corner multi-generational suite on Floor ${lockedFloor.floor} with dual balconies and panoramic mountain vistas.`,
      },
    ];
  }, [lockedFloor, numericProjectId]);

  // Selected Unit
  const selectedUnit = useMemo<ProjectUnit>(() => {
    if (selectedUnitId !== null) {
      const match = floorUnits.find((u) => u.id === selectedUnitId);
      if (match) return match;
    }
    return floorUnits[0];
  }, [floorUnits, selectedUnitId]);

  // Synchronize unit selection when floor changes
  useEffect(() => {
    if (floorUnits.length > 0) {
      const stillInList = floorUnits.some((u) => u.id === selectedUnitId);
      if (!stillInList) {
        setSelectedUnitId(floorUnits[0].id);
      }
    }
  }, [floorUnits, selectedUnitId]);

  // 4. Custom assets with fallback
  const [customAssets, setCustomAssets] = useState<ExplorerCustomAssets>(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_ASSETS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<ExplorerCustomAssets>;
        return {
          exteriorUrl: parsed.exteriorUrl || initialExteriorUrl || defaultExteriorImg,
          technicalPlanUrl:
            parsed.technicalPlanUrl || initialTechnicalPlanUrl || defaultTechnicalPlanImg,
          furnishedPlanUrl:
            parsed.furnishedPlanUrl || initialFurnishedPlanUrl || defaultFurnishedPlanImg,
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

  // 5. Resolved plans for selected unit
  const activePlans = useMemo(() => {
    const resolved = resolveUnitPlans(selectedUnit, {
      id: numericProjectId,
      image_url: initialExteriorUrl,
      masterplan_image: masterplanImageUrl,
    });

    return {
      technicalPlan: customAssets.technicalPlanUrl !== defaultTechnicalPlanImg
        ? customAssets.technicalPlanUrl
        : resolved.technicalPlan,
      furnishedPlan: customAssets.furnishedPlanUrl !== defaultFurnishedPlanImg
        ? customAssets.furnishedPlanUrl
        : resolved.furnishedPlan,
      legendImg: resolved.legendImg,
      masterplanImg: resolved.masterplanImg || masterplanImageUrl,
    };
  }, [
    selectedUnit,
    numericProjectId,
    initialExteriorUrl,
    masterplanImageUrl,
    customAssets.technicalPlanUrl,
    customAssets.furnishedPlanUrl,
  ]);

  // 6. Interactive room hotspots for selected unit
  const unitRooms = useMemo<RoomHotspot[]>(() => {
    return getUnitRooms(selectedUnit);
  }, [selectedUnit]);

  const activeRoom = useMemo<RoomHotspot>(() => {
    return unitRooms.find((r) => r.id === selectedRoomId) || unitRooms[0];
  }, [unitRooms, selectedRoomId]);

  // 7. Interactive 50/50 X-Ray Split Slider
  const [splitPct, setSplitPct] = useState<number>(50);
  const splitContainerRef = useRef<HTMLDivElement>(null);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);
  const splitMotion = useMotionValue(50);
  const smoothSplit = useSpring(splitMotion, { stiffness: 320, damping: 32 });
  const clipPathRight = useTransform(smoothSplit, (v) => `inset(0 ${100 - v}% 0 0)`);
  const splitHandleLeft = useTransform(smoothSplit, (v) => `${v}%`);

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

  const handleSelectFloor = (floorGroup: FloorGroup) => {
    setSelectedFloorNum(floorGroup.floor);
    if (floorGroup.units.length > 0) {
      setSelectedUnitId(floorGroup.units[0].id);
    }
  };

  const handleSelectUnit = (unit: ProjectUnit) => {
    setSelectedUnitId(unit.id);
    if (onSelectUnit) onSelectUnit(unit);
  };

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
          // ignore localStorage quota limit
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

  const unitPrice = selectedUnit.price || lockedFloor.startingPriceUsd;
  const unitTitle = selectedUnit.title || `${selectedUnit.unit_number} Residence`;
  const areaValue = selectedUnit.area || 173;

  return (
    <section
      id="interactive-project-explorer"
      className="my-10 rounded-2xl bg-brand-navy-deep text-white border border-white/10 overflow-hidden shadow-2xl"
    >
      {/* Top Studio Bar: Title + Realtime Breadcrumbs + Image Studio Toggle */}
      <div className="border-b border-white/10 bg-brand-navy px-5 py-5 sm:px-8">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-white/60 mb-1.5">
              <span className="font-semibold text-brand-gold-lt uppercase tracking-wider">
                {t('projects.interactiveExplorer', 'Interactive Architectural Development Explorer')}
              </span>
              <span aria-hidden="true">·</span>
              <span>{projectLocation}</span>
              {deliveryDate && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{t('projects.delivery', 'Delivery')}: {deliveryDate}</span>
                </>
              )}
              {projectStatus && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-emerald-400 font-medium">{projectStatus}</span>
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
              <span>{t('projects.facadeFloorXray', 'Facade Floor Selector + 50/50 X-Ray')}</span>
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
              <span>{t('projects.customProjectAssets', 'Project Images & Uploads')}</span>
            </button>
          </div>
        </div>

        {/* Collapsible Custom Asset Drawer */}
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
                      Custom Building Elevation &amp; Floor Plan Layers
                    </h3>
                    <p className="text-xs text-white/65">
                      Upload local images or paste live render URLs to customize this interactive explorer.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleResetAssets}
                      className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold text-white/85 transition-colors whitespace-nowrap cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <RotateCcw size={13} />
                      <span>Reset Defaults</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAssetDrawerOpen(false)}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white/75 cursor-pointer"
                      aria-label="Close Drawer"
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
                        subtitle: 'Tower facade with interactive floor bands',
                        value: customAssets.exteriorUrl,
                      },
                      {
                        key: 'technicalPlanUrl' as const,
                        title: '02. 2D Technical Architectural Blueprint',
                        subtitle: 'Structural dimensions & CAD layer',
                        value: activePlans.technicalPlan,
                      },
                      {
                        key: 'furnishedPlanUrl' as const,
                        title: '03. 3D Furnished Interior Layout',
                        subtitle: 'Spatial rendered plan layer',
                        value: activePlans.furnishedPlan,
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

      {/* Shared KPI Telemetry Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 border-b border-white/10 bg-brand-navy-deep/70 divide-y md:divide-y-0 md:divide-x divide-white/10">
        <div className="px-5 py-3.5">
          <p className="text-[11px] text-white/55">{t('projects.selectedFloor', 'Selected Floor Plate')}</p>
          <p className="text-base font-bold text-white mt-0.5 tabular-nums">
            Floor {String(lockedFloor.floor).padStart(2, '0')} · +{lockedFloor.elevationMeters}m
          </p>
        </div>
        <div className="px-5 py-3.5">
          <p className="text-[11px] text-white/55">{t('projects.selectedApartment', 'Selected Apartment')}</p>
          <p className="text-base font-bold text-brand-gold-lt mt-0.5 truncate">
            {selectedUnit.unit_number} ({areaValue} m²)
          </p>
        </div>
        <div className="px-5 py-3.5">
          <p className="text-[11px] text-white/55">{t('projects.floorInventory', 'Floor Units')}</p>
          <p className="text-base font-bold text-white mt-0.5 tabular-nums">
            {lockedFloor.availableUnits} Available · {lockedFloor.totalUnits} Total
          </p>
        </div>
        <div className="px-5 py-3.5">
          <p className="text-[11px] text-white/55">{t('projects.roomFocus', 'Active Room Focus')}</p>
          <p className="text-base font-bold text-white mt-0.5 truncate tabular-nums">
            {activeRoom.nameEn.split(' ')[0]} · {activeRoom.areaSqm} m²
          </p>
        </div>
        <div className="px-5 py-3.5 col-span-2 md:col-span-1">
          <p className="text-[11px] text-white/55">{t('projects.startingValuation', 'Price / Valuation')}</p>
          <p className="text-base font-bold text-emerald-400 mt-0.5 tabular-nums">
            ${unitPrice.toLocaleString()} {selectedUnit.currency || 'USD'}
          </p>
        </div>
      </div>

      {/* Main 2-Column Responsive Stage */}
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ========================================================= */}
          {/* LEFT 5 COLS: Dynamic Exterior Building Facade + Floor Bands */}
          {/* ========================================================= */}
          <div className="lg:col-span-5 flex flex-col rounded-xl bg-brand-navy border border-white/10 overflow-hidden shadow-lg">
            {/* Facade Header */}
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between text-xs bg-brand-navy-deep/80">
              <span className="font-bold text-white flex items-center gap-2">
                <Building2 size={15} className="text-brand-gold-lt" />
                <span>{t('projects.buildingElevation', 'Building Elevation Facade')}</span>
              </span>
              <span className="text-white/60 tabular-nums">
                {floorGroups.length} {t('projects.floors', 'Floors')} · {lockedFloor.totalUnits} {t('projects.unitsOnFloor', 'Units on Floor')}
              </span>
            </div>

            {/* Facade Image with Overlaid Floor Bands & Quick Elevator Stepper */}
            <div className="relative min-h-[480px] sm:min-h-[560px] bg-brand-navy-deep overflow-hidden select-none flex">
              {/* Background Exterior Image */}
              <div className="relative flex-1 h-full overflow-hidden">
                <img
                  src={customAssets.exteriorUrl}
                  alt={`${projectName} Building Elevation`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-navy-deep via-brand-navy-deep/20 to-brand-navy-deep/50 pointer-events-none" />

                {/* Overlaid Interactive Horizontal Floor Bands on the Exterior Facade */}
                <div className="absolute inset-x-3 sm:inset-x-5 inset-y-0 pointer-events-auto">
                  {floorGroups.map((fg) => {
                    const isSelected = fg.floor === selectedFloorNum;
                    const isHovered = fg.floor === hoveredFloorNum;
                    const isActive = isSelected || isHovered;
                    const isSoldOut = fg.availableUnits === 0;

                    return (
                      <button
                        key={fg.floor}
                        type="button"
                        onClick={() => handleSelectFloor(fg)}
                        onMouseEnter={() => setHoveredFloorNum(fg.floor)}
                        onMouseLeave={() => setHoveredFloorNum(null)}
                        style={{
                          top: `${fg.bandTopPct}%`,
                          height: `${fg.bandHeightPct}%`,
                        }}
                        className={`group absolute left-0 right-0 rounded-md transition-all duration-150 flex items-center justify-between px-2.5 sm:px-3 cursor-pointer ${
                          isActive
                            ? 'bg-brand-gold/65 border-2 border-white shadow-lg z-20 scale-[1.01]'
                            : 'bg-brand-navy/30 hover:bg-brand-gold/40 border border-white/20 z-10'
                        }`}
                        aria-label={`Select Floor ${fg.floor}`}
                      >
                        <span className="text-[11px] sm:text-xs font-mono font-bold text-white drop-shadow tabular-nums flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isSoldOut ? 'bg-red-400' : 'bg-emerald-400'
                            }`}
                          />
                          <span>F{String(fg.floor).padStart(2, '0')}</span>
                        </span>
                        <span className="text-[10px] sm:text-[11px] font-semibold text-white drop-shadow tabular-nums truncate max-w-[170px] text-right">
                          {isSoldOut
                            ? t('property.status.sold', 'Reserved')
                            : `${fg.availableUnits}/${fg.totalUnits} Open · $${Math.round(
                                fg.startingPriceUsd / 1000
                              )}k+`}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Floating Bottom Floor Summary Card */}
                <div className="absolute bottom-3 inset-x-3 rounded-xl bg-brand-navy-deep/95 backdrop-blur-md border border-white/15 p-3.5 flex items-center justify-between gap-3 shadow-xl">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-white">{activeFloor.label}</p>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-brand-gold/20 text-brand-gold-lt">
                        +{activeFloor.elevationMeters}m
                      </span>
                    </div>
                    <p className="text-[11px] text-white/65 mt-0.5 tabular-nums">
                      {activeFloor.availableUnits} Available · {activeFloor.reservedUnits} Reserved · {activeFloor.soldUnits} Sold
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-white/50 block">From</span>
                    <span className="text-xs font-mono font-bold text-emerald-400 tabular-nums">
                      ${activeFloor.startingPriceUsd.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Vertical Floor Stepper / Elevator Column for Quick 1-Click Jumping */}
              <div className="w-11 sm:w-12 bg-brand-navy border-l border-white/10 flex flex-col py-2 px-1 items-center justify-between overflow-y-auto">
                <div className="text-[9px] uppercase tracking-wider font-bold text-white/50 mb-1 text-center">
                  Fl
                </div>
                <div className="flex flex-col gap-1 w-full flex-1 justify-center">
                  {floorGroups.map((fg) => {
                    const isSelected = fg.floor === selectedFloorNum;
                    return (
                      <button
                        key={fg.floor}
                        type="button"
                        onClick={() => handleSelectFloor(fg)}
                        title={fg.label}
                        className={`w-full py-1 text-center rounded text-[11px] font-mono font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-brand-gold text-white shadow-sm ring-1 ring-white'
                            : 'text-white/70 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {String(fg.floor).padStart(2, '0')}
                      </button>
                    );
                  })}
                </div>
                <div className="text-[9px] text-white/40 mt-1">
                  <ChevronDown size={12} className="mx-auto" />
                </div>
              </div>
            </div>

            {/* Instruction Footer */}
            <div className="px-4 py-2.5 bg-brand-navy-deep/60 border-t border-white/10 text-[11px] text-white/60 flex items-center justify-between">
              <span>{t('projects.clickFloorToInspect', 'Click any floor band on the building facade to explore its apartments')}</span>
              <Layers size={13} className="text-brand-gold-lt shrink-0" />
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT 7 COLS: Floor Apartments + Technical & 3D Plan Stage */}
          {/* ========================================================= */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            {/* 1. Floor Level Apartments Selector (Showing all floor plans of the selected floor) */}
            <div className="rounded-xl bg-brand-navy border border-white/10 p-4 sm:p-5 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-brand-gold animate-pulse" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      {lockedFloor.label} — {floorUnits.length} {t('projects.unitsAvailableOnFloor', 'Apartment Layouts')}
                    </h3>
                  </div>
                  <p className="text-xs text-white/60 mt-0.5">
                    {t(
                      'projects.selectApartmentPrompt',
                      'Select an apartment to inspect its 2D Technical Blueprint and 3D Furnished Plan'
                    )}
                  </p>
                </div>

                {activePlans.masterplanImg && (
                  <button
                    type="button"
                    onClick={() => {
                      if (activePlans.masterplanImg) {
                        window.open(activePlans.masterplanImg, '_blank');
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-white/80 border border-white/15 transition-colors cursor-pointer inline-flex items-center gap-1.5 self-start sm:self-auto"
                  >
                    <FileText size={13} className="text-brand-gold-lt" />
                    <span>{t('projects.viewFloorPlate', 'Floor Plate Masterplan')}</span>
                  </button>
                )}
              </div>

              {/* Apartment Cards Grid on this Floor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {floorUnits.map((u) => {
                  const isUnitSelected = u.id === selectedUnit.id;
                  const unitPlans = resolveUnitPlans(u, {
                    id: numericProjectId,
                    image_url: initialExteriorUrl,
                    masterplan_image: masterplanImageUrl,
                  });

                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleSelectUnit(u)}
                      className={`p-3 rounded-xl border text-left transition-all duration-150 cursor-pointer flex gap-3 relative ${
                        isUnitSelected
                          ? 'bg-brand-navy-deep border-brand-gold shadow-md ring-1 ring-brand-gold'
                          : 'bg-white/5 hover:bg-white/10 border-white/10'
                      }`}
                    >
                      {/* Plan Thumbnail */}
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-white/10 shrink-0 border border-white/15 flex items-center justify-center">
                        <img
                          src={unitPlans.furnishedPlan || activePlans.furnishedPlan}
                          alt={u.unit_number}
                          className="w-full h-full object-contain bg-white p-0.5"
                          loading="lazy"
                        />
                      </div>

                      {/* Specs */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-xs font-bold text-white truncate">
                            {u.unit_number}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              u.status === 'sold'
                                ? 'bg-red-500/20 text-red-300'
                                : u.status === 'reserved'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-emerald-500/20 text-emerald-300'
                            }`}
                          >
                            {u.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-white/70 truncate mb-1.5">
                          {u.title || `${u.beds || 3} Bed Residence`}
                        </p>
                        <div className="flex items-center gap-3 text-[11px] text-white/60">
                          <span className="font-mono tabular-nums">{u.area || 173} m²</span>
                          <span aria-hidden="true">·</span>
                          <span>{u.beds || 3} Bed</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono text-emerald-400 font-semibold tabular-nums">
                            ${((u.price || lockedFloor.startingPriceUsd) / 1000).toFixed(0)}k
                          </span>
                        </div>
                      </div>

                      {isUnitSelected && (
                        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-brand-gold" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Interactive Technical 2D Blueprint & 3D Furnished Plan Stage */}
            <div className="rounded-xl bg-brand-navy border border-white/10 overflow-hidden shadow-lg flex flex-col">
              {/* Plan Controls Toolbar */}
              <div className="px-4 py-3 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 bg-brand-navy-deep/80">
                {/* View Modes */}
                <div className="flex items-center gap-1.5 p-1 rounded-lg bg-white/5 border border-white/10">
                  <button
                    type="button"
                    onClick={() => setViewMode('split')}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors whitespace-nowrap cursor-pointer inline-flex items-center gap-1.5 ${
                      viewMode === 'split'
                        ? 'bg-brand-gold text-white shadow-sm'
                        : 'text-white/70 hover:text-white'
                    }`}
                  >
                    <SlidersHorizontal size={13} />
                    <span>50/50 X-Ray Split</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewMode('furnished')}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                      viewMode === 'furnished'
                        ? 'bg-brand-gold text-white shadow-sm'
                        : 'text-white/70 hover:text-white'
                    }`}
                  >
                    3D Furnished
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewMode('technical')}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                      viewMode === 'technical'
                        ? 'bg-brand-gold text-white shadow-sm'
                        : 'text-white/70 hover:text-white'
                    }`}
                  >
                    2D Technical
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewMode('side-by-side')}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors whitespace-nowrap cursor-pointer inline-flex items-center gap-1.5 ${
                      viewMode === 'side-by-side'
                        ? 'bg-brand-gold text-white shadow-sm'
                        : 'text-white/70 hover:text-white'
                    }`}
                  >
                    <Columns2 size={13} />
                    <span>Side-by-Side</span>
                  </button>
                </div>

                {/* Hotspot Toggle */}
                <div className="flex items-center gap-3 text-xs text-white/70">
                  <button
                    type="button"
                    onClick={() => setShowDimensionPins((v) => !v)}
                    className="hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Eye size={14} className="text-brand-gold-lt" />
                    <span>{showDimensionPins ? 'Hide Room Hotspots' : 'Show Room Hotspots'}</span>
                  </button>
                  {viewMode === 'split' && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums text-brand-gold-lt">
                        Split: {splitPct}%
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Canvas Viewports */}
              {viewMode === 'split' && (
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
                  className="relative min-h-[420px] sm:min-h-[480px] bg-neutral-900 overflow-hidden select-none cursor-ew-resize"
                >
                  {/* Base Layer: 3D Furnished Plan */}
                  <img
                    src={activePlans.furnishedPlan}
                    alt={`${unitTitle} 3D Furnished Plan`}
                    referrerPolicy="no-referrer"
                    draggable={false}
                    className="w-full h-full object-contain bg-white"
                  />

                  {/* Top Clipped Layer: 2D Technical Blueprint */}
                  <motion.div
                    style={{ clipPath: clipPathRight }}
                    className="absolute inset-0 pointer-events-none"
                  >
                    <img
                      src={activePlans.technicalPlan}
                      alt={`${unitTitle} 2D Technical Blueprint`}
                      referrerPolicy="no-referrer"
                      draggable={false}
                      className="w-full h-full object-contain bg-white"
                    />
                  </motion.div>

                  {/* Floating Badges */}
                  <div className="absolute top-3 left-3 pointer-events-none px-2.5 py-1 rounded-md bg-brand-navy-deep/90 text-[11px] font-bold text-white border border-white/20 shadow-md">
                    ← 2D Technical Blueprint (Structural CAD)
                  </div>
                  <div className="absolute top-3 right-3 pointer-events-none px-2.5 py-1 rounded-md bg-brand-gold text-[11px] font-bold text-white shadow-md">
                    3D Furnished Spatial Layout →
                  </div>

                  {/* Room Pins */}
                  {showDimensionPins &&
                    unitRooms.map((room) => {
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
                          className={`-translate-x-1/2 -translate-y-1/2 absolute z-20 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all duration-150 cursor-pointer flex items-center gap-1.5 shadow-md ${
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

                  {/* Draggable Vertical Split Curtain Handle */}
                  <motion.div
                    style={{ left: splitHandleLeft }}
                    className="absolute inset-y-0 z-30 -translate-x-1/2 w-0.5 bg-brand-gold pointer-events-none flex items-center justify-center"
                  >
                    <div className="w-9 h-9 rounded-full bg-brand-gold text-white shadow-xl border-2 border-white flex items-center justify-center">
                      <MoveHorizontal size={16} />
                    </div>
                  </motion.div>
                </div>
              )}

              {viewMode === 'furnished' && (
                <div className="relative min-h-[420px] sm:min-h-[480px] bg-neutral-900 overflow-hidden flex items-center justify-center p-2">
                  <img
                    src={activePlans.furnishedPlan}
                    alt={`${unitTitle} 3D Furnished Plan`}
                    className="max-h-[500px] w-auto object-contain mx-auto bg-white rounded-lg"
                  />
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-brand-gold text-[11px] font-bold text-white shadow-md">
                    3D Furnished Plan View
                  </div>
                </div>
              )}

              {viewMode === 'technical' && (
                <div className="relative min-h-[420px] sm:min-h-[480px] bg-neutral-900 overflow-hidden flex items-center justify-center p-2">
                  <img
                    src={activePlans.technicalPlan}
                    alt={`${unitTitle} 2D Technical Blueprint`}
                    className="max-h-[500px] w-auto object-contain mx-auto bg-white rounded-lg"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-brand-navy-deep/90 text-[11px] font-bold text-white border border-white/20 shadow-md">
                    2D Technical Blueprint View (Structural CAD)
                  </div>
                </div>
              )}

              {viewMode === 'side-by-side' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-3 bg-neutral-900 min-h-[400px]">
                  <div className="relative bg-white rounded-lg p-2 flex flex-col items-center justify-center">
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-brand-navy text-[10px] font-bold text-white">
                      2D Technical Blueprint
                    </span>
                    <img
                      src={activePlans.technicalPlan}
                      alt="Technical Blueprint"
                      className="max-h-72 w-auto object-contain mt-5"
                    />
                  </div>
                  <div className="relative bg-white rounded-lg p-2 flex flex-col items-center justify-center">
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-brand-gold text-[10px] font-bold text-white">
                      3D Furnished Layout
                    </span>
                    <img
                      src={activePlans.furnishedPlan}
                      alt="Furnished Layout"
                      className="max-h-72 w-auto object-contain mt-5"
                    />
                  </div>
                </div>
              )}

              {/* Room Architectural Specification Strip */}
              <div className="p-4 bg-brand-navy-deep/90 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-bold text-white">{activeRoom.nameEn}</span>
                    <span aria-hidden="true" className="text-white/40">·</span>
                    <span className="font-arabic text-brand-gold-lt">{activeRoom.nameFa}</span>
                    <span aria-hidden="true" className="text-white/40">·</span>
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

              {/* Apartment Action Bar: Schedule Visit + WhatsApp Inquiry */}
              <div className="p-4 bg-brand-navy border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-white">{unitTitle}</p>
                  <p className="text-[11px] text-white/60">
                    Floor {selectedUnit.floor || lockedFloor.floor} · {selectedUnit.beds || 3} Beds · {selectedUnit.baths || 2} Baths · {areaValue} m²
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setModalUnit(selectedUnit)}
                    className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-bold border border-white/20 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Eye size={13} />
                    <span>{t('projects.fullSpecifications', 'Full Specifications')}</span>
                  </button>

                  <a
                    href={`https://wa.me/93782222279?text=${encodeURIComponent(
                      `Hello Attaie Properties, I am interested in inquiring about ${projectName}, Floor ${
                        selectedUnit.floor || lockedFloor.floor
                      }, ${selectedUnit.unit_number} (${areaValue} m²).`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
                  >
                    <MessageCircle size={13} />
                    <span>{t('contact.whatsapp', 'WhatsApp Inquire')}</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      if (onRequestVisit) {
                        onRequestVisit(selectedUnit.unit_number);
                      } else {
                        setModalUnit(selectedUnit);
                      }
                    }}
                    className="px-4 py-2 rounded-lg bg-brand-gold hover:bg-brand-gold-dark text-white text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
                  >
                    <Calendar size={13} />
                    <span>{t('projects.bookVisit', 'Schedule Viewing')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Full Apartment Breakdown if triggered */}
      {modalUnit && (
        <ApartmentFullInfoModal
          unit={modalUnit}
          projectName={projectName}
          onClose={() => setModalUnit(null)}
        />
      )}
    </section>
  );
};

export { DualPaneElevationXRayView } from './DualPaneElevationXRayView';
export default PremiumProjectExplorer;
