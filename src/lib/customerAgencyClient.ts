/**
 * Customer-only agency verification API. Caller supplies a CURRENT Firebase ID token
 * from the dedicated customer authentication provider. No tokens are stored here.
 */
const ROOT = (import.meta.env?.VITE_API_URL as string | undefined) || '/api';

export type AgencyStatus = 'pending' | 'verified' | 'rejected';
export type ContactMethod = 'email' | 'phone';

export interface AgencyApplication {
  id: number;
  legal_name: string;
  public_name: string;
  registration_reference: string | null;
  description: string | null;
  verification_status: AgencyStatus;
  operational_status: 'active' | 'suspended';
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface RepresentativeInfo {
  representative_name: string;
  representative_position: string;
  representative_contact_method: ContactMethod;
  business_email: string;
  business_phone_e164: string;
}

export interface AgencyDocument {
  id: number;
  document_type: 'registration' | 'license';
  original_filename: string;
  byte_size: number;
  uploaded_at: string;
}

export interface AgencyDocumentsResponse {
  verification_status: AgencyStatus;
  documents: AgencyDocument[];
}

async function customerRequest<T>(
  path: string,
  token: string,
  options: { method?: 'GET' | 'POST'; body?: BodyInit; isJson?: boolean } = {},
): Promise<T> {
  if (!token || token.length < 20) throw new Error('Sign in with a verified account first.');
  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
  };
  if (options.isJson) headers['Content-Type'] = 'application/json';
  const response = await fetch(`${ROOT}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body,
    cache: 'no-store',
    credentials: 'omit',
  });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const reason = typeof data === 'object' && data !== null && 'error' in data && typeof data.error === 'string'
      ? data.error
      : 'Agency request failed. Please try again.';
    throw new Error(reason);
  }
  return data as T;
}

export const customerAgencyApi = {
  getApplication: (token: string) =>
    customerRequest<{ agency: AgencyApplication | null }>('/customer/agencies.php', token),
  createApplication: (token: string, data: Pick<AgencyApplication, 'legal_name' | 'public_name'> & {
    registration_reference: string; description: string
  }) => customerRequest<{ agency: AgencyApplication }>('/customer/agencies.php', token, {
    method: 'POST', body: JSON.stringify(data), isJson: true,
  }),
  getRepresentative: (token: string) =>
    customerRequest<{ agency: RepresentativeInfo & { id: number; verification_status: AgencyStatus } }>(
      '/customer/agency-verification.php', token,
    ),
  saveRepresentative: (token: string, data: RepresentativeInfo) =>
    customerRequest<{ success: true; verification_status: AgencyStatus }>(
      '/customer/agency-verification.php', token, {
        method: 'POST', body: JSON.stringify(data), isJson: true,
      },
    ),
  getDocuments: (token: string) =>
    customerRequest<AgencyDocumentsResponse>('/customer/agency-documents.php', token),
  uploadDocument: (token: string, documentType: 'registration' | 'license', file: File) => {
    const payload = new FormData();
    payload.set('document_type', documentType);
    payload.set('document', file);
    return customerRequest<{ id: number; document_type: string; verification_status: AgencyStatus }>(
      '/customer/agency-document.php', token, { method: 'POST', body: payload },
    );
  },
};
