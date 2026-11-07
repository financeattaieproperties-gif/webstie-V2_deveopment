import React from 'react';
import { Skeleton } from './Skeleton';

export const ProjectCardSkeleton = () => {
  return (
    <div
      aria-hidden="true"
      className="flex flex-col h-full bg-white rounded-2xl overflow-hidden border border-brand-navy/8 shadow-xs"
    >
      {/* Editorial Image Header matching 16:10 aspect ratio */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-brand-navy/5">
        <Skeleton className="w-full h-full rounded-none bg-neutral-200/80" />
        {/* Top-left status badge placeholder */}
        <div className="absolute top-3 left-3">
          <Skeleton className="h-6 w-24 rounded-full bg-white/75" />
        </div>
        {/* Bottom-left units available overlay placeholder */}
        <div className="absolute bottom-3 left-3">
          <Skeleton className="h-7 w-36 rounded-lg bg-white/75" />
        </div>
      </div>

      {/* Editorial Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <Skeleton className="h-3 w-32 mb-2 rounded bg-brand-gold/20" />
          <Skeleton className="h-6 w-3/4 mb-2 rounded-md bg-neutral-200" />
          <div className="flex items-center gap-1.5 mb-3">
            <Skeleton className="w-3.5 h-3.5 rounded-full shrink-0 bg-neutral-200" />
            <Skeleton className="h-4 w-1/2 rounded bg-neutral-200/80" />
          </div>

          {/* Description lines */}
          <div className="space-y-1.5 mb-4">
            <Skeleton className="h-3.5 w-full rounded bg-neutral-200/75" />
            <Skeleton className="h-3.5 w-4/5 rounded bg-neutral-200/75" />
          </div>

          {/* Inventory Availability bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <Skeleton className="h-3 w-28 rounded bg-neutral-200/80" />
              <Skeleton className="h-3 w-14 rounded bg-neutral-200" />
            </div>
            <Skeleton className="h-1.5 w-full rounded-full bg-neutral-200/80" />
          </div>
        </div>

        {/* Footer row */}
        <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
          <div className="flex items-center gap-2">
            <Skeleton className="w-3.5 h-3.5 rounded shrink-0 bg-neutral-200" />
            <Skeleton className="h-4 w-28 rounded bg-neutral-200/80" />
          </div>
          <Skeleton className="h-7 w-20 rounded-xl bg-brand-gold/15 shrink-0" />
        </div>
      </div>
    </div>
  );
};

export interface ProjectGridSkeletonProps {
  count?: number;
  className?: string;
}

export const ProjectGridSkeleton = ({
  count = 6,
  className = 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6',
}: ProjectGridSkeletonProps) => {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading projects"
      className={className}
    >
      {Array.from({ length: count }).map((_, idx) => (
        <ProjectCardSkeleton key={idx} />
      ))}
    </div>
  );
};

export const ProjectSpotlightSkeleton = () => {
  return (
    <div
      aria-hidden="true"
      className="rounded-2xl overflow-hidden shadow-brand-lg bg-brand-navy text-white grid grid-cols-1 lg:grid-cols-12 min-h-[340px] md:min-h-[380px]"
    >
      <div className="lg:col-span-6 p-8 md:p-12 flex flex-col justify-between">
        <div>
          <Skeleton className="h-6 w-28 rounded-lg bg-white/15 mb-4" />
          <Skeleton className="h-8 md:h-9 w-3/4 rounded-lg bg-white/20 mb-3" />
          <Skeleton className="h-4 w-1/2 rounded bg-white/15 mb-5" />
          <div className="space-y-2 mb-6">
            <Skeleton className="h-3.5 w-full rounded bg-white/10" />
            <Skeleton className="h-3.5 w-11/12 rounded bg-white/10" />
            <Skeleton className="h-3.5 w-2/3 rounded bg-white/10" />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-5 border-t border-white/15">
          <div className="flex items-center gap-5">
            <Skeleton className="h-4 w-24 rounded bg-white/15" />
            <Skeleton className="h-4 w-28 rounded bg-white/15" />
          </div>
          <Skeleton className="h-10 w-40 rounded-xl bg-white/20" />
        </div>
      </div>

      <div className="lg:col-span-6 relative min-h-[240px]">
        <Skeleton className="w-full h-full rounded-none bg-white/10" />
      </div>
    </div>
  );
};
