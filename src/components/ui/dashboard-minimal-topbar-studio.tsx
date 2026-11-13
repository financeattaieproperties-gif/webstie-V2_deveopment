import React, { useMemo, useState } from 'react';
import {
  Search,
  ArrowUpRight,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  UNIFIED_ACTIVITY_FEED,
  UNIFIED_DEPARTMENT_HEALTH,
  UNIFIED_METRICS,
  UNIFIED_MODULE_DESCRIPTIONS,
  UNIFIED_NAV_GROUPS,
  UNIFIED_PIPELINE_STAGES,
  UNIFIED_RECORDS,
  filterUnifiedRecords,
  type UnifiedDashboardModuleId,
  type UnifiedRecordRow,
} from './unified-dashboards/unifiedData';

type PeriodWindow = 'today' | '7d' | '30d';

export interface MinimalTopbarStudioDashboardProps {
  className?: string;
}

export function DashboardMinimalTopbarStudio({
  className,
}: MinimalTopbarStudioDashboardProps) {
  const [activeGroupId, setActiveGroupId] = useState<string>('command');
  const [activeModule, setActiveModule] = useState<UnifiedDashboardModuleId>('overview');
  const [period, setPeriod] = useState<PeriodWindow>('30d');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | UnifiedRecordRow['status']>('All');

  const activeGroup = useMemo(
    () => UNIFIED_NAV_GROUPS.find((g) => g.id === activeGroupId) || UNIFIED_NAV_GROUPS[0],
    [activeGroupId],
  );

  const filteredRecords = useMemo(
    () => filterUnifiedRecords(UNIFIED_RECORDS, activeModule, searchQuery, statusFilter),
    [activeModule, searchQuery, statusFilter],
  );

  const activeMeta = UNIFIED_MODULE_DESCRIPTIONS[activeModule];

  const handleGroupClick = (groupId: string) => {
    setActiveGroupId(groupId);
    const grp = UNIFIED_NAV_GROUPS.find((g) => g.id === groupId);
    if (grp && grp.items.length > 0) {
      setActiveModule(grp.items[0].id);
    }
  };

  const handleModuleSelect = (moduleId: UnifiedDashboardModuleId) => {
    setActiveModule(moduleId);
    const grp = UNIFIED_NAV_GROUPS.find((g) => g.items.some((i) => i.id === moduleId));
    if (grp) setActiveGroupId(grp.id);
  };

  return (
    <div
      className={cn('min-h-[calc(100vh-3.5rem)] w-full bg-[#F8FAFC] text-slate-900', className)}
      data-testid="unified-dashboard-option-3"
    >
      {/* Top Bar: Clean 3-Zone Workspace Navigation */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-3.5 sm:px-6 lg:px-8">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="grid h-8 w-8 place-content-center rounded-md border border-slate-200 bg-slate-50 text-slate-900">
              <Building2 className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-slate-900 whitespace-nowrap">
              Attaie Operations
            </span>
          </div>

          {/* Zone 2: Primary Domain Pillars */}
          <nav
            aria-label="Primary workspace categories"
            className="hidden md:flex items-center gap-6"
          >
            {UNIFIED_NAV_GROUPS.map((group) => {
              const isSelected = group.id === activeGroupId;
              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => handleGroupClick(group.id)}
                  className={cn(
                    'text-xs font-medium transition-colors whitespace-nowrap shrink-0 py-1',
                    isSelected
                      ? 'text-slate-950 underline underline-offset-8 decoration-2'
                      : 'text-slate-500 hover:text-slate-900',
                  )}
                >
                  {group.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Compact Search Input */}
          <div className="relative w-36 sm:w-64 shrink-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search all..."
              aria-label="Search all dashboards"
              className="h-9 w-full rounded-md border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* Secondary Horizontal Module Tab Strip */}
        <div className="border-t border-slate-100 bg-white">
          <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 sm:px-6 lg:px-8">
            {/* Mobile group selector */}
            <div className="flex md:hidden items-center gap-1 pr-2 mr-2 border-r border-slate-200">
              {UNIFIED_NAV_GROUPS.map((group) => (
                <button
                  key={`m-${group.id}`}
                  type="button"
                  onClick={() => handleGroupClick(group.id)}
                  className={cn(
                    'rounded px-2 py-2 text-[11px] font-medium whitespace-nowrap shrink-0',
                    group.id === activeGroupId
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-500 hover:text-slate-900',
                  )}
                >
                  {group.label}
                </button>
              ))}
            </div>

            {activeGroup.items.map((item) => {
              const isCurrent = activeModule === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveModule(item.id)}
                  className={cn(
                    'inline-flex items-center gap-2 border-b-2 px-3 py-2.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0',
                    isCurrent
                      ? 'border-slate-900 text-slate-900'
                      : 'border-transparent text-slate-500 hover:text-slate-900',
                  )}
                >
                  <span>{item.label}</span>
                  {item.badgeCount !== undefined && (
                    <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                      {item.badgeCount}
                    </span>
                  )}
                </button>
              );
            })}

            <div className="ml-auto hidden lg:flex items-center gap-3 pl-4 text-[11px] text-slate-400 whitespace-nowrap shrink-0">
              <span>Jump to:</span>
              {(['overview', 'leads', 'finance', 'marketing', 'seo'] as UnifiedDashboardModuleId[]).map(
                (quickId) => (
                  <button
                    key={`jump-${quickId}`}
                    type="button"
                    onClick={() => handleModuleSelect(quickId)}
                    className={cn(
                      'font-medium transition-colors capitalize',
                      activeModule === quickId
                        ? 'text-slate-900'
                        : 'text-slate-500 hover:text-slate-900',
                    )}
                  >
                    {quickId}
                  </button>
                ),
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Centered Studio Canvas */}
      <main className="mx-auto min-w-0 max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Page Heading & Timeframe Control */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-slate-500">
              {activeGroup.label} · Unified Staff & Website CRM
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
              {activeMeta.title}
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">{activeMeta.subtitle}</p>
          </div>

          <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-white p-1">
            {([
              { id: 'today', label: 'Today' },
              { id: '7d', label: '7 Days' },
              { id: '30d', label: '30 Days' },
            ] as const).map((win) => (
              <button
                key={win.id}
                type="button"
                onClick={() => setPeriod(win.id)}
                className={cn(
                  'rounded px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0',
                  period === win.id
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900',
                )}
              >
                {win.label}
              </button>
            ))}
          </div>
        </div>

        {/* Clean 4-Card KPI Row */}
        <section aria-label="KPI summary" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {UNIFIED_METRICS.map((metric) => (
            <button
              key={metric.id}
              type="button"
              onClick={() => handleModuleSelect(metric.targetModule)}
              className="group min-w-0 rounded-lg border border-slate-200 bg-white p-5 text-left transition-colors hover:border-slate-300"
            >
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{metric.label}</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-700" />
              </div>
              <div className="mt-2.5 text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">
                {metric.value}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                <span className="font-medium text-slate-700">{metric.delta}</span> · {metric.context}
              </div>
            </button>
          ))}
        </section>

        {/* Full-Width Operations Data Table */}
        <section className="min-w-0 rounded-lg border border-slate-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-slate-900">
                Cross-Department Ledger
              </h2>
              <p className="text-xs text-slate-500">
                Showing {filteredRecords.length} records · Period:{' '}
                {period === 'today' ? 'Today' : period === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
              </p>
            </div>

            <div className="flex max-w-full flex-wrap items-center gap-2">
              <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-md bg-slate-100 p-1">
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

              {activeModule !== 'overview' && (
                <button
                  type="button"
                  onClick={() => handleModuleSelect('overview')}
                  className="h-8 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
                >
                  View All Modules
                </button>
              )}
            </div>
          </div>

          {filteredRecords.length === 0 ? (
            <div className="px-6 py-12 text-center text-xs text-slate-500">
              No records found for this module and status combination.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-medium text-slate-500">
                    <th className="px-5 py-3">Reference</th>
                    <th className="px-4 py-3">Title & Context</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3">Owner</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Updated</th>
                    <th className="px-5 py-3 text-right">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRecords.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => handleModuleSelect(row.department)}
                      className="cursor-pointer transition-colors hover:bg-slate-50"
                    >
                      <td className="px-5 py-3 font-mono text-xs text-slate-500 tabular-nums whitespace-nowrap">
                        {row.reference}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{row.title}</div>
                        <div className="text-xs text-slate-500">{row.subtitle}</div>
                      </td>
                      <td className="px-4 py-3 text-xs font-medium text-slate-600 whitespace-nowrap">
                        {row.departmentLabel}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                        {row.owner}
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
                      <td className="px-4 py-3 font-mono text-xs text-slate-400 tabular-nums whitespace-nowrap">
                        {row.updatedAt}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-xs font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                        {row.valueDisplay}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Bottom 2-Column Executive Summary: Pipeline + SLA / Recent Feed */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-900">
                Pipeline & Department Health
              </h2>
              <span className="font-mono text-xs text-slate-500 tabular-nums">
                48 active inquiries
              </span>
            </div>

            <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-100 mb-4">
              {UNIFIED_PIPELINE_STAGES.map((stage) => (
                <div
                  key={stage.key}
                  className={stage.barClass}
                  style={{ width: `${stage.pct}%` }}
                />
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              {UNIFIED_DEPARTMENT_HEALTH.map((dh) => (
                <button
                  key={dh.id}
                  type="button"
                  onClick={() => handleModuleSelect(dh.moduleId)}
                  className="text-left hover:bg-slate-50 rounded p-2 -m-2 transition-colors"
                >
                  <div className="text-xs text-slate-500">{dh.label}</div>
                  <div className="mt-0.5 text-base font-semibold text-slate-900 tabular-nums">
                    {dh.value}
                  </div>
                  <div className="text-[11px] text-slate-400">{dh.meta}</div>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-900">
                Recent Cross-Department Updates
              </h2>
              <span className="text-xs text-slate-400">Live workspace stream</span>
            </div>
            <div className="divide-y divide-slate-100">
              {UNIFIED_ACTIVITY_FEED.map((act) => (
                <button
                  key={act.id}
                  type="button"
                  onClick={() => handleModuleSelect(act.moduleId)}
                  className="flex w-full items-baseline justify-between gap-4 py-2.5 text-left hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-slate-900 truncate">
                      {act.title}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {act.department} · {act.detail}
                    </div>
                  </div>
                  <span className="shrink-0 font-mono text-[11px] text-slate-400 tabular-nums">
                    {act.timestamp}
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default DashboardMinimalTopbarStudio;
