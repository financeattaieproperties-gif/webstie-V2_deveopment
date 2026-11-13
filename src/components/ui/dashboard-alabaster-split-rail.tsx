import React, { useMemo, useState } from 'react';
import {
  LayoutGrid,
  Briefcase,
  Settings2,
  Building2,
  Search,
  ChevronRight,
  Layers,
  CheckCircle2,
  Clock,
  SlidersHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  UNIFIED_ACTIVITY_FEED,
  UNIFIED_METRICS,
  UNIFIED_MODULE_DESCRIPTIONS,
  UNIFIED_NAV_GROUPS,
  UNIFIED_PIPELINE_STAGES,
  UNIFIED_RECORDS,
  filterUnifiedRecords,
  getDefaultModuleForRoleLens,
  readPreferredRoleLens,
  readSidebarCompactPreference,
  toggleSidebarCompactPreference,
  writePreferredRoleLens,
  type UnifiedDashboardModuleId,
  type UnifiedRecordRow,
  type UnifiedRoleLensId,
} from './unified-dashboards/unifiedData';

const PILLAR_ICONS: Record<string, React.ElementType> = {
  command: LayoutGrid,
  'sales-crm': Briefcase,
  operations: Layers,
  organization: Settings2,
};

const STAFF_PERSPECTIVES: ReadonlyArray<{ id: UnifiedRoleLensId; label: string }> = [
  { id: 'all', label: 'CEO · Unified View' },
  { id: 'manager', label: 'Manager · Operations & Contracts' },
  { id: 'sales', label: 'Sales & Call Center' },
  { id: 'finance', label: 'Finance & HR Contracts' },
  { id: 'media', label: 'Marketing & Engineering' },
] as const;

export interface AlabasterSplitRailDashboardProps {
  className?: string;
}

export function DashboardAlabasterSplitRail({
  className,
}: AlabasterSplitRailDashboardProps) {
  const [perspective, setPerspective] = useState<UnifiedRoleLensId>(() =>
    readPreferredRoleLens(),
  );
  const [activeGroupId, setActiveGroupId] = useState<string>(
    () => getDefaultModuleForRoleLens(readPreferredRoleLens()).groupId,
  );
  const [activeModule, setActiveModule] = useState<UnifiedDashboardModuleId>(
    () => getDefaultModuleForRoleLens(readPreferredRoleLens()).moduleId,
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | UnifiedRecordRow['status']>('All');
  const [selectedRecordId, setSelectedRecordId] = useState<string>(UNIFIED_RECORDS[0].id);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isCompact, setIsCompact] = useState<boolean>(() => readSidebarCompactPreference());

  const handleToggleCompact = () => {
    setIsCompact((prev) => toggleSidebarCompactPreference(prev));
  };

  const handleChangePerspective = (nextLens: UnifiedRoleLensId) => {
    setPerspective(nextLens);
    writePreferredRoleLens(nextLens);
    const target = getDefaultModuleForRoleLens(nextLens);
    setActiveGroupId(target.groupId);
    setActiveModule(target.moduleId);
  };

  const activeGroup = useMemo(
    () => UNIFIED_NAV_GROUPS.find((g) => g.id === activeGroupId) || UNIFIED_NAV_GROUPS[0],
    [activeGroupId],
  );

  const filteredRecords = useMemo(
    () => filterUnifiedRecords(UNIFIED_RECORDS, activeModule, searchQuery, statusFilter),
    [activeModule, searchQuery, statusFilter],
  );

  const selectedRecord = useMemo(
    () =>
      filteredRecords.find((r) => r.id === selectedRecordId) ||
      filteredRecords[0] ||
      UNIFIED_RECORDS[0],
    [filteredRecords, selectedRecordId],
  );

  const activeMeta = UNIFIED_MODULE_DESCRIPTIONS[activeModule];

  const handleSelectPillar = (groupId: string) => {
    setActiveGroupId(groupId);
    const group = UNIFIED_NAV_GROUPS.find((g) => g.id === groupId);
    if (group && group.items.length > 0) {
      setActiveModule(group.items[0].id);
    }
  };

  const handleSelectModule = (id: UnifiedDashboardModuleId, groupId?: string) => {
    setActiveModule(id);
    if (groupId) {
      setActiveGroupId(groupId);
    } else {
      const ownerGroup = UNIFIED_NAV_GROUPS.find((g) => g.items.some((i) => i.id === id));
      if (ownerGroup) setActiveGroupId(ownerGroup.id);
    }
    setMobileNavOpen(false);
  };

  return (
    <div
      className={cn(
        'flex min-h-[calc(100vh-3.5rem)] w-full bg-[#F7F8FA] text-slate-900',
        className,
      )}
      data-testid="unified-dashboard-option-2"
      data-sidebar-mode={isCompact ? 'compact' : 'expanded'}
    >
      {/* Mobile drawer overlay */}
      {mobileNavOpen && (
        <button
          type="button"
          aria-label="Close split navigation"
          onClick={() => setMobileNavOpen(false)}
          className="fixed inset-0 z-30 bg-slate-900/20 lg:hidden"
        />
      )}

      {/* Tier 1 + Tier 2 Architectural Split Rail */}
      <aside
        aria-label="Architectural workspace navigation"
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex bg-white border-r border-slate-200 transition-transform duration-200 lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)] lg:translate-x-0',
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {/* Primary 64px Pillar Rail */}
        <div className="flex w-16 flex-col items-center border-r border-slate-200 bg-[#FBFBFD] py-3.5">
          <div className="mb-5 grid h-9 w-9 place-content-center rounded-md border border-slate-300 bg-white text-xs font-semibold text-slate-900">
            <Building2 className="h-4 w-4" />
          </div>

          <div className="flex flex-1 flex-col items-center gap-2">
            {UNIFIED_NAV_GROUPS.map((group) => {
              const Icon = PILLAR_ICONS[group.id] || LayoutGrid;
              const isCurrent = group.id === activeGroupId;
              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => handleSelectPillar(group.id)}
                  title={group.label}
                  aria-label={group.label}
                  className={cn(
                    'grid h-10 w-10 place-content-center rounded-md transition-colors',
                    isCurrent
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900',
                  )}
                >
                  <Icon className="h-4 w-4" />
                </button>
              );
            })}
          </div>

          <div className="mt-auto flex w-full flex-col items-center gap-2 border-t border-slate-200/80 pt-3">
            <button
              type="button"
              data-testid="sidebar-compact-toggle"
              onClick={handleToggleCompact}
              aria-pressed={isCompact}
              aria-expanded={!isCompact}
              title={isCompact ? 'Expand full sidebar' : 'Compact icon-only sidebar'}
              aria-label={isCompact ? 'Expand full sidebar' : 'Compact icon-only sidebar'}
              className={cn(
                'hidden lg:grid h-10 w-10 place-content-center rounded-md transition-colors',
                isCompact
                  ? 'bg-slate-900 text-white hover:bg-slate-800'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900',
              )}
            >
              {isCompact ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </button>

            <button
              type="button"
              onClick={() => handleSelectModule('seo', 'organization')}
              title="SEO & System Settings"
              aria-label="SEO & System Settings"
              className={cn(
                'grid h-10 w-10 place-content-center rounded-md transition-colors',
                activeModule === 'seo'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900',
              )}
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Secondary Contextual Sub-Drawer */}
        <div className={cn('flex w-56 flex-col bg-white', isCompact && 'lg:hidden')}>
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
            <div className="min-w-0">
              <div className="truncate text-xs font-medium text-slate-400">
                Attaie Properties
              </div>
              <div className="truncate text-sm font-semibold text-slate-900">
                {activeGroup.label}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMobileNavOpen(false)}
              aria-label="Close drawer"
              className="inline-flex h-8 w-8 items-center justify-center rounded text-slate-500 hover:bg-slate-100 lg:hidden"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
            <div className="space-y-0.5">
              {activeGroup.items.map((item) => {
                const isSelected = activeModule === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectModule(item.id, activeGroup.id)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-xs transition-colors',
                      isSelected
                        ? 'bg-slate-100 font-semibold text-slate-900'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                    )}
                  >
                    <span className="truncate">{item.label}</span>
                    {item.badgeCount !== undefined && (
                      <span className="ml-2 font-mono text-[11px] text-slate-400 tabular-nums">
                        {item.badgeCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick Jump to All Dashboards */}
            <div className="border-t border-slate-100 pt-3">
              <div className="px-2 pb-1.5 text-[11px] font-medium text-slate-400">
                All Modules
              </div>
              <div className="space-y-0.5">
                {UNIFIED_NAV_GROUPS.flatMap((g) =>
                  g.items.map((item) => (
                    <button
                      key={`all-${item.id}`}
                      type="button"
                      onClick={() => handleSelectModule(item.id, g.id)}
                      className={cn(
                        'flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-[11px] transition-colors',
                        activeModule === item.id
                          ? 'font-semibold text-slate-900 bg-slate-50'
                          : 'text-slate-500 hover:text-slate-800',
                      )}
                    >
                      <span className="truncate">{item.label}</span>
                      <span className="ml-1.5 text-[10px] text-slate-400 shrink-0">
                        {item.sourceApp === 'Admin CRM'
                          ? 'Web'
                          : item.sourceApp === 'Staff Workspace'
                            ? 'Staff'
                            : 'Core'}
                      </span>
                    </button>
                  )),
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 p-3">
            <label htmlFor="alabaster-perspective" className="block text-[11px] font-medium text-slate-500 mb-1">
              Workspace Role Lens
            </label>
            <select
              id="alabaster-perspective"
              data-testid="workspace-role-lens-select"
              value={perspective}
              onChange={(e) =>
                handleChangePerspective(e.target.value as UnifiedRoleLensId)
              }
              className="h-9 w-full rounded-md border border-slate-200 bg-slate-50 px-2.5 text-xs font-medium text-slate-800 focus:border-slate-400 focus:bg-white focus:outline-none"
            >
              {STAFF_PERSPECTIVES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </aside>

      {/* Main Alabaster Workspace */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Breadcrumb Header */}
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-3.5">
          <div className="flex items-center gap-2 text-xs text-slate-500 min-w-0">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open workspace navigation"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 lg:hidden"
            >
              <Menu className="h-4 w-4" />
            </button>
            <span className="whitespace-nowrap">{activeGroup.label}</span>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <h1 className="truncate text-sm font-semibold text-slate-900">
              {activeMeta.title}
            </h1>
          </div>

          <div className="flex w-full items-center gap-3 sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by serial, staff, or title..."
                aria-label="Filter unified records"
                className="h-9 w-full rounded-md border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none"
              />
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 p-4 sm:p-6 space-y-6">
          {/* Flat Hairline 4-Cell Metric Strip */}
          <section
            aria-label="Workspace key metrics"
            className="grid grid-cols-1 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white sm:grid-cols-2 sm:divide-y-0 sm:divide-x xl:grid-cols-4"
          >
            {UNIFIED_METRICS.map((metric) => (
              <button
                key={metric.id}
                type="button"
                onClick={() => handleSelectModule(metric.targetModule)}
                className="flex min-w-0 flex-col justify-between p-5 text-left transition-colors hover:bg-slate-50"
              >
                <span className="text-xs font-medium text-slate-500">
                  {metric.label}
                </span>
                <span className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">
                  {metric.value}
                </span>
                <span className="mt-1.5 text-xs text-slate-500">
                  {metric.delta} · {metric.context}
                </span>
              </button>
            ))}
          </section>

          {/* 2/3 Data Grid + 1/3 Record Inspector */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <section className="min-w-0 xl:col-span-2 rounded-lg border border-slate-200 bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-slate-900">
                    {activeMeta.title} Ledger
                  </h2>
                  <span className="font-mono text-xs text-slate-400 tabular-nums">
                    ({filteredRecords.length})
                  </span>
                </div>

                <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-md border border-slate-200 bg-[#F7F8FA] p-0.5">
                  {(['All', 'Active', 'Pending', 'Needs Review', 'Completed'] as const).map(
                    (status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setStatusFilter(status)}
                        className={cn(
                          'rounded px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0',
                          statusFilter === status
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900',
                        )}
                      >
                        {status}
                      </button>
                    ),
                  )}
                </div>
              </div>

              {filteredRecords.length === 0 ? (
                <div className="px-6 py-12 text-center text-xs text-slate-500">
                  No records match your active filter.{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('All');
                      handleSelectModule('overview', 'command');
                    }}
                    className="font-medium text-slate-900 underline"
                  >
                    Show all departments
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs font-medium text-slate-500">
                        <th className="px-5 py-2.5">Ref</th>
                        <th className="px-4 py-2.5">Item</th>
                        <th className="px-4 py-2.5">Module</th>
                        <th className="px-4 py-2.5">Status</th>
                        <th className="px-5 py-2.5 text-right">Amount / Metric</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredRecords.map((row) => {
                        const isSelected = selectedRecord?.id === row.id;
                        return (
                          <tr
                            key={row.id}
                            onClick={() => setSelectedRecordId(row.id)}
                            className={cn(
                              'cursor-pointer transition-colors',
                              isSelected ? 'bg-slate-100/75' : 'hover:bg-slate-50',
                            )}
                          >
                            <td className="px-5 py-3 font-mono text-xs text-slate-500 tabular-nums whitespace-nowrap">
                              {row.reference}
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-medium text-slate-900">{row.title}</div>
                              <div className="text-xs text-slate-500">{row.owner}</div>
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                              {row.departmentLabel}
                            </td>
                            <td className="px-4 py-3 text-xs whitespace-nowrap">
                              <span
                                className={cn(
                                  'font-medium',
                                  row.status === 'Active' && 'text-emerald-700',
                                  row.status === 'Pending' && 'text-amber-700',
                                  row.status === 'Needs Review' && 'text-blue-700',
                                  row.status === 'Completed' && 'text-slate-600',
                                )}
                              >
                                {row.status}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-right font-mono text-xs font-medium text-slate-900 tabular-nums whitespace-nowrap">
                              {row.valueDisplay}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Right Column: Live Record Inspector & Pipeline Summary */}
            <aside className="space-y-6">
              {selectedRecord && (
                <section className="rounded-lg border border-slate-200 bg-white p-5">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="font-mono text-xs font-medium text-slate-500 tabular-nums">
                      {selectedRecord.reference}
                    </span>
                    <span className="text-xs font-medium text-slate-600">
                      {selectedRecord.updatedAt}
                    </span>
                  </div>

                  <h3 className="mt-3 text-sm font-semibold text-slate-900">
                    {selectedRecord.title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    {selectedRecord.subtitle}
                  </p>

                  <dl className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs">
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Department</dt>
                      <dd className="font-medium text-slate-900">
                        {selectedRecord.departmentLabel}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Assigned Owner</dt>
                      <dd className="font-medium text-slate-900">{selectedRecord.owner}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Current State</dt>
                      <dd className="font-medium text-slate-900">{selectedRecord.status}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Primary Value</dt>
                      <dd className="font-mono font-semibold text-slate-900 tabular-nums">
                        {selectedRecord.valueDisplay}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectModule(selectedRecord.department)}
                      className="flex-1 rounded-md bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800 whitespace-nowrap"
                    >
                      Open {selectedRecord.departmentLabel}
                    </button>
                  </div>
                </section>
              )}

              <section className="rounded-lg border border-slate-200 bg-white p-5">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">
                  Pipeline Distribution
                </h3>
                <div className="space-y-3">
                  {UNIFIED_PIPELINE_STAGES.map((stage) => (
                    <div key={stage.key}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-600">{stage.label}</span>
                        <span className="font-mono font-medium text-slate-900 tabular-nums">
                          {stage.count} · {stage.pct}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={stage.barClass}
                          style={{ width: `${stage.pct}%`, height: '100%' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-lg border border-slate-200 bg-white p-5">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">
                  Department Activity Log
                </h3>
                <div className="space-y-2.5">
                  {UNIFIED_ACTIVITY_FEED.slice(0, 4).map((act) => (
                    <div key={act.id} className="flex items-start gap-2.5 text-xs">
                      {act.moduleId === 'seo' ? (
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      ) : (
                        <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-slate-800 truncate">{act.title}</div>
                        <div className="text-[11px] text-slate-400">
                          {act.department} · {act.timestamp}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}

export default DashboardAlabasterSplitRail;
