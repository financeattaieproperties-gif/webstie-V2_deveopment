import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  CheckCircle2,
  FileText,
  MapPin,
  Upload,
  UserCheck,
  XCircle,
} from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { SeoHead } from '../components/seo/SeoHead';
import { buildCareerSeo } from '../lib/seoConfig';
import { getCareer, submitCareerApplication, type CareerJob } from '../lib/dbService';
import { Button } from '../components/ui/Button';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';

function isJobExpiredInKabul(job: CareerJob): boolean {
  if (job.is_expired !== undefined) return Boolean(job.is_expired);
  if (job.status === 'closed' || job.effective_status === 'closed') return true;
  const raw = job.deadline_at?.trim() || '';
  if (!raw) return false;
  const datePart = raw.slice(0, 10);
  const isoCutoff = /^\d{4}-\d{2}-\d{2}$/.test(raw) || raw.endsWith('00:00:00')
    ? `${datePart}T23:59:59+04:30`
    : `${raw.replace(' ', 'T')}+04:30`;
  const cutoffMs = Date.parse(isoCutoff);
  return Number.isFinite(cutoffMs) ? Date.now() > cutoffMs : false;
}

export default function CareerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('common');
  const jobId = Number(id || 0);

  const [job, setJob] = useState<CareerJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Application form state
  const [name, setName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!jobId) {
      setError('Job announcement not found');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    getCareer(jobId)
      .then(data => setJob(data))
      .catch(err => setError((err as Error).message || 'Job announcement not found'))
      .finally(() => setLoading(false));
  }, [jobId]);

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview(null);
      return;
    }
    const url = URL.createObjectURL(photoFile);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSubmitError(null);
    const file = e.target.files?.[0] ?? null;
    if (file && file.size > 5 * 1024 * 1024) {
      setSubmitError(t('careerApply.errFileTooLarge'));
      e.target.value = '';
      return;
    }
    setPhotoFile(file);
  };

  const handleCvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSubmitError(null);
    const file = e.target.files?.[0] ?? null;
    if (file && file.size > 5 * 1024 * 1024) {
      setSubmitError(t('careerApply.errFileTooLarge'));
      e.target.value = '';
      return;
    }
    setCvFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job) return;
    setSubmitError(null);

    if (!photoFile) {
      setSubmitError(t('careerApply.errPhotoRequired'));
      return;
    }
    if (!cvFile) {
      setSubmitError(t('careerApply.errCvRequired'));
      return;
    }

    const formData = new FormData();
    formData.append('job_id', String(job.id));
    formData.append('name', name.trim());
    formData.append('father_name', fatherName.trim());
    formData.append('email', email.trim());
    formData.append('phone', phone.trim());
    formData.append('address', address.trim());
    formData.append('photo', photoFile);
    formData.append('cv', cvFile);

    setSubmitting(true);
    try {
      await submitCareerApplication(formData);
      setSubmitted(true);
    } catch (err) {
      setSubmitError((err as Error).message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  const expired = job ? isJobExpiredInKabul(job) : false;
  const deadlineDate = job?.deadline_at ? job.deadline_at.slice(0, 10) : '';
  const qualificationList = (job?.qualifications || '')
    .split(/\r?\n/)
    .map(line => line.replace(/^[-•*]\s*/, '').trim())
    .filter(Boolean);

  const breadcrumbItems = [
    { label: t('nav.careers', 'Careers'), href: '/careers' },
    { label: job?.title || t('breadcrumbs.careerDetails', 'Career Details') },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-brand-cream">
      <SeoHead seo={job ? buildCareerSeo(job, id) : undefined} context={{ careerJob: job }} />
      <Navbar />

      <section className="relative bg-brand-navy pt-32 pb-12 overflow-hidden">
        <div className="absolute inset-0 islamic-pattern opacity-10 pointer-events-none" />
        <div className="container-custom relative z-10">
          <Breadcrumbs variant="light" items={breadcrumbItems} className="mb-4" />
          <Link
            to="/careers"
            className="inline-flex items-center gap-2 text-xs font-semibold text-white/75 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {t('careersPage.backToCareers')}
          </Link>

          {job && (
            <div className="mb-8">
              <div className="flex flex-wrap items-center gap-2.5 mb-3">
                {expired ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-200 border border-red-400/30">
                    <XCircle className="w-3.5 h-3.5" />
                    {t('careersPage.statusClosed')}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {t('careersPage.statusOpen')}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white">
                  <Briefcase className="w-3.5 h-3.5 text-brand-gold-lt" />
                  {job.employment_type}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white">
                  <MapPin className="w-3.5 h-3.5 text-brand-gold-lt" />
                  {job.location}
                </span>
                {deadlineDate && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white">
                    <Calendar className="w-3.5 h-3.5 text-brand-gold-lt" />
                    {t('careersPage.deadlineLabel')}: <strong>{deadlineDate}</strong>
                  </span>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                {job.title}
              </h1>
            </div>
          )}
        </div>
      </section>

      <main className="flex-1 py-12">
        <div className="container-custom">
          {loading ? (
            <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center text-neutral-500">
              {t('careersPage.loading')}
            </div>
          ) : error || !job ? (
            <div className="bg-white rounded-2xl border border-red-200 p-12 text-center">
              <p className="text-red-600 font-semibold text-lg mb-4">{error || 'Job not found'}</p>
              <Link
                to="/careers"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-navy text-white text-sm font-semibold"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('careersPage.backToCareers')}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Job Description & Qualifications */}
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-white rounded-2xl border border-neutral-200 p-6 md:p-8 shadow-xs">
                  <h2 className="text-xl font-bold text-brand-navy mb-4">
                    {t('careersPage.descriptionHeading')}
                  </h2>
                  <div className="prose max-w-none text-neutral-700 leading-relaxed whitespace-pre-line">
                    {job.description}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-neutral-200 p-6 md:p-8 shadow-xs">
                  <h2 className="text-xl font-bold text-brand-navy mb-4">
                    {t('careersPage.qualificationsHeading')}
                  </h2>
                  {qualificationList.length > 0 ? (
                    <ul className="space-y-3">
                      {qualificationList.map((item, i) => (
                        <li key={i} className="flex items-start gap-3 text-neutral-700">
                          <CheckCircle2 className="w-5 h-5 text-brand-gold shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-neutral-700 whitespace-pre-line">{job.qualifications}</p>
                  )}
                </div>
              </div>

              {/* Right Column: Application Form */}
              <div className="lg:col-span-5">
                <div className="bg-white rounded-2xl border border-neutral-200 p-6 md:p-8 shadow-sm">
                  {expired ? (
                    <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-center">
                      <XCircle className="w-10 h-10 text-red-600 mx-auto mb-3" />
                      <h3 className="text-lg font-bold text-red-900 mb-2">
                        {t('careerApply.closedBannerTitle')}
                      </h3>
                      <p className="text-sm text-red-700 leading-relaxed">
                        {t('careerApply.closedBannerBody')}
                      </p>
                    </div>
                  ) : submitted ? (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-6 text-center">
                      <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
                      <h3 className="text-xl font-bold text-emerald-950 mb-2">
                        {t('careerApply.successTitle')}
                      </h3>
                      <p className="text-sm text-emerald-800 leading-relaxed mb-5">
                        {t('careerApply.successBody')}
                      </p>
                      <Link
                        to="/careers"
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-navy text-white text-sm font-semibold hover:bg-brand-navy-light transition-colors"
                      >
                        {t('careersPage.backToCareers')}
                      </Link>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <h2 className="text-xl font-bold text-brand-navy">
                          {t('careerApply.heading')}
                        </h2>
                        <p className="text-xs md:text-sm text-neutral-500 mt-1">
                          {t('careerApply.subheading')}
                        </p>
                      </div>

                      {submitError && (
                        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs md:text-sm font-medium">
                          {submitError}
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                          {t('careerApply.nameLabel')} *
                        </label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={e => setName(e.target.value)}
                          placeholder={t('careerApply.namePlaceholder')}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:border-brand-gold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                          {t('careerApply.fatherNameLabel')} *
                        </label>
                        <input
                          type="text"
                          required
                          value={fatherName}
                          onChange={e => setFatherName(e.target.value)}
                          placeholder={t('careerApply.fatherNamePlaceholder')}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:border-brand-gold"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                            {t('careerApply.emailLabel')} *
                          </label>
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder={t('careerApply.emailPlaceholder')}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:border-brand-gold"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                            {t('careerApply.phoneLabel')} *
                          </label>
                          <input
                            type="tel"
                            required
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            placeholder={t('careerApply.phonePlaceholder')}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:border-brand-gold"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                          {t('careerApply.addressLabel')} *
                        </label>
                        <input
                          type="text"
                          required
                          value={address}
                          onChange={e => setAddress(e.target.value)}
                          placeholder={t('careerApply.addressPlaceholder')}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:border-brand-gold"
                        />
                      </div>

                      {/* Applicant Photo Upload */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                          {t('careerApply.photoLabel')} *
                        </label>
                        <div className="flex items-center gap-3">
                          {photoPreview ? (
                            <img
                              src={photoPreview}
                              alt="Applicant preview"
                              className="w-14 h-14 rounded-xl object-cover border border-neutral-200 shrink-0"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-xl bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-400 shrink-0">
                              <UserCheck className="w-6 h-6" />
                            </div>
                          )}
                          <label className="flex-1 cursor-pointer">
                            <span className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-neutral-300 hover:border-brand-gold text-xs font-semibold text-neutral-700 bg-neutral-50 transition-colors">
                              <Upload className="w-4 h-4 text-brand-gold" />
                              {photoFile ? photoFile.name : t('careerApply.photoSelectBtn')}
                            </span>
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              onChange={handlePhotoChange}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>

                      {/* Applicant CV Upload */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                          {t('careerApply.cvLabel')} *
                        </label>
                        <label className="block cursor-pointer">
                          <span className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-neutral-300 hover:border-brand-gold text-xs font-semibold text-neutral-700 bg-neutral-50 transition-colors">
                            <FileText className="w-4 h-4 text-brand-gold" />
                            {cvFile ? cvFile.name : t('careerApply.cvSelectBtn')}
                          </span>
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            onChange={handleCvChange}
                            className="hidden"
                          />
                        </label>
                      </div>

                      <Button
                        type="submit"
                        variant="primary"
                        disabled={submitting}
                        className="w-full py-3 mt-2"
                      >
                        {submitting ? t('careerApply.submitting') : t('careerApply.submitBtn')}
                      </Button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
