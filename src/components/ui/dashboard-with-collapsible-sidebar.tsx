import React, { useMemo, useState } from 'react';
import {
  LayoutDashboard,
  Building2,
  Layers,
  PhoneIncoming,
  CalendarClock,
  CalendarCheck,
  MessageSquare,
  FileText,
  DollarSign,
  Film,
  Compass,
  Users,
  Search,
  ChevronsRight,
  SlidersHorizontal,
  ArrowUpRight,
  Menu,
  X,
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
  readSidebarCompactPreference,
  writeSidebarCompactPreference,
  type UnifiedDashboardModuleId,
  type UnifiedNavItem,
  type UnifiedRecordRow,
} from './unified-dashboards/unifiedData';

const OPTION1_SIDEBAR_COMPACT_KEY = 'attaie_unified_option1_sidebar_compact';

const MODULE_ICONS: Record<UnifiedDashboardModuleId, React.ElementType> = {
  overview: LayoutDashboard,
  properties: Building2,
  projects: Layers,
  leads: PhoneIncoming,
  followups: CalendarClock,
  visits: CalendarCheck,
  chat: MessageSquare,
  contracts: FileText,
  finance: DollarSign,
  marketing: Film,
  engineering: Compass,
  team: Users,
  seo: SlidersHorizontal,
};

export interface CollapsibleSidebarDashboardProps {
  className?: string;
}

export function DashboardWithCollapsibleSidebar({
  className,
}: CollapsibleSidebarDashboardProps) {
  const [open, setOpen] = useState<boolean>(
    () => !readSidebarCompactPreference(undefined, OPTION1_SIDEBAR_COMPACT_KEY),
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeModule, setActiveModule] = useState<UnifiedDashboardModuleId>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | UnifiedRecordRow['status']>('All');

  const handleToggleSidebar = () => {
    setOpen((prev) => {
      const nextOpen = !prev;
      writeSidebarCompactPreference(!nextOpen, undefined, OPTION1_SIDEBAR_COMPACT_KEY);
      return nextOpen;
    });
  };

  const filteredRecords = useMemo(
    () => filterUnifiedRecords(UNIFIED_RECORDS, activeModule, searchQuery, statusFilter),
    [activeModule, searchQuery, statusFilter],
  );

  const activeMeta = UNIFIED_MODULE_DESCRIPTIONS[activeModule];

  const handleSelectModule = (id: UnifiedDashboardModuleId) => {
    setActiveModule(id);
    setMobileOpen(false);
  };

  return (
    <div
      className={cn(
        'flex min-h-[calc(100vh-3.5rem)] w-full bg-[#FAFAFA] text-slate-900',
        className,
      )}
      data-testid="unified-dashboard-option-1"
      data-sidebar-mode={open ? 'expanded' : 'compact'}
    >
      {/* Mobile drawer backdrop */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation drawer"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-slate-900/20 lg:hidden"
        />
      )}

      {/* Collapsible Minimal Light Sidebar */}
      <nav
        aria-label="Unified dashboard navigation"
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col border-r border-slate-200 bg-white transition-[width,transform] duration-200 ease-out lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)] lg:translate-x-0',
          open ? 'w-64' : 'w-16',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <TitleSection
          open={open}
          onCloseMobile={() => setMobileOpen(false)}
        />

        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-5">
          {UNIFIED_NAV_GROUPS.map((group, idx) => (
            <div
              key={group.id}
              className={cn(idx > 0 && 'border-t border-slate-100 pt-4')}
            >
              {open && (
                <div className="px-3 pb-1.5 text-[11px] font-medium tracking-wide text-slate-400">
                  {group.label}
                </div>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <SidebarOption
                    key={item.id}
                    item={item}
                    Icon={MODULE_ICONS[item.id]}
                    selected={activeModule === item.id}
                    open={open}
                    onSelect={handleSelectModule}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <ToggleClose open={open} onToggle={handleToggleSidebar} />
      </nav>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Clean Minimal Top Header */}
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 lg:hidden"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold tracking-tight text-slate-900">
                {activeMeta.title}
              </h1>
              <p className="truncate text-xs text-slate-500">
                {activeMeta.subtitle}
              </p>
            </div>
          </div>

          <div className="flex w-full items-center gap-3 sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search records, serials, staff..."
                aria-label="Search unified workspace"
                className="h-10 w-full rounded-md border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none"
              />
            </div>
            {activeModule !== 'overview' && (
              <button
                type="button"
                onClick={() => setActiveModule('overview')}
                className="inline-flex h-10 items-center rounded-md border border-slate-200 bg-white px-3.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
              >
                All Modules
              </button>
            )}
          </div>
        </header>

        <main className="min-w-0 flex-1 p-4 sm:p-6 space-y-6">
          {/* 4-Column KPI Grid */}
          <section aria-label="Key metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {UNIFIED_METRICS.map((metric) => (
              <button
                key={metric.id}
                type="button"
                onClick={() => setActiveModule(metric.targetModule)}
                className="group min-w-0 rounded-lg border border-slate-200 bg-white p-5 text-left transition-colors hover:border-slate-300"
              >
                <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                  <span>{metric.label}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
                <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">
                  {metric.value}
                </div>
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
                  <span
                    className={cn(
                      'font-medium',
                      metric.tone === 'positive' && 'text-emerald-700',
                      metric.tone === 'warning' && 'text-amber-700',
                      metric.tone === 'neutral' && 'text-slate-600',
                    )}
                  >
                    {metric.delta}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="truncate">{metric.context}</span>
                </div>
              </button>
            ))}
          </section>

          {/* Main Split Grid: 2/3 Operations Table + 1/3 Activity & Pipeline */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            {/* Operations Ledger Table */}
            <section className="min-w-0 xl:col-span-2 rounded-lg border border-slate-200 bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-slate-900">
                    Unified Operations Queue
                  </h2>
                  <p className="text-xs text-slate-500">
                    {filteredRecords.length} matching records · {activeMeta.covers}
                  </p>
                </div>

                {/* Segmented Status Filter */}
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
              </div>

              {filteredRecords.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <p className="text-sm font-medium text-slate-700">
                    No matching records in this view
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Clear your filter or switch back to Executive Overview to view all departments.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('All');
                      setActiveModule('overview');
                    }}
                    className="mt-4 inline-flex h-9 items-center rounded-md border border-slate-200 bg-white px-4 text-xs font-medium text-slate-800 hover:bg-slate-50"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs font-medium text-slate-500">
                        <th className="px-5 py-3">Record</th>
                        <th className="px-4 py-3">Department</th>
                        <th className="px-4 py-3">Owner</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-5 py-3 text-right">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredRecords.map((row) => (
                        <tr
                          key={row.id}
                          onClick={() => setActiveModule(row.department)}
                          className="cursor-pointer transition-colors hover:bg-slate-50"
                        >
                          <td className="px-5 py-3">
                            <div className="font-medium text-slate-900">{row.title}</div>
                            <div className="mt-0.5 text-xs text-slate-500">
                              <span className="font-mono tabular-nums text-slate-600">
                                {row.reference}
                              </span>
                              {' · '}
                              {row.subtitle}
                            </div>
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
                          <td className="px-5 py-3 text-right font-mono text-xs font-medium text-slate-900 tabular-nums whitespace-nowrap">
                            {row.valueDisplay}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Right Column: Pipeline Health & Department Activity */}
            <div className="space-y-6">
              {/* Leads Pipeline Summary */}
              <section className="rounded-lg border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-900">
                    Leads Pipeline Health
                  </h2>
                  <span className="font-mono text-xs text-slate-500 tabular-nums">
                    48 total
                  </span>
                </div>

                <div className="mt-3 flex h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  {UNIFIED_PIPELINE_STAGES.map((stage) => (
                    <div
                      key={stage.key}
                      className={stage.barClass}
                      style={{ width: `${stage.pct}%` }}
                      title={`${stage.label}: ${stage.count}`}
                    />
                  ))}
                </div>

                <div className="mt-4 space-y-2.5">
                  {UNIFIED_PIPELINE_STAGES.map((stage) => (
                    <div
                      key={stage.key}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="text-slate-600">{stage.label}</span>
                      <span className="font-mono font-medium text-slate-900 tabular-nums">
                        {stage.count} ({stage.pct}%)
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Cross-Department Activity Feed */}
              <section className="rounded-lg border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-slate-900">
                    Recent Activity
                  </h2>
                  <button
                    type="button"
                    onClick={() => setActiveModule('overview')}
                    className="text-xs font-medium text-slate-600 hover:text-slate-900"
                  >
                    All feeds
                  </button>
                </div>

                <div className="divide-y divide-slate-100">
                  {UNIFIED_ACTIVITY_FEED.map((act) => (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => setActiveModule(act.moduleId)}
                      className="block w-full py-2.5 text-left transition-colors hover:bg-slate-50"
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-xs font-medium text-slate-900">
                          {act.title}
                        </span>
                        <span className="shrink-0 text-[11px] text-slate-400 tabular-nums">
                          {act.timestamp}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">
                        {act.department} · {act.detail}
                      </p>
                    </button>
                  ))}
                </div>
              </section>

              {/* Department Benchmarks */}
              <section className="rounded-lg border border-slate-200 bg-white p-5">
                <h2 className="text-sm font-semibold text-slate-900 mb-3">
                  Department Pulse
                </h2>
                <div className="space-y-2.5">
                  {UNIFIED_DEPARTMENT_HEALTH.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveModule(item.moduleId)}
                      className="flex w-full items-center justify-between text-left text-xs hover:text-slate-900"
                    >
                      <div>
                        <div className="font-medium text-slate-800">{item.label}</div>
                        <div className="text-[11px] text-slate-400">{item.meta}</div>
                      </div>
                      <span className="font-mono font-semibold text-slate-900 tabular-nums">
                        {item.value}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function TitleSection({
  open,
  onCloseMobile,
}: {
  open: boolean;
  onCloseMobile: () => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 px-3 py-3.5">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="grid h-9 w-9 shrink-0 place-content-center rounded-lg bg-slate-900 text-xs font-bold tracking-tight text-white">
          AP
        </div>
        {open && (
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-slate-900">
              Attaie Unified
            </div>
            <div className="truncate text-xs text-slate-500">
              Admin & Staff Workspace
            </div>
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={onCloseMobile}
        aria-label="Close sidebar"
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 lg:hidden"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function SidebarOption({
  item,
  Icon,
  selected,
  open,
  onSelect,
}: {
  item: UnifiedNavItem;
  Icon: React.ElementType;
  selected: boolean;
  open: boolean;
  onSelect: (id: UnifiedDashboardModuleId) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item.id)}
      title={!open ? item.label : undefined}
      className={cn(
        'relative flex h-9 w-full items-center rounded-md px-2.5 text-left transition-colors',
        selected
          ? 'bg-slate-100 text-slate-900 font-medium'
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
      )}
    >
      <Icon
        className={cn(
          'h-4 w-4 shrink-0',
          selected ? 'text-slate-900' : 'text-slate-500',
        )}
      />
      {open && (
        <span className="ml-2.5 flex-1 truncate text-xs">{item.label}</span>
      )}
      {open && item.badgeCount !== undefined && (
        <span className="ml-2 font-mono text-[11px] text-slate-400 tabular-nums">
          {item.badgeCount}
        </span>
      )}
    </button>
  );
}

function ToggleClose({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      data-testid="option1-sidebar-toggle"
      onClick={onToggle}
      aria-pressed={!open}
      aria-expanded={open}
      aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
      className="hidden h-11 w-full items-center border-t border-slate-200 px-3.5 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 lg:flex"
    >
      <ChevronsRight
        className={cn(
          'h-4 w-4 shrink-0 transition-transform duration-200',
          open && 'rotate-180',
        )}
      />
      {open && <span className="ml-2.5 text-xs font-medium">Collapse</span>}
    </button>
  );
}

export default DashboardWithCollapsibleSidebar;
