import JsBarcode from 'jsbarcode';
import type { InquirySubmissionResult } from './dbService';
import i18n from '../i18n';

const escape = (value: string) => value.replace(/[&<>"']/g, character => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[character]!));

export function downloadInquiryReceipt(receipt: InquirySubmissionResult['receipt'], language: 'en' | 'fa'): void {
  const t = i18n.getFixedT(language);
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  JsBarcode(svg, receipt.reference, { format: 'CODE128', width: 2, height: 80, margin: 24, displayValue: true });
  const font = new URL(language === 'fa' ? '/fonts/tajawal-400.ttf' : '/fonts/dm-sans-400.ttf', window.location.origin).href;
  const html = `<!doctype html><html lang="${language}" dir="${language === 'fa' ? 'rtl' : 'ltr'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escape(t('inquiryDelivery.receiptTitle'))}</title><style>
  @font-face{font-family:Receipt;src:url('${escape(font)}')}body{font-family:Receipt,Arial,sans-serif;color:#020E3A;background:white;margin:2rem auto;padding:1rem;max-width:52rem;line-height:1.6}h1{font-size:1.7rem}dt{font-weight:bold}dd{margin:0 0 1rem;overflow-wrap:anywhere}.barcode{direction:ltr;overflow:auto}svg{max-width:100%;height:auto}button{padding:.8rem 1.2rem;font:inherit;cursor:pointer}@media print{button{display:none}body{margin:0;max-width:none}.barcode{overflow:visible}}
  </style></head><body><p>Attaie Properties</p><h1>${escape(t('inquiryDelivery.receiptTitle'))}</h1><p>${escape(t('inquiryDelivery.receiptText'))}</p><dl>
  <dt>${escape(t('inquiryDelivery.reference'))}</dt><dd dir="ltr">${escape(receipt.reference)}</dd>
  <dt>${escape(t('inquiryDelivery.submittedAt'))}</dt><dd dir="ltr">${escape(receipt.submittedAt)}</dd>
  <dt>${escape(t('inquiryDelivery.customerName'))}</dt><dd>${escape(receipt.customerName)}</dd>
  <dt>${escape(t('inquiryDelivery.propertyName'))}</dt><dd>${escape(receipt.propertyName)}</dd></dl>
  <div class="barcode">${new XMLSerializer().serializeToString(svg)}</div><p>${escape(t('inquiryDelivery.noPayment'))}</p>
  <button type="button" onclick="window.print()">${escape(t('inquiryDelivery.print'))}</button></body></html>`;
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = `${receipt.reference}.html`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
