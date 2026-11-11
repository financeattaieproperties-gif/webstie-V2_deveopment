// Firebase credentials go only to Google's documented HTTPS API. Tokens stay in memory.
async function call(apiKey, action, body, transport) {
  if (!apiKey) throw new Error('Firebase sign-in is not configured. Contact your administrator.');
  try {
    const response = await transport(`https://identitytoolkit.googleapis.com/v1/accounts:${action}?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST', credentials: 'omit', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    const data = await response.json();
    return { ok: response.ok, data };
  } catch {
    throw new Error('Sign-in service is unavailable. Please try again.');
  }
}
export async function signIn(apiKey, email, password, transport = fetch) {
  const { ok, data } = await call(apiKey, 'signInWithPassword', { email, password, returnSecureToken: true }, transport);
  if (!ok || typeof data.idToken !== 'string' || !data.idToken) throw new Error('Sign-in failed. Check your email and password.');
  return data.idToken;
}
export async function resetPassword(apiKey, email, transport = fetch) {
  const { ok, data } = await call(apiKey, 'sendOobCode', { requestType: 'PASSWORD_RESET', email }, transport);
  if (!ok && data?.error?.message !== 'EMAIL_NOT_FOUND') throw new Error('Password reset is unavailable. Please try again.');
}
