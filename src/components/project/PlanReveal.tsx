import React, { useState, useRef, useCallback, useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Columns2, Layers, MoveHorizontal, Check, Eye } from 'lucide-react';
import type { PlanPair } from '../../../shared/visual-config';

export interface PlanRevealProps {
  plan: PlanPair;
  aspectRatio?: string; // e.g. '16/10' or '4/3'
  initialPercent?: number; // 0 to 100, default 50
  children?: ReactNode; // Hotspots, apartment labels, and interactive overlays
  className?: string;
  onPercentChange?: (percent: number) => void;
  showMobileQuickToggles?: boolean;
}

export const PlanReveal: React.FC<PlanRevealProps> = ({
  plan,
  aspectRatio = '16/10',
  initialPercent = 50,
  children,
  className = '',
  onPercentChange,
  showMobileQuickToggles = true,
}) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'fa';

  const [percent, setPercent] = useState<number>(initialPercent);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);

  const updatePercent = useCallback(
    (newPct: number) => {
      const clamped = Math.max(0, Math.min(100, Math.round(newPct)));
      setPercent(clamped);
      if (onPercentChange) onPercentChange(clamped);
    },
    [onPercentChange]
  );

  const calculatePercentFromPointer = useCallback(
    (clientX: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const relativeX = clientX - rect.left;
      const pct = (relativeX / rect.width) * 100;
      updatePercent(isRtl ? 100 - pct : pct);
    },
    [isRtl, updatePercent]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragStartPos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStartPos.current) return;

    // 6px drag threshold to distinguish dragging from tapping/clicking
    const deltaX = Math.abs(e.clientX - dragStartPos.current.x);
    const deltaY = Math.abs(e.clientY - dragStartPos.current.y);

    if (!isDragging && deltaX > 6 && deltaX > deltaY) {
      setIsDragging(true);
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }

    if (isDragging) {
      calculatePercentFromPointer(e.clientX);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Safe catch
      }
    }
    dragStartPos.current = null;
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      updatePercent(percent + (isRtl ? 5 : -5));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      updatePercent(percent + (isRtl ? -5 : 5));
    } else if (e.key === 'Home') {
      e.preventDefault();
      updatePercent(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      updatePercent(100);
    }
  };

  // Quick Preset Actions
  const setPreset = (preset: '2d' | 'split' | 'furnished') => {
    if (preset === '2d') updatePercent(100);
    else if (preset === 'furnished') updatePercent(0);
    else updatePercent(50);
  };

  // The furnished plan is displayed underneath on the left;
  // The 2D technical plan is clipped from the right or vice versa.
  const clipInset = isRtl
    ? `inset(0 0 0 ${100 - percent}%)`
    : `inset(0 ${100 - percent}% 0 0)`;

  return (
    <div className={`relative flex flex-col ${className}`}>
      {/* Mobile & Desktop Quick Toggle Bar */}
      {showMobileQuickToggles && (
        <div className="flex items-center justify-between gap-2 px-3 py-2 bg-brand-navy/90 text-white rounded-t-2xl border border-brand-navy/20 text-xs">
          <div className="flex items-center gap-2">
            <Columns2 className="w-4 h-4 text-brand-gold shrink-0" />
            <span className="font-semibold text-white/90 hidden sm:inline">
              {t('projects.revealCompare', '2D Technical vs. 2D Furnished Reveal')}
            </span>
            <span className="font-semibold text-white/90 sm:hidden">
              {t('projects.revealShort', 'Plan Reveal')}
            </span>
          </div>

          <div className="flex items-center bg-white/10 p-0.5 rounded-lg border border-white/10">
            <button
              type="button"
              onClick={() => setPreset('2d')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                percent === 100
                  ? 'bg-brand-gold text-brand-navy font-bold shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/5'
              }`}
            >
              {t('projects.plan2dTechnical', '2D Technical')}
            </button>
            <button
              type="button"
              onClick={() => setPreset('split')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                percent > 0 && percent < 100
                  ? 'bg-brand-gold text-brand-navy font-bold shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/5'
              }`}
            >
              50/50
            </button>
            <button
              type="button"
              onClick={() => setPreset('furnished')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                percent === 0
                  ? 'bg-brand-gold text-brand-navy font-bold shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/5'
              }`}
            >
              {t('projects.planFurnished', 'Furnished 3D')}
            </button>
          </div>
        </div>
      )}

      {/* Main Image Comparison Stage */}
      <div
        ref={containerRef}
        tabIndex={0}
        role="slider"
        aria-label="2D Technical and Furnished plan reveal comparison slider"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ aspectRatio }}
        className={`relative w-full overflow-hidden bg-slate-950 select-none outline-none focus:ring-2 focus:ring-brand-gold ${
          showMobileQuickToggles ? 'rounded-b-2xl border-x border-b border-brand-navy/20' : 'rounded-2xl border border-brand-navy/20'
        }`}
      >
        {/* Layer 1: 2D Furnished Plan (Base layer) */}
        <div className="absolute inset-0 flex items-center justify-center p-2 bg-slate-950">
          <img
            src={plan.furnishedUrl}
            alt={plan.label?.en ? `${plan.label.en} (Furnished Layout)` : 'Furnished Floor Plan'}
            className="w-full h-full object-contain pointer-events-none"
            loading="lazy"
            draggable={false}
          />
        </div>

        {/* Layer 2: 2D Technical Blueprint (Clipped layer) */}
        <div
          style={{ clipPath: clipInset }}
          className="absolute inset-0 flex items-center justify-center p-2 bg-slate-950 transition-[clip-path] duration-75 ease-out will-change-[clip-path]"
        >
          <img
            src={plan.twoDUrl}
            alt={plan.label?.en ? `${plan.label.en} (Technical CAD Blueprint)` : 'Technical Blueprint Plan'}
            className="w-full h-full object-contain pointer-events-none filter contrast-[1.05]"
            loading="lazy"
            draggable={false}
          />
        </div>

        {/* Layer 3: Vertical Divider Line and Draggable Handle */}
        <div
          style={{
            left: isRtl ? undefined : `${percent}%`,
            right: isRtl ? `${percent}%` : undefined,
          }}
          className="absolute top-0 bottom-0 w-1 bg-brand-gold shadow-[0_0_12px_rgba(1,69,242,0.8)] pointer-events-none z-20 transition-[left,right] duration-75 ease-out"
        >
          {/* Draggable Thumb */}
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-brand-gold text-brand-navy shadow-lg flex items-center justify-center border-2 border-white cursor-ew-resize">
            <MoveHorizontal className="w-4 h-4" />
          </div>
        </div>

        {/* Badges showing which side is which */}
        <div className="absolute bottom-3 left-3 z-20 pointer-events-none">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-md text-white text-[11px] font-semibold border border-white/10 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-brand-gold" />
            {isRtl ? 'پلان فرنیچر شده' : '2D Technical Blueprint'}
          </span>
        </div>
        <div className="absolute bottom-3 right-3 z-20 pointer-events-none">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-md text-white text-[11px] font-semibold border border-white/10 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            {isRtl ? 'پلان تخنیکی و مهندسی' : '2D Furnished Layout'}
          </span>
        </div>

        {/* Layer 4: Interactive Hotspots, Apartment Labels & Polygons */}
        {children && <div className="absolute inset-0 z-30 pointer-events-auto">{children}</div>}
      </div>
    </div>
  );
};

export default PlanReveal;
