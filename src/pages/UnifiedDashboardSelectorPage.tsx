import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Check, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DashboardWithCollapsibleSidebar } from '@/components/ui/dashboard-with-collapsible-sidebar';
import { DashboardAlabasterSplitRail } from '@/components/ui/dashboard-alabaster-split-rail';
import { DashboardMinimalTopbarStudio } from '@/components/ui/dashboard-minimal-topbar-studio';

export type UnifiedDashboardOptionId = 'option-1' | 'option-2' | 'option-3';

export interface UnifiedDashboardOptionSpec {
  id: UnifiedDashboardOptionId;
  shortLabel: string;
  title: string;
  sourceStyle: string;
  summary: string;
  components: string[];
}

export const UNIFIED_DASHBOARD_OPTIONS: UnifiedDashboardOptionSpec[] = [
  {
    id: 'option-1',
    shortLabel: '01 · Collapsible Sidebar',
    title: 'Collapsible Sidebar Workspace',
    sourceStyle: '21st.dev Collapsible Sidebar Block (Light Minimal)',
    summary:
      'Single sticky white sidebar (256px ↔ 64px icon rail) grouping Command, Sales CRM, Operations, and Organization modules with KPI cards, queue table, pipeline bar, and department feed.',
    components: [
      'CollapsibleSidebar + TitleSection + ToggleClose',
      'Grouped SidebarOption Items + Mobile Drawer',
      'Inline Search HeaderBar + 4-Column KPI Grid',
      'Unified Operations Queue Table + Status Tabs',
      'Leads Pipeline Health Bar + Recent Activity + Department Pulse',
    ],
  },
  {
    id: 'option-2',
    shortLabel: '02 · Alabaster Split-Rail',
    title: 'Alabaster Architectural Split-Rail',
    sourceStyle: '21st.dev Alabaster Architectural Sidebar (Light Minimal)',
    summary:
      'Two-tier navigation (64px primary icon pillar rail + 224px contextual module drawer with role lens switcher), flat hairline 4-cell KPI strip, ledger table, and live right-hand record inspector.',
    components: [
      '64px Primary Pillar Rail + 224px Sub-Navigation Drawer',
      'Workspace Role Lens Switcher (CEO / Sales / Finance / Media)',
      'Breadcrumb Top Bar + Flat Divide-X KPI Strip',
      'Filterable Cross-Department Ledger Table',
      'Live Record Inspector Panel + Pipeline Distribution + Activity Log',
    ],
  },
  {
    id: 'option-3',
    shortLabel: '03 · Minimal Top-Nav Studio',
    title: 'Minimal Top-Nav Studio',
    sourceStyle: '21st.dev Minimal Light SaaS App Layout',
    summary:
      'Zero-sidebar centered max-w-7xl layout with clean 3-zone top bar, horizontal module underline tabs, timeframe switcher, full-width operations table, and executive summary strip.',
    components: [
      '3-Zone Top Header + Secondary Horizontal Module Tab Strip',
      'Period Timeframe Switcher (Today / 7 Days / 30 Days)',
      '4-Column KPI Summary Row + Quick Jump Links',
      'Full-Width Cross-Department Ledger Grid',
      'Bottom 2-Column Pipeline Health & Cross-Department Updates',
    ],
  },
];

const STORAGE_KEY = 'attaie_selected_unified_dashboard';

export default function UnifiedDashboardSelectorPage() {
  const [activeOption, setActiveOption] = useState<UnifiedDashboardOptionId>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as UnifiedDashboardOptionId | null;
      if (saved === 'option-1' || saved === 'option-2' || saved === 'option-3') {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'option-2';
  });

  const [confirmedOption, setConfirmedOption] = useState<UnifiedDashboardOptionId | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as UnifiedDashboardOptionId | null;
      if (saved === 'option-1' || saved === 'option-2' || saved === 'option-3') {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'option-2';
  });

  const [showComponents, setShowComponents] = useState(false);

  const currentSpec =
    UNIFIED_DASHBOARD_OPTIONS.find((opt) => opt.id === activeOption) ||
    UNIFIED_DASHBOARD_OPTIONS[0];

  const handleConfirmSelection = () => {
    setConfirmedOption(activeOption);
    try {
      localStorage.setItem(STORAGE_KEY, activeOption);
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#FAFAFA] text-slate-900">
      <Helmet>
        <title>Unified Dashboard Options — Attaie Properties</title>
        <meta
          name="description"
          content="Compare and select from three minimal light-theme unified dashboard architectures combining all Admin CRM and Staff workspaces."
        />
      </Helmet>

      {/* Sticky Minimal Light Option Selector Bar */}
      <div className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex min-h-14 max-w-[1600px] flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-6 lg:flex-nowrap lg:gap-4 lg:py-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-xs font-semibold tracking-tight text-slate-900 whitespace-nowrap">
              Unified Dashboard Preview
            </span>
            <span className="hidden xl:inline text-xs text-slate-400 whitespace-nowrap">
              · 3 Minimal Light Options
            </span>
          </div>

          {/* 3-Option Segmented Selector */}
          <div
            role="tablist"
            aria-label="Unified dashboard design options"
            className="order-3 flex w-full max-w-full items-center gap-1 overflow-x-auto rounded-md border border-slate-200 bg-slate-50 p-1 lg:order-2 lg:w-auto"
          >
            {UNIFIED_DASHBOARD_OPTIONS.map((option) => {
              const isActive = activeOption === option.id;
              const isConfirmed = confirmedOption === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  data-testid={`select-tab-${option.id}`}
                  onClick={() => setActiveOption(option.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0',
                    isActive
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900',
                  )}
                >
                  <span>{option.shortLabel}</span>
                  {isConfirmed && (
                    <Check className="h-3 w-3 text-emerald-600" aria-label="Selected" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Actions: Component Spec Toggle & Confirm Choice */}
          <div className="order-2 flex items-center gap-2 shrink-0 lg:order-3">
            <button
              type="button"
              onClick={() => setShowComponents((v) => !v)}
              aria-expanded={showComponents}
              data-testid="toggle-components-drawer"
              className="hidden sm:inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
            >
              <Layers className="h-3.5 w-3.5 text-slate-500" />
              <span>{showComponents ? 'Hide Specs' : 'Components'}</span>
            </button>

            <button
              type="button"
              onClick={handleConfirmSelection}
              data-testid="confirm-dashboard-selection"
              className={cn(
                'inline-flex h-8 items-center gap-1.5 rounded-md px-3.5 text-xs font-medium transition-colors whitespace-nowrap',
                confirmedOption === activeOption
                  ? 'bg-emerald-700 text-white'
                  : 'bg-slate-900 text-white hover:bg-slate-800',
              )}
            >
              {confirmedOption === activeOption ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Selected</span>
                </>
              ) : (
                <span>Select Option</span>
              )}
            </button>
          </div>
        </div>

        {/* Expandable Component Specification Strip */}
        {showComponents && (
          <div
            data-testid="components-spec-drawer"
            className="border-t border-slate-200 bg-[#FAFAFA] px-4 py-3.5 sm:px-6"
          >
            <div className="mx-auto flex max-w-[1600px] flex-wrap items-start justify-between gap-4">
              <div className="max-w-2xl">
                <div className="text-xs font-semibold text-slate-900">
                  {currentSpec.title} · {currentSpec.sourceStyle}
                </div>
                <p className="mt-0.5 text-xs text-slate-500">{currentSpec.summary}</p>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                {currentSpec.components.map((comp) => (
                  <span key={comp} className="whitespace-nowrap">
                    · {comp}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Live Minimal Light Unified Dashboard Viewport */}
      {activeOption === 'option-1' && <DashboardWithCollapsibleSidebar />}
      {activeOption === 'option-2' && <DashboardAlabasterSplitRail />}
      {activeOption === 'option-3' && <DashboardMinimalTopbarStudio />}
    </div>
  );
}
