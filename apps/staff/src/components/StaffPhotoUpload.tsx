import React, { useId, useState } from 'react';

export type UploadStaffFile = (dataURL: string, fileName: string, purpose: string) => Promise<{url: string; fileName?: string}>;
export function StaffPhotoUpload({ label, value, purpose, onChange, onUpload, lang = 'en' }: {
  label: string; value: string; purpose: string; onChange: (url: string) => void;
  onUpload?: UploadStaffFile; lang?: 'en' | 'fa';
}) {
  const id = useId(); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  return <div className="field">
    <label htmlFor={id}>{label}</label>
    {value && <img src={value} alt={label} width={72} height={96} style={{objectFit: 'cover',borderRadius: 6}} />}
    <input id={id} type="file" accept="image/jpeg,image/png,image/webp" disabled={!onUpload || busy}
      aria-describedby={error ? `${id}-error` : undefined} onChange={async e => {
        const file = e.currentTarget.files?.[0];
        if (!file || !onUpload) return;
        setError('');
        if (file.size > 5 * 1024 * 1024 || !['image/jpeg','image/png','image/webp'].includes(file.type)) {
          setError(lang === 'fa' ? 'عکس JPG، PNG یا WebP تا ۵ مگابایت انتخاب کنید.' : 'Choose a JPG, PNG or WebP image up to 5 MB.'); return;
        }
        setBusy(true);
        try { const data = await new Promise<string>((resolve,reject) => {
          const reader = new FileReader(); reader.onerror = () => reject(new Error('Image could not be read.'));
          reader.onload = () => resolve(String(reader.result)); reader.readAsDataURL(file);
        }); const uploaded = await onUpload(data, file.name, purpose); onChange(uploaded.url);
        } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
      }} />
    {busy && <small role="status">{lang === 'fa' ? 'در حال بارگذاری…' : 'Uploading…'}</small>}
    {error && <small id={`${id}-error`} role="alert">{error}</small>}
  </div>;
}
