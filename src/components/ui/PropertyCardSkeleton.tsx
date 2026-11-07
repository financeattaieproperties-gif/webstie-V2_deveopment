import React from 'react';
import { Skeleton } from './Skeleton';

export const PropertyCardSkeleton = () => {
  return (
    <div
      aria-hidden="true"
      className="flex flex-col h-full bg-white/90 backdrop-blur-md rounded-2xl overflow-hidden border border-brand-navy/8 shadow-xs"
    >
      {/* Image Header Skeleton matching 4:3 aspect ratio */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-brand-navy/5">
        <Skeleton className="w-full h-full rounded-none bg-neutral-200/80" />
        {/* Top-left listing type tag placeholder */}
        <div className="absolute top-3 left-3">
          <Skeleton className="h-7 w-20 rounded-xl bg-white/70" />
        </div>
        {/* Top-right status badge & heart button placeholders */}
        <div className="absolute top-3 right-12">
          <Skeleton className="h-6 w-20 rounded-full bg-white/70" />
        </div>
        <div className="absolute top-3 right-3">
          <Skeleton className="w-8 h-8 rounded-full bg-white/70" />
        </div>
        {/* Bottom-left price placeholder */}
        <div className="absolute bottom-3 left-3">
          <Skeleton className="h-7 w-28 rounded-lg bg-white/75" />
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <Skeleton className="h-4 w-20 rounded bg-neutral-200" />
            <Skeleton className="h-4 w-24 rounded bg-neutral-200/80" />
          </div>
          <Skeleton className="h-6 w-4/5 mt-1 mb-2 rounded-md bg-neutral-200" />
          <div className="flex items-center gap-1.5 mb-4">
            <Skeleton className="w-3.5 h-3.5 rounded-full shrink-0 bg-neutral-200" />
            <Skeleton className="h-4 w-3/5 rounded bg-neutral-200/80" />
          </div>
        </div>

        <div className="space-y-4">
          {/* Feature icons row */}
          <div className="grid grid-cols-2 sm:flex sm:items-center sm:flex-wrap gap-2.5 pt-4 border-t border-neutral-100">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <Skeleton className="w-7 h-7 rounded-lg shrink-0 bg-brand-gold/10" />
                <Skeleton className="h-3.5 w-11 rounded bg-neutral-200/90" />
              </div>
            ))}
          </div>

          {/* View Details footer bar */}
          <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
            <Skeleton className="h-4 w-24 rounded bg-neutral-200/80" />
          </div>
        </div>
      </div>
    </div>
  );
};

export interface PropertyGridSkeletonProps {
  count?: number;
  className?: string;
}

export const PropertyGridSkeleton = ({
  count = 6,
  className = 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6',
}: PropertyGridSkeletonProps) => {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading properties"
      className={className}
    >
      {Array.from({ length: count }).map((_, idx) => (
        <PropertyCardSkeleton key={idx} />
      ))}
    </div>
  );
};

