import { useCallback, useEffect, useState } from 'react';
import { AgencyOnboarding } from '../components/customer/AgencyOnboarding';
import { customerEmailAuth, type CustomerEmailSession, type CustomerProfile } from '../lib/customerEmailAuth';

/**
 * Phase 2 customer-only entry point. Firebase email sign-in is enabled when
 * VITE_FIREBASE_API_KEY is configured. Phone OTP is not silently emulated.
 * No customer token is written to browser storage.
 */
export default function CustomerAccountPage() {
  const [mode,setMode]=useState<'signin'|'signup'>('signin');
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [displayName,setDisplayName]=useState('');
  const [session,setSession]=useState<CustomerEmailSession|null>(null);
  const [profile,setProfile]=useState<CustomerProfile|null>(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [needsVerification,setNeedsVerification]=useState(false);

  const activate=useCallback(async (active:CustomerEmailSession, name:string) => {
    const verified=await customerEmailAuth.emailVerified(active.idToken);
    setSession(active);
    if (!verified) {
      setNeedsVerification(true);
      setProfile(null);
      return false;
    }
    setNeedsVerification(false);
    let customer:CustomerProfile;
    try {
      customer=await customerEmailAuth.profile(active.idToken);
    } catch (reason) {
      if ((reason as {status?:number}).status!==404) throw reason;
      customer=await customerEmailAuth.profile(active.idToken,{
        display_name:name.trim() || active.email.split('@')[0],locale:'en'
      });
    }
    setProfile(customer);
    return true;
  },[]);

  useEffect(()=>{
    if(!session) return;
    const timer=window.setInterval(()=>{
      if(Date.now()<session.expiresAt-5*60*1000) return;
      void customerEmailAuth.refresh(session).then(setSession).catch(()=>{
        setSession(null);setProfile(null);setNeedsVerification(false);
        setError('Your sign-in expired. Please sign in again.');
      });
    },60*1000);
    return ()=>window.clearInterval(timer);
  },[session]);

  async function submit(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if(busy) return;
    setBusy(true);setError('');setNotice('');
    try {
      const active=mode==='signup'
        ? await customerEmailAuth.signUp(email.trim(),password)
        : await customerEmailAuth.signIn(email.trim(),password);
      setPassword('');
      if(mode==='signup') {
        setSession(active);
        await customerEmailAuth.sendVerification(active.idToken);
        setNeedsVerification(true);
        setNotice('Verification email sent. Open the email link, then return here and select Check verification.');
      } else {
        const ready=await activate(active,displayName);
        if(!ready) setNotice('Verify your email address to finish signing in.');
      }
    } catch(reason) {
      setError(reason instanceof Error?reason.message:'Sign-in failed.');
    } finally {setBusy(false);}
  }
  async function checkVerification() {
    if(!session || busy) return;
    setBusy(true);setError('');setNotice('');
    try {
      const fresh=await customerEmailAuth.refresh(session);
      const ready=await activate(fresh,displayName);
      if(!ready) setNotice('Your email is not verified yet. Open the link in your email and try again.');
    } catch(reason) {
      setError(reason instanceof Error?reason.message:'Verification check failed.');
    } finally {setBusy(false);}
  }
  async function resendVerification() {
    if(!session || busy) return;
    setBusy(true);setError('');setNotice('');
    try {
      const fresh=await customerEmailAuth.refresh(session);
      setSession(fresh);
      await customerEmailAuth.sendVerification(fresh.idToken);
      setNotice('Another verification email was requested. Check your inbox and spam folder.');
    } catch(reason) {
      setError(reason instanceof Error?reason.message:'Could not request another email.');
    } finally {setBusy(false);}
  }
  function signOut() {
    setSession(null);setProfile(null);setNeedsVerification(false);
    setPassword('');setNotice('Signed out of this browser session.');setError('');
  }

  const field='block w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 focus-visible:outline-2 focus-visible:outline-amber-600';
  return <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-950">
    <section className="mx-auto max-w-3xl space-y-5">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Attaie Properties — Customer account</h1>
        <p className="text-slate-600">Manage your individual profile or apply for a real estate agency account.</p>
      </header>
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-900">{error}</p>}
      {notice && <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">{notice}</p>}
      {profile && session ? <>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
          <div><p className="font-semibold">{profile.display_name || session.email}</p>
            <p className="text-sm text-slate-600">{profile.email || session.email} · {profile.account_type} account</p>
          </div>
          <button type="button" onClick={signOut} className="rounded-lg border border-slate-300 px-4 py-2">Sign out</button>
        </div>
        <AgencyOnboarding idToken={session.idToken}/>
      </> : needsVerification && session ? (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-semibold">Verify your email</h2>
          <p>Open the verification link sent to <strong>{session.email}</strong>. After verifying, return here.</p>
          <div className="flex flex-wrap gap-3">
            <button type="button" disabled={busy} onClick={()=>void checkVerification()} className="rounded-lg bg-slate-950 px-4 py-3 text-white disabled:opacity-50">Check verification</button>
            <button type="button" disabled={busy} onClick={()=>void resendVerification()} className="rounded-lg border border-slate-300 px-4 py-3 disabled:opacity-50">Resend email</button>
            <button type="button" onClick={signOut} className="rounded-lg border border-slate-300 px-4 py-3">Sign out</button>
          </div>
        </div>
      ) : (
        <form onSubmit={(event)=>void submit(event)} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">{mode==='signin'?'Sign in':'Create your account'}</h2>
          {mode==='signup' && <label className="block text-sm font-medium">Your name
            <input className={field} value={displayName} maxLength={160} onChange={e=>setDisplayName(e.target.value)} autoComplete="name" required/>
          </label>}
          <label className="block text-sm font-medium">Email address
            <input className={field} type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" required/>
          </label>
          <label className="block text-sm font-medium">Password
            <input className={field} type="password" value={password} minLength={6} onChange={e=>setPassword(e.target.value)}
              autoComplete={mode==='signup'?'new-password':'current-password'} required/>
          </label>
          <button disabled={busy} className="rounded-lg bg-slate-950 px-5 py-3 font-semibold text-white disabled:opacity-50">
            {busy?'Please wait…':mode==='signin'?'Sign in':'Create account'}
          </button>
          <button type="button" className="ml-3 text-sm underline" onClick={()=>{setMode(mode==='signin'?'signup':'signin');setError('');setNotice('');}}>
            {mode==='signin'?'Create an account':'Already have an account? Sign in'}
          </button>
          <p className="text-xs text-slate-600">Email sign-in is available when Firebase is configured. Phone OTP sign-in requires a separate Firebase phone-auth/reCAPTCHA integration and is not yet enabled. Your sign-in is kept in memory and ends on page reload.</p>
        </form>
      )}
    </section>
  </main>;
}
