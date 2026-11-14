const API = (import.meta.env?.VITE_API_URL as string | undefined) || '/api';

export interface Property {
  id: number;
  serial_number: string;
  title: string;
  price: number;
  location: string;
  beds: number | null;
  baths: number | null;
  area: number | null;
  floor: number | null;
  status: 'available' | 'pending' | 'sold' | 'rented';
  type: 'Villa' | 'Apartment' | 'House' | 'Commercial' | 'Land';
  listing_type: 'sale' | 'rent';
  image_url: string | null;
  gallery_images: string[];
  video_url: string | null;
  floor_plan_url?: string | null;
  three_d_plan_url?: string | null;
  description: string | null;
  created_at: string;
}

export interface Project {
  id: number;
  name: string;
  location: string;
  delivery_date: string | null;
  status: 'Coming Soon' | 'In Progress' | 'Sold Out' | 'Under Construction' | 'Ready';
  available_units: number;
  total_units: number;
  image_url: string | null;
  gallery_images: string[];
  video_url: string | null;
  masterplan_image: string | null;
  description: string | null;
  created_at: string;
}

export interface Agent {
  id: number;
  name: string;
  role: string;
  background: string;
  portrait_url: string;
  phone: string;
  email: string;
  whatsapp: string | null;
  published: boolean;
}

export interface Branch {
  id: number;
  name: string;
  address: string;
  phone: string | null;
  email: string | null;
}

export interface Lead {
  clientRequestId?: string;
  name: string;
  email: string;
  phone: string;
  message?: string;
  propertyId?: string;
  propertyName?: string;
}

export interface ProjectUnit {
  id: number;
  project_id: number;
  project_name?: string;
  project_location?: string;
  unit_number: string;
  title: string | null;
  beds: number | null;
  baths: number | null;
  area: number | null;
  floor: number | null;
  price: number | null;
  currency: string;
  status: 'available' | 'reserved' | 'sold' | 'rented';
  image_url: string | null;
  technical_plan_url?: string | null;
  description: string | null;
}

export interface VisitRequestInput {
  name: string;
  phone: string;
  requestedAt: string;
  label: string;
  propertyId?: number;
  projectId?: number;
  projectUnitId?: number;
}

export async function getProperties(filters?: {
  status?: string;
  type?: string;
  listing_type?: string;
  serial_number?: string;
  search?: string;
}): Promise<Property[]> {
  const params = new URLSearchParams(
    Object.fromEntries(Object.entries(filters ?? {}).filter(([, v]) => v)) as Record<string, string>
  );
  const res = await fetch(`${API}/get-properties.php?${params}`);
  if (!res.ok) throw new Error('Failed to fetch properties');
  return res.json();
}

export async function getProperty(id: number): Promise<Property> {
  const res = await fetch(`${API}/get-property.php?id=${id}`);
  if (!res.ok) throw new Error('Property not found');
  return res.json();
}

export interface GlobalSearchResponse {
  query: string;
  total: number;
  results: Property[];
}

export async function searchProperties(
  query: string,
  options?: {
    purpose?: 'buy' | 'rent' | 'commercial';
    limit?: number;
    signal?: AbortSignal;
  }
): Promise<GlobalSearchResponse> {
  const trimmed = query.trim();
  const params = new URLSearchParams();
  if (trimmed) params.set('q', trimmed);
  if (options?.purpose) params.set('purpose', options.purpose);
  if (options?.limit) params.set('limit', String(options.limit));

  try {
    const res = await fetch(`${API}/search?${params.toString()}`, {
      signal: options?.signal,
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        const items: Property[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.results)
            ? data.results
            : Array.isArray(data?.properties)
              ? data.properties
              : [];
        return {
          query: typeof data?.query === 'string' ? data.query : trimmed,
          total: typeof data?.total === 'number' ? data.total : items.length,
          results: items,
        };
      }
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw err;
    }
    // Fall back to get-properties.php if running against static PHP host without /api/search
  }

  const all = await getProperties(trimmed ? { search: trimmed } : undefined);
  const normalized = trimmed.toLowerCase();
  const limit = options?.limit ?? 20;

  let filtered = all.filter((p) => {
    if (options?.purpose === 'rent' && p.listing_type !== 'rent') return false;
    if (options?.purpose === 'commercial' && p.type !== 'Commercial') return false;
    if (!normalized) return true;
    const title = (p.title || '').toLowerCase();
    const location = (p.location || '').toLowerCase();
    const serial = (p.serial_number || '').toLowerCase();
    return (
      serial.includes(normalized) ||
      title.includes(normalized) ||
      location.includes(normalized)
    );
  });

  if (normalized) {
    filtered = filtered.sort((a, b) => {
      const aSerial = (a.serial_number || '').toLowerCase();
      const bSerial = (b.serial_number || '').toLowerCase();
      const aExact = aSerial === normalized ? 1 : 0;
      const bExact = bSerial === normalized ? 1 : 0;
      return bExact - aExact;
    });
  }

  return {
    query: trimmed,
    total: filtered.length,
    results: filtered.slice(0, limit),
  };
}

export async function getProjects(): Promise<Project[]> {
  const res = await fetch(`${API}/get-projects.php`);
  if (!res.ok) throw new Error('Failed to fetch projects');
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error('STATIC_PREVIEW_NON_JSON');
  }
  return res.json();
}

export async function getProject(id: number): Promise<Project> {
  const res = await fetch(`${API}/get-project.php?id=${id}`);
  const contentType = res.headers.get('content-type') || '';
  if (!res.ok) {
    const err = new Error('Project not found') as Error & { status?: number; isJsonApi?: boolean };
    err.status = res.status;
    err.isJsonApi = contentType.includes('application/json');
    throw err;
  }
  if (!contentType.includes('application/json')) {
    throw new Error('STATIC_PREVIEW_NON_JSON');
  }
  return res.json();
}

export async function getAgents(): Promise<Agent[]> {
  const res = await fetch(`${API}/get-agents.php`);
  if (!res.ok) throw new Error('Failed to fetch agents');
  return res.json();
}

export async function getAgent(id: number): Promise<Agent> {
  const res = await fetch(`${API}/get-agent.php?id=${id}`);
  if (!res.ok) throw new Error(res.status === 404 ? 'Agent not found' : 'Failed to fetch agent');
  return res.json();
}

export async function getBranches(): Promise<Branch[]> {
  const res = await fetch(`${API}/get-branches.php`);
  if (!res.ok) throw new Error('Failed to fetch branches');
  return res.json();
}

export interface ProjectUnitsResponse {
  items: ProjectUnit[];
  page: number;
  limit: number;
  total?: number;
  has_more?: boolean;
}

function normalizeUnitPlans(unit: ProjectUnit): ProjectUnit {
  if (unit.description && unit.description.includes('[TECHNICAL_PLAN:')) {
    const match = unit.description.match(/\[TECHNICAL_PLAN:\s*([^\]]+)\]/);
    const technical_plan_url = match ? match[1].trim() : null;
    const cleanDesc = unit.description.replace(/\[TECHNICAL_PLAN:\s*[^\]]+\]\n?/g, '').trim();
    return { ...unit, technical_plan_url, description: cleanDesc || null };
  }
  return unit;
}

export async function getProjectUnits(projectId: number): Promise<ProjectUnitsResponse> {
  const allItems: ProjectUnit[] = [];
  let page = 1;
  const limit = 100;
  let hasMore = true;

  while (hasMore && page <= 20) {
    const res = await fetch(`${API}/get-project-units.php?project_id=${projectId}&page=${page}&limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch apartments');
    const data = (await res.json()) as ProjectUnitsResponse;
    const batch = Array.isArray(data.items) ? data.items.map(normalizeUnitPlans) : [];
    allItems.push(...batch);
    hasMore = Boolean(data.has_more && batch.length > 0);
    page += 1;
  }

  return { items: allItems, page: 1, limit, total: allItems.length, has_more: false };
}

export async function getAllProjectUnits(status?: string): Promise<ProjectUnitsResponse> {
  const allItems: ProjectUnit[] = [];
  let page = 1;
  const limit = 100;
  let hasMore = true;

  while (hasMore && page <= 20) {
    const params = new URLSearchParams({ all: '1', page: String(page), limit: String(limit) });
    if (status) params.set('status', status);
    const res = await fetch(`${API}/get-project-units.php?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch project apartments');
    const data = (await res.json()) as ProjectUnitsResponse;
    const batch = Array.isArray(data.items) ? data.items.map(normalizeUnitPlans) : [];
    allItems.push(...batch);
    hasMore = Boolean(data.has_more && batch.length > 0);
    page += 1;
  }

  return { items: allItems, page: 1, limit, total: allItems.length, has_more: false };
}

export interface CareerJob {
  id: number;
  title: string;
  location: string;
  employment_type: string;
  description: string;
  qualifications: string;
  deadline_at: string;
  status: 'draft' | 'published' | 'closed';
  effective_status?: 'published' | 'closed';
  is_expired?: boolean;
  created_at: string;
  updated_at?: string;
}

export async function getCareers(): Promise<CareerJob[]> {
  const res = await fetch(`${API}/get-careers.php`);
  if (!res.ok) throw new Error('Failed to fetch career announcements');
  return res.json();
}

export async function getCareer(id: number): Promise<CareerJob> {
  const res = await fetch(`${API}/get-career.php?id=${id}`);
  if (!res.ok) throw new Error(res.status === 404 ? 'Career announcement not found' : 'Failed to fetch career announcement');
  return res.json();
}

export async function submitCareerApplication(formData: FormData): Promise<{ success: boolean; id: number }> {
  const res = await fetch(`${API}/submit-career-application.php`, {
    method: 'POST',
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to submit job application');
  }
  return data;
}

export async function submitVisitRequest(input: VisitRequestInput): Promise<{ success: boolean; id: number }> {
  const { label: _label, ...payload } = input;
  const res = await fetch(`${API}/submit-visit-request.php`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to request a visit');
  return data;
}

export interface SiteSeoSettings {
  id?: number;
  site_name: string;
  default_title: string;
  title_template: string;
  default_description: string;
  keywords: string | null;
  og_image: string | null;
  twitter_image: string | null;
  twitter_card: 'summary_large_image' | 'summary';
  twitter_site: string | null;
  canonical_base_url: string;
  robots_index: boolean;
  updated_at?: string | null;
}

export async function getSeoSettings(): Promise<SiteSeoSettings | null> {
  try {
    const res = await fetch(`${API}/get-seo-settings.php`);
    if (res.ok) {
      const data = (await res.json()) as SiteSeoSettings;
      if (data && data.default_title) {
        try {
          localStorage.setItem('attaie_seo_settings_v1', JSON.stringify(data));
        } catch {
          // ignore storage quota errors
        }
        return data;
      }
    }
  } catch {
    // Fallback to local cache if PHP backend is unavailable
  }

  try {
    const cached = localStorage.getItem('attaie_seo_settings_v1');
    if (cached) {
      return JSON.parse(cached) as SiteSeoSettings;
    }
  } catch {
    // ignore
  }
  return null;
}

export interface InquirySubmissionResult {
  success: true;
  id: number;
  receipt: { reference: string; submittedAt: string; customerName: string; propertyName: string };
}

export async function createLead(lead: Lead): Promise<InquirySubmissionResult> {
  const res = await fetch(`${API}/submit-lead.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(lead),
  });
  if (!res.ok) throw new Error('Failed to submit inquiry');
  return res.json();
}

