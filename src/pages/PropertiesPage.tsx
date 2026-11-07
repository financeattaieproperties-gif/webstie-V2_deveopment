import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import gsap from 'gsap';
import { SlidersHorizontal, Bed, Bath, Maximize2, Layers, MapPin, Building2, Eye, LayoutGrid, Map as MapIcon, Columns2, X, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { SearchBar } from '../components/forms/SearchBar';
import { FilterSidebar, FilterState } from '../components/property/FilterSidebar';
import { PropertyCard } from '../components/ui/PropertyCard';
import { ProjectCard } from '../components/ui/ProjectCard';
import { PropertyCardSkeleton } from '../components/ui/PropertyCardSkeleton';
import { ProjectCardSkeleton } from '../components/ui/ProjectCardSkeleton';
import { PropertiesPageSkeleton } from '../components/ui/PageGridSkeletons';
import { Skeleton } from '../components/ui/Skeleton';
import { ApartmentFullInfoModal } from '../components/project/ProjectUnitsSection';
import type { MapPropertyItem } from '../components/map/AttaieGoogleMap';
import { MapSkeleton } from '../components/map/MapSkeleton';

const AttaieGoogleMap = lazy(() =>
  import('../components/map/AttaieGoogleMap').then((m) => ({ default: m.AttaieGoogleMap }))
);
import {
  getProperties,
  getProjects,
  getAllProjectUnits,
  type Property,
  type Project,
  type ProjectUnit,
} from '../lib/dbService';
import { SeoHead } from '../components/seo/SeoHead';
import { buildPropertiesListingSeo } from '../lib/seoConfig';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';

const defaultFilters: FilterState = {
  purpose: 'buy',
  type: [],
  minPrice: 0,
  maxPrice: 2000000,
  minArea: 0,
  maxArea: 1000,
  beds: [],
  baths: [],
  status: [],
};

function ProjectUnitInventoryCard({
  unit,
}: {
  unit: ProjectUnit;
}) {
  const { t } = useTranslation();
  const [selectedUnitOpen, setSelectedUnitOpen] = useState(false);
  const projectLabel = unit.project_name || `Project #${unit.project_id}`;
  const unitTitle = unit.title || `${projectLabel} — ${t('projectUnits.unitPrefix', { number: unit.unit_number })}`;

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setSelectedUnitOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setSelectedUnitOpen(true);
          }
        }}
        className="group bg-white rounded-2xl overflow-hidden border border-brand-navy/8 hover:border-brand-gold/60 shadow-brand-sm hover:shadow-brand-lg transition-all duration-300 flex flex-col h-full cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-brand-gold"
      >
        <div className="relative block aspect-[16/10] overflow-hidden bg-brand-navy">
          {unit.image_url ? (
            <img
              src={unit.image_url}
              alt={`${projectLabel} — ${unit.unit_number}`}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/40 text-sm">
              <Building2 size={36} />
            </div>
          )}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-brand-navy/90 text-white backdrop-blur-xs">
              {t('projectUnits.projectApartmentBadge')}
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold capitalize bg-brand-gold text-white">
              {unit.status}
            </span>
          </div>
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
            <span className="text-xs font-bold bg-black/50 backdrop-blur-xs px-2.5 py-1 rounded-lg">
              {projectLabel} · {t('projectUnits.unitPrefix', { number: unit.unit_number })}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-brand-navy shadow-xs">
              <Eye size={12} className="text-brand-gold" />
              Full Info
            </span>
          </div>
        </div>

        <div className="p-5 flex-1 flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold text-brand-gold uppercase tracking-wider mb-1">
              {projectLabel}
            </p>
            <h3 className="text-lg font-bold text-brand-navy line-clamp-1 group-hover:text-brand-gold transition-colors">
              {unitTitle}
            </h3>
            {unit.project_location && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-neutral-500">
                <MapPin size={13} className="text-brand-gold shrink-0" />
                <span className="truncate">{unit.project_location}</span>
              </p>
            )}

            <div
              aria-label="Apartment features"
              className="mt-4 grid grid-cols-2 sm:flex sm:items-center sm:flex-wrap gap-2.5 text-xs font-semibold text-neutral-600 pt-3 border-t border-neutral-100"
            >
              {unit.beds !== null && (
                <div className="flex items-center gap-2" title={t('projectUnits.beds', { count: unit.beds })}>
                  <span className="w-7 h-7 rounded-lg bg-brand-gold/10 text-brand-gold flex items-center justify-center shrink-0">
                    <Bed size={14} aria-hidden="true" />
                  </span>
                  <span>{t('projectUnits.beds', { count: unit.beds })}</span>
                </div>
              )}
              {unit.baths !== null && (
                <div className="flex items-center gap-2" title={t('projectUnits.baths', { count: unit.baths })}>
                  <span className="w-7 h-7 rounded-lg bg-brand-gold/10 text-brand-gold flex items-center justify-center shrink-0">
                    <Bath size={14} aria-hidden="true" />
                  </span>
                  <span>{t('projectUnits.baths', { count: unit.baths })}</span>
                </div>
              )}
              {unit.area !== null && (
                <div className="flex items-center gap-2" title={`${unit.area} m²`}>
                  <span className="w-7 h-7 rounded-lg bg-brand-gold/10 text-brand-gold flex items-center justify-center shrink-0">
                    <Maximize2 size={13} aria-hidden="true" />
                  </span>
                  <span>{unit.area} m²</span>
                </div>
              )}
              {unit.floor !== null && (
                <div className="flex items-center gap-2" title={t('projectUnits.floor', { floor: unit.floor })}>
                  <span className="w-7 h-7 rounded-lg bg-brand-gold/10 text-brand-gold flex items-center justify-center shrink-0">
                    <Layers size={13} aria-hidden="true" />
                  </span>
                  <span>{t('projectUnits.floor', { floor: unit.floor })}</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-neutral-100 flex items-center justify-between gap-2 flex-wrap">
            <div>
              {unit.price !== null ? (
                <p className="text-lg font-bold text-brand-gold">
                  ${Number(unit.price).toLocaleString()}
                </p>
              ) : (
                <p className="text-sm font-semibold text-neutral-500">Price on request</p>
              )}
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-gold group-hover:translate-x-0.5 transition-transform">
              Open Full Apartment Info →
            </span>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedUnitOpen && (
          <ApartmentFullInfoModal
            unit={unit}
            projectName={projectLabel}
            onClose={() => setSelectedUnitOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function PropertiesContent() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get('category') || 'individual';
  const isProjects = category === 'projects';

  const initialPurposeParam = searchParams.get('purpose');
  const initialPurpose: FilterState['purpose'] =
    initialPurposeParam === 'rent' || initialPurposeParam === 'commercial' ? initialPurposeParam : 'buy';
  const initialTypeParam = searchParams.get('type');
  const initialBedsParam = searchParams.get('beds');
  const initialMaxPriceParam = Number(searchParams.get('maxPrice') || 0);

  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [allProjectUnits, setAllProjectUnits] = useState<ProjectUnit[]>([]);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [filters, setFilters] = useState<FilterState>(() => ({
    ...defaultFilters,
    purpose: initialPurpose,
    type: initialTypeParam ? [initialTypeParam] : [],
    beds: initialBedsParam ? [initialBedsParam === '6+' ? '5+' : initialBedsParam] : [],
    maxPrice: initialMaxPriceParam > 0 ? initialMaxPriceParam : defaultFilters.maxPrice,
  }));
  const [searchQuery, setSearchQuery] = useState(
    () => searchParams.get('search') ?? searchParams.get('serial_number') ?? ''
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'split' | 'map'>(() => {
    const viewParam = searchParams.get('view');
    return viewParam === 'map' || viewParam === 'split' ? viewParam : 'grid';
  });
  const heroHeaderRef = useRef<HTMLDivElement>(null);

  const handleViewModeChange = useCallback(
    (nextMode: 'grid' | 'split' | 'map') => {
      setViewMode(nextMode);
      const nextParams = new URLSearchParams(searchParams);
      if (nextMode === 'grid') {
        nextParams.delete('view');
      } else {
        nextParams.set('view', nextMode);
      }
      setSearchParams(nextParams, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  // Minimal GSAP header entrance
  useEffect(() => {
    if (!heroHeaderRef.current) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        heroHeaderRef.current,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.55, ease: 'power2.out' }
      );
    }, heroHeaderRef);
    return () => ctx.revert();
  }, []);

  const loadData = useCallback(() => {
    setLoading(true);
    setError(null);
    if (isProjects) {
      getProjects()
        .then((data) => setAllProjects(data))
        .catch(() => setError('Failed to load. Please try again.'))
        .finally(() => setLoading(false));
    } else {
      Promise.all([getProperties(), getAllProjectUnits()])
        .then(([propsData, unitsResp]) => {
          setAllProperties(propsData);
          setAllProjectUnits(unitsResp.items);
        })
        .catch(() => setError('Failed to load. Please try again.'))
        .finally(() => setLoading(false));
    }
  }, [isProjects]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Sync when URL search params change externally (e.g. from Navbar or Hero search)
  useEffect(() => {
    const urlTerm = searchParams.get('search') ?? searchParams.get('serial_number') ?? '';
    setSearchQuery(urlTerm);
    const urlPurpose = searchParams.get('purpose');
    if (urlPurpose === 'buy' || urlPurpose === 'rent' || urlPurpose === 'commercial') {
      setFilters((prev) => ({ ...prev, purpose: urlPurpose }));
    }
  }, [searchParams]);

  const handleSearchChange = (nextQuery: string) => {
    setSearchQuery(nextQuery);
    const nextParams = new URLSearchParams(searchParams);
    if (nextQuery.trim()) {
      nextParams.set('search', nextQuery.trim());
    } else {
      nextParams.delete('search');
      nextParams.delete('serial_number');
    }
    setSearchParams(nextParams, { replace: true });
  };

  const handlePurposeChange = (purpose: FilterState['purpose']) => {
    setFilters((prev) => ({
      ...prev,
      purpose,
      type: purpose === 'commercial' && !prev.type.includes('Commercial') ? ['Commercial'] : prev.type,
    }));
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();

  // Real-time filtered standalone properties (matches title, location, or serial_number + sidebar filters)
  const properties = allProperties.filter((p) => {
    if (normalizedQuery) {
      const matchesTitle = p.title.toLowerCase().includes(normalizedQuery);
      const matchesLocation = p.location.toLowerCase().includes(normalizedQuery);
      const matchesSerial = (p.serial_number ?? '').toLowerCase().includes(normalizedQuery);
      if (!matchesTitle && !matchesLocation && !matchesSerial) {
        return false;
      }
    }

    if (filters.type.length > 0 && !filters.type.includes(p.type)) {
      return false;
    }

    if (filters.purpose === 'rent' && p.listing_type !== 'rent') {
      return false;
    }
    if (filters.purpose === 'commercial' && p.type !== 'Commercial') {
      return false;
    }
    if (filters.purpose === 'buy' && filters.status.length > 0 && p.listing_type !== 'sale') {
      return false;
    }

    if (p.price < filters.minPrice || p.price > filters.maxPrice) {
      return false;
    }

    if (p.area !== null && (p.area < filters.minArea || p.area > filters.maxArea)) {
      return false;
    }

    if (filters.beds.length > 0) {
      if (p.beds === null || p.beds === undefined) return false;
      const bedMatch = filters.beds.some((b) =>
        b === 'Studio' ? p.beds === 0 : b === '5+' ? (p.beds ?? 0) >= 5 : p.beds === Number(b)
      );
      if (!bedMatch) return false;
    }

    if (filters.baths.length > 0) {
      if (p.baths === null || p.baths === undefined) return false;
      const bathMatch = filters.baths.some((b) =>
        b === '4+' ? (p.baths ?? 0) >= 4 : p.baths === Number(b)
      );
      if (!bathMatch) return false;
    }

    if (filters.status.length > 0 && !filters.status.includes(p.status)) {
      return false;
    }

    return true;
  });

  // Real-time filtered project units (matches unit_number, title, project_name, or project_location + sidebar filters)
  const projectUnits = allProjectUnits.filter((u) => {
    if (normalizedQuery) {
      const matchesUnitNumber = u.unit_number.toLowerCase().includes(normalizedQuery);
      const matchesTitle = (u.title ?? '').toLowerCase().includes(normalizedQuery);
      const matchesProjectName = (u.project_name ?? '').toLowerCase().includes(normalizedQuery);
      const matchesLocation = (u.project_location ?? '').toLowerCase().includes(normalizedQuery);
      if (!matchesUnitNumber && !matchesTitle && !matchesProjectName && !matchesLocation) {
        return false;
      }
    }

    if (filters.type.length > 0 && !filters.type.includes('Apartment')) {
      return false;
    }
    if (filters.purpose === 'rent' || filters.purpose === 'commercial') {
      return false;
    }
    if (u.price !== null && (u.price < filters.minPrice || u.price > filters.maxPrice)) {
      return false;
    }
    if (u.area !== null && (u.area < filters.minArea || u.area > filters.maxArea)) {
      return false;
    }
    if (filters.beds.length > 0) {
      if (u.beds === null) return false;
      const bedMatch = filters.beds.some((b) =>
        b === 'Studio' ? u.beds === 0 : b === '5+' ? (u.beds ?? 0) >= 5 : u.beds === Number(b)
      );
      if (!bedMatch) return false;
    }
    if (filters.baths.length > 0) {
      if (u.baths === null) return false;
      const bathMatch = filters.baths.some((b) =>
        b === '4+' ? (u.baths ?? 0) >= 4 : u.baths === Number(b)
      );
      if (!bathMatch) return false;
    }
    if (filters.status.length > 0) {
      const mappedStatus = u.status === 'reserved' ? 'pending' : u.status;
      if (!filters.status.includes(mappedStatus)) return false;
    }

    return true;
  });

  // Real-time filtered projects when viewing projects tab
  const projects = allProjects.filter((proj) => {
    if (!normalizedQuery) return true;
    return (
      proj.name.toLowerCase().includes(normalizedQuery) ||
      proj.location.toLowerCase().includes(normalizedQuery)
    );
  });

  const mapItems: MapPropertyItem[] = useMemo(() => {
    if (isProjects) {
      return projects
        .filter((proj) => proj.status !== 'Sold Out')
        .map((proj) => ({
          id: `proj-${proj.id}`,
          title: proj.name,
          locationQuery: proj.location || 'Wazir Akbar Khan, Kabul',
          priceDisplay:
            proj.available_units !== undefined ? `${proj.available_units} Units Available` : undefined,
          type: 'Signature Project',
          status: proj.status,
          imageUrl: proj.image_url,
          href: `/projects/${proj.id}`,
        }));
    }

    const availableProperties =
      filters.status.length > 0
        ? properties
        : properties.filter((p) => p.status === 'available');

    const propItems: MapPropertyItem[] = availableProperties.map((p) => ({
      id: `prop-${p.id}`,
      title: p.title,
      locationQuery: p.location || 'Kabul, Afghanistan',
      priceDisplay:
        p.listing_type === 'rent' ? `$${p.price.toLocaleString()} / mo` : `$${p.price.toLocaleString()}`,
      type: p.type,
      status: p.status,
      beds: p.beds,
      baths: p.baths,
      area: p.area,
      imageUrl: p.image_url,
      href: `/properties/${p.id}`,
    }));

    const availableUnits =
      filters.status.length > 0
        ? projectUnits
        : projectUnits.filter((u) => u.status === 'available');

    const unitItems: MapPropertyItem[] = availableUnits.map((u) => ({
      id: `unit-${u.id}`,
      title: u.title || `${u.project_name || 'Project'} — Unit ${u.unit_number}`,
      locationQuery: u.project_location || 'Wazir Akbar Khan, Kabul',
      priceDisplay: u.price !== null ? `$${Number(u.price).toLocaleString()}` : 'Price on request',
      type: 'Project Apartment',
      status: u.status,
      beds: u.beds,
      baths: u.baths,
      area: u.area,
      imageUrl: u.image_url,
      href: `/projects/${u.project_id}#unit-${u.id}`,
    }));

    return [...propItems, ...unitItems];
  }, [isProjects, projects, properties, projectUnits, filters.status]);

  const totalInventoryCount = properties.length + projectUnits.length;
  const seo = buildPropertiesListingSeo({ isProjects, search: searchQuery.trim() });

  return (
    <main className="min-h-screen bg-brand-ivory flex flex-col">
      <SeoHead
        seo={searchQuery.trim() || isProjects ? seo : undefined}
        context={{
          purpose: filters.purpose,
          propertyTypes: filters.type,
        }}
      />
      <Navbar />

      <div className="relative bg-brand-navy pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 islamic-pattern" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand-gold/40 to-transparent" />
        <div ref={heroHeaderRef} className="container-custom relative z-10">
          <Breadcrumbs
            variant="light"
            items={[
              {
                label: isProjects
                  ? t('nav.projects', 'Signature Projects')
                  : t('nav.properties', 'Properties'),
              },
            ]}
            className="mb-4"
          />
          <p className="text-brand-gold text-xs font-bold uppercase tracking-[0.3em] mb-3 flex items-center gap-3">
            <span className="inline-block w-8 h-[1px] bg-brand-gold/50" />
            Kabul, Afghanistan
          </p>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
            {isProjects ? 'Signature Projects' : 'Browse Properties'}
          </h1>
          <SearchBar
            value={searchQuery}
            onChange={handleSearchChange}
            purpose={filters.purpose}
            onPurposeChange={handlePurposeChange}
          />
        </div>
      </div>

      {/* Tab bar with sliding active indicator */}
      <div className="bg-white/95 backdrop-blur-md border-b border-neutral-100 sticky top-0 z-40 shadow-sm">
        <div className="container-custom flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="flex gap-1">
            {[
              { label: 'Individual Properties', href: '/properties?category=individual', active: !isProjects },
              { label: 'Signature Projects', href: '/projects', active: isProjects },
            ].map((tab) => (
              <a
                key={tab.label}
                href={tab.href}
                className={`relative px-5 py-2 rounded-lg text-sm font-bold transition-colors duration-200 ${
                  tab.active ? 'text-white' : 'text-neutral-500 hover:text-brand-navy hover:bg-neutral-100'
                }`}
              >
                {tab.active && (
                  <motion.span
                    layoutId="tab-bg"
                    className="absolute inset-0 bg-brand-navy rounded-lg"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </a>
            ))}
          </div>

          {/* Grid / Split / Interactive Map Toggle */}
          <div
            role="group"
            aria-label="Switch between Grid and Map views"
            className="inline-flex items-center gap-1 rounded-xl bg-neutral-100 p-1 border border-brand-navy/10"
          >
            {[
              { id: 'grid' as const, label: 'Grid View', icon: LayoutGrid },
              { id: 'split' as const, label: 'Split View', icon: Columns2 },
              { id: 'map' as const, label: 'Map View', icon: MapIcon, count: mapItems.length },
            ].map((opt) => {
              const Icon = opt.icon;
              const active = viewMode === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => handleViewModeChange(opt.id)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    active
                      ? 'bg-brand-navy text-white shadow-xs'
                      : 'text-neutral-600 hover:text-brand-navy'
                  }`}
                >
                  <Icon size={14} className={active ? 'text-brand-gold' : ''} />
                  <span>{opt.label}</span>
                  {opt.count !== undefined && !loading && (
                    <span
                      className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold tabular-nums ${
                        active
                          ? 'bg-brand-gold text-white'
                          : 'bg-brand-navy/10 text-brand-navy'
                      }`}
                    >
                      {opt.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="container-custom py-12 flex-grow">
        <div className="flex flex-col lg:flex-row gap-8">
          {!isProjects && viewMode !== 'map' && (
            <aside className="w-full lg:w-72 shrink-0">
              <FilterSidebar filters={filters} onChange={setFilters} className="sticky top-24" />
            </aside>
          )}

          <div className="flex-1 min-w-0">
            {/* Error state with retry */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center justify-between gap-4">
                <span>{error}</span>
                <button
                  type="button"
                  onClick={loadData}
                  className="text-sm font-semibold underline shrink-0 hover:text-red-900"
                >
                  Retry
                </button>
              </div>
            )}

            <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-brand-gold rounded-full" />
                <AnimatePresence mode="wait">
                  {loading ? (
                    <motion.div
                      key="loading-count"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <Skeleton className="h-7 w-48 rounded-lg bg-neutral-200" />
                    </motion.div>
                  ) : (
                    <motion.h2
                      key={isProjects ? projects.length : totalInventoryCount}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.2 }}
                      className="text-lg font-bold text-brand-navy tabular-nums"
                    >
                      {isProjects
                        ? `${projects.length} Projects Available`
                        : `${totalInventoryCount} Properties Found`}
                    </motion.h2>
                  )}
                </AnimatePresence>
              </div>

              {/* 21st.dev + Motion.dev Interactive Filter Transition Bar */}
              {!isProjects &&
                (searchQuery.trim() ||
                  filters.type.length > 0 ||
                  filters.beds.length > 0 ||
                  filters.status.length > 0) && (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-wrap items-center gap-2"
                  >
                    {searchQuery.trim() && (
                      <button
                        type="button"
                        onClick={() => handleSearchChange('')}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-brand-navy text-white text-xs font-semibold hover:bg-brand-gold transition-colors cursor-pointer"
                      >
                        <span>“{searchQuery.trim()}”</span>
                        <X size={12} />
                      </button>
                    )}
                    {filters.type.map((tItem) => (
                      <button
                        key={tItem}
                        type="button"
                        onClick={() =>
                          setFilters((prev) => ({
                            ...prev,
                            type: prev.type.filter((x) => x !== tItem),
                          }))
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-brand-navy/15 text-brand-navy text-xs font-semibold hover:border-brand-gold transition-colors cursor-pointer"
                      >
                        <span>{tItem}</span>
                        <X size={12} />
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setFilters(defaultFilters);
                        handleSearchChange('');
                      }}
                      className="inline-flex items-center gap-1 text-xs font-bold text-brand-gold hover:underline cursor-pointer ml-1"
                    >
                      <RotateCcw size={12} />
                      <span>Reset all</span>
                    </button>
                  </motion.div>
                )}
            </div>

            {viewMode === 'map' ? (
              <Suspense fallback={<MapSkeleton heightClass="h-[640px]" />}>
                <AttaieGoogleMap
                  mode="multi-property"
                  items={mapItems}
                  heightClass="h-[640px]"
                  showNeighborhoodTools={true}
                  showDirections={true}
                />
              </Suspense>
            ) : (
              <div className={viewMode === 'split' ? 'grid grid-cols-1 xl:grid-cols-12 gap-6 items-start' : ''}>
                <div className={viewMode === 'split' ? 'xl:col-span-7' : ''}>
                  {loading ? (
                    <div
                      role="status"
                      aria-busy="true"
                      aria-label={isProjects ? 'Loading projects' : 'Loading properties'}
                      className={`grid grid-cols-1 md:grid-cols-2 ${
                        viewMode === 'split' ? '' : 'xl:grid-cols-3'
                      } gap-6`}
                    >
                      {Array.from({ length: 6 }).map((_, i) =>
                        isProjects ? (
                          <ProjectCardSkeleton key={i} />
                        ) : (
                          <PropertyCardSkeleton key={i} />
                        )
                      )}
                    </div>
                  ) : isProjects ? (
                    <motion.div
                      key="projects"
                      className={`grid grid-cols-1 md:grid-cols-2 ${
                        viewMode === 'split' ? '' : 'xl:grid-cols-3'
                      } gap-6`}
                      initial="hidden"
                      animate="visible"
                      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07 } } }}
                    >
                      {projects.map((proj) => (
                        <motion.div
                          key={proj.id}
                          variants={{
                            hidden: { opacity: 0, y: 20, scale: 0.97 },
                            visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
                          }}
                        >
                          <ProjectCard
                            id={String(proj.id)}
                            name={proj.name}
                            location={proj.location}
                            deliveryDate={proj.delivery_date ?? undefined}
                            status={proj.status}
                            availableUnits={proj.available_units}
                            image={proj.image_url}
                          />
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : (
                    <>
                      {!loading && totalInventoryCount === 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex flex-col items-center justify-center py-24 text-center"
                        >
                          <div className="w-20 h-20 rounded-full bg-brand-gold/10 flex items-center justify-center mb-6">
                            <SlidersHorizontal size={32} className="text-brand-gold" />
                          </div>
                          <h3 className="text-xl font-bold text-brand-navy mb-2">No properties match your filters</h3>
                          <p className="text-neutral-500 mb-6 max-w-xs">
                            Try adjusting your search criteria to see more results.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setFilters(defaultFilters);
                              handleSearchChange('');
                            }}
                            className="px-6 py-2.5 bg-brand-navy text-white rounded-lg font-semibold text-sm hover:bg-brand-navy-light transition-colors"
                          >
                            Clear All Filters
                          </button>
                        </motion.div>
                      )}

                      {totalInventoryCount > 0 && (
                        <motion.div
                          key="properties"
                          className={`grid grid-cols-1 md:grid-cols-2 ${
                            viewMode === 'split' ? '' : 'xl:grid-cols-3'
                          } gap-6`}
                          initial="hidden"
                          animate="visible"
                          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07 } } }}
                        >
                          {properties.map((prop) => (
                            <motion.div
                              key={`prop-${prop.id}`}
                              variants={{
                                hidden: { opacity: 0, y: 20, scale: 0.97 },
                                visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
                              }}
                            >
                              <PropertyCard
                                id={String(prop.id)}
                                serialNumber={prop.serial_number}
                                title={prop.title}
                                price={prop.price}
                                location={prop.location}
                                beds={prop.beds ?? undefined}
                                baths={prop.baths ?? undefined}
                                area={prop.area ?? undefined}
                                floor={prop.floor ?? undefined}
                                status={prop.status}
                                type={prop.type}
                                listingType={prop.listing_type}
                                image={prop.image_url}
                                galleryImages={prop.gallery_images}
                              />
                            </motion.div>
                          ))}
                          {projectUnits.map((unit) => (
                            <motion.div
                              key={`unit-${unit.id}`}
                              variants={{
                                hidden: { opacity: 0, y: 20, scale: 0.97 },
                                visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
                              }}
                            >
                              <ProjectUnitInventoryCard
                                unit={unit}
                              />
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </>
                  )}
                </div>

                {viewMode === 'split' && (
                  <div className="xl:col-span-5 sticky top-24">
                    <Suspense fallback={<MapSkeleton heightClass="h-[580px]" />}>
                      <AttaieGoogleMap
                        mode="multi-property"
                        items={mapItems}
                        heightClass="h-[580px]"
                        showNeighborhoodTools={true}
                        showDirections={true}
                      />
                    </Suspense>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}

export default function PropertiesPage() {
  return (
    <Suspense fallback={<PropertiesPageSkeleton />}>
      <PropertiesContent />
    </Suspense>
  );
}

