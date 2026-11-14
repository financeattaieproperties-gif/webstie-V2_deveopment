import React, { Suspense, lazy, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import {
  Footer,
  OFFICIAL_SOCIAL_LINKS,
  FacebookIcon,
  YoutubeIcon,
} from '../components/layout/Footer';
import { Button } from '../components/ui/Button';
import { ClickToCallButton } from '../components/ui/ClickToCallButton';
import { enqueueInquiry } from '../lib/inquiryOutbox';
import { InquiryDeliveryStatus } from '../components/forms/InquiryDeliveryStatus';
import { SeoHead } from '../components/seo/SeoHead';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';
import { useTranslation } from 'react-i18next';
import { MapSkeleton } from '../components/map/MapSkeleton';

const AttaieGoogleMap = lazy(() =>
  import('../components/map/AttaieGoogleMap').then((m) => ({ default: m.AttaieGoogleMap }))
);

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(8, 'Phone number is required'),
  propertyName: z.string().optional(),
  message: z.string().min(10, 'Please provide at least 10 characters'),
});

type FormValues = z.infer<typeof schema>;

const INQUIRY_TOPICS = [
  'Buying a Property',
  'Renting / Leasing',
  'Off-Plan Signature Project',
  'List My Property',
  'Diaspora Advisory',
] as const;

const CONTACT_INFO = [
  {
    icon: Phone,
    label: 'Phone',
    value: '+93 782 222 279',
    href: 'tel:+93782222279',
  },
  {
    icon: MessageCircle,
    label: 'WhatsApp',
    value: '+93 782 222 279',
    href: 'https://wa.me/93782222279',
  },
  {
    icon: Mail,
    label: 'Email',
    value: 'info@attaieproperties.com',
    href: 'mailto:info@attaieproperties.com',
  },
  {
    icon: MapPin,
    label: 'Office',
    value: 'Street #13, Wazir Akbar Khan, Kabul, Afghanistan',
    href: undefined,
  },
  {
    icon: MapPin,
    label: 'Website',
    value: 'www.attaieproperties.com',
    href: 'https://www.attaieproperties.com',
  },
];

export default function ContactPage() {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string>('Buying a Property');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, dirtyFields },
    reset,
  } = useForm<FormValues>({ resolver: zodResolver(schema), mode: 'onTouched' });

  const messageValue = watch('message') || '';

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await enqueueInquiry({
        name: data.name,
        email: data.email,
        phone: data.phone,
        message: `[${selectedTopic}] ${data.message}`,
        propertyName: data.propertyName || selectedTopic || 'General Inquiry',
      });
      reset();
    } catch (_err) {
      setSubmitError(t('inquiryDelivery.storageError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldClass = (hasError: boolean, isValidDirty?: boolean) =>
    `w-full px-4 py-3 rounded-xl border transition-all duration-200 outline-none bg-white text-brand-navy placeholder:text-neutral-400 ${
      hasError
        ? 'border-red-400 focus:ring-2 focus:ring-red-400 focus:border-red-400'
        : isValidDirty
        ? 'border-status-available/60 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold'
        : 'border-neutral-300 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold'
    }`;

  return (
    <main className="min-h-screen bg-brand-cream flex flex-col">
      <SeoHead />
      <Navbar />

      {/* Hero banner */}
      <section className="relative pt-36 pb-20 bg-brand-navy overflow-hidden">
        <div className="absolute inset-0 islamic-pattern opacity-20" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand-gold/40 to-transparent" />
        <div className="container-custom relative z-10 text-center">
          <div className="flex justify-center mb-4">
            <Breadcrumbs
              variant="light"
              items={[{ label: t('nav.contact', 'Contact') }]}
              className="w-auto"
            />
          </div>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-brand-gold text-xs font-bold uppercase tracking-[0.25em] mb-4 flex items-center justify-center gap-3"
          >
            <span className="inline-block w-8 h-[1px] bg-brand-gold/50" />
            Get in Touch
            <span className="inline-block w-8 h-[1px] bg-brand-gold/50" />
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="text-4xl md:text-5xl font-display font-bold text-white mb-4"
          >
            Contact Our Team
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.18 }}
            className="text-white/60 text-lg max-w-xl mx-auto"
          >
            Fill in the form below and one of our agents will get back to you within 24 hours.
          </motion.p>
        </div>
      </section>

      {/* Content (21st.dev Forms & Dialogs + Motion.dev Validation Feedback) */}
      <section className="section-padding flex-grow">
        <div className="container-custom">
          <div className="flex flex-col lg:flex-row gap-12 max-w-5xl mx-auto">
            {/* Contact info sidebar */}
            <aside className="w-full lg:w-80 shrink-0">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <h2 className="text-xl font-bold text-brand-navy mb-6">Contact Details</h2>
                <div className="space-y-5">
                  {CONTACT_INFO.map(({ icon: Icon, label, value, href }) => (
                    <div key={label} className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-brand-gold/10 flex items-center justify-center shrink-0">
                        <Icon size={18} className="text-brand-gold" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-neutral-400 uppercase tracking-wide mb-0.5">
                          {label}
                        </p>
                        {href ? (
                          <a
                            href={href}
                            target={href.startsWith('http') ? '_blank' : undefined}
                            rel="noopener noreferrer"
                            className="text-brand-navy font-semibold hover:text-brand-gold transition-colors link-underline"
                          >
                            {value}
                          </a>
                        ) : (
                          <p className="text-brand-navy font-semibold">{value}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Official Facebook & YouTube Channels */}
                <div className="mt-8 p-5 rounded-2xl bg-white border border-brand-navy/10 shadow-brand-sm">
                  <p className="text-brand-gold text-xs font-bold uppercase tracking-widest mb-3">
                    Official Social Channels
                  </p>
                  <div className="space-y-2.5">
                    {OFFICIAL_SOCIAL_LINKS.map((social) => {
                      const Icon = social.platform === 'facebook' ? FacebookIcon : YoutubeIcon;
                      return (
                        <a
                          key={social.url}
                          href={social.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-center justify-between gap-2.5 p-2 rounded-xl bg-brand-cream/70 hover:bg-brand-gold/10 border border-transparent hover:border-brand-gold/30 transition-all"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-brand-gold/15 flex items-center justify-center shrink-0 text-brand-gold group-hover:bg-brand-gold group-hover:text-white transition-colors">
                              <Icon size={14} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider leading-none mb-0.5">
                                {social.label}
                              </p>
                              <p
                                className="text-xs font-semibold text-brand-navy group-hover:text-brand-gold transition-colors truncate"
                                dir="auto"
                              >
                                {social.name}
                              </p>
                            </div>
                          </div>
                          <ExternalLink
                            size={13}
                            className="text-neutral-400 group-hover:text-brand-gold shrink-0 transition-colors"
                          />
                        </a>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-6 p-5 rounded-2xl bg-brand-navy text-white">
                  <p className="text-brand-gold text-xs font-bold uppercase tracking-widest mb-2">
                    Office Hours
                  </p>
                  <p className="font-semibold">Saturday – Thursday</p>
                  <p className="text-white/60 text-sm">8:00 AM – 6:00 PM (AFT)</p>
                  <p className="font-semibold mt-3">Friday</p>
                  <p className="text-white/60 text-sm">Closed</p>
                </div>

                <div className="mt-6">
                  <p className="text-xs font-bold text-neutral-400 uppercase tracking-wide mb-3">
                    Prefer a call?
                  </p>
                  <ClickToCallButton className="w-full justify-center" />
                </div>
              </motion.div>
            </aside>

            {/* 21st.dev Form with Motion.dev Validation Feedback */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.15 }}
              className="flex-1 bg-white rounded-2xl border border-brand-navy/10 p-8"
              style={{ boxShadow: 'var(--shadow-lg)' }}
            >
              <InquiryDeliveryStatus />
              <AnimatePresence mode="wait">
                  <motion.form
                    key="form"
                    onSubmit={handleSubmit(onSubmit)}
                    className="space-y-5"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <h3 className="text-xl font-bold text-brand-navy">Send an Inquiry</h3>
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-gold">
                        <Sparkles size={13} />
                        <span>Verified Lead Desk</span>
                      </span>
                    </div>

                    {/* 21st.dev Interactive Topic Selector */}
                    <div>
                      <span className="block text-xs font-bold text-neutral-500 uppercase tracking-wide mb-2">
                        Inquiry Topic
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {INQUIRY_TOPICS.map((topic) => {
                          const active = selectedTopic === topic;
                          return (
                            <button
                              key={topic}
                              type="button"
                              onClick={() => {
                                setSelectedTopic(topic);
                                setValue('propertyName', topic);
                              }}
                              className={`relative px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                                active
                                  ? 'text-white'
                                  : 'bg-brand-cream text-neutral-600 hover:text-brand-navy'
                              }`}
                            >
                              {active && (
                                <motion.span
                                  layoutId="contact-topic-pill"
                                  className="absolute inset-0 bg-brand-navy rounded-xl"
                                  transition={{ type: 'spring', stiffness: 360, damping: 28 }}
                                />
                              )}
                              <span className="relative z-10">{topic}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label
                          htmlFor="name"
                          className="block text-xs font-bold text-neutral-500 uppercase tracking-wide mb-1.5"
                        >
                          Full Name <span className="text-red-400">*</span>
                        </label>
                        <input
                          id="name"
                          {...register('name')}
                          placeholder="Ahmad Karimi"
                          className={fieldClass(!!errors.name, dirtyFields.name && !errors.name)}
                        />
                        <AnimatePresence>
                          {errors.name && (
                            <motion.p
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              className="flex items-center gap-1 text-red-500 text-xs mt-1.5 font-medium"
                            >
                              <AlertCircle size={12} aria-hidden="true" />
                              {errors.name.message}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>

                      <div>
                        <label
                          htmlFor="phone"
                          className="block text-xs font-bold text-neutral-500 uppercase tracking-wide mb-1.5"
                        >
                          Phone Number <span className="text-red-400">*</span>
                        </label>
                        <input
                          id="phone"
                          type="tel"
                          {...register('phone')}
                          placeholder="+93 70 123 4567"
                          className={fieldClass(
                            !!errors.phone,
                            dirtyFields.phone && !errors.phone
                          )}
                        />
                        <AnimatePresence>
                          {errors.phone && (
                            <motion.p
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              className="flex items-center gap-1 text-red-500 text-xs mt-1.5 font-medium"
                            >
                              <AlertCircle size={12} aria-hidden="true" />
                              {errors.phone.message}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="email"
                        className="block text-xs font-bold text-neutral-500 uppercase tracking-wide mb-1.5"
                      >
                        Email Address <span className="text-red-400">*</span>
                      </label>
                      <input
                        id="email"
                        type="email"
                        {...register('email')}
                        placeholder="ahmad@example.com"
                        className={fieldClass(!!errors.email, dirtyFields.email && !errors.email)}
                      />
                      <AnimatePresence>
                        {errors.email && (
                          <motion.p
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="flex items-center gap-1 text-red-500 text-xs mt-1.5 font-medium"
                          >
                            <AlertCircle size={12} aria-hidden="true" />
                            {errors.email.message}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    <div>
                      <label
                        htmlFor="propertyName"
                        className="block text-xs font-bold text-neutral-500 uppercase tracking-wide mb-1.5"
                      >
                        Property / Project of Interest
                        <span className="text-neutral-400 font-normal ml-1">(Optional)</span>
                      </label>
                      <input
                        id="propertyName"
                        {...register('propertyName')}
                        placeholder="e.g. project name, property serial, or location…"
                        className={fieldClass(false)}
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label
                          htmlFor="message"
                          className="block text-xs font-bold text-neutral-500 uppercase tracking-wide"
                        >
                          Message <span className="text-red-400">*</span>
                        </label>
                        <span className="text-[11px] text-neutral-400 tabular-nums">
                          {messageValue.length} chars (min 10)
                        </span>
                      </div>
                      <textarea
                        id="message"
                        {...register('message')}
                        rows={5}
                        placeholder="Tell us what you're looking for — budget, location preference, unit type, timeline…"
                        className={`${fieldClass(
                          !!errors.message,
                          messageValue.length >= 10 && !errors.message
                        )} resize-none`}
                      />
                      <AnimatePresence>
                        {errors.message && (
                          <motion.p
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="flex items-center gap-1 text-red-500 text-xs mt-1.5 font-medium"
                          >
                            <AlertCircle size={12} aria-hidden="true" />
                            {errors.message.message}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    <AnimatePresence>
                      {submitError && (
                        <motion.p
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-1.5 text-red-500 text-sm font-medium p-3 bg-red-50 rounded-xl border border-red-200"
                        >
                          <AlertCircle size={16} aria-hidden="true" />
                          {submitError}
                        </motion.p>
                      )}
                    </AnimatePresence>

                    <Button type="submit" loading={isSubmitting} className="w-full">
                      {isSubmitting ? t('inquiryDelivery.saving') : t('inquiryForm.send')}
                    </Button>

                    <p className="text-xs text-neutral-400 text-center">
                      We respond within 24 hours. No spam, ever.
                    </p>
                  </motion.form>
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Interactive Kabul Offices & Directions Map */}
          <div className="max-w-5xl mx-auto mt-16">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-6 bg-brand-gold rounded-full" />
              <div>
                <h2 className="text-2xl font-display font-bold text-brand-navy">
                  Our Kabul Offices &amp; Interactive Directions
                </h2>
                <p className="text-sm text-neutral-500">
                  Explore our Wazir Akbar Khan headquarters and branch offices across Kabul or
                  calculate driving &amp; walking directions.
                </p>
              </div>
            </div>
            <Suspense fallback={<MapSkeleton heightClass="h-[520px]" label="Loading Office Locations &amp; Directions…" />}>
              <AttaieGoogleMap
                mode="office"
                heightClass="h-[520px]"
                showNeighborhoodTools={true}
                showDirections={true}
              />
            </Suspense>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
