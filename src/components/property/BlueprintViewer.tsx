import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  X,
  Layers,
  Box,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Bed,
  Bath,
  Maximize2,
  Calendar,
  MessageCircle,
  Eye,
  CheckCircle2,
  Compass,
  DollarSign,
  Info,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export interface BlueprintUnitHotspot {
  id: string | number;
  unit_number: string;
  title?: string | null;
  floor?: number | null;
  beds?: number | null;
  baths?: number | null;
  area?: number | null;
  price?: number | null;
  currency?: string;
  status?: 'available' | 'reserved' | 'sold' | 'rented';
  xPct: number; // 0 to 100
  yPct: number; // 0 to 100
  description?: string | null;
  technicalPlanUrl?: string | null;
  furnishedPlanUrl?: string | null;
}

export interface BlueprintViewerProps {
  floorPlanUrl: string;
  propertyTitle?: string;
  threeDPlanUrl?: string | null;
  units?: BlueprintUnitHotspot[];
  selectedUnitId?: string | number | null;
  onSelectUnit?: (unit: BlueprintUnitHotspot) => void;
  onRequestVisit?: (unitLabel: string) => void;
  onClose?: () => void;
  isModal?: boolean;
  className?: string;
}

/**
 * Standard default quadrant distribution for units if xPct/yPct are not specified.
 */
function getDefaultCoordinates(index: number, total: number): { xPct: number; yPct: number } {
  if (total <= 1) return { xPct: 50, yPct: 50 };
  if (total === 2) {
    return index === 0 ? { xPct: 35, yPct: 50 } : { xPct: 65, yPct: 50 };
  }
  if (total === 3) {
    const coords = [
      { xPct: 30, yPct: 42 },
      { xPct: 70, yPct: 42 },
      { xPct: 50, yPct: 72 },
    ];
    return coords[index % coords.length];
  }
  if (total === 4) {
    const coords = [
      { xPct: 28, yPct: 36 },
      { xPct: 72, yPct: 36 },
      { xPct: 28, yPct: 68 },
      { xPct: 72, yPct: 68 },
    ];
    return coords[index % coords.length];
  }
  if (total === 5) {
    const coords = [
      { xPct: 24, yPct: 34 },
      { xPct: 50, yPct: 34 },
      { xPct: 76, yPct: 34 },
      { xPct: 35, yPct: 68 },
      { xPct: 65, yPct: 68 },
    ];
    return coords[index % coords.length];
  }
  // 6 or more
  const row = Math.floor(index / 3);
  const col = index % 3;
  return {
    xPct: Number((22 + col * 28).toFixed(1)),
    yPct: Number((34 + row * 34).toFixed(1)),
  };
}

export const BlueprintViewer: React.FC<BlueprintViewerProps> = ({
  floorPlanUrl,
  propertyTitle = 'Architectural Floor Plan Blueprint',
  threeDPlanUrl,
  units = [],
  selectedUnitId,
  onSelectUnit,
  onRequestVisit,
  onClose,
  isModal = Boolean(onClose),
  className = '',
}) => {
  const { t } = useTranslation();
  const hasFloorPlan = Boolean(floorPlanUrl);
  const hasThreeDPlan = Boolean(threeDPlanUrl);
  const hasBoth = hasFloorPlan && hasThreeDPlan;

  const [activeTab, setActiveTab] = useState<'floor' | '3d'>('floor');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showHotspots, setShowHotspots] = useState<boolean>(true);
  const [hoveredUnit, setHoveredUnit] = useState<BlueprintUnitHotspot | null>(null);

  // Normalize units with coordinates
  const processedUnits = useMemo<BlueprintUnitHotspot[]>(() => {
    if (units.length > 0) {
      return units.map((u, i) => {
        const hasCoords = typeof u.xPct === 'number' && typeof u.yPct === 'number';
        const defaultCoord = getDefaultCoordinates(i, units.length);
        return {
          ...u,
          xPct: hasCoords ? u.xPct : defaultCoord.xPct,
          yPct: hasCoords ? u.yPct : defaultCoord.yPct,
        };
      });
    }

    // Default sample units for floorplan inspection if none passed
    return [
      {
        id: 'unit-a',
        unit_number: 'Unit A',
        title: '3+1 Bedroom Sunlit Corner Residence',
        floor: 4,
        beds: 3,
        baths: 3,
        area: 173,
        price: 138000,
        currency: 'USD',
        status: 'available',
        xPct: 28,
        yPct: 36,
        description:
          'South-east corner residence with formal guest room (Mehmankhana), panoramic glass terrace, master suite with en-suite bath, and acoustic insulation.',
      },
      {
        id: 'unit-b',
        unit_number: 'Unit B',
        title: '5+1 Bedroom Multi-Generational Family Suite',
        floor: 4,
        beds: 5,
        baths: 4,
        area: 243,
        price: 195000,
        currency: 'USD',
        status: 'available',
        xPct: 72,
        yPct: 36,
        description:
          'Expansive family suite featuring separate formal reception salon, dual balconies, large chef kitchen with pantry, and double-glazed soundproof curtain glazing.',
      },
      {
        id: 'unit-c',
        unit_number: 'Unit C',
        title: '4+1 Bedroom Modern Panorama Apartment',
        floor: 4,
        beds: 4,
        baths: 3,
        area: 203,
        price: 162000,
        currency: 'USD',
        status: 'reserved',
        xPct: 28,
        yPct: 68,
        description:
          'High-zone apartment with custom walnut wardrobes, central heating ducts, open dining hall, and swift elevator access.',
      },
      {
        id: 'unit-d',
        unit_number: 'Unit D',
        title: '3+1 Bedroom Boulevard Suite',
        floor: 4,
        beds: 3,
        baths: 2,
        area: 165,
        price: 132000,
        currency: 'USD',
        status: 'available',
        xPct: 72,
        yPct: 68,
        description:
          'Symmetric boulevard-facing layout with private foyer, contemporary kitchen, and deep balcony overlooking the city skyline.',
      },
    ];
  }, [units]);

  // Selected unit state
  const [internalSelectedId, setInternalSelectedId] = useState<string | number>(() => {
    return selectedUnitId ?? processedUnits[0]?.id ?? 'unit-a';
  });

  useEffect(() => {
    if (selectedUnitId !== undefined && selectedUnitId !== null) {
      setInternalSelectedId(selectedUnitId);
    }
  }, [selectedUnitId]);

  const activeUnit = useMemo<BlueprintUnitHotspot>(() => {
    const target = hoveredUnit || processedUnits.find((u) => u.id === internalSelectedId) || processedUnits[0];
    return target;
  }, [hoveredUnit, internalSelectedId, processedUnits]);

  const handleUnitClick = (unit: BlueprintUnitHotspot) => {
    setInternalSelectedId(unit.id);
    if (onSelectUnit) onSelectUnit(unit);
  };

  // Keyboard Escape & Tab Trapping for Modal Mode
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isModal || !onClose) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isModal, onClose]);

  const currentDisplayUrl =
    activeTab === 'floor' || !hasThreeDPlan ? floorPlanUrl : threeDPlanUrl || floorPlanUrl;

  const currentAlt =
    activeTab === 'floor'
      ? `${propertyTitle} — 2D Architectural CAD Floor Plan`
      : `${propertyTitle} — 3D Spatial Interior Plan`;

  const statusColorMap = {
    available: { dot: 'bg-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
    reserved: { dot: 'bg-amber-400', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    sold: { dot: 'bg-red-400', badge: 'bg-red-500/20 text-red-300 border-red-500/30' },
    rented: { dot: 'bg-blue-400', badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  };

  // Main inner content
  const content = (
    <div
      ref={dialogRef}
      role={isModal ? 'dialog' : 'region'}
      aria-label="Blueprint Floor Plan Viewer"
      className={`w-full flex flex-col rounded-2xl bg-[#020b24] text-white border border-white/10 shadow-2xl overflow-hidden ${
        isModal ? 'max-w-5xl max-h-[92vh]' : ''
      } ${className}`}
    >
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 sm:px-7 bg-brand-navy border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs text-brand-gold-lt uppercase tracking-wider font-semibold mb-1">
            <Layers size={14} className="text-brand-gold" />
            <span>Interactive Floor Plan Blueprint &amp; Unit Hotspots</span>
          </div>
          <h2 className="text-lg sm:text-xl font-display font-bold text-white truncate">
            {propertyTitle}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* 2D / 3D Plan Tabs */}
          {hasBoth && (
            <div className="flex items-center p-1 rounded-xl bg-white/5 border border-white/10">
              <button
                type="button"
                onClick={() => setActiveTab('floor')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                  activeTab === 'floor'
                    ? 'bg-brand-gold text-white shadow-sm'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <Layers size={13} />
                <span>2D Blueprint</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('3d')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                  activeTab === '3d'
                    ? 'bg-brand-gold text-white shadow-sm'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <Box size={13} />
                <span>3D Spatial</span>
              </button>
            </div>
          )}

          {/* Hotspot Toggle */}
          <button
            type="button"
            onClick={() => setShowHotspots((v) => !v)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
              showHotspots
                ? 'bg-brand-gold/25 text-brand-gold-lt border-brand-gold/40'
                : 'bg-white/5 hover:bg-white/10 text-white/70 border-white/15'
            }`}
          >
            <Eye size={13} />
            <span>{showHotspots ? 'Hide Hotspots' : 'Show Hotspots'}</span>
          </button>

          {/* Zoom Controls */}
          <div className="flex items-center rounded-xl bg-white/5 border border-white/10 p-0.5">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(1, z - 0.25))}
              disabled={zoomLevel <= 1}
              className="p-1.5 rounded-lg text-white/70 hover:text-white disabled:opacity-30 cursor-pointer"
              title="Zoom out"
              aria-label="Zoom out"
            >
              <ZoomOut size={14} />
            </button>
            <span className="text-[11px] font-mono px-2 text-white/80 tabular-nums">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
              disabled={zoomLevel >= 2.5}
              className="p-1.5 rounded-lg text-white/70 hover:text-white disabled:opacity-30 cursor-pointer"
              title="Zoom in"
              aria-label="Zoom in"
            >
              <ZoomIn size={14} />
            </button>
            {zoomLevel > 1 && (
              <button
                type="button"
                onClick={() => setZoomLevel(1)}
                className="p-1.5 text-white/60 hover:text-white border-l border-white/10"
                title="Reset zoom"
              >
                <RotateCcw size={13} />
              </button>
            )}
          </div>

          {/* Close button for modal */}
          {isModal && onClose && (
            <button
              ref={closeBtnRef}
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors shrink-0"
              aria-label="Close Blueprint Viewer"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* 2. Interactive CAD Floor Plan Stage with Overlaid Hotspots */}
      <div className="relative flex-1 bg-[#02081f] overflow-hidden select-none min-h-[380px] sm:min-h-[480px] flex items-center justify-center p-4">
        {/* Architectural Background Grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-25"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(255, 255, 255, 0.08) 1px, transparent 1px),
                              linear-gradient(to bottom, rgba(255, 255, 255, 0.08) 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />

        {/* Blueprint Plan Image Container (Supports Zoom) */}
        <div
          className="relative max-w-full max-h-full transition-transform duration-200 ease-out"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <img
            src={currentDisplayUrl}
            alt={currentAlt}
            referrerPolicy="no-referrer"
            className="max-h-[55vh] sm:max-h-[62vh] w-auto max-w-full object-contain rounded-xl bg-white shadow-2xl border border-white/20 p-1"
          />

          {/* Overlaid Interactive Hotspots for Individual Apartment Units */}
          {showHotspots && (
            <div className="absolute inset-0 pointer-events-auto">
              {processedUnits.map((unit) => {
                const isSelected = unit.id === activeUnit.id;
                const isHovered = hoveredUnit?.id === unit.id;
                const statusStyle = statusColorMap[unit.status || 'available'];

                return (
                  <div
                    key={unit.id}
                    style={{ left: `${unit.xPct}%`, top: `${unit.yPct}%` }}
                    className="-translate-x-1/2 -translate-y-1/2 absolute z-20"
                    onMouseEnter={() => setHoveredUnit(unit)}
                    onMouseLeave={() => setHoveredUnit(null)}
                  >
                    {/* Hotspot Button */}
                    <button
                      type="button"
                      onClick={() => handleUnitClick(unit)}
                      className={`group relative flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-xl ${
                        isSelected
                          ? 'bg-brand-navy-deep text-white scale-110 ring-2 ring-brand-gold border border-brand-gold shadow-[0_0_12px_rgba(1,69,242,0.5)]'
                          : isHovered
                          ? 'bg-brand-navy-deep text-white scale-110 ring-2 ring-[#0145F2] border border-[#0145F2] shadow-[0_0_14px_rgba(1,69,242,0.65)]'
                          : 'bg-brand-navy-deep/90 text-white/90 hover:scale-105 border border-white/30 backdrop-blur-md'
                      }`}
                      aria-label={`Select ${unit.unit_number}`}
                    >
                      {/* Pulsing Beacon Ring on Hover or Select */}
                      {(isSelected || isHovered) && (
                        <span
                          className={`absolute -inset-1 rounded-xl opacity-75 animate-ping pointer-events-none ${statusStyle.dot}`}
                        />
                      )}

                      {/* Status Dot */}
                      <span className={`w-2 h-2 rounded-full shrink-0 ${statusStyle.dot}`} />

                      {/* Unit Number & Area */}
                      <span className="font-mono text-xs">{unit.unit_number}</span>
                      {unit.area && (
                        <span className="text-[10px] opacity-75 font-mono tabular-nums">
                          ({unit.area}m²)
                        </span>
                      )}
                    </button>

                    {/* Hover Floating Unit Popover Card */}
                    <AnimatePresence>
                      {isHovered && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: -8, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute bottom-full left-1/2 -translate-x-1/2 z-30 mb-2 w-64 rounded-xl bg-brand-navy-deep/95 backdrop-blur-lg border border-brand-gold/50 p-3 shadow-2xl text-left pointer-events-none"
                        >
                          {/* Pointer Arrow */}
                          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-brand-navy-deep rotate-45 border-r border-b border-brand-gold/50" />

                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-xs font-bold text-white truncate">
                              {unit.unit_number}
                            </span>
                            <span
                              className={`text-[9.5px] px-2 py-0.5 rounded-full font-semibold border ${statusStyle.badge}`}
                            >
                              {unit.status}
                            </span>
                          </div>

                          <p className="text-[11px] text-white/80 line-clamp-1 mb-2 font-medium">
                            {unit.title || `${unit.beds || 3} Bedroom Residence`}
                          </p>

                          <div className="flex items-center justify-between text-[11px] text-white/70 pt-2 border-t border-white/10">
                            <span className="font-mono tabular-nums">
                              {unit.area || 173} m² · {unit.beds || 3} Beds
                            </span>
                            {unit.price && (
                              <span className="font-mono font-bold text-emerald-400 tabular-nums">
                                ${unit.price.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* CAD Compass Marker in bottom-right */}
        <div className="absolute bottom-3 right-3 pointer-events-none px-2.5 py-1 rounded-md bg-brand-navy-deep/80 border border-white/15 text-[10px] font-mono text-white/60 flex items-center gap-1.5">
          <Compass size={12} className="text-brand-gold-lt" />
          <span>TRUE NORTH ↑</span>
        </div>
      </div>

      {/* 3. Selected Unit Architectural Specifications & Detail Display */}
      <div className="p-4 sm:p-6 bg-brand-navy border-t border-white/10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Left: Unit Identity & Architectural Notes */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <span>{activeUnit.unit_number}</span>
                <span className="text-white/40">·</span>
                <span className="text-brand-gold-lt font-normal">
                  {activeUnit.title || `${activeUnit.beds || 3} Bed Residence`}
                </span>
              </span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                  statusColorMap[activeUnit.status || 'available'].badge
                }`}
              >
                {activeUnit.status}
              </span>
            </div>

            <p className="text-xs text-white/70 leading-relaxed max-w-3xl line-clamp-2">
              {activeUnit.description ||
                `${activeUnit.unit_number} features an open-concept living salon, separate formal guest room (Mehmankhana), master bedroom suite, double-glazed acoustic glazing, and panoramic terrace.`}
            </p>
          </div>

          {/* Center: Specs Grid */}
          <div className="flex items-center gap-4 sm:gap-6 shrink-0 py-2 px-4 rounded-xl bg-white/5 border border-white/10">
            {activeUnit.area && (
              <div className="text-center">
                <span className="text-[10px] text-white/50 block">Area</span>
                <span className="text-xs sm:text-sm font-mono font-bold text-white tabular-nums">
                  {activeUnit.area} m²
                </span>
              </div>
            )}
            {activeUnit.beds !== undefined && activeUnit.beds !== null && (
              <div className="text-center">
                <span className="text-[10px] text-white/50 block">Bedrooms</span>
                <span className="text-xs sm:text-sm font-mono font-bold text-white tabular-nums">
                  {activeUnit.beds} Beds
                </span>
              </div>
            )}
            {activeUnit.baths !== undefined && activeUnit.baths !== null && (
              <div className="text-center">
                <span className="text-[10px] text-white/50 block">Bathrooms</span>
                <span className="text-xs sm:text-sm font-mono font-bold text-white tabular-nums">
                  {activeUnit.baths} Baths
                </span>
              </div>
            )}
            {activeUnit.price && (
              <div className="text-center">
                <span className="text-[10px] text-white/50 block">Valuation</span>
                <span className="text-xs sm:text-sm font-mono font-bold text-emerald-400 tabular-nums">
                  ${activeUnit.price.toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Right: Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <a
              href={currentDisplayUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold border border-white/15 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <ExternalLink size={13} className="text-brand-gold-lt" />
              <span>Full Size</span>
            </a>

            <a
              href={`https://wa.me/93782222279?text=${encodeURIComponent(
                `Hello Attaie Properties, I am inquiring about ${propertyTitle} — ${activeUnit.unit_number} (${
                  activeUnit.area || 173
                } m²).`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <MessageCircle size={13} />
              <span>WhatsApp</span>
            </a>

            <button
              type="button"
              onClick={() => {
                if (onRequestVisit) {
                  onRequestVisit(activeUnit.unit_number);
                } else if (onClose) {
                  onClose();
                }
              }}
              className="px-4 py-2 rounded-xl bg-brand-gold hover:bg-brand-gold-dark text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Calendar size={13} />
              <span>Schedule Viewing</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (!isModal) {
    return content;
  }

  // Modal Wrapper
  return (
    <div
      className="fixed inset-0 z-[120] bg-brand-navy/85 backdrop-blur-md p-3 sm:p-6 flex items-center justify-center overflow-y-auto"
      role="presentation"
      onMouseDown={onClose}
    >
      <div onMouseDown={(e) => e.stopPropagation()} className="w-full max-w-5xl my-auto">
        {content}
      </div>
    </div>
  );
};

export default BlueprintViewer;
