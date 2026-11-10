import React, { useState, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, Sparkles, Layers, ChevronRight, Eye } from 'lucide-react';
import type { ExplorerProject, ExplorerFloor } from '../../../shared/visual-config';
import { toSvgPolygonPoints } from '../../lib/explorerGeometry';

export interface PhotoFloorSelectorProps {
  project: ExplorerProject;
  selectedFloorId: string | null;
  hoveredFloorId?: string | null;
  onSelectFloor: (floor: ExplorerFloor) => void;
  onHoverFloor?: (floor: ExplorerFloor | null) => void;
  className?: string;
}

export const PhotoFloorSelector: React.FC<PhotoFloorSelectorProps> = ({
  project,
  selectedFloorId,
  hoveredFloorId: externalHoveredFloorId,
  onSelectFloor,
  onHoverFloor,
  className = '',
}) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'fa';

  const [internalHoveredFloorId, setInternalHoveredFloorId] = useState<string | null>(null);
  const activeHoveredId = externalHoveredFloorId ?? internalHoveredFloorId;

  // Active highlighted floor is either hovered or selected
  const activeFloor = useMemo(() => {
    if (activeHoveredId) {
      return project.floors.find((f) => f.id === activeHoveredId) || null;
    }
    if (selectedFloorId) {
      return project.floors.find((f) => f.id === selectedFloorId) || null;
    }
    return null;
  }, [project.floors, activeHoveredId, selectedFloorId]);

  const handleMouseEnterFloor = (floor: ExplorerFloor) => {
    setInternalHoveredFloorId(floor.id);
    if (onHoverFloor) onHoverFloor(floor);
  };

  const handleMouseLeaveFloor = () => {
    setInternalHoveredFloorId(null);
    if (onHoverFloor) onHoverFloor(null);
  };

  return (
    <div className={`relative flex flex-col md:flex-row gap-6 items-stretch ${className}`}>
      {/* Left/Main Column: Exterior Building Photograph with Warm Window Lighting */}
      <div className="relative flex-1 rounded-2xl overflow-hidden bg-slate-950 border border-brand-navy/20 shadow-xl group select-none min-h-[460px] flex items-center justify-center">
        {/* Real Exterior Photograph */}
        <img
          src={project.exteriorImageUrl}
          alt={`${project.projectName} Exterior Elevation`}
          className="w-full h-full object-contain max-h-[640px] pointer-events-none"
          loading="eager"
        />

        {/* SVG Interactive Overlay Layer for Window Illumination & Hit Polygons */}
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full z-10"
        >
          <defs>
            {/* Realistic Warm Incandescent Window Light Glow Filter */}
            <filter id="architectural-window-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="1.8" result="blur" />
              <feColorMatrix
                type="matrix"
                values="
                  1 0 0 0 1.0
                  0 0.85 0 0 0.82
                  0 0 0.5 0 0.45
                  0 0 0 1 0"
                result="coloredBlur"
              />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Render illuminated light layers for hovered or selected floor */}
          {project.floors.map((floor) => {
            const isTarget = activeFloor?.id === floor.id;
            if (!isTarget || !floor.lightLayers) return null;

            return (
              <g key={`light-${floor.id}`} className="transition-opacity duration-300 pointer-events-none">
                {floor.lightLayers.map((layer) =>
                  layer.windowPolygons?.map((poly, polyIdx) => (
                    <polygon
                      key={`win-${floor.id}-${polyIdx}`}
                      points={toSvgPolygonPoints(poly, 100, 100)}
                      fill={layer.color || 'rgba(255, 218, 140, 0.76)'}
                      filter="url(#architectural-window-glow)"
                      className="animate-pulse"
                      style={{ animationDuration: '3.5s' }}
                    />
                  ))
                )}
              </g>
            );
          })}

          {/* Interactive Hit Regions for each floor */}
          {project.floors.map((floor) => {
            const isSelected = selectedFloorId === floor.id;
            const isHovered = activeHoveredId === floor.id;

            return (
              <g
                key={`hit-${floor.id}`}
                onClick={() => onSelectFloor(floor)}
                onMouseEnter={() => handleMouseEnterFloor(floor)}
                onMouseLeave={handleMouseLeaveFloor}
                className="cursor-pointer"
                role="button"
                tabIndex={0}
                aria-label={floor.label[isRtl ? 'fa' : 'en']}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectFloor(floor);
                  }
                }}
              >
                {floor.hitRegions.map((region, regIdx) => (
                  <polygon
                    key={`reg-${floor.id}-${regIdx}`}
                    points={toSvgPolygonPoints(region, 100, 100)}
                    fill={isSelected ? 'rgba(1, 69, 242, 0.18)' : isHovered ? 'rgba(255, 214, 138, 0.14)' : 'transparent'}
                    stroke={isSelected ? '#0145F2' : isHovered ? '#B8960C' : 'transparent'}
                    strokeWidth={isSelected ? '0.45' : isHovered ? '0.35' : '0'}
                    strokeDasharray={floor.kind === 'duplex' ? '1 0.5' : undefined}
                    className="transition-all duration-200"
                  />
                ))}
              </g>
            );
          })}
        </svg>

        {/* Floating Active Floor Info Pill */}
        {activeFloor && (
          <div className="absolute top-4 left-4 right-4 sm:right-auto z-20 pointer-events-none transition-all duration-300">
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-brand-gold/40 shadow-2xl text-white text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-gold animate-ping" />
              <div>
                <p className="font-bold text-sm text-brand-gold">
                  {activeFloor.label[isRtl ? 'fa' : 'en']}
                </p>
                <p className="text-white/80 text-[11px]">
                  {activeFloor.apartments.length}{' '}
                  {isRtl ? 'اپارتمان در این منزل موجود است' : 'apartments on this level'}
                  {activeFloor.kind === 'duplex' && (
                    <span className="mx-1.5 text-amber-300 font-semibold">
                      · {isRtl ? 'دوبلکس دو طبقه' : 'Two-Story Duplex'}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Helper Hint */}
        <div className="absolute bottom-3 inset-x-3 z-20 pointer-events-none flex items-center justify-between text-[11px] text-white/75 bg-slate-950/70 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/10">
          <span>{t('projects.photoElevationHint', 'Hover or tap any illuminated floor to explore floorplans')}</span>
          <span className="hidden sm:inline font-mono text-brand-gold">50/50 X-Ray Blueprint</span>
        </div>
      </div>

      {/* Right Column: Floor Directory List / Quick Select */}
      <div className="w-full md:w-72 flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-between px-1 pb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-navy/70">
            {t('projects.selectFloorLevel', 'Select Floor Level')}
          </span>
          <span className="text-[11px] text-gray-500 font-medium">
            {project.floors.length} {t('projects.levels', 'Levels')}
          </span>
        </div>

        <div className="flex flex-col gap-1.5 max-h-[580px] overflow-y-auto pr-1">
          {project.floors.map((floor) => {
            const isSelected = selectedFloorId === floor.id;
            const isHovered = activeHoveredId === floor.id;
            const availableCount = floor.apartments.filter((a) => a.status === 'available').length;

            return (
              <button
                key={floor.id}
                type="button"
                onClick={() => onSelectFloor(floor)}
                onMouseEnter={() => handleMouseEnterFloor(floor)}
                onMouseLeave={handleMouseLeaveFloor}
                className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-brand-gold text-white border-brand-gold shadow-md font-semibold'
                    : isHovered
                    ? 'bg-brand-navy/5 text-brand-navy border-brand-gold/60'
                    : 'bg-white text-gray-800 border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                      isSelected ? 'bg-white text-brand-navy' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {floor.floorNumbers.join('-')}
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold truncate leading-tight">
                      {floor.label[isRtl ? 'fa' : 'en']}
                    </p>
                    <p className={`text-[10px] truncate ${isSelected ? 'text-white/85' : 'text-gray-500'}`}>
                      {availableCount} {isRtl ? 'اپارتمان موجود' : 'Available'} · {floor.apartments.length}{' '}
                      {isRtl ? 'مجموع' : 'Total'}
                    </p>
                  </div>
                </div>

                <ChevronRight
                  className={`w-4 h-4 shrink-0 transition-transform ${
                    isRtl ? 'rotate-180' : ''
                  } ${isSelected ? 'text-white translate-x-0.5' : 'text-gray-400'}`}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PhotoFloorSelector;
