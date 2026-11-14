import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { discardPendingInquiry, listInquiryDeliveries, retryInquiry, subscribeInquiryDeliveries, type InquiryDelivery } from '../../lib/inquiryOutbox';
import { downloadInquiryReceipt } from '../../lib/inquiryReceipt';

export function InquiryDeliveryStatus({ propertyId }: { propertyId?: string }) {
  const { t, i18n } = useTranslation();
  const [items, setItems] = useState<InquiryDelivery[]>([]);
  const [error, setError] = useState(false);
  useEffect(() => {
    let mounted = true;
    const refresh = () => { void listInquiryDeliveries().then(rows => { if (mounted) { setItems(rows); setError(false); } }).catch(() => { if (mounted) setError(true); }); };
    const stop = subscribeInquiryDeliveries(refresh); refresh();
    return () => { mounted = false; stop(); };
  }, []);
  const act = (action: Promise<void>) => { void action.catch(() => setError(true)); };
  return <section data-inquiry-deliveries className="my-4 space-y-3 min-w-0" aria-label={t('inquiryDelivery.title')} aria-live="polite">
    {error && <p role="alert" className="text-sm text-red-700">{t('inquiryDelivery.storageError')}</p>}
    {items.filter(item => !propertyId || item.status === 'confirmed' || item.payload.propertyId === propertyId).map(item => <div key={item.clientRequestId} className="rounded-xl border border-neutral-200 bg-white p-4 text-sm space-y-2 min-w-0">
      <p className="font-semibold text-brand-navy">{t(`inquiryDelivery.${item.status}`)}</p>
      {item.status === 'confirmed' ? <>
        <p className="break-all" dir="ltr">{item.receipt.reference}</p>
        <p>{item.receipt.propertyName}</p>
        <button type="button" className="min-h-11 text-brand-gold underline cursor-pointer" onClick={() => downloadInquiryReceipt(item.receipt, i18n.language === 'fa' ? 'fa' : 'en')}>{t('inquiryDelivery.download')}</button>
      </> : <>
        <p>{item.payload.propertyName || t('inquiryDelivery.general')}</p>
        {item.status !== 'sending' && <div className="flex flex-wrap gap-3">
          <button type="button" className="min-h-11 text-brand-gold underline cursor-pointer" onClick={() => act(retryInquiry(item.clientRequestId))}>{t('inquiryDelivery.retry')}</button>
          <button type="button" className="min-h-11 text-neutral-600 underline cursor-pointer" onClick={() => act(discardPendingInquiry(item.clientRequestId))}>{t('inquiryDelivery.discard')}</button>
        </div>}
      </>}
    </div>)}
    {items.some(item => item.status !== 'confirmed') && <p className="text-xs text-neutral-600">{t('inquiryDelivery.openBrowser')}</p>}
  </section>;
}
