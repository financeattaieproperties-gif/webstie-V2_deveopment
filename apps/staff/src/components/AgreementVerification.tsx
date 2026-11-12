import React, { useEffect, useState } from 'react';

type VerifiedAgreement = { contractSerial: string; status: string; amendmentVersion: number };
export function AgreementVerification({ token, verify, lang = 'en' }: {
  token: string; verify: (token: string) => Promise<VerifiedAgreement>; lang?: 'en' | 'fa';
}) {
  const [result, setResult] = useState<VerifiedAgreement | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    if (!/^[a-f0-9]{64}$/i.test(token)) { setError('Invalid verification code.'); return; }
    verify(token).then(data => { if (active) setResult(data); })
      .catch(() => { if (active) setError('This agreement could not be verified.'); });
    return () => { active = false; };
  }, [token, verify]);
  const fa = lang === 'fa';
  return <main className="center-screen" dir={fa ? 'rtl' : 'ltr'}>
    <section className="panel" style={{ width: 'min(100%, 520px)' }}>
      <h1>{fa ? 'تأیید اصالت قرارداد' : 'Agreement verification'}</h1>
      {error ? <p role="alert">{fa ? 'اصالت این قرارداد تأیید نشد.' : error}</p> : !result ?
        <p role="status">{fa ? 'در حال بررسی…' : 'Checking agreement…'}</p> : <dl>
          <dt>{fa ? 'شماره قرارداد' : 'Agreement number'}</dt><dd>{result.contractSerial}</dd>
          <dt>{fa ? 'وضعیت' : 'Status'}</dt><dd>{result.status}</dd>
          <dt>{fa ? 'نسخه' : 'Version'}</dt><dd>{result.amendmentVersion}</dd>
        </dl>}
      <p>{fa ? 'برای جزئیات قرارداد با دفتر تماس بگیرید.' : 'Contact the office for agreement details.'}</p>
    </section>
  </main>;
}
