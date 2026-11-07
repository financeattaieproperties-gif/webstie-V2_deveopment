import React from 'react';
import { Navbar } from '../layout/Navbar';
import { Footer } from '../layout/Footer';
import { Skeleton } from './Skeleton';
import { PropertyGridSkeleton } from './PropertyCardSkeleton';
import { ProjectGridSkeleton, ProjectSpotlightSkeleton } from './ProjectCardSkeleton';

/**
 * Full-page skeleton for /properties route suspense fallback.
 * Preserves Navbar, Hero Search Header, Sticky Filter Bar, Sidebar, and Property Grid.
 */
export const PropertiesPageSkeleton = () => {
  return (
    <main className="min-h-screen bg-brand-ivory flex flex-col" role="status" aria-busy="true" aria-label="Loading properties page">
      <Navbar />

      {/* Navy Hero Header Skeleton */}
      <div className="relative bg-brand-navy pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 islamic-pattern" />
        <div className="container-custom relative z-10">
          <Skeleton className="h-4 w-36 rounded bg-white/15 mb-4" />
          <Skeleton className="h-3.5 w-44 rounded bg-brand-gold/40 mb-3" />
          <Skeleton className="h-10 md:h-12 w-72 md:w-96 rounded-lg bg-white/20 mb-6" />
          {/* SearchBar Skeleton */}
          <div className="w-full max-w-4xl rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <Skeleton className="h-11 w-44 rounded-xl bg-white/15" />
              <Skeleton className="h-11 flex-1 rounded-xl bg-white/15" />
              <Skeleton className="h-11 w-28 rounded-xl bg-brand-gold/50" />
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Sub-bar Skeleton */}
      <div className="bg-white/95 backdrop-blur-md border-b border-neutral-100 shadow-xs">
        <div className="container-custom flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="flex gap-2">
            <Skeleton className="h-9 w-44 rounded-lg bg-neutral-200" />
            <Skeleton className="h-9 w-40 rounded-lg bg-neutral-100" />
          </div>
          <div className="flex gap-1.5">
            <Skeleton className="h-8 w-24 rounded-lg bg-neutral-200" />
            <Skeleton className="h-8 w-24 rounded-lg bg-neutral-100" />
            <Skeleton className="h-8 w-24 rounded-lg bg-neutral-100" />
          </div>
        </div>
      </div>

      {/* Main Content Area: Filter Sidebar + Property Grid Skeleton */}
      <div className="container-custom py-12 flex-grow">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-72 shrink-0 hidden lg:block">
            <div className="bg-white rounded-2xl border border-brand-navy/8 p-6 space-y-6">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-24 rounded bg-neutral-200" />
                <Skeleton className="h-4 w-14 rounded bg-neutral-100" />
              </div>
              <div className="space-y-2.5 pt-4 border-t border-neutral-100">
                <Skeleton className="h-4 w-28 rounded bg-neutral-200 mb-3" />
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-9 w-full rounded-xl bg-neutral-100" />
                ))}
              </div>
              <div className="space-y-2.5 pt-4 border-t border-neutral-100">
                <Skeleton className="h-4 w-24 rounded bg-neutral-200 mb-3" />
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} className="h-9 rounded-lg bg-neutral-100" />
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 bg-brand-gold rounded-full" />
              <Skeleton className="h-7 w-48 rounded-lg bg-neutral-200" />
            </div>
            <PropertyGridSkeleton count={6} />
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
};

/**
 * Full-page skeleton for /projects route suspense fallback.
 * Preserves Navbar, Hero Header, Featured Development Spotlight, Filter Tabs, and Project Grid.
 */
export const ProjectsPageSkeleton = () => {
  return (
    <main className="min-h-screen bg-brand-cream flex flex-col" role="status" aria-busy="true" aria-label="Loading projects page">
      <Navbar />

      {/* Navy Hero Header Skeleton */}
      <section className="bg-brand-navy pt-36 pb-16 islamic-pattern relative overflow-hidden">
        <div className="container-custom relative z-10">
          <Skeleton className="h-4 w-32 rounded bg-white/15 mb-4" />
          <Skeleton className="h-3.5 w-40 rounded bg-brand-gold/40" />
          <Skeleton className="mt-3 h-10 md:h-12 w-80 md:w-[420px] rounded-lg bg-white/20" />
          <Skeleton className="mt-3 h-4 w-full max-w-xl rounded bg-white/15" />
          <Skeleton className="mt-2 h-4 w-3/4 max-w-md rounded bg-white/10" />
        </div>
      </section>

      {/* Featured Developments Spotlight Skeleton */}
      <section className="container-custom pt-12">
        <div className="mb-5">
          <Skeleton className="h-3.5 w-40 rounded bg-brand-gold/25 mb-2" />
          <Skeleton className="h-7 w-80 rounded-lg bg-neutral-200" />
        </div>
        <ProjectSpotlightSkeleton />
      </section>

      {/* Filter Bar + Project Cards Grid Skeleton */}
      <section className="container-custom py-14 flex-grow">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton
                key={i}
                className={`h-9 w-28 rounded-xl ${i === 1 ? 'bg-brand-navy/20' : 'bg-white border border-brand-navy/10'}`}
              />
            ))}
          </div>
          <Skeleton className="h-4 w-44 rounded bg-neutral-200" />
        </div>

        <ProjectGridSkeleton count={6} />
      </section>

      <Footer />
    </main>
  );
};

/**
 * Full-page skeleton for property/project detail pages and secondary pages.
 */
export const DetailPageSkeleton = () => {
  return (
    <main className="min-h-screen bg-brand-cream flex flex-col" role="status" aria-busy="true" aria-label="Loading details">
      <Navbar />
      <header className="bg-brand-navy pt-24 pb-4 border-b border-white/10">
        <div className="container-custom">
          <Skeleton className="h-4 w-48 rounded bg-white/15" />
        </div>
      </header>
      <Skeleton className="w-full h-[52vh] min-h-[380px] rounded-none bg-neutral-200" />
      <div className="container-custom pt-8 pb-16 flex-grow">
        <div className="flex flex-col lg:flex-row gap-12">
          <div className="flex-1 space-y-5">
            <div className="flex gap-2">
              <Skeleton className="h-6 w-24 rounded-full bg-neutral-200" />
              <Skeleton className="h-6 w-28 rounded-full bg-neutral-200" />
            </div>
            <Skeleton className="h-10 w-3/4 rounded-lg bg-neutral-200" />
            <Skeleton className="h-5 w-1/2 rounded bg-neutral-200/80" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-20 rounded-2xl bg-white border border-brand-navy/8" />
              ))}
            </div>
            <Skeleton className="h-48 w-full rounded-2xl bg-white border border-brand-navy/8" />
          </div>
          <div className="w-full lg:w-96 shrink-0">
            <Skeleton className="h-96 w-full rounded-2xl bg-white border border-brand-navy/8" />
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
};

/**
 * Structured page skeleton for general routes (About, Contact, Agents, Careers).
 */
export const GenericPageSkeleton = () => {
  return (
    <main className="min-h-screen bg-brand-cream flex flex-col" role="status" aria-busy="true" aria-label="Loading page">
      <Navbar />
      <section className="bg-brand-navy pt-36 pb-16 islamic-pattern">
        <div className="container-custom">
          <Skeleton className="h-4 w-32 rounded bg-white/15 mb-4" />
          <Skeleton className="h-10 md:h-12 w-72 md:w-96 rounded-lg bg-white/20 mb-3" />
          <Skeleton className="h-4 w-full max-w-lg rounded bg-white/15" />
        </div>
      </section>
      <section className="container-custom py-12 flex-grow">
        <PropertyGridSkeleton count={3} />
      </section>
      <Footer />
    </main>
  );
};
