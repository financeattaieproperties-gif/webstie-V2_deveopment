/**
 * Customer-only Firebase email/password authentication.
 * Tokens live in React memory, never localStorage/sessionStorage.
 * This deliberately does not implement phone OTP; phone sign-in requires
 * Firebase's supported reCAPTCHA/phone-auth integration and a carrier pilot.
 */
const FIREBASE_KEY = import.meta.env.VITE_FIREBASE_API_KEY as string | undefined;
const API_ROOT = (import.meta.env.VITE_API_URL as string | undefined) || '/api';

export interface CustomerEmailSession {
  idToken: string;
  refreshToken: string;
  expiresAt: number;
  email: string;
}
export interface CustomerProfile {
  id: number;
  display_name: string;
  email: string | null;
  email_verified: boolean;
  phone_e164: string | null;
  phone_verified: boolean;
  account_type: 'individual' | 'agency';
  status: string;
}
type FirebaseTokens = { idToken: string; refreshToken: string; expiresIn: string; email?: string };
type FirebaseLookup = { users?: Array<{emailVerified?: boolean; email?: string}> };

function requireKey(): string {
  if (!FIREBASE_KEY) throw new Error('Customer sign-in is not configured. Contact the website administrator.');
  return FIREBASE_KEY;
}
async function firebaseRequest<T>(path: string, payload: object): Promise<T> {
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/${path}?key=${encodeURIComponent(requireKey())}`, {
    method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload),
    cache:'no-store', credentials:'omit'
  });
  const data = await response.json().catch(() => ({})) as {error?:{message?:string}};
  if (!response.ok) {
    const code = data.error?.message ?? '';
    if (code.includes('EMAIL_EXISTS')) throw new Error('An account with this email already exists.');
    if (code.includes('WEAK_PASSWORD')) throw new Error('Use a stronger password.');
    if (code.includes('TOO_MANY_ATTEMPTS')) throw new Error('Too many attempts. Try again later.');
    throw new Error('Authentication failed. Check your details and try again.');
  }
  return data as unknown as T;
}
function toSession(tokens: FirebaseTokens, fallbackEmail: string): CustomerEmailSession {
  return {
    idToken:tokens.idToken, refreshToken:tokens.refreshToken,
    expiresAt:Date.now() + Math.max(1, Number(tokens.expiresIn) || 3600)*1000,
    email:tokens.email ?? fallbackEmail,
  };
}
export const customerEmailAuth = {
  signIn: async (email:string,password:string) =>
    toSession(await firebaseRequest<FirebaseTokens>('accounts:signInWithPassword',{email,password,returnSecureToken:true}),email),
  signUp: async (email:string,password:string) =>
    toSession(await firebaseRequest<FirebaseTokens>('accounts:signUp',{email,password,returnSecureToken:true}),email),
  sendVerification: (idToken:string) =>
    firebaseRequest('accounts:sendOobCode',{requestType:'VERIFY_EMAIL',idToken}),
  emailVerified: async (idToken:string) => {
    const data=await firebaseRequest<FirebaseLookup>('accounts:lookup',{idToken});
    return data.users?.[0]?.emailVerified === true;
  },
  refresh: async (session:CustomerEmailSession):Promise<CustomerEmailSession> => {
    const response=await fetch(`https://securetoken.googleapis.com/v1/token?key=${encodeURIComponent(requireKey())}`,{
      method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body:new URLSearchParams({grant_type:'refresh_token',refresh_token:session.refreshToken}),
      cache:'no-store',credentials:'omit',
    });
    const data=await response.json().catch(()=>({})) as {
      id_token?:string;refresh_token?:string;expires_in?:string
    };
    if(!response.ok || !data.id_token || !data.refresh_token) {
      throw new Error('Your sign-in expired. Please sign in again.');
    }
    return {
      idToken:data.id_token,refreshToken:data.refresh_token,
      expiresAt:Date.now()+(Number(data.expires_in)||3600)*1000,email:session.email,
    };
  },
  profile: async (idToken:string, create?:{display_name:string;locale:'en'|'fa'|'ps'}):Promise<CustomerProfile> => {
    const response=await fetch(`${API_ROOT}/customer/me.php`,{
      method:create?'POST':'GET',
      headers:{Authorization:`Bearer ${idToken}`,Accept:'application/json',...(create?{'Content-Type':'application/json'}:{})},
      ...(create?{body:JSON.stringify(create)}:{}),
      cache:'no-store',credentials:'omit',
    });
    const data=await response.json().catch(()=>({})) as {customer?:CustomerProfile;error?:string};
    if (!response.ok || !data.customer) {
      const error=new Error(data.error || 'Could not load your customer account.') as Error & {status?:number};
      error.status=response.status;
      throw error;
    }
    return data.customer;
  },
};
