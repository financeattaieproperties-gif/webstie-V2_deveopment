import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, X, PhoneCall, CheckCircle, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type Status = 'idle' | 'sending' | 'success' | 'error';

interface Props {
  variant?: 'button' | 'floating';
  className?: string;
}

export const ClickToCallButton = ({ variant = 'button', className = '' }: Props) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [number, setNumber] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  const handleClose = () => {
    if (status === 'sending') return;
    setOpen(false);
    setTimeout(() => {
      setStatus('idle');
      setNumber('');
      setErrorMsg('');
    }, 300);
  };

  const handleDial = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setErrorMsg('');
    try {
      const res = await fetch('/api/initiate-call.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_number: number }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus('error');
        setErrorMsg(data.error || t('callUs.genericError'));
        return;
      }
      setStatus('success');
    } catch {
      setStatus('error');
      setErrorMsg(t('callUs.networkError'));
    }
  };

  const trigger =
    variant === 'floating' ? (
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className={`fixed bottom-24 right-6 z-40 w-14 h-14 rounded-full bg-brand-navy text-white flex items-center justify-center shadow-xl ${className}`}
        aria-label={t('callUs.button')}
      >
        <Phone size={22} />
      </motion.button>
    ) : (
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.04, y: -2 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className={`inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-brand-navy text-white font-semibold text-sm hover:bg-brand-navy/90 transition-colors ${className}`}
        aria-label={t('callUs.button')}
      >
        <Phone size={18} strokeWidth={2.2} />
        {t('callUs.button')}
      </motion.button>
    );

  return (
    <>
      {trigger}

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={handleClose}
              className="fixed inset-0 z-50 bg-brand-navy/50 backdrop-blur-sm"
            />

            <motion.div
              key="panel"
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              role="dialog"
              aria-modal="true"
              aria-label={t('callUs.title')}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="pointer-events-auto w-full max-w-sm bg-white/95 backdrop-blur-xl rounded-3xl border border-white/60 p-8 shadow-2xl">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-brand-gold/15 border border-brand-gold/25 flex items-center justify-center shadow-xs">
                    <PhoneCall size={24} strokeWidth={2.2} className="text-brand-gold" />
                  </div>
                  <button
                    onClick={handleClose}
                    className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 hover:bg-neutral-200 transition-colors"
                    aria-label={t('callUs.cancel')}
                  >
                    <X size={16} strokeWidth={2.4} />
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {status === 'success' ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-center py-4"
                    >
                      <div className="w-16 h-16 rounded-full bg-status-available/10 flex items-center justify-center mx-auto mb-4">
                        <CheckCircle size={32} className="text-status-available" />
                      </div>
                      <h3 className="font-bold text-brand-navy text-lg mb-2">{t('callUs.successTitle')}</h3>
                      <p className="text-neutral-500 text-sm leading-relaxed">{t('callUs.success')}</p>
                      <button
                        onClick={handleClose}
                        className="mt-6 text-brand-gold font-semibold text-sm hover:underline"
                      >
                        {t('callUs.close')}
                      </button>
                    </motion.div>
                  ) : (
                    <motion.form
                      key="form"
                      onSubmit={handleDial}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <h3 className="font-bold text-brand-navy text-xl mb-1">{t('callUs.title')}</h3>
                      <p className="text-neutral-500 text-sm mb-6 leading-relaxed">{t('callUs.subtitle')}</p>

                      <label
                        htmlFor="ctc-phone"
                        className="block text-xs font-bold text-neutral-500 uppercase tracking-wide mb-2"
                      >
                        {t('callUs.phoneLabel')}
                      </label>
                      <input
                        id="ctc-phone"
                        type="tel"
                        value={number}
                        onChange={(e) => setNumber(e.target.value)}
                        placeholder={t('callUs.placeholder')}
                        pattern="^(0?7\d{8}|93\d{9})$"
                        title={t('callUs.formatHint')}
                        required
                        disabled={status === 'sending'}
                        className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-white text-brand-navy placeholder:text-neutral-400 outline-none focus:ring-2 focus:ring-brand-gold focus:border-brand-gold transition-colors text-sm mb-4 disabled:opacity-60"
                      />

                      {status === 'error' && errorMsg && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-1.5 text-red-500 text-xs font-medium p-3 bg-red-50 rounded-lg border border-red-200 mb-4"
                        >
                          <AlertCircle size={13} />
                          {errorMsg}
                        </motion.p>
                      )}

                      <motion.button
                        type="submit"
                        disabled={status === 'sending'}
                        whileHover={{ scale: status !== 'sending' ? 1.02 : 1 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-3.5 rounded-xl bg-brand-navy text-white font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2 transition-opacity"
                      >
                        <Phone size={17} strokeWidth={2.2} />
                        {status === 'sending' ? t('callUs.connecting') : t('callUs.dial')}
                      </motion.button>

                      <p className="text-xs text-neutral-400 text-center mt-3">{t('callUs.disclaimer')}</p>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
