import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bed, Bath, Maximize2, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';
import type { ExplorerFloor, ApartmentPlacement } from '../../../shared/visual-config';
import { PlanReveal } from './PlanReveal';
import { toSvgPolygonPoints } from '../../lib/explorerGeometry';

export interface FloorPlanSelectorProps {
  floor: ExplorerFloor;
  selectedApartmentId: string | null;
  onSelectApartment: (apartment: ApartmentPlacement) => void;
  revealPercent?: number;
  onRevealPercentChange?: (pct: number) => void;
  className?: string;
}

export const FloorPlanSelector: React.FC<FloorPlanSelectorProps> = ({
  floor,
  selectedApartmentId,
  onSelectApartment,
  revealPercent = 50,
  onRevealPercentChange,
  className = '',
}) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'fa';
  const [hoveredUnitId, setHoveredUnitId] = useState<string | null>(null);

  const hoveredUnit = floor.apartments.find((a) => a.id === hoveredUnitId) || null;

  const sortedApartments = [...floor.apartments].sort((a, b) => {
    if (a.id === hoveredUnitId) return 1;
    if (b.id === hoveredUnitId) return -1;
    if (a.id === selectedApartmentId) return 1;
    if (b.id === selectedApartmentId) return -1;
    return 0;
  });

  return (
    <div className={`relative flex flex-col gap-5 ${className}`}>
      {/* Plan Reveal Stage with Interactive Apartment Polygons Overlay */}
      <PlanReveal
        plan={floor.masterplan}
        aspectRatio="16/10"
        initialPercent={revealPercent}
        onPercentChange={onRevealPercentChange}
      >
        {/* SVG Interactive Overlay for Apartment Units */}
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full pointer-events-auto"
        >
          <defs>
            {/* Subtle Blue Glow Highlight Filter for Unit Outline */}
            <filter id="unit-outline-blue-glow" x="-25%" y="-25%" width="150%" height="150%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="0.65" result="blur" />
              <feColorMatrix
                type="matrix"
                values="
                  0 0 0 0 0.004
                  0 0 0 0 0.27
                  0 0 0 0 0.95
                  0 0 0 0.85 0"
                result="coloredBlur"
              />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {sortedApartments.map((unit) => {
            const isSelected = selectedApartmentId === unit.id;
            const isHovered = hoveredUnitId === unit.id;

            // Subtle blue glow highlight when mouse pointer is positioned over the unit
            const fillColor = isSelected
              ? 'rgba(1, 69, 242, 0.30)'
              : isHovered
              ? 'rgba(1, 69, 242, 0.18)'
              : 'rgba(255, 255, 255, 0.04)';

            const strokeColor = isSelected
              ? '#0145F2'
              : isHovered
              ? '#0145F2'
              : 'rgba(255, 255, 255, 0.35)';

            return (
              <polygon
                key={`unit-poly-${unit.id}`}
                points={toSvgPolygonPoints(unit.polygon, 100, 100)}
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth={isSelected ? '0.85' : isHovered ? '0.75' : '0.25'}
                filter={isHovered || isSelected ? 'url(#unit-outline-blue-glow)' : undefined}
                className="cursor-pointer transition-all duration-200"
                style={{
                  vectorEffect: 'non-scaling-stroke',
                }}
                onClick={() => onSelectApartment(unit)}
                onMouseEnter={() => setHoveredUnitId(unit.id)}
                onMouseLeave={() => setHoveredUnitId(null)}
                role="button"
                tabIndex={0}
                aria-label={`${unit.unitNumber} (${unit.areaSqm} m²)`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectApartment(unit);
                  }
                }}
              />
            );
          })}
        </svg>

        {/* Floating Unit Anchors & Name Pills on the Masterplan */}
        <div className="absolute inset-0 pointer-events-none">
          {floor.apartments.map((unit) => {
            const isHovered = hoveredUnitId === unit.id;
            const isSelected = selectedApartmentId === unit.id;

            return (
              <div
                key={`anchor-${unit.id}`}
                style={{
                  left: `${unit.labelAnchor.x * 100}%`,
                  top: `${unit.labelAnchor.y * 100}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                className="absolute z-20 pointer-events-auto"
              >
                <button
                  type="button"
                  onClick={() => onSelectApartment(unit)}
                  onMouseEnter={() => setHoveredUnitId(unit.id)}
                  onMouseLeave={() => setHoveredUnitId(null)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all shadow-lg border backdrop-blur-md cursor-pointer ${
                    isSelected
                      ? 'bg-brand-gold text-white border-white scale-110 shadow-[0_0_14px_rgba(1,69,242,0.6)]'
                      : isHovered
                      ? 'bg-white text-[#0145F2] border-[#0145F2] scale-105 ring-2 ring-[#0145F2]/40 shadow-[0_0_12px_rgba(1,69,242,0.5)]'
                      : 'bg-slate-900/85 text-white/90 border-white/20 hover:bg-slate-900'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      unit.status === 'available'
                        ? 'bg-green-400'
                        : unit.status === 'reserved'
                        ? 'bg-amber-400'
                        : 'bg-red-400'
                    }`}
                  />
                  <span>{unit.unitNumber}</span>
                  <span className="text-[10px] text-white/75 font-normal">
                    {unit.areaSqm} m²
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </PlanReveal>

      {/* Apartment Quick Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {floor.apartments.map((unit) => {
          const isSelected = selectedApartmentId === unit.id;
          const isHovered = hoveredUnitId === unit.id;

          return (
            <div
              key={`card-${unit.id}`}
              onClick={() => onSelectApartment(unit)}
              onMouseEnter={() => setHoveredUnitId(unit.id)}
              onMouseLeave={() => setHoveredUnitId(null)}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-brand-navy text-white border-brand-gold shadow-lg'
                  : isHovered
                  ? 'bg-brand-ivory/60 border-brand-gold text-brand-navy'
                  : 'bg-white border-gray-200 text-gray-800 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-bold text-sm text-brand-gold">
                  {unit.unitNumber}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                    unit.status === 'available'
                      ? 'bg-green-100 text-green-700'
                      : unit.status === 'reserved'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {unit.status}
                </span>
              </div>

              <p className="text-xs font-medium mb-3 line-clamp-1">
                {unit.title?.[isRtl ? 'fa' : 'en'] || unit.unitNumber}
              </p>

              <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                <span className="flex items-center gap-1">
                  <Maximize2 className="w-3.5 h-3.5 text-brand-gold" />
                  {unit.areaSqm} m²
                </span>
                <span className="flex items-center gap-1">
                  <Bed className="w-3.5 h-3.5 text-brand-gold" />
                  {unit.beds} {t('properties.beds', 'Beds')}
                </span>
                <span className="flex items-center gap-1">
                  <Bath className="w-3.5 h-3.5 text-brand-gold" />
                  {unit.baths} {t('properties.baths', 'Baths')}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100/60">
                <span className="font-bold text-sm">
                  {unit.priceUsd ? `$${unit.priceUsd.toLocaleString()}` : t('property.priceOnRequest', 'Price on Request')}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-gold">
                  {t('projects.viewApartmentPlan', 'View Plan')}
                  <ChevronRight className={`w-3.5 h-3.5 ${isRtl ? 'rotate-180' : ''}`} />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FloorPlanSelector;
