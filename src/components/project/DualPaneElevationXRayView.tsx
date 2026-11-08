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
  Building2,
  Eye,
  MoveHorizontal,
  Layers,
  Bed,
  Bath,
  Maximize2,
  Calendar,
  Compass,
  Columns2,
  FileText,
  MessageCircle,
  Sparkles,
  ChevronRight,
  ZoomIn,
  Grid3X3,
  Image as ImageIcon,
  CheckCircle2,
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

export interface DualPaneElevationXRayViewProps {
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
  onFloorHover?: (floorNum: number) => void;
}

export const DualPaneElevationXRayView: React.FC<DualPaneElevationXRayViewProps> = ({
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
  onFloorHover,
}) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'fa';
  const numericProjectId = Number(projectId) || 1;

  // 1. Units & Floor Groups
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

  const floorGroups = useMemo<FloorGroup[]>(() => {
    return buildFloorGroups(internalUnits, numericProjectId);
  }, [internalUnits, numericProjectId]);

  // 2. Synchronization State between Elevation and Blueprint
  const [selectedFloorNum, setSelectedFloorNum] = useState<number>(() => {
    return floorGroups[0]?.floor ?? 4;
  });
  const [hoveredFloorNum, setHoveredFloorNum] = useState<number | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('salon');
  const [showDimensionPins, setShowDimensionPins] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'split' | 'furnished' | 'technical' | 'side-by-side'>('split');
  const [elevationDisplayMode, setElevationDisplayMode] = useState<'svg-cad' | 'photorealistic'>('svg-cad');
  const [modalUnit, setModalUnit] = useState<ProjectUnit | null>(null);

  // Keep selected floor valid
  useEffect(() => {
    if (floorGroups.length > 0) {
      const exists = floorGroups.some((g) => g.floor === selectedFloorNum);
      if (!exists) {
        setSelectedFloorNum(floorGroups[0].floor);
      }
    }
  }, [floorGroups, selectedFloorNum]);

  // The active floor: prioritizes hovered floor for real-time synchronization, locks on selected floor
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

  // Available units on active/hovered floor
  const currentFloorUnits = useMemo<ProjectUnit[]>(() => {
    if (activeFloor.units && activeFloor.units.length > 0) {
      return activeFloor.units;
    }
    return [
      {
        id: activeFloor.floor * 100 + 1,
        project_id: numericProjectId,
        unit_number: `Floor ${activeFloor.floor} — Unit A`,
        title: '3+1 Bedroom Luxury Residence',
        floor: activeFloor.floor,
        beds: 3,
        baths: 3,
        area: 173,
        price: activeFloor.startingPriceUsd,
        currency: 'USD',
        status: 'available',
        image_url: null,
        description: `Sunlit residence on Floor ${activeFloor.floor} with private guest salon (Mehmankhana), double glazing, and city views.`,
      },
      {
        id: activeFloor.floor * 100 + 2,
        project_id: numericProjectId,
        unit_number: `Floor ${activeFloor.floor} — Unit B`,
        title: '4+1 Bedroom Family Corner Suite',
        floor: activeFloor.floor,
        beds: 4,
        baths: 3,
        area: 215,
        price: activeFloor.startingPriceUsd + 28000,
        currency: 'USD',
        status: 'available',
        image_url: null,
        description: `Corner multi-generational suite on Floor ${activeFloor.floor} with dual balconies and panoramic mountain vistas.`,
      },
    ];
  }, [activeFloor, numericProjectId]);

  // Selected Unit
  const selectedUnit = useMemo<ProjectUnit>(() => {
    if (selectedUnitId !== null) {
      const match = currentFloorUnits.find((u) => u.id === selectedUnitId);
      if (match) return match;
    }
    return currentFloorUnits[0];
  }, [currentFloorUnits, selectedUnitId]);

  // Synchronize unit selection when floor changes
  useEffect(() => {
    if (currentFloorUnits.length > 0) {
      const exists = currentFloorUnits.some((u) => u.id === selectedUnitId);
      if (!exists) {
        setSelectedUnitId(currentFloorUnits[0].id);
      }
    }
  }, [currentFloorUnits, selectedUnitId]);

  // 3. Resolved Plans for the Selected Unit
  const activePlans = useMemo(() => {
    const resolved = resolveUnitPlans(selectedUnit, {
      id: numericProjectId,
      image_url: initialExteriorUrl,
      masterplan_image: masterplanImageUrl,
    });

    return {
      technicalPlan: resolved.technicalPlan || defaultTechnicalPlanImg,
      furnishedPlan: resolved.furnishedPlan || defaultFurnishedPlanImg,
      legendImg: resolved.legendImg,
      masterplanImg: resolved.masterplanImg || masterplanImageUrl,
    };
  }, [selectedUnit, numericProjectId, initialExteriorUrl, masterplanImageUrl]);

  // 4. Room Hotspots
  const unitRooms = useMemo<RoomHotspot[]>(() => {
    return getUnitRooms(selectedUnit);
  }, [selectedUnit]);

  const activeRoom = useMemo<RoomHotspot>(() => {
    return unitRooms.find((r) => r.id === selectedRoomId) || unitRooms[0];
  }, [unitRooms, selectedRoomId]);

  // 5. Interactive 50/50 X-Ray Split Slider
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

  const handleFloorHover = useCallback(
    (floorGroup: FloorGroup) => {
      setHoveredFloorNum(floorGroup.floor);
      setSelectedFloorNum(floorGroup.floor);
      if (floorGroup.units.length > 0) {
        setSelectedUnitId(floorGroup.units[0].id);
        if (onSelectUnit) onSelectUnit(floorGroup.units[0]);
      } else {
        setSelectedUnitId(floorGroup.floor * 100 + 1);
      }
      if (onFloorHover) onFloorHover(floorGroup.floor);
    },
    [onSelectUnit, onFloorHover]
  );

  const handleFloorLeave = useCallback(() => {
    setHoveredFloorNum(null);
  }, []);

  const handleSelectFloor = (floorGroup: FloorGroup) => {
    setSelectedFloorNum(floorGroup.floor);
    if (floorGroup.units.length > 0) {
      setSelectedUnitId(floorGroup.units[0].id);
      if (onSelectUnit) onSelectUnit(floorGroup.units[0]);
    } else {
      setSelectedUnitId(floorGroup.floor * 100 + 1);
    }
  };

  const handleSelectUnit = (unit: ProjectUnit) => {
    setSelectedUnitId(unit.id);
    if (onSelectUnit) onSelectUnit(unit);
  };

  const unitPrice = selectedUnit.price || activeFloor.startingPriceUsd;
  const unitTitle = selectedUnit.title || `${selectedUnit.unit_number} Residence`;
  const areaValue = selectedUnit.area || 173;
  const isHoverSyncActive = hoveredFloorNum !== null && hoveredFloorNum !== selectedFloorNum;

  // SVG Geometry Dimensions for Interactive Architectural Vector Tower
  const svgWidth = 460;
  const svgHeight = 680;
  const towerLeft = 110;
  const towerWidth = 240;
  const towerTop = 85;
  const towerBottom = 600;
  const towerHeight = towerBottom - towerTop;
  const totalFloors = floorGroups.length || 11;
  const floorSliceHeight = towerHeight / totalFloors;

  return (
    <section
      id="dual-pane-elevation-xray-view"
      className="my-10 rounded-2xl bg-brand-navy-deep text-white border border-white/10 overflow-hidden shadow-2xl"
    >
      {/* ========================================================= */}
      {/* TOP HEADER: Architectural Title & Telemetry                */}
      {/* ========================================================= */}
      <div className="border-b border-white/10 bg-brand-navy px-5 py-5 sm:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-white/60 mb-1.5">
              <span className="font-semibold text-brand-gold-lt uppercase tracking-wider">
                {t('projects.dualPaneEyebrow', 'Dual-Pane Elevation & X-Ray Blueprint View')}
              </span>
              <span aria-hidden="true">·</span>
              <span>{projectLocation}</span>
              {deliveryDate && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{t('projects.delivery', 'Delivery')}: {deliveryDate}</span>
                </>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight flex items-center gap-3">
              <span>{projectName}</span>
              {isHoverSyncActive && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-brand-gold/30 text-brand-gold-lt border border-brand-gold/50 animate-pulse font-normal">
                  Synchronizing Level {hoveredFloorNum}…
                </span>
              )}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-brand-navy-deep border border-white/15 text-xs font-semibold text-white/90 shadow-sm">
              <Layers size={14} className="text-brand-gold-lt" />
              <span>
                {floorGroups.length} {t('projects.floors', 'Floors')} · {lockedFloor.totalUnits} {t('projects.unitsOnFloor', 'Units/Floor')}
              </span>
            </div>

            <div className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10">
              <button
                type="button"
                onClick={() => setElevationDisplayMode('svg-cad')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                  elevationDisplayMode === 'svg-cad'
                    ? 'bg-brand-gold text-white shadow-sm'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <Grid3X3 size={13} />
                <span>SVG Vector CAD</span>
              </button>
              <button
                type="button"
                onClick={() => setElevationDisplayMode('photorealistic')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                  elevationDisplayMode === 'photorealistic'
                    ? 'bg-brand-gold text-white shadow-sm'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <ImageIcon size={13} />
                <span>Render Photo</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SYNCHRONIZED TELEMETRY STRIP                              */}
      {/* ========================================================= */}
      <div className="grid grid-cols-2 md:grid-cols-5 border-b border-white/10 bg-brand-navy-deep/70 divide-y md:divide-y-0 md:divide-x divide-white/10">
        <div className="px-5 py-3">
          <p className="text-[11px] text-white/55">
            {isHoverSyncActive ? 'Hovered Level' : 'Selected Floor'}
          </p>
          <p className="text-base font-bold text-white mt-0.5 tabular-nums flex items-center gap-2">
            <span>Floor {String(activeFloor.floor).padStart(2, '0')}</span>
            <span className="text-xs font-mono text-brand-gold-lt">+{activeFloor.elevationMeters}m</span>
          </p>
        </div>
        <div className="px-5 py-3">
          <p className="text-[11px] text-white/55">Active Apartment</p>
          <p className="text-base font-bold text-brand-gold-lt mt-0.5 truncate">
            {selectedUnit.unit_number} ({areaValue} m²)
          </p>
        </div>
        <div className="px-5 py-3">
          <p className="text-[11px] text-white/55">Floor Units Open</p>
          <p className="text-base font-bold text-white mt-0.5 tabular-nums">
            {activeFloor.availableUnits} Available / {activeFloor.totalUnits} Total
          </p>
        </div>
        <div className="px-5 py-3">
          <p className="text-[11px] text-white/55">Room Hotspot Focus</p>
          <p className="text-base font-bold text-white mt-0.5 truncate tabular-nums">
            {activeRoom.nameEn.split(' ')[0]} ({activeRoom.areaSqm} m²)
          </p>
        </div>
        <div className="px-5 py-3 col-span-2 md:col-span-1">
          <p className="text-[11px] text-white/55">Valuation / Price</p>
          <p className="text-base font-bold text-emerald-400 mt-0.5 tabular-nums">
            ${unitPrice.toLocaleString()} {selectedUnit.currency || 'USD'}
          </p>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MAIN DUAL-PANE STAGE                                      */}
      {/* ========================================================= */}
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ======================================================= */}
          {/* LEFT PANE: Interactive SVG Elevation Map                */}
          {/* ======================================================= */}
          <div className="lg:col-span-5 flex flex-col rounded-xl bg-brand-navy border border-white/10 overflow-hidden shadow-lg">
            {/* Left Pane Header */}
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between text-xs bg-brand-navy-deep/80">
              <span className="font-bold text-white flex items-center gap-2">
                <Building2 size={15} className="text-brand-gold-lt" />
                <span>
                  {elevationDisplayMode === 'svg-cad'
                    ? 'Interactive SVG Architectural Elevation'
                    : 'Building Elevation Photo'}
                </span>
              </span>
              <span className="text-xs text-brand-gold-lt font-mono">
                {isHoverSyncActive ? `Hovering F${activeFloor.floor}` : `Locked F${selectedFloorNum}`}
              </span>
            </div>

            {/* SVG Elevation Map Canvas */}
            <div className="relative min-h-[500px] sm:min-h-[580px] bg-[#020b24] overflow-hidden select-none flex items-center justify-center p-2">
              {elevationDisplayMode === 'svg-cad' ? (
                /* Pure Interactive Architectural Vector SVG */
                <svg
                  viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                  className="w-full h-full max-h-[620px] select-none"
                  style={{ filter: 'drop-shadow(0 10px 25px rgba(0,0,0,0.5))' }}
                >
                  <defs>
                    {/* Architectural Blueprint Grid Pattern */}
                    <pattern id="cadGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <line x1="0" y1="0" x2="20" y2="0" stroke="rgba(255,255,255,0.04)" strokeWidth="0.8" />
                      <line x1="0" y1="0" x2="0" y2="20" stroke="rgba(255,255,255,0.04)" strokeWidth="0.8" />
                    </pattern>
                    {/* Sky Gradient */}
                    <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#04123b" />
                      <stop offset="70%" stopColor="#02081f" />
                      <stop offset="100%" stopColor="#010617" />
                    </linearGradient>
                    {/* Tower Facade Gradient */}
                    <linearGradient id="towerGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#0d266e" />
                      <stop offset="25%" stopColor="#153696" />
                      <stop offset="75%" stopColor="#0e2874" />
                      <stop offset="100%" stopColor="#07194f" />
                    </linearGradient>
                    {/* Active/Hover Floor Gradient */}
                    <linearGradient id="activeFloorGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="rgba(1, 69, 242, 0.85)" />
                      <stop offset="50%" stopColor="rgba(80, 140, 255, 0.95)" />
                      <stop offset="100%" stopColor="rgba(1, 69, 242, 0.85)" />
                    </linearGradient>
                  </defs>

                  {/* Backdrop CAD Grid */}
                  <rect x="0" y="0" width={svgWidth} height={svgHeight} fill="url(#skyGrad)" />
                  <rect x="0" y="0" width={svgWidth} height={svgHeight} fill="url(#cadGrid)" />

                  {/* Left Architectural Elevation Datum Axis */}
                  <line x1="45" y1="60" x2="45" y2="615" stroke="rgba(255,255,255,0.25)" strokeWidth="1" strokeDasharray="3 3" />
                  <text x="45" y="50" fill="#93c5fd" fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                    +DATUM
                  </text>
                  <text x="40" y="90" fill="rgba(255,255,255,0.6)" fontSize="9" fontFamily="monospace" textAnchor="end">
                    +42.0m
                  </text>
                  <line x1="42" y1="88" x2="48" y2="88" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
                  <text x="40" y="240" fill="rgba(255,255,255,0.6)" fontSize="9" fontFamily="monospace" textAnchor="end">
                    +28.0m
                  </text>
                  <line x1="42" y1="238" x2="48" y2="238" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
                  <text x="40" y="420" fill="rgba(255,255,255,0.6)" fontSize="9" fontFamily="monospace" textAnchor="end">
                    +14.0m
                  </text>
                  <line x1="42" y1="418" x2="48" y2="418" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
                  <text x="40" y="605" fill="#34d399" fontSize="9" fontFamily="monospace" textAnchor="end">
                    ±0.00m
                  </text>
                  <line x1="42" y1="603" x2="48" y2="603" stroke="#34d399" strokeWidth="1.5" />

                  {/* Ground Foundation & Street Grade Line */}
                  <line x1="20" y1="604" x2="440" y2="604" stroke="#34d399" strokeWidth="2" />
                  <rect x="20" y="605" width="420" height="40" fill="#030b20" />
                  {/* Hatching for foundation ground */}
                  {Array.from({ length: 28 }).map((_, i) => (
                    <line
                      key={i}
                      x1={25 + i * 15}
                      y1="605"
                      x2={35 + i * 15}
                      y2="630"
                      stroke="rgba(255,255,255,0.12)"
                      strokeWidth="1"
                    />
                  ))}
                  <text x="230" y="625" fill="rgba(255,255,255,0.4)" fontSize="9" fontFamily="monospace" textAnchor="middle">
                    GRADE LEVEL · BASEMENT PARKING RAMP &amp; FOUNDATION SLAB
                  </text>

                  {/* Tower Crown / Penthouse Pergola / Parapet */}
                  <polygon
                    points={`${towerLeft + 20},${towerTop - 25} ${towerLeft + towerWidth - 20},${towerTop - 25} ${towerLeft + towerWidth - 10},${towerTop} ${towerLeft + 10},${towerTop}`}
                    fill="#0a1d52"
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth="1.2"
                  />
                  <line
                    x1={towerLeft + 30}
                    y1={towerTop - 12}
                    x2={towerLeft + towerWidth - 30}
                    y2={towerTop - 12}
                    stroke="#93c5fd"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={towerLeft + towerWidth / 2}
                    y={towerTop - 32}
                    fill="#93c5fd"
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="middle"
                    fontWeight="bold"
                  >
                    ROOFTOP SKY TERRACE &amp; SOLAR CANOPY
                  </text>

                  {/* Tower Main Architectural Massing */}
                  <rect
                    x={towerLeft}
                    y={towerTop}
                    width={towerWidth}
                    height={towerHeight}
                    fill="url(#towerGrad)"
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth="1.5"
                  />

                  {/* Vertical Structural Shear Columns & Mullions */}
                  <line x1={towerLeft + 60} y1={towerTop} x2={towerLeft + 60} y2={towerBottom} stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
                  <line x1={towerLeft + 120} y1={towerTop} x2={towerLeft + 120} y2={towerBottom} stroke="rgba(255,255,255,0.25)" strokeWidth="2" />
                  <line x1={towerLeft + 180} y1={towerTop} x2={towerLeft + 180} y2={towerBottom} stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />

                  {/* INTERACTIVE SVG FLOOR SLICES (Synchronized in real-time with Blueprint) */}
                  {floorGroups.map((fg, idx) => {
                    const sliceY = towerTop + idx * floorSliceHeight;
                    const isSelected = fg.floor === selectedFloorNum;
                    const isHovered = fg.floor === hoveredFloorNum;
                    const isActive = isSelected || isHovered;
                    const isSoldOut = fg.availableUnits === 0;

                    return (
                      <g
                        key={fg.floor}
                        className="cursor-pointer transition-all duration-150"
                        onMouseEnter={() => handleFloorHover(fg)}
                        onMouseLeave={handleFloorLeave}
                        onClick={() => handleSelectFloor(fg)}
                      >
                        {/* Floor Slab Division Line */}
                        <line
                          x1={towerLeft}
                          y1={sliceY}
                          x2={towerLeft + towerWidth}
                          y2={sliceY}
                          stroke={isActive ? '#ffffff' : 'rgba(255,255,255,0.25)'}
                          strokeWidth={isActive ? 2 : 1}
                        />

                        {/* Interactive Floor Slices Rect */}
                        <rect
                          x={towerLeft + 2}
                          y={sliceY + 1}
                          width={towerWidth - 4}
                          height={floorSliceHeight - 2}
                          fill={isActive ? 'url(#activeFloorGrad)' : 'rgba(2, 14, 58, 0.45)'}
                          stroke={isActive ? '#ffffff' : 'transparent'}
                          strokeWidth={isActive ? 1.5 : 0}
                          className="transition-colors duration-150"
                        />

                        {/* Fenestration Window Frames inside floor slice */}
                        <rect
                          x={towerLeft + 12}
                          y={sliceY + 6}
                          width={36}
                          height={floorSliceHeight - 12}
                          fill={isActive ? 'rgba(255,255,255,0.3)' : 'rgba(147, 197, 253, 0.12)'}
                          stroke="rgba(255,255,255,0.2)"
                          strokeWidth="0.8"
                        />
                        <rect
                          x={towerLeft + 72}
                          y={sliceY + 6}
                          width={36}
                          height={floorSliceHeight - 12}
                          fill={isActive ? 'rgba(255,255,255,0.3)' : 'rgba(147, 197, 253, 0.12)'}
                          stroke="rgba(255,255,255,0.2)"
                          strokeWidth="0.8"
                        />
                        <rect
                          x={towerLeft + 132}
                          y={sliceY + 6}
                          width={36}
                          height={floorSliceHeight - 12}
                          fill={isActive ? 'rgba(255,255,255,0.3)' : 'rgba(147, 197, 253, 0.12)'}
                          stroke="rgba(255,255,255,0.2)"
                          strokeWidth="0.8"
                        />
                        <rect
                          x={towerLeft + 192}
                          y={sliceY + 6}
                          width={36}
                          height={floorSliceHeight - 12}
                          fill={isActive ? 'rgba(255,255,255,0.3)' : 'rgba(147, 197, 253, 0.12)'}
                          stroke="rgba(255,255,255,0.2)"
                          strokeWidth="0.8"
                        />

                        {/* Floor Plate Label inside building slice */}
                        <text
                          x={towerLeft + 16}
                          y={sliceY + floorSliceHeight / 2 + 4}
                          fill="#ffffff"
                          fontSize="11"
                          fontFamily="monospace"
                          fontWeight="bold"
                          pointerEvents="none"
                        >
                          F{String(fg.floor).padStart(2, '0')}
                        </text>

                        {/* Availability Pill Indicator inside slice */}
                        <circle
                          cx={towerLeft + towerWidth - 20}
                          cy={sliceY + floorSliceHeight / 2}
                          r="4"
                          fill={isSoldOut ? '#ef4444' : '#22c55e'}
                          pointerEvents="none"
                        />

                        {/* Right Callout Tag & Laser Beam on Hover / Active */}
                        {isActive && (
                          <g pointerEvents="none">
                            {/* Horizontal Laser Alignment Beam across to Blueprint pane */}
                            <line
                              x1={towerLeft + towerWidth}
                              y1={sliceY + floorSliceHeight / 2}
                              x2={svgWidth - 6}
                              y2={sliceY + floorSliceHeight / 2}
                              stroke="#0145F2"
                              strokeWidth="2"
                              strokeDasharray="4 3"
                              opacity="0.85"
                            />
                            {/* Target arrow head indicator */}
                            <polygon
                              points={`${svgWidth - 6},${sliceY + floorSliceHeight / 2 - 4} ${svgWidth - 1},${sliceY + floorSliceHeight / 2} ${svgWidth - 6},${sliceY + floorSliceHeight / 2 + 4}`}
                              fill="#0145F2"
                            />
                            {/* Callout Box */}
                            <rect
                              x={towerLeft + towerWidth + 12}
                              y={sliceY + floorSliceHeight / 2 - 13}
                              width="96"
                              height="26"
                              rx="5"
                              fill="#010826"
                              stroke="#0145F2"
                              strokeWidth="1.5"
                            />
                            <text
                              x={towerLeft + towerWidth + 18}
                              y={sliceY + floorSliceHeight / 2 + 4}
                              fill="#ffffff"
                              fontSize="9"
                              fontFamily="sans-serif"
                              fontWeight="bold"
                            >
                              F{String(fg.floor).padStart(2, '0')} · Blueprint Active →
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}

                  {/* Ground Lobby Glass Entrance Portal */}
                  <rect
                    x={towerLeft + 70}
                    y={towerBottom - 32}
                    width={100}
                    height={32}
                    fill="rgba(1, 69, 242, 0.35)"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                  <line
                    x1={towerLeft + 120}
                    y1={towerBottom - 32}
                    x2={towerLeft + 120}
                    y2={towerBottom}
                    stroke="#ffffff"
                    strokeWidth="1"
                  />
                  <text
                    x={towerLeft + 120}
                    y={towerBottom - 14}
                    fill="#ffffff"
                    fontSize="8.5"
                    fontFamily="monospace"
                    textAnchor="middle"
                    fontWeight="bold"
                  >
                    MAIN FOYER &amp; CONCIERGE
                  </text>
                </svg>
              ) : (
                /* Photorealistic Render with Overlaid Floor Bands */
                <div className="relative w-full h-full min-h-[500px]">
                  <img
                    src={initialExteriorUrl || defaultExteriorImg}
                    alt={`${projectName} Elevation`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-navy-deep via-transparent to-brand-navy-deep/40 pointer-events-none" />

                  {/* Overlaid Floor Bands */}
                  <div className="absolute inset-x-4 inset-y-6 pointer-events-auto">
                    {floorGroups.map((fg) => {
                      const isSelected = fg.floor === selectedFloorNum;
                      const isHovered = fg.floor === hoveredFloorNum;
                      const isActive = isSelected || isHovered;
                      return (
                        <button
                          key={fg.floor}
                          type="button"
                          onClick={() => handleSelectFloor(fg)}
                          onMouseEnter={() => handleFloorHover(fg)}
                          onMouseLeave={handleFloorLeave}
                          style={{
                            top: `${fg.bandTopPct}%`,
                            height: `${fg.bandHeightPct}%`,
                          }}
                          className={`absolute left-0 right-0 rounded-md transition-all flex items-center justify-between px-3 cursor-pointer ${
                            isActive
                              ? 'bg-brand-gold/75 border-2 border-white shadow-xl z-20 scale-[1.01]'
                              : 'bg-brand-navy/35 hover:bg-brand-gold/45 border border-white/20 z-10'
                          }`}
                        >
                          <span className="text-xs font-mono font-bold text-white tabular-nums">
                            F{String(fg.floor).padStart(2, '0')}
                          </span>
                          <span className="text-xs font-semibold text-white tabular-nums">
                            +{fg.elevationMeters}m · {fg.availableUnits} Available
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Bottom Quick Elevation Info */}
              <div className="absolute bottom-3 inset-x-3 rounded-xl bg-brand-navy-deep/95 backdrop-blur-md border border-white/15 p-3 flex items-center justify-between gap-3 shadow-lg pointer-events-none">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{activeFloor.label}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-brand-gold/25 text-brand-gold-lt">
                      +{activeFloor.elevationMeters}m Elevation
                    </span>
                  </div>
                  <p className="text-[11px] text-white/65 mt-0.5 tabular-nums">
                    {activeFloor.availableUnits} Open · {activeFloor.reservedUnits} Reserved · {activeFloor.soldUnits} Sold
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

            {/* Elevation Instruction Strip */}
            <div className="px-4 py-2.5 bg-brand-navy-deep/60 border-t border-white/10 text-[11px] text-white/60 flex items-center justify-between">
              <span>Hover any floor in the SVG elevation map to immediately synchronize the blueprint view</span>
              <Compass size={13} className="text-brand-gold-lt shrink-0" />
            </div>
          </div>

          {/* ======================================================= */}
          {/* RIGHT PANE: Layered Blueprint Floor Plan & X-Ray        */}
          {/* ======================================================= */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            {/* 1. Synchronized Floor Plate Header & Apartment Selector */}
            <div className="rounded-xl bg-brand-navy border border-white/10 p-4 sm:p-5 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        hoveredFloorNum !== null ? 'bg-brand-gold animate-ping' : 'bg-brand-gold'
                      }`}
                    />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Floor Plate {String(activeFloor.floor).padStart(2, '0')} — {currentFloorUnits.length} Apartment Blueprints
                    </h3>
                  </div>
                  <p className="text-xs text-white/60 mt-0.5">
                    {hoveredFloorNum !== null ? (
                      <span className="text-brand-gold-lt font-semibold flex items-center gap-1.5">
                        <Sparkles size={12} className="text-brand-gold animate-spin" />
                        Synchronized with Level {activeFloor.floor} elevation hover · Floor plan automatically highlighted
                      </span>
                    ) : (
                      'Hover any floor on the SVG elevation to automatically synchronize and highlight its floor plan.'
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
                    <span>Floor Plate Masterplan</span>
                  </button>
                )}
              </div>

              {/* Floor Apartments Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentFloorUnits.map((u) => {
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
                          ? 'bg-brand-navy-deep border-brand-gold shadow-md ring-2 ring-brand-gold/70'
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
                          <span className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                            <span>{u.unit_number}</span>
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
                        <p className="text-[11px] text-white/70 truncate mb-1">
                          {u.title || `${u.beds || 3} Bed Residence`}
                        </p>
                        <div className="flex items-center gap-3 text-[11px] text-white/60">
                          <span className="font-mono tabular-nums">{u.area || 173} m²</span>
                          <span aria-hidden="true">·</span>
                          <span>{u.beds || 3} Bed</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono text-emerald-400 font-semibold tabular-nums">
                            ${((u.price || activeFloor.startingPriceUsd) / 1000).toFixed(0)}k
                          </span>
                        </div>
                      </div>

                      {isUnitSelected && (
                        <span className="absolute top-2 right-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-brand-gold text-white text-[9.5px] font-mono font-bold shadow-xs">
                          <Sparkles size={9} />
                          <span>Active Plan</span>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Layered Blueprint Floor Plan & 50/50 X-Ray Canvas */}
            <div className="rounded-xl bg-brand-navy border border-white/10 overflow-hidden shadow-lg flex flex-col">
              {/* Blueprint Control Bar */}
              <div className="px-4 py-3 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 bg-brand-navy-deep/80">
                {/* View Mode Tabs */}
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
                    onClick={() => setViewMode('technical')}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                      viewMode === 'technical'
                        ? 'bg-brand-gold text-white shadow-sm'
                        : 'text-white/70 hover:text-white'
                    }`}
                  >
                    2D Blueprint CAD
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

                {/* Hotspot Toggle & Split Telemetry */}
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

              {/* Viewport: Layered Canvas */}
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
                  className="relative min-h-[420px] sm:min-h-[480px] bg-[#020d29] overflow-hidden select-none cursor-ew-resize"
                  style={{
                    backgroundImage:
                      'radial-gradient(circle at 50% 50%, rgba(1, 69, 242, 0.08) 0%, transparent 80%)',
                  }}
                >
                  {/* Layer A (Base): 3D Furnished Spatial Plan */}
                  <img
                    src={activePlans.furnishedPlan}
                    alt={`${unitTitle} 3D Furnished Spatial Plan`}
                    referrerPolicy="no-referrer"
                    draggable={false}
                    className="w-full h-full object-contain bg-white"
                  />

                  {/* Layer B (Clipped Top): 2D Technical Blueprint */}
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

                  {/* Blueprint Floating Badges */}
                  <div className="absolute top-3 left-3 pointer-events-none px-2.5 py-1 rounded-md bg-brand-navy-deep/90 text-[11px] font-bold text-white border border-white/20 shadow-md">
                    ← 2D Technical Blueprint (Structural CAD)
                  </div>
                  <div className="absolute top-3 right-3 pointer-events-none px-2.5 py-1 rounded-md bg-brand-gold text-[11px] font-bold text-white shadow-md">
                    3D Furnished Spatial Layout →
                  </div>

                  {/* Synchronized Level Indicator Badge */}
                  <div className="absolute bottom-3 left-3 pointer-events-none px-2.5 py-1 rounded-md bg-brand-navy-deep/85 border border-brand-gold/40 text-[10px] font-mono text-brand-gold-lt shadow">
                    LEVEL {activeFloor.floor} · {activeFloor.elevationMeters}M ELEVATION
                  </div>

                  {/* Room Hotspot Pins */}
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

                  {/* Draggable Vertical Split Divider Handle */}
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

              {viewMode === 'technical' && (
                <div className="relative min-h-[420px] sm:min-h-[480px] bg-[#020d29] overflow-hidden flex items-center justify-center p-3">
                  <img
                    src={activePlans.technicalPlan}
                    alt={`${unitTitle} 2D Technical Blueprint`}
                    className="max-h-[500px] w-auto object-contain mx-auto bg-white rounded-lg shadow-md"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-brand-navy-deep/90 text-[11px] font-bold text-white border border-white/20 shadow-md">
                    2D Architectural Blueprint CAD View
                  </div>
                </div>
              )}

              {viewMode === 'furnished' && (
                <div className="relative min-h-[420px] sm:min-h-[480px] bg-[#020d29] overflow-hidden flex items-center justify-center p-3">
                  <img
                    src={activePlans.furnishedPlan}
                    alt={`${unitTitle} 3D Furnished Plan`}
                    className="max-h-[500px] w-auto object-contain mx-auto bg-white rounded-lg shadow-md"
                  />
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-brand-gold text-[11px] font-bold text-white shadow-md">
                    3D Furnished Spatial Plan View
                  </div>
                </div>
              )}

              {viewMode === 'side-by-side' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-[#020d29] min-h-[400px]">
                  <div className="relative bg-white rounded-lg p-2 flex flex-col items-center justify-center border border-white/10">
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-brand-navy text-[10px] font-bold text-white">
                      2D Technical Blueprint (CAD)
                    </span>
                    <img
                      src={activePlans.technicalPlan}
                      alt="Technical Blueprint"
                      className="max-h-72 w-auto object-contain mt-5"
                    />
                  </div>
                  <div className="relative bg-white rounded-lg p-2 flex flex-col items-center justify-center border border-white/10">
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

              {/* Apartment Action Bar */}
              <div className="p-4 bg-brand-navy border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-white">{unitTitle}</p>
                  <p className="text-[11px] text-white/60">
                    Floor {selectedUnit.floor || activeFloor.floor} · {selectedUnit.beds || 3} Beds · {selectedUnit.baths || 2} Baths · {areaValue} m²
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setModalUnit(selectedUnit)}
                    className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-bold border border-white/20 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Eye size={13} />
                    <span>Full Specifications</span>
                  </button>

                  <a
                    href={`https://wa.me/93782222279?text=${encodeURIComponent(
                      `Hello Attaie Properties, I am interested in inquiring about ${projectName}, Floor ${
                        selectedUnit.floor || activeFloor.floor
                      }, ${selectedUnit.unit_number} (${areaValue} m²).`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
                  >
                    <MessageCircle size={13} />
                    <span>WhatsApp Inquire</span>
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
                    <span>Schedule Viewing</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Full Apartment Breakdown */}
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

export default DualPaneElevationXRayView;
