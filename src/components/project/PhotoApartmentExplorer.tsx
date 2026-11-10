import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Bed,
  Bath,
  Calendar,
  MessageCircle,
  PhoneCall,
  Sparkles,
  Layers,
  ArrowLeft,
} from 'lucide-react';
import type { ExplorerProject, ExplorerFloor, ApartmentPlacement } from '../../../shared/visual-config';
import { getProjectVisualConfig } from '../../lib/visualConfigService';
import { PhotoFloorSelector } from './PhotoFloorSelector';
import { FloorPlanSelector } from './FloorPlanSelector';
import { PlanReveal } from './PlanReveal';
import { useExplorerNavigation } from './useExplorerNavigation';
import { ClickToCallButton } from '../ui/ClickToCallButton';

export interface PhotoApartmentExplorerProps {
  projectId: number;
  projectName?: string;
  className?: string;
  onSelectUnit?: (unit: ApartmentPlacement) => void;
}

export const PhotoApartmentExplorer: React.FC<PhotoApartmentExplorerProps> = ({
  projectId,
  projectName = 'Development Project',
  className = '',
  onSelectUnit,
}) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'fa';

  const [projectConfig, setProjectConfig] = useState<ExplorerProject | null>(null);
  const [loading, setLoading] = useState(true);

  // Load visual configuration for this project
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    getProjectVisualConfig(Number(projectId))
      .then((cfg) => {
        if (isMounted) setProjectConfig(cfg);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [projectId]);

  const nav = useExplorerNavigation();

  if (loading) {
    return (
      <div className="w-full h-96 rounded-2xl bg-brand-navy/5 border border-brand-navy/10 animate-pulse flex flex-col items-center justify-center p-6 text-center my-6">
        <div className="w-9 h-9 rounded-full border-2 border-brand-gold border-t-transparent animate-spin mb-3" />
        <p className="text-xs font-bold uppercase tracking-wider text-brand-navy">
          {t('projects.loadingExplorer', 'Loading Photo Apartment Explorer…')}
        </p>
      </div>
    );
  }

  if (!projectConfig || projectConfig.floors.length === 0) {
    return null;
  }

  return (
    <div className={`relative bg-brand-cream/60 rounded-3xl p-4 sm:p-6 border border-brand-navy/10 shadow-sm my-8 ${className}`}>
      {/* Top Header & Breadcrumb Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-brand-navy/10">
        <div className="flex items-center gap-2">
          {nav.stage !== 'exterior' && (
            <button
              type="button"
              onClick={nav.stage === 'apartment' ? nav.goBackToFloor : nav.goBackToExterior}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-xs font-bold text-brand-navy hover:border-brand-gold transition-colors shadow-sm cursor-pointer"
            >
              <ArrowLeft className={`w-3.5 h-3.5 ${isRtl ? 'rotate-180' : ''}`} />
              {nav.stage === 'apartment'
                ? t('projects.backToFloor', 'Back to Floor Plan')
                : t('projects.backToBuilding', 'Back to Building Photo')}
            </button>
          )}

          <nav className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
            <button
              type="button"
              onClick={nav.goBackToExterior}
              className={`hover:text-brand-gold transition-colors ${
                nav.stage === 'exterior' ? 'font-bold text-brand-navy' : ''
              }`}
            >
              {projectConfig.projectName}
            </button>

            {nav.selectedFloor && (
              <>
                <ChevronRight className={`w-3 h-3 text-gray-400 ${isRtl ? 'rotate-180' : ''}`} />
                <button
                  type="button"
                  onClick={nav.goBackToFloor}
                  className={`hover:text-brand-gold transition-colors ${
                    nav.stage === 'floor' ? 'font-bold text-brand-navy' : ''
                  }`}
                >
                  {nav.selectedFloor.label[isRtl ? 'fa' : 'en']}
                </button>
              </>
            )}

            {nav.selectedApartment && (
              <>
                <ChevronRight className={`w-3 h-3 text-gray-400 ${isRtl ? 'rotate-180' : ''}`} />
                <span className="font-bold text-brand-gold">
                  {nav.selectedApartment.unitNumber}
                </span>
              </>
            )}
          </nav>
        </div>

        {/* Stage Indicator Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-navy/5 text-[11px] font-semibold text-brand-navy">
          <Sparkles className="w-3.5 h-3.5 text-brand-gold" />
          <span>
            {nav.stage === 'exterior'
              ? t('projects.stageExterior', '1. Illuminated Floor Selection')
              : nav.stage === 'floor'
              ? t('projects.stageFloor', '2. Whole Floor Masterplan')
              : t('projects.stageUnit', '3. 2D / Furnished Plan Reveal')}
          </span>
        </div>
      </div>

      {/* STAGE 1: Exterior Elevation Photography with Architectural Window Glow */}
      {nav.stage === 'exterior' && (
        <PhotoFloorSelector
          project={projectConfig}
          selectedFloorId={nav.selectedFloor?.id || null}
          onSelectFloor={(floor) => nav.selectFloor(floor)}
        />
      )}

      {/* STAGE 2: Whole Floor Masterplan Plate with Unit Hotspots */}
      {nav.stage === 'floor' && nav.selectedFloor && (
        <FloorPlanSelector
          floor={nav.selectedFloor}
          selectedApartmentId={nav.selectedApartment?.id || null}
          revealPercent={nav.revealPercent}
          onRevealPercentChange={(pct) => nav.setRevealPercent(pct)}
          onSelectApartment={(apt) => {
            nav.selectApartment(apt);
            if (onSelectUnit) onSelectUnit(apt);
          }}
        />
      )}

      {/* STAGE 3: Individual Apartment 2D vs. Furnished Plan Reveal & Inquiry */}
      {nav.stage === 'apartment' && nav.selectedApartment && (
        <div className="flex flex-col lg:flex-row gap-6 items-stretch">
          {/* Left Column: 50/50 Plan Reveal */}
          <div className="flex-1 min-w-0">
            <PlanReveal
              plan={nav.selectedApartment.plan}
              aspectRatio="16/10"
              initialPercent={nav.revealPercent}
              onPercentChange={(pct) => nav.setRevealPercent(pct)}
            />
          </div>

          {/* Right Column: Apartment Specifications & Direct Booking Actions */}
          <div className="w-full lg:w-80 flex flex-col justify-between bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-gold">
                  {nav.selectedFloor?.label[isRtl ? 'fa' : 'en']}
                </span>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                    nav.selectedApartment.status === 'available'
                      ? 'bg-green-100 text-green-700'
                      : nav.selectedApartment.status === 'reserved'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {nav.selectedApartment.status}
                </span>
              </div>

              <h2 className="text-xl font-bold text-brand-navy mb-1">
                {nav.selectedApartment.unitNumber}
              </h2>
              <p className="text-xs text-gray-500 mb-4">
                {nav.selectedApartment.title?.[isRtl ? 'fa' : 'en'] || 'Exclusive Luxury Residence'}
              </p>

              {/* Specs Grid */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-brand-ivory/60 rounded-xl mb-4 text-center">
                <div>
                  <p className="text-[10px] text-gray-500">{t('properties.area', 'Area')}</p>
                  <p className="font-bold text-sm text-brand-navy">{nav.selectedApartment.areaSqm} m²</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500">{t('properties.beds', 'Bedrooms')}</p>
                  <p className="font-bold text-sm text-brand-navy">{nav.selectedApartment.beds}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500">{t('properties.baths', 'Bathrooms')}</p>
                  <p className="font-bold text-sm text-brand-navy">{nav.selectedApartment.baths}</p>
                </div>
              </div>

              {/* Price */}
              <div className="mb-4">
                <p className="text-xs text-gray-500">{t('property.price', 'Price')}</p>
                <p className="text-2xl font-black text-brand-navy">
                  {nav.selectedApartment.priceUsd
                    ? `$${nav.selectedApartment.priceUsd.toLocaleString()}`
                    : t('property.priceOnRequest', 'Price on Request')}
                </p>
              </div>

              {nav.selectedApartment.description && (
                <p className="text-xs text-gray-600 leading-relaxed mb-4">
                  {nav.selectedApartment.description[isRtl ? 'fa' : 'en']}
                </p>
              )}
            </div>

            {/* Direct Contact Actions */}
            <div className="flex flex-col gap-2 pt-4 border-t border-gray-100">
              <a
                href={`https://wa.me/93782222279?text=${encodeURIComponent(
                  isRtl
                    ? `سلام، من در مورد اپارتمان ${nav.selectedApartment.unitNumber} در پروژه ${projectConfig.projectName} سوال داشتم.`
                    : `Hello, I am interested in ${nav.selectedApartment.unitNumber} at ${projectConfig.projectName}. Can I schedule a visit?`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#25D366] text-white font-bold text-xs hover:bg-[#20ba59] transition-colors shadow-md"
              >
                <MessageCircle className="w-4 h-4" />
                {t('property.inquireWhatsApp', 'Inquire via WhatsApp')}
              </a>
              <ClickToCallButton />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoApartmentExplorer;
