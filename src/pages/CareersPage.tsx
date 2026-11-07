import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Briefcase,
  Calendar,
  Clock,
  Cloud,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  MapPin,
  Sun,
  ArrowRight,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { SeoHead } from '../components/seo/SeoHead';
import { getCareers, type CareerJob } from '../lib/dbService';
import { Button } from '../components/ui/Button';
import { Breadcrumbs } from '../components/ui/Breadcrumbs';

interface KabulWeatherCache {
  tempC: number;
  weatherCode: number;
  fetchedAt: number;
}

let cachedKabulWeather: KabulWeatherCache | null = null;

function isJobExpiredInKabul(job: CareerJob): boolean {
  if (job.is_expired !== undefined) return Boolean(job.is_expired);
  if (job.status === 'closed' || job.effective_status === 'closed') return true;
  const raw = job.deadline_at?.trim() || '';
  if (!raw) return false;
  const datePart = raw.slice(0, 10);
  // Kabul is UTC+04:30 year-round
  const isoCutoff = /^\d{4}-\d{2}-\d{2}$/.test(raw) || raw.endsWith('00:00:00')
    ? `${datePart}T23:59:59+04:30`
    : `${raw.replace(' ', 'T')}+04:30`;
  const cutoffMs = Date.parse(isoCutoff);
  return Number.isFinite(cutoffMs) ? Date.now() > cutoffMs : false;
}

export const KabulLiveInfoBar: React.FC = () => {
  const { t, i18n } = useTranslation('common');
  const [now, setNow] = useState<Date>(() => new Date());
  const [weather, setWeather] = useState<KabulWeatherCache | null>(cachedKabulWeather);
  const [weatherFailed, setWeatherFailed] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const TEN_MINUTES = 10 * 60 * 1000;
    if (cachedKabulWeather && Date.now() - cachedKabulWeather.fetchedAt < TEN_MINUTES) {
      setWeather(cachedKabulWeather);
      return;
    }

    const controller = new AbortController();
    fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=34.5553&longitude=69.2075&current=temperature_2m,weather_code',
      { signal: controller.signal }
    )
      .then(res => {
        if (!res.ok) throw new Error('Weather fetch failed');
        return res.json();
      })
      .then(data => {
        const temp = Number(data?.current?.temperature_2m);
        const code = Number(data?.current?.weather_code ?? 0);
        if (Number.isFinite(temp)) {
          const entry: KabulWeatherCache = {
            tempC: Math.round(temp),
            weatherCode: code,
            fetchedAt: Date.now(),
          };
          cachedKabulWeather = entry;
          setWeather(entry);
        } else {
          setWeatherFailed(true);
        }
      })
      .catch(() => {
        setWeatherFailed(true);
      });

    return () => controller.abort();
  }, []);

  const locale = i18n.language === 'fa' ? 'fa-AF' : 'en-US';

  const formattedDate = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(locale, {
        timeZone: 'Asia/Kabul',
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(now);
    } catch {
      return now.toISOString().slice(0, 10);
    }
  }, [now, locale]);

  const formattedTime = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(locale, {
        timeZone: 'Asia/Kabul',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }).format(now);
    } catch {
      return now.toLocaleTimeString();
    }
  }, [now, locale]);

  const getWeatherMeta = (code: number) => {
    if (code === 0) return { label: t('careersPage.weatherClear'), Icon: Sun };
    if (code === 1 || code === 2) return { label: t('careersPage.weatherPartlyCloudy'), Icon: CloudSun };
    if (code === 3 || code === 45 || code === 48) return { label: t('careersPage.weatherCloudy'), Icon: Cloud };
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return { label: t('careersPage.weatherRain'), Icon: CloudRain };
    if ((code >= 71 && code <= 77) || code === 85 || code === 86) return { label: t('careersPage.weatherSnow'), Icon: CloudSnow };
    if (code >= 95) return { label: t('careersPage.weatherStorm'), Icon: CloudLightning };
    return { label: t('careersPage.weatherPartlyCloudy'), Icon: CloudSun };
  };

  const weatherMeta = weather ? getWeatherMeta(weather.weatherCode) : null;
  const WeatherIcon = weatherMeta?.Icon ?? CloudSun;

  return (
    <div className="inline-flex flex-wrap items-center gap-4 bg-white/10 backdrop-blur-md border border-white/15 rounded-xl px-4 py-2.5 text-white shadow-md">
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-brand-gold shrink-0" />
        <span className="text-sm font-bold text-white">{formattedDate}</span>
      </div>

      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-brand-gold shrink-0" />
        <span className="text-sm font-bold text-white font-mono">{formattedTime}</span>
      </div>

      <div className="flex items-center gap-2">
        <WeatherIcon className="w-4 h-4 text-brand-gold shrink-0" />
        {weather ? (
          <span className="text-sm font-bold text-white">
            {weather.tempC}°C · {weatherMeta?.label}
          </span>
        ) : (
          <span className="text-sm text-white/75">
            {weatherFailed ? t('careersPage.weatherUnavailable') : '…'}
          </span>
        )}
      </div>
    </div>
  );
};

export default function CareersPage() {
  const { t } = useTranslation('common');
  const [jobs, setJobs] = useState<CareerJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('all');

  const loadJobs = () => {
    setLoading(true);
    setError(null);
    getCareers()
      .then(data => setJobs(Array.isArray(data) ? data : []))
      .catch(err => setError((err as Error).message || t('careersPage.error')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const expired = isJobExpiredInKabul(job);
      if (filter === 'open') return !expired;
      if (filter === 'closed') return expired;
      return true;
    });
  }, [jobs, filter]);

  return (
    <div className="min-h-screen flex flex-col bg-brand-cream">
      <SeoHead />
      <Navbar />

      {/* Hero Header with Kabul Live Date, Clock, and Weather */}
      <section className="relative bg-brand-navy pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 islamic-pattern opacity-10 pointer-events-none" />
        <div className="container-custom relative z-10">
          <Breadcrumbs
            variant="light"
            items={[{ label: t('nav.careers', 'Careers') }]}
            className="mb-4"
          />
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-gold/20 border border-brand-gold/40 text-brand-gold-lt text-xs font-bold uppercase tracking-widest mb-4">
              <Briefcase className="w-3.5 h-3.5" />
              {t('careersPage.eyebrow')}
            </span>
            <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-4">
              {t('careersPage.title')}
            </h1>
            <p className="text-white/75 text-base md:text-lg leading-relaxed">
              {t('careersPage.subtitle')}
            </p>
          </div>
        </div>
      </section>

      {/* Main Listings Content */}
      <main className="flex-1 py-14">
        <div className="container-custom">
          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="inline-flex bg-white p-1.5 rounded-xl border border-neutral-200 shadow-xs">
              {(
                [
                  { id: 'all', label: t('careersPage.filterAll') },
                  { id: 'open', label: t('careersPage.filterOpen') },
                  { id: 'closed', label: t('careersPage.filterClosed') },
                ] as const
              ).map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                    filter === tab.id
                      ? 'bg-brand-navy text-white shadow-xs'
                      : 'text-neutral-600 hover:text-brand-navy'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center text-neutral-500">
              {t('careersPage.loading')}
            </div>
          ) : error ? (
            <div className="bg-white rounded-2xl border border-red-200 p-10 text-center">
              <p className="text-red-600 font-semibold mb-4">{error}</p>
              <Button variant="primary" onClick={loadJobs}>
                {t('careersPage.retry')}
              </Button>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center text-neutral-600">
              <Briefcase className="w-10 h-10 text-neutral-400 mx-auto mb-3" />
              <p className="font-medium">{t('careersPage.empty')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {filteredJobs.map((job, idx) => {
                const expired = isJobExpiredInKabul(job);
                const deadlineDate = job.deadline_at ? job.deadline_at.slice(0, 10) : '';
                const qualificationLines = (job.qualifications || '')
                  .split(/\r?\n/)
                  .map(line => line.replace(/^[-•*]\s*/, '').trim())
                  .filter(Boolean)
                  .slice(0, 4);

                return (
                  <motion.article
                    key={job.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: idx * 0.05 }}
                    className="bg-white rounded-2xl border border-neutral-200/90 shadow-xs hover:shadow-md transition-all p-6 md:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5 mb-3">
                        {expired ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                            <XCircle className="w-3.5 h-3.5" />
                            {t('careersPage.statusClosed')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {t('careersPage.statusOpen')}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-gold/10 text-brand-gold">
                          <Briefcase className="w-3.5 h-3.5" />
                          {job.employment_type}
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700">
                          <MapPin className="w-3.5 h-3.5 text-brand-gold" />
                          {job.location}
                        </span>
                        {deadlineDate && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700">
                            <Calendar className="w-3.5 h-3.5 text-brand-gold" />
                            {t('careersPage.deadlineLabel')}: <strong>{deadlineDate}</strong>
                          </span>
                        )}
                      </div>

                      <h2 className="text-xl md:text-2xl font-bold text-brand-navy mb-2">
                        <Link to={`/careers/${job.id}`} className="hover:text-brand-gold transition-colors">
                          {job.title}
                        </Link>
                      </h2>

                      <p className="text-neutral-600 text-sm md:text-base line-clamp-2 mb-4">
                        {job.description}
                      </p>

                      {qualificationLines.length > 0 && (
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                            {t('careersPage.qualificationsHeading')}
                          </p>
                          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs md:text-sm text-neutral-700">
                            {qualificationLines.map((q, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-brand-gold mt-2 shrink-0" />
                                <span className="line-clamp-1">{q}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 flex lg:flex-col items-stretch sm:items-end justify-end gap-3 border-t lg:border-t-0 pt-4 lg:pt-0 border-neutral-100">
                      <Link
                        to={`/careers/${job.id}`}
                        className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
                          expired
                            ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                            : 'bg-brand-gold text-white hover:bg-brand-gold-dark shadow-sm'
                        }`}
                      >
                        {expired ? t('careersPage.viewDetails') : t('careersPage.viewAndApply')}
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
