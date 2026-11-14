"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { enqueueInquiry } from '../../lib/inquiryOutbox';
import { InquiryDeliveryStatus } from './InquiryDeliveryStatus';
import { useTranslation } from 'react-i18next';

const inquirySchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(8, 'Phone number is required'),
  message: z.string().optional(),
});

type InquiryFormValues = z.infer<typeof inquirySchema>;

export const InquiryForm = ({ propertyId, propertyName }: { propertyId?: string, propertyName?: string }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useTranslation();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<InquiryFormValues>({
    resolver: zodResolver(inquirySchema)
  });

  const onSubmit = async (data: InquiryFormValues) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await enqueueInquiry({
        ...data,
        propertyId,
        propertyName
      });
      reset();
    } catch (_error) {
      setSubmitError(t('inquiryDelivery.storageError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="bg-white/60 backdrop-blur-md p-6 rounded-xl border border-white/60"
      style={{ boxShadow: 'var(--shadow-lg)' }}
    >
      <h3 className="font-heading text-xl font-bold text-brand-navy mb-4">
        {propertyName ? t('inquiryForm.about', { propertyName }) : t('inquiryForm.title')}
      </h3>

      <InquiryDeliveryStatus propertyId={propertyId} />
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1.5">
              {t('inquiryForm.name')}
            </label>
            <input
              id="name"
              {...register('name')}
              placeholder="Ahmad Karimi"
              className={`w-full px-4 py-3 rounded-lg border transition-colors duration-200 ${
                errors.name
                  ? 'border-red-500 focus:ring-2 focus:ring-red-500 focus:border-red-500'
                  : 'border-neutral-300 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold'
              } outline-none`}
            />
            {errors.name && (
              <p className="flex items-center gap-1 text-red-500 text-xs mt-1.5 font-medium">
                <AlertCircle size={12} aria-hidden="true" />
                {errors.name.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1.5">
              {t('inquiryForm.email')}
            </label>
            <input
              id="email"
              {...register('email')}
              type="email"
              placeholder="ahmad@example.com"
              className={`w-full px-4 py-3 rounded-lg border transition-colors duration-200 ${
                errors.email
                  ? 'border-red-500 focus:ring-2 focus:ring-red-500 focus:border-red-500'
                  : 'border-neutral-300 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold'
              } outline-none`}
            />
            {errors.email && (
              <p className="flex items-center gap-1 text-red-500 text-xs mt-1.5 font-medium">
                <AlertCircle size={12} aria-hidden="true" />
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="phone" className="block text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1.5">
              {t('inquiryForm.phone')}
            </label>
            <input
              id="phone"
              {...register('phone')}
              type="tel"
              placeholder="+93 70 123 4567"
              className={`w-full px-4 py-3 rounded-lg border transition-colors duration-200 ${
                errors.phone
                  ? 'border-red-500 focus:ring-2 focus:ring-red-500 focus:border-red-500'
                  : 'border-neutral-300 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold'
              } outline-none`}
            />
            {errors.phone && (
              <p className="flex items-center gap-1 text-red-500 text-xs mt-1.5 font-medium">
                <AlertCircle size={12} aria-hidden="true" />
                {errors.phone.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="message" className="block text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1.5">
              {t('inquiryForm.message')}
            </label>
            <textarea
              id="message"
              {...register('message')}
              placeholder="I am interested in this property..."
              rows={4}
              className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold outline-none resize-none transition-colors duration-200"
            />
          </div>

          {submitError && (
            <p className="flex items-center gap-1 text-red-500 text-xs font-medium">
              <AlertCircle size={12} aria-hidden="true" />
              {submitError}
            </p>
          )}

          <Button type="submit" loading={isSubmitting} className="w-full">
            {isSubmitting ? t('inquiryDelivery.saving') : t('inquiryForm.send')}
          </Button>
        </form>
    </div>
  );
};
