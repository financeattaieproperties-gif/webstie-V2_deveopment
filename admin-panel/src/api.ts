const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api';
const CSRF_STORAGE_KEY = 'admin_csrf_token';

async function getCsrfToken(forceRefresh = false): Promise<string> {
  if (forceRefresh) {
    sessionStorage.removeItem(CSRF_STORAGE_KEY);
  } else {
    const cached = sessionStorage.getItem(CSRF_STORAGE_KEY);
    if (cached) return cached;
  }
  try {
    const res = await fetch(`${BASE}/admin/csrf.php`, { credentials: 'include' });
    if (res.ok) {
      const data = (await res.json()) as { csrf_token?: string };
      if (data.csrf_token) {
        sessionStorage.setItem(CSRF_STORAGE_KEY, data.csrf_token);
        return data.csrf_token;
      }
    }
  } catch {
    // fallback if offline
  }
  return '';
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const method = (options?.method ?? 'GET').toUpperCase();
  const isMutation = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options?.headers as Record<string, string>) ?? {}),
  };

  if (isMutation && !path.includes('admin-login')) {
    const token = await getCsrfToken();
    if (token) {
      headers['X-CSRF-Token'] = token;
    }
  }

  let res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    ...options,
    headers,
  });

  // If CSRF token in sessionStorage is stale (403), refresh token once and retry
  if (res.status === 403 && isMutation && !path.includes('admin-login')) {
    const freshToken = await getCsrfToken(true);
    if (freshToken) {
      headers['X-CSRF-Token'] = freshToken;
      res = await fetch(`${BASE}${path}`, {
        credentials: 'include',
        ...options,
        headers,
      });
    }
  }

  if (!res.ok) {
    if (res.status === 401 && !path.includes('admin-login')) {
      sessionStorage.removeItem('admin_logged_in');
      sessionStorage.removeItem(CSRF_STORAGE_KEY);
      window.location.reload();
    }
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

async function chatRequest<T>(action:string,body?:Record<string,unknown>):Promise<T> {
  const root=BASE.replace(/\/api\/?$/,'');
  const token=body ? await getCsrfToken() : '';
  const response=await fetch(`${root}/chat-service.php?action=${action}`,{method:body?'POST':'GET',credentials:'include',cache:'no-store',headers:{'Content-Type':'application/json',...(token?{'X-CSRF-Token':token}:{})},...(body?{body:JSON.stringify(body)}:{})});
  if(!response.ok) throw new Error('Chat request failed. Your change was not confirmed.');
  return response.json() as Promise<T>;
}
export const api = {
  login: async (username: string, password: string) => {
    const res = await request<{ success: boolean; csrf_token?: string }>('/admin-login.php', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    if (res.csrf_token) {
      sessionStorage.setItem(CSRF_STORAGE_KEY, res.csrf_token);
    }
    return res;
  },
  logout: async () => {
    try {
      return await request<{ success: boolean }>('/admin-logout.php', { method: 'POST' });
    } finally {
      sessionStorage.removeItem(CSRF_STORAGE_KEY);
    }
  },
  getCsrf: () => getCsrfToken(),

  getProperties:    () => request<Property[]>('/admin/properties.php'),
  createProperty:   (data: PropertyInput) =>
    request<{ id: number }>('/admin/properties.php', { method: 'POST', body: JSON.stringify(data) }),
  updateProperty:   (data: PropertyInput & { id: number }) =>
    request<{ updated: number }>('/admin/properties.php', { method: 'PUT', body: JSON.stringify(data) }),
  deleteProperty:   (id: number) =>
    request<{ deleted: number }>(`/admin/properties.php?id=${id}`, { method: 'DELETE' }),

  getProjects:      () => request<Project[]>('/admin/projects.php'),
  createProject:    (data: ProjectInput) =>
    request<{ id: number }>('/admin/projects.php', { method: 'POST', body: JSON.stringify(data) }),
  updateProject:    (data: ProjectInput & { id: number }) =>
    request<{ updated: number }>('/admin/projects.php', { method: 'PUT', body: JSON.stringify(data) }),
  deleteProject:    (id: number) =>
    request<{ deleted: number }>(`/admin/projects.php?id=${id}`, { method: 'DELETE' }),

  getProjectUnits: async (projectId: number): Promise<ProjectUnit[]> => {
    const list = await request<ProjectUnit[]>(`/admin/project-units.php?project_id=${projectId}`);
    return (list || []).map(u => {
      if (u.description && u.description.includes('[TECHNICAL_PLAN:')) {
        const match = u.description.match(/\[TECHNICAL_PLAN:\s*([^\]]+)\]/);
        const technical_plan_url = match ? match[1].trim() : null;
        const cleanDesc = u.description.replace(/\[TECHNICAL_PLAN:\s*[^\]]+\]\n?/g, '').trim();
        return { ...u, technical_plan_url, description: cleanDesc || null };
      }
      return u;
    });
  },
  createProjectUnit: (data: ProjectUnitInput) => {
    const { technical_plan_url, description, ...rest } = data;
    const cleanDesc = description ? description.replace(/\[TECHNICAL_PLAN:\s*[^\]]+\]\n?/g, '').trim() : '';
    const payloadDesc = technical_plan_url
      ? `[TECHNICAL_PLAN: ${technical_plan_url.trim()}]${cleanDesc ? `\n${cleanDesc}` : ''}`
      : (cleanDesc || null);
    return request<{ id: number }>('/admin/project-units.php', {
      method: 'POST',
      body: JSON.stringify({ ...rest, description: payloadDesc }),
    });
  },
  updateProjectUnit: (data: ProjectUnitInput & { id: number }) => {
    const { technical_plan_url, description, ...rest } = data;
    const cleanDesc = description ? description.replace(/\[TECHNICAL_PLAN:\s*[^\]]+\]\n?/g, '').trim() : '';
    const payloadDesc = technical_plan_url
      ? `[TECHNICAL_PLAN: ${technical_plan_url.trim()}]${cleanDesc ? `\n${cleanDesc}` : ''}`
      : (cleanDesc || null);
    return request<{ updated: number }>('/admin/project-units.php', {
      method: 'PUT',
      body: JSON.stringify({ ...rest, description: payloadDesc }),
    });
  },
  deleteProjectUnit: (id: number) =>
    request<{ deleted: number }>(`/admin/project-units.php?id=${id}`, { method: 'DELETE' }),

  getAgents: () => request<Agent[]>('/admin/agents.php'),
  createAgent: (data: AgentInput) => request<{ id: number }>('/admin/agents.php', { method: 'POST', body: JSON.stringify(data) }),
  updateAgent: (data: AgentInput & { id: number }) => request<{ updated: number }>('/admin/agents.php', { method: 'PUT', body: JSON.stringify(data) }),
  deleteAgent: (id: number) => request<{ deleted: number }>(`/admin/agents.php?id=${id}`, { method: 'DELETE' }),
  getBranches: () => request<Branch[]>('/admin/branches.php'),
  createBranch: (data: BranchInput) => request<{ id: number }>('/admin/branches.php', { method: 'POST', body: JSON.stringify(data) }),
  updateBranch: (data: BranchInput & { id: number }) => request<{ updated: number }>('/admin/branches.php', { method: 'PUT', body: JSON.stringify(data) }),
  deleteBranch: (id: number) => request<{ deleted: number }>(`/admin/branches.php?id=${id}`, { method: 'DELETE' }),

  getLeads: () => request<Lead[]>('/admin/leads.php'),
  updateInquiryFollowup: (id: number, body: {version: number; status: 'new' | 'in_progress' | 'resolved'; notes: string; followupAt: string | null}) =>
    request<Lead>('/admin/leads.php', {method: 'PUT', body: JSON.stringify({id, ...body})}),
  getSubmissions: () => request<SubmissionPost[]>('/admin/submissions.php'),
  updateSubmissionStatus: (payload: {
    id: number;
    version: number;
    action: 'approve' | 'publish' | 'reject';
    price?: number;
    listing_type?: 'sale' | 'rent';
    beds?: number | null;
    baths?: number | null;
    area?: number | null;
    floor?: number | null;
    reason?: string;
  }) =>
    request<{
      ok: boolean;
      submission_status: SubmissionPost['submission_status'];
      website_property_id?: number;
      serial_number?: string;
    }>('/admin/submissions.php', { method: 'PUT', body: JSON.stringify(payload) }),
  getVisitRequests: () => request<VisitRequest[]>('/admin/visit-requests.php'),
  updateVisitRequest: (id: number, status: VisitRequest['status'], staff_note: string) =>
    request<{ success: boolean }>('/admin/visit-requests.php', { method: 'PUT', body: JSON.stringify({ id, status, staff_note }) }),

  getCareers: () => request<CareerJob[]>('/admin/careers.php'),
  createCareer: (data: CareerJobInput) =>
    request<{ id: number }>('/admin/careers.php', { method: 'POST', body: JSON.stringify(data) }),
  updateCareer: (data: CareerJobInput & { id: number }) =>
    request<{ updated: number }>('/admin/careers.php', { method: 'PUT', body: JSON.stringify(data) }),
  deleteCareer: (id: number) =>
    request<{ deleted: number }>(`/admin/careers.php?id=${id}`, { method: 'DELETE' }),
  getCareerApplications: (jobId?: number) =>
    request<CareerApplication[]>(jobId ? `/admin/career-applications.php?job_id=${jobId}` : '/admin/career-applications.php'),
  getCareerFileUrl: (id: number, type: 'photo' | 'cv', download = false) =>
    `${BASE}/admin/career-file.php?id=${id}&type=${type}${download ? '&download=1' : ''}`,

  getSeoSettings: async (): Promise<SeoSettings> => {
    try {
      const data = await request<SeoSettings>('/admin/seo-settings.php');
      try {
        localStorage.setItem('attaie_seo_settings_v1', JSON.stringify(data));
      } catch {
        // ignore storage quota errors
      }
      return data;
    } catch {
      const cached = localStorage.getItem('attaie_seo_settings_v1');
      if (cached) {
        try {
          return JSON.parse(cached) as SeoSettings;
        } catch {
          // fall through to defaults
        }
      }
      return DEFAULT_SEO_SETTINGS;
    }
  },

  updateSeoSettings: async (data: SeoSettingsInput): Promise<SeoSettings> => {
    const merged: SeoSettings = {
      ...DEFAULT_SEO_SETTINGS,
      ...data,
      id: 1,
      updated_at: new Date().toISOString(),
    };
    try {
      localStorage.setItem('attaie_seo_settings_v1', JSON.stringify(merged));
    } catch {
      // ignore storage quota errors
    }
    try {
      const saved = await request<SeoSettings>('/admin/seo-settings.php', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      try {
        localStorage.setItem('attaie_seo_settings_v1', JSON.stringify(saved));
      } catch {
        // ignore
      }
      return saved;
    } catch {
      // If running in static preview without PHP backend, persist in localStorage
      return merged;
    }
  },

  getSeoKeywords: async (): Promise<SeoKeywordsResponse> => {
    const syncLocal = (resp: SeoKeywordsResponse) => {
      try {
        localStorage.setItem('attaie_seo_keywords_v1', JSON.stringify(resp.keywords));
        const rawSettings = localStorage.getItem('attaie_seo_settings_v1');
        const settingsObj = rawSettings
          ? (JSON.parse(rawSettings) as SeoSettings)
          : { ...DEFAULT_SEO_SETTINGS };
        localStorage.setItem(
          'attaie_seo_settings_v1',
          JSON.stringify({ ...settingsObj, keywords: resp.active_keywords }),
        );
      } catch {
        // ignore storage quota errors
      }
      return resp;
    };

    try {
      const data = await request<SeoKeywordsResponse>('/admin/seo-keywords.php');
      if (data && Array.isArray(data.keywords)) {
        return syncLocal(data);
      }
    } catch {
      // Fallback to local cache if PHP backend is unavailable
    }

    try {
      const cached = localStorage.getItem('attaie_seo_keywords_v1');
      if (cached) {
        const items = JSON.parse(cached) as SeoKeywordItem[];
        const active_keywords = items
          .filter(i => i.enabled)
          .map(i => i.keyword)
          .join(', ');
        return { keywords: items, active_keywords };
      }
    } catch {
      // ignore
    }

    const fallbackItems: SeoKeywordItem[] = (DEFAULT_SEO_SETTINGS.keywords || '')
      .split(',')
      .map(k => k.trim())
      .filter(Boolean)
      .map((keyword, idx) => ({ id: idx + 1, keyword, enabled: true }));
    return syncLocal({
      keywords: fallbackItems,
      active_keywords: fallbackItems.map(i => i.keyword).join(', '),
    });
  },

  addSeoKeyword: async (keyword: string, enabled = true): Promise<SeoKeywordsResponse> => {
    const resp = await request<SeoKeywordsResponse>('/admin/seo-keywords.php', {
      method: 'POST',
      body: JSON.stringify({ keyword, enabled }),
    });
    try {
      localStorage.setItem('attaie_seo_keywords_v1', JSON.stringify(resp.keywords));
      const rawSettings = localStorage.getItem('attaie_seo_settings_v1');
      const settingsObj = rawSettings ? (JSON.parse(rawSettings) as SeoSettings) : { ...DEFAULT_SEO_SETTINGS };
      localStorage.setItem('attaie_seo_settings_v1', JSON.stringify({ ...settingsObj, keywords: resp.active_keywords }));
    } catch {
      // ignore
    }
    return resp;
  },

  toggleSeoKeyword: async (id: number, enabled: boolean): Promise<SeoKeywordsResponse> => {
    const resp = await request<SeoKeywordsResponse>('/admin/seo-keywords.php', {
      method: 'PUT',
      body: JSON.stringify({ id, enabled }),
    });
    try {
      localStorage.setItem('attaie_seo_keywords_v1', JSON.stringify(resp.keywords));
      const rawSettings = localStorage.getItem('attaie_seo_settings_v1');
      const settingsObj = rawSettings ? (JSON.parse(rawSettings) as SeoSettings) : { ...DEFAULT_SEO_SETTINGS };
      localStorage.setItem('attaie_seo_settings_v1', JSON.stringify({ ...settingsObj, keywords: resp.active_keywords }));
    } catch {
      // ignore
    }
    return resp;
  },

  toggleAllSeoKeywords: async (enabled: boolean): Promise<SeoKeywordsResponse> => {
    const resp = await request<SeoKeywordsResponse>('/admin/seo-keywords.php', {
      method: 'PUT',
      body: JSON.stringify({ action: 'set_all', enabled }),
    });
    try {
      localStorage.setItem('attaie_seo_keywords_v1', JSON.stringify(resp.keywords));
      const rawSettings = localStorage.getItem('attaie_seo_settings_v1');
      const settingsObj = rawSettings ? (JSON.parse(rawSettings) as SeoSettings) : { ...DEFAULT_SEO_SETTINGS };
      localStorage.setItem('attaie_seo_settings_v1', JSON.stringify({ ...settingsObj, keywords: resp.active_keywords }));
    } catch {
      // ignore
    }
    return resp;
  },

  deleteSeoKeyword: async (id: number): Promise<SeoKeywordsResponse> => {
    const resp = await request<SeoKeywordsResponse>(`/admin/seo-keywords.php?id=${id}`, {
      method: 'DELETE',
    });
    try {
      localStorage.setItem('attaie_seo_keywords_v1', JSON.stringify(resp.keywords));
      const rawSettings = localStorage.getItem('attaie_seo_settings_v1');
      const settingsObj = rawSettings ? (JSON.parse(rawSettings) as SeoSettings) : { ...DEFAULT_SEO_SETTINGS };
      localStorage.setItem('attaie_seo_settings_v1', JSON.stringify({ ...settingsObj, keywords: resp.active_keywords }));
    } catch {
      // ignore
    }
    return resp;
  },

  restoreDefaultSeoKeywords: async (): Promise<SeoKeywordsResponse> => {
    const resp = await request<SeoKeywordsResponse>('/admin/seo-keywords.php', {
      method: 'POST',
      body: JSON.stringify({ action: 'restore_defaults' }),
    });
    try {
      localStorage.setItem('attaie_seo_keywords_v1', JSON.stringify(resp.keywords));
      const rawSettings = localStorage.getItem('attaie_seo_settings_v1');
      const settingsObj = rawSettings ? (JSON.parse(rawSettings) as SeoSettings) : { ...DEFAULT_SEO_SETTINGS };
      localStorage.setItem('attaie_seo_settings_v1', JSON.stringify({ ...settingsObj, keywords: resp.active_keywords }));
    } catch {
      // ignore
    }
    return resp;
  },

  fetchSitemapStatusJson: async (): Promise<SitemapStatusData> => {
    const baseRoot = BASE.replace(/\/api\/?$/, '');
    const candidates = [
      `/sitemap-status.json?t=${Date.now()}`,
      ...(baseRoot ? [`${baseRoot}/sitemap-status.json?t=${Date.now()}`] : []),
    ];

    let lastError: Error | null = null;
    for (const url of candidates) {
      try {
        const res = await fetch(url, {
          cache: 'no-store',
          headers: { Accept: 'application/json' },
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status} fetching sitemap-status.json`);
        }
        const data = (await res.json()) as SitemapStatusData;
        if (data && typeof data.generated_at === 'string' && data.counts) {
          return data;
        }
      } catch (err) {
        lastError = err instanceof Error ? err : new Error('Failed to load sitemap-status.json');
      }
    }
    throw lastError ?? new Error('Unable to load sitemap-status.json');
  },

  fetchSitemapXmlText: async (): Promise<string> => {
    const baseRoot = BASE.replace(/\/api\/?$/, '');
    const candidates = [
      `/sitemap.xml?t=${Date.now()}`,
      ...(baseRoot ? [`${baseRoot}/sitemap.xml?t=${Date.now()}`] : []),
    ];
    for (const url of candidates) {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (res.ok) {
          const text = await res.text();
          if (text.includes('<urlset')) return text;
        }
      } catch {
        // try next candidate
      }
    }
    return '';
  },

  getSitemapStatus: async (): Promise<SitemapCrawlReport> => {
    try {
      const report = await request<SitemapCrawlReport>('/admin/sitemap.php');
      if (report && report.counts) {
        return report;
      }
    } catch {
      // Fallback to static /sitemap-status.json + /sitemap.xml when PHP endpoint is unavailable
    }
    const [statusJson, xmlText] = await Promise.all([
      api.fetchSitemapStatusJson(),
      api.fetchSitemapXmlText(),
    ]);
    return {
      ...statusJson,
      xml: statusJson.xml ?? xmlText,
    };
  },

  generateSitemap: async (canonicalBaseUrl?: string): Promise<SitemapCrawlReport> => {
    try {
      return await request<SitemapCrawlReport>('/admin/sitemap.php', {
        method: 'POST',
        body: JSON.stringify(canonicalBaseUrl ? { canonical_base_url: canonicalBaseUrl } : {}),
      });
    } catch {
      const [statusJson, xmlText] = await Promise.all([
        api.fetchSitemapStatusJson(),
        api.fetchSitemapXmlText(),
      ]);
      const nowIso = new Date().toISOString();
      const base = (canonicalBaseUrl || statusJson.canonical_base_url || 'https://www.attaieproperties.com').replace(/\/+$/, '');
      return {
        ...statusJson,
        generated_at: nowIso,
        canonical_base_url: base,
        sitemap_url: `${base}/sitemap.xml`,
        xml: statusJson.xml ?? xmlText,
      };
    }
  },

  uploadImage: async (file: File, purpose?: 'blueprint' | 'gallery'): Promise<string> => {
    const buildForm = () => {
      const form = new FormData();
      form.append('image', file);
      if (purpose) {
        form.append('purpose', purpose);
      }
      return form;
    };

    const token = await getCsrfToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['X-CSRF-Token'] = token;
    }
    const endpoint = `${BASE}/admin/upload.php${purpose ? `?purpose=${encodeURIComponent(purpose)}` : ''}`;
    let res = await fetch(endpoint, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: buildForm(),
    });

    if (res.status === 403) {
      const freshToken = await getCsrfToken(true);
      if (freshToken) {
        headers['X-CSRF-Token'] = freshToken;
        res = await fetch(endpoint, {
          method: 'POST',
          credentials: 'include',
          headers,
          body: buildForm(),
        });
      }
    }

    if (res.status === 401) {
      sessionStorage.removeItem('admin_logged_in');
      sessionStorage.removeItem(CSRF_STORAGE_KEY);
      window.location.reload();
      throw new Error('Your admin session expired. Please sign in again.');
    }

    if (res.ok) {
      const data = (await res.json()) as { url: string };
      return data.url;
    }

    const errBody = (await res.json().catch(() => ({}))) as { error?: string };

    // Fallback: if multipart upload returned 400 (e.g. cPanel tmp dir or multipart limit), retry as base64 JSON
    if (res.status === 400) {
      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ''));
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsDataURL(file);
        });
        const retryRes = await fetch(endpoint, {
          method: 'POST',
          credentials: 'include',
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image_base64: base64,
            filename: file.name,
            purpose: purpose ?? '',
          }),
        });
        if (retryRes.ok) {
          const retryData = (await retryRes.json()) as { url: string };
          return retryData.url;
        }
        const retryErr = (await retryRes.json().catch(() => ({}))) as { error?: string };
        if (retryErr.error) {
          throw new Error(retryErr.error);
        }
      } catch (fallbackErr) {
        if (fallbackErr instanceof Error && fallbackErr.message !== 'Failed to read file') {
          throw fallbackErr;
        }
      }
    }

    throw new Error(errBody.error || `Upload failed (HTTP ${res.status})`);
  },

  getChatConversations: async (): Promise<ChatConversation[]> => {
    const data=await chatRequest<{conversations:ChatConversation[]}>('admin_list');
    if(!Array.isArray(data.conversations)) throw new Error('Invalid chat response');
    return data.conversations;
  },
  replyToChat: async (sessionId:string,message:string,adminName='Attaie Admin',clientMessageId:string=crypto.randomUUID()): Promise<ChatConversation|null> => {
    const data=await chatRequest<{conversation:ChatConversation}>('admin_reply',{session_id:sessionId,message,admin_name:adminName,client_message_id:clientMessageId});
    if(!data.conversation) throw new Error('Chat reply was not confirmed');
    return data.conversation;
  },
  markChatRead: async (sessionId:string):Promise<void> => { await chatRequest('admin_mark_read',{session_id:sessionId}); },
  sendAdminTypingSignal: async (sessionId:string,isTyping:boolean,adminName='Attaie Admin'):Promise<void> => {
    try { await chatRequest('typing',{session_id:sessionId,actor:'admin',actor_name:adminName,is_typing:isTyping}); }
    catch { /* Typing is ephemeral; message mutations report transport errors separately. */ }
  },
  updateChatStatus: async (sessionId:string,status:'open'|'resolved'):Promise<void> => {await chatRequest('admin_status',{session_id:sessionId,status});},
  deleteChatConversation: async (sessionId:string):Promise<void> => {await chatRequest('admin_delete',{session_id:sessionId});},
  getAiAdminSettings: async (): Promise<AiAdminSettings> => {
    const baseRoot = BASE.replace(/\/api\/?$/, '');
    const token = await getCsrfToken();
    const res = await fetch(`${baseRoot}/ai-chat/admin-settings.php`, {
      credentials: 'include',
      headers: token ? { 'X-CSRF-Token': token } : {},
      cache: 'no-store',
    });
    const ct = res.headers.get('content-type') || '';
    if (res.ok && ct.includes('application/json')) {
      const data = (await res.json()) as { settings: AiAdminSettings };
      return data.settings;
    }
    throw new Error(`Unable to load AI settings from PHP backend (HTTP ${res.status}).`);
  },

  saveAiProviderKey: async (payload: {
    provider: 'openai' | 'gemini' | 'anthropic';
    api_key: string;
    model: string;
  }): Promise<{ message: string; settings: AiAdminSettings }> => {
    const baseRoot = BASE.replace(/\/api\/?$/, '');
    const token = await getCsrfToken();
    const res = await fetch(`${baseRoot}/ai-chat/admin-settings.php`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'X-CSRF-Token': token } : {}),
      },
      body: JSON.stringify({
        action: 'save_provider_key',
        ...payload,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
      message?: string;
      settings?: AiAdminSettings;
    };
    if (!res.ok || !data.ok || !data.settings) {
      throw new Error(data.error || `Failed to save API key (HTTP ${res.status})`);
    }
    return { message: data.message || 'Saved.', settings: data.settings };
  },

  deleteAiProviderKey: async (
    provider: 'openai' | 'gemini' | 'anthropic'
  ): Promise<{ message: string; settings: AiAdminSettings }> => {
    const baseRoot = BASE.replace(/\/api\/?$/, '');
    const token = await getCsrfToken();
    const res = await fetch(`${baseRoot}/ai-chat/admin-settings.php`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'X-CSRF-Token': token } : {}),
      },
      body: JSON.stringify({
        action: 'delete_provider_key',
        provider,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
      message?: string;
      settings?: AiAdminSettings;
    };
    if (!res.ok || !data.ok || !data.settings) {
      throw new Error(data.error || `Failed to delete API key (HTTP ${res.status})`);
    }
    return { message: data.message || 'Deleted.', settings: data.settings };
  },

  activateAiProvider: async (payload: {
    provider: 'openai' | 'gemini' | 'anthropic';
    model: string;
    enabled?: boolean;
    allow_fallback?: boolean;
    max_output_tokens?: number;
    daily_request_limit?: number;
    retention_days?: number;
  }): Promise<{ message: string; settings: AiAdminSettings }> => {
    const baseRoot = BASE.replace(/\/api\/?$/, '');
    const token = await getCsrfToken();
    const res = await fetch(`${baseRoot}/ai-chat/admin-settings.php`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'X-CSRF-Token': token } : {}),
      },
      body: JSON.stringify({
        action: 'activate_provider',
        ...payload,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
      message?: string;
      settings?: AiAdminSettings;
    };
    if (!res.ok || !data.ok || !data.settings) {
      throw new Error(data.error || `Failed to activate provider (HTTP ${res.status})`);
    }
    return { message: data.message || 'Updated.', settings: data.settings };
  },

  testAiProviderConnection: async (payload: {
    provider: 'openai' | 'gemini' | 'anthropic';
    model: string;
    api_key?: string;
  }): Promise<{ ok: boolean; message?: string; sample?: string; error?: string; settings?: AiAdminSettings }> => {
    const baseRoot = BASE.replace(/\/api\/?$/, '');
    const token = await getCsrfToken();
    const res = await fetch(`${baseRoot}/ai-chat/admin-settings.php`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'X-CSRF-Token': token } : {}),
      },
      body: JSON.stringify({
        action: 'test_connection',
        ...payload,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      message?: string;
      sample?: string;
      error?: string;
      settings?: AiAdminSettings;
    };
    return {
      ok: Boolean(res.ok && data.ok),
      message: data.message,
      sample: data.sample,
      error: data.error,
      settings: data.settings,
    };
  },
};

export interface AiProviderConfig {
  id: 'openai' | 'gemini' | 'anthropic';
  label: string;
  models: Record<string, string>;
  default_model: string;
  billing_note: string;
  selected_model: string;
  has_key: boolean;
  masked_key: string;
  updated_at: string | null;
  last_test_ok: boolean | null;
}

export interface AiAdminSettings {
  enabled: boolean;
  active_provider: 'openai' | 'gemini' | 'anthropic';
  active_model: string;
  allow_fallback: boolean;
  max_output_tokens: number;
  daily_request_limit: number;
  retention_days: number;
  handoff_channel: string;
  storage_outside_webroot: boolean;
  providers: Record<'openai' | 'gemini' | 'anthropic', AiProviderConfig>;
}

export interface SitemapCrawlUrl {
  loc: string;
  lastmod: string;
  changefreq: string;
  priority: string;
  category: 'static' | 'properties' | 'projects' | 'careers' | 'agents';
  title: string;
  image_count: number;
}

export interface SitemapStatusData {
  generated_at: string;
  canonical_base_url: string;
  sitemap_url: string;
  counts: {
    static: number;
    properties: number;
    projects: number;
    careers: number;
    agents: number;
    total: number;
  };
  urls: SitemapCrawlUrl[];
  xml?: string;
}

export interface SitemapCrawlReport extends SitemapStatusData {
  xml: string;
}

export interface SeoSettings {
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

export interface SeoKeywordItem {
  id: number;
  keyword: string;
  enabled: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface SeoKeywordsResponse {
  success?: boolean;
  added?: number;
  keywords: SeoKeywordItem[];
  active_keywords: string;
}

export type SeoSettingsInput = Omit<SeoSettings, 'id' | 'updated_at'>;

export const DEFAULT_SEO_SETTINGS: SeoSettings = {
  id: 1,
  site_name: 'Attaie Properties',
  default_title: 'Attaie Properties — Premier Real Estate in Kabul, Afghanistan',
  title_template: '%s | Attaie Properties',
  default_description:
    'Browse verified luxury villas, modern apartments, commercial spaces, and development projects for sale and rent across Kabul with Attaie Properties.',
  keywords:
    'Attaie Properties, Kabul real estate, properties for sale in Kabul, properties for rent in Kabul, luxury villas Kabul, apartments in Kabul, Afghanistan property agency',
  og_image: '/logo.png',
  twitter_image: null,
  twitter_card: 'summary_large_image',
  twitter_site: '@AttaieProps',
  canonical_base_url: 'https://www.attaieproperties.com',
  robots_index: true,
  updated_at: null,
};

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
  floor_plan_url: string | null;
  three_d_plan_url: string | null;
  description: string | null;
  created_at: string;
}

export type PropertyInput = Omit<Property, 'id' | 'created_at'>;

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

export type ProjectInput = Omit<Project, 'id' | 'created_at'>;

export interface ProjectUnit {
  id: number;
  project_id: number;
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

export type ProjectUnitInput = Omit<ProjectUnit, 'id'>;

export interface Agent {
  id: number; name: string; role: string; background: string; portrait_url: string;
  phone: string; email: string; whatsapp: string | null; published: boolean; created_at?: string;
}
export type AgentInput = Omit<Agent, 'id' | 'created_at'>;

export interface Branch {
  id: number; name: string; address: string; phone: string | null; email: string | null; created_at?: string;
}
export type BranchInput = Omit<Branch, 'id' | 'created_at'>;

export interface Lead {
  receipt_reference?: string | null;
  receipt_submitted_at?: string | null;
  followup_status?: 'new' | 'in_progress' | 'resolved';
  followup_notes?: string | null;
  followup_at?: string | null;
  version?: number | string;
  id: number;
  name: string;
  email: string;
  phone: string;
  message: string | null;
  property_id: string | null;
  property_name: string | null;
  stage: string;
  source: string;
  status: string;
  created_at: string;
}

export interface VisitRequest {
  id: number; name: string; phone: string; listing_name: string; requested_at: string;
  status: 'pending' | 'confirmed' | 'declined' | 'completed' | 'cancelled'; staff_note: string | null;
  events: Array<{ previous_status: string | null; next_status: string; actor: string; note: string | null; created_at: string }>;
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
  is_expired?: boolean;
  application_count?: number;
  created_at: string;
  updated_at?: string;
}

export type CareerJobInput = Omit<CareerJob, 'id' | 'is_expired' | 'application_count' | 'created_at' | 'updated_at'>;

export interface CareerApplication {
  id: number;
  job_id: number;
  job_title: string;
  name: string;
  father_name: string;
  email: string;
  phone: string;
  address: string;
  photo_original_name: string;
  photo_mime_type: string;
  photo_size: number;
  cv_original_name: string;
  cv_mime_type: string;
  cv_size: number;
  created_at: string;
}

export interface ChatMessage {
  client_message_id?: string;
  delivery_status?: 'pending' | 'confirmed' | 'needs_attention';
  id: string;
  sender: 'customer' | 'admin' | 'system';
  sender_name: string;
  text: string;
  created_at: string;
  read_status?: 'sent' | 'read';
  read_at?: string | null;
}

export interface ChatConversation {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  property_id?: string | null;
  property_name?: string | null;
  page_context?: string | null;
  status: 'open' | 'resolved';
  unread_admin: number;
  unread_customer: number;
  typing_customer_at?: string | null;
  typing_admin_at?: string | null;
  typing_admin_name?: string | null;
  is_customer_typing?: boolean;
  is_admin_typing?: boolean;
  created_at: string;
  updated_at: string;
  messages: ChatMessage[];
}

export interface SubmissionPost {
  id: number;
  version: number;
  marketing_entry_id?: number;
  property_serial: string;
  customer_name: string;
  address: string;
  property_type: 'House' | 'Apartment' | 'Shop' | 'Villa' | 'Commercial' | 'Land' | 'Block' | 'Building';
  property_info_note: string;
  photos: string[];
  social_platform: string;
  submission_status: 'Submitted' | 'Approved' | 'Published' | 'Rejected';
  submitted_by: string;
  approved_by?: string | null;
  published_by?: string | null;
  rejected_reason?: string | null;
  website_property_id?: number | null;
  created_at: string;
  updated_at?: string;
}


