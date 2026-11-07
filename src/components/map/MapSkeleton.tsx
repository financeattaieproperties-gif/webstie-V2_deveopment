import React from 'react';
import { MapPin } from 'lucide-react';

export interface MapSkeletonProps {
  heightClass?: string;
  label?: string;
}

export function MapSkeleton({
  heightClass = 'h-[500px]',
  label = 'Loading Interactive Map…',
}: MapSkeletonProps) {
  return (
    <div
      className={`w-full ${heightClass} rounded-2xl bg-neutral-100 border border-brand-navy/10 relative overflow-hidden flex flex-col items-center justify-center p-6 text-center select-none`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-100 via-neutral-200/50 to-neutral-100 animate-pulse" />
      <div className="relative z-10 flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-brand-gold/15 text-brand-gold flex items-center justify-center shadow-xs">
          <MapPin size={24} className="animate-bounce" />
        </div>
        <p className="text-xs font-bold uppercase tracking-wider text-brand-navy">{label}</p>
        <div className="w-24 h-1 bg-brand-gold/30 rounded-full overflow-hidden">
          <div className="w-full h-full bg-brand-gold animate-[pulse_1.2s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  );
}
