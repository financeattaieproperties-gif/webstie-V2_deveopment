import { useState, type FormEvent } from 'react';
import { api, type Lead } from '../api';
import en from '../../../src/i18n/locales/en.json';
import fa from '../../../src/i18n/locales/fa.json';

export function inquiryLabels() {
  return localStorage.getItem('lang') === 'fa' ? fa.inquiryFollowup : en.inquiryFollowup;
}

export function inquiryTime(value?: string | null): string {
  return value ? value.replace(' ', 'T') + (value.endsWith('Z') ? '' : 'Z') : '';
}

const inputStyle = { width:'100%', minHeight:44, padding:'0.65rem', border:'1px solid #E2E8F0', borderRadius:6, background:'#FFFFFF', color:'#0F172A', font:'inherit', boxSizing:'border-box' as const };

export default function InquiryFollowupEditor({ inquiry, onSaved, onClose }: {inquiry: Lead; onSaved: (item: Lead) => void; onClose: () => void}) {
  const labels = inquiryLabels();
  const t = (key: keyof typeof labels) => labels[key];
  const initialDate = inquiry.followup_at ? new Date(inquiryTime(inquiry.followup_at)) : null;
  const [status, setStatus] = useState(inquiry.followup_status || 'new');
  const [notes, setNotes] = useState(inquiry.followup_notes || '');
  const [date, setDate] = useState(initialDate ? new Date(initialDate.getTime()-initialDate.getTimezoneOffset()*60000).toISOString().slice(0,16) : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError('');
    try {
      onSaved(await api.updateInquiryFollowup(inquiry.id, {version:Number(inquiry.version || 1), status, notes, followupAt:date ? new Date(date).toISOString().replace('.000Z','Z') : null}));
    } catch (error) { setError(error instanceof Error ? error.message : t('saveError')); }
    finally { setSaving(false); }
  }
  return <form onSubmit={submit} dir={localStorage.getItem('lang') === 'fa' ? 'rtl' : 'ltr'} style={{background:'#FFFFFF',border:'1px solid #E2E8F0',borderRadius:8,padding:'1rem',marginBlock:'1rem',display:'grid',gap:'0.85rem'}} aria-label={t('title')}>
    <h2 style={{margin:0,fontSize:'1.1rem',color:'#0F172A'}}>{t('title')}: {inquiry.name}</h2>
    {inquiry.receipt_reference && <p dir="ltr" style={{overflowWrap:'anywhere',margin:0}}>{inquiry.receipt_reference}</p>}
    <label>{t('status')}<select value={status} onChange={event=>setStatus(event.target.value as typeof status)} style={inputStyle}>
      {(['new','in_progress','resolved'] as const).map(value=><option key={value} value={value}>{t(value)}</option>)}
    </select></label>
    <label>{t('notes')}<textarea value={notes} onChange={event=>setNotes(event.target.value)} maxLength={4000} rows={4} style={inputStyle} /></label>
    <label>{t('nextTime')}<input type="datetime-local" value={date} onChange={event=>setDate(event.target.value)} style={inputStyle} /></label>
    {error && <p role="alert" style={{color:'#B91C1C',margin:0}}>{error} {t('conflictHint')}</p>}
    <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
      <button type="submit" disabled={saving} style={{...inputStyle,width:'auto',background:'#0F172A',color:'#FFFFFF',cursor:'pointer'}}>{t(saving?'saving':'save')}</button>
      <button type="button" onClick={onClose} disabled={saving} style={{...inputStyle,width:'auto',cursor:'pointer'}}>{t('close')}</button>
    </div>
  </form>;
}
