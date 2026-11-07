import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Layers,
  Hammer,
  Paintbrush,
  KeyRound,
  CheckCircle2,
  ArrowRight,
  SlidersHorizontal,
  DollarSign,
  ShieldCheck,
  Building2,
} from 'lucide-react';

export interface PaymentMilestone {
  step: number;
  percent: number;
  cumulative: number;
  titleEn: string;
  titleFa: string;
  stageEn: string;
  stageFa: string;
  descEn: string;
  descFa: string;
  barColor: string;
  badgeBg: string;
  icon: 'agreement' | 'structure' | 'brickwork' | 'paint' | 'handover';
}

export interface PaymentPlanDefinition {
  id: 'plan1' | 'plan2';
  badgeEn: string;
  badgeFa: string;
  nameEn: string;
  nameFa: string;
  subtitleEn: string;
  subtitleFa: string;
  summaryHighlightEn: string;
  summaryHighlightFa: string;
  agreementPercent: number;
  constructionPercent: number;
  handoverPercent: number;
  stagesCount: number;
  milestones: PaymentMilestone[];
}

export const PAYMENT_PLANS: Record<'plan1' | 'plan2', PaymentPlanDefinition> = {
  plan1: {
    id: 'plan1',
    badgeEn: '1st Payment Plan · 5-Stage Construction Schedule',
    badgeFa: 'پلان اول پرداخت · جدول ۵ مرحله‌ای پیشرفت ساخت',
    nameEn: '1st Payment Plan',
    nameFa: 'پلان اول پرداخت',
    subtitleEn: '5-Stage Construction Milestone Schedule',
    subtitleFa: 'پرداخت مرحله‌ای مطابق پیشرفت فزیکی ساختمان',
    summaryHighlightEn:
      'Ideal for buyers who prefer spreading 40% of the apartment value across verified structural, brickwork, and finishing milestones.',
    summaryHighlightFa:
      'مناسب برای خریدارانی که ترجیح می‌دهند ۴۰٪ قیمت اپارتمان را در مراحل تاییدشده اسکلیت، خشت‌کاری و رنگ‌مالی پرداخت نمایند.',
    agreementPercent: 50,
    constructionPercent: 40,
    handoverPercent: 10,
    stagesCount: 5,
    milestones: [
      {
        step: 1,
        percent: 50,
        cumulative: 50,
        titleEn: 'On conducting the agreement',
        titleFa: 'هنگام عقد قرارداد رسمی',
        stageEn: 'Stage 01 · Official Contract Signing',
        stageFa: 'مرحله اول · امضای قرارداد رسمی',
        descEn:
          'Initial down payment upon signing the official pre-sale purchase agreement and unit reservation deed at Attaie Properties.',
        descFa:
          'پیش‌پرداخت اول هنگام امضای قرارداد رسمی پیش‌فروش و ثبت واحد به نام خریدار در دفتر املاک عطایی.',
        barColor: 'bg-[#9A712B]',
        badgeBg: 'bg-[#9A712B] text-white',
        icon: 'agreement',
      },
      {
        step: 2,
        percent: 15,
        cumulative: 65,
        titleEn: 'On finishing the structure',
        titleFa: 'هنگام تکمیل اسکلیت ساختمان',
        stageEn: 'Stage 02 · Concrete Frame & Slab Completion',
        stageFa: 'مرحله دوم · تکمیل اسکلیت و چت‌ها',
        descEn:
          'Payable once the reinforced concrete columns, seismic shear walls, and floor slabs of the tower are structurally completed.',
        descFa:
          'قابل پرداخت پس از تکمیل کامل ستون‌های کانکریتی، دیوارهای برشی ضد زلزله و چت‌های ساختمان.',
        barColor: 'bg-[#B3873B]',
        badgeBg: 'bg-[#B3873B] text-white',
        icon: 'structure',
      },
      {
        step: 3,
        percent: 15,
        cumulative: 80,
        titleEn: 'On finishing the brickworks',
        titleFa: 'هنگام تکمیل خشت‌کاری',
        stageEn: 'Stage 03 · Interior Partitions & Masonry',
        stageFa: 'مرحله سوم · دیوارچینی و پارتیشن‌بندی داخلی',
        descEn:
          'Payable upon completion of exterior masonry, acoustic room partitions, and rough-in mechanical/electrical conduits.',
        descFa:
          'قابل پرداخت پس از تکمیل خشت‌کاری بیرونی، دیوارهای جداکننده اتاق‌ها و لوله‌کشی اولیه برق و آب.',
        barColor: 'bg-[#C89F53]',
        badgeBg: 'bg-[#C89F53] text-white',
        icon: 'brickwork',
      },
      {
        step: 4,
        percent: 10,
        cumulative: 90,
        titleEn: 'On finishing the paint job',
        titleFa: 'هنگام تکمیل رنگ‌مالی و نازک‌کاری',
        stageEn: 'Stage 04 · Interior Paint & Fine Finishes',
        stageFa: 'مرحله چهارم · تکمیل رنگ‌مالی و دیکور داخلی',
        descEn:
          'Payable when plastering, primer, interior wall painting, ceiling gypsum work, and cabinet installations are finalized.',
        descFa:
          'قابل پرداخت پس از تکمیل پلسترکاری، رنگ‌مالی دیوارهای داخلی، گچ‌کاری سقف و نصب الماری‌ها.',
        barColor: 'bg-[#1D1B18]',
        badgeBg: 'bg-[#1D1B18] text-white',
        icon: 'paint',
      },
      {
        step: 5,
        percent: 10,
        cumulative: 100,
        titleEn: 'On handover',
        titleFa: 'هنگام تحویل‌دهی کلید اپارتمان',
        stageEn: 'Stage 05 · Final Inspection & Key Handover',
        stageFa: 'مرحله پنجم · بررسی نهایی و تسلیمی کلید',
        descEn:
          'Final settlement upon apartment walkthrough, utility meter activation, and formal handover of keys and ownership documents.',
        descFa:
          'تصفیه نهایی هنگام بازدید اپارتمان، فعال‌سازی میترها و تسلیمی رسمی کلید و اسناد ملکیت.',
        barColor: 'bg-[#1F6E43]',
        badgeBg: 'bg-[#1F6E43] text-white',
        icon: 'handover',
      },
    ],
  },
  plan2: {
    id: 'plan2',
    badgeEn: '2nd Payment Plan · 2-Stage Direct Settlement',
    badgeFa: 'پلان دوم پرداخت · تسویه مستقیم ۲ مرحله‌ای',
    nameEn: '2nd Payment Plan',
    nameFa: 'پلان دوم پرداخت',
    subtitleEn: '2-Stage Direct Agreement & Handover Plan',
    subtitleFa: 'پرداخت مستقیم در زمان عقد قرارداد و تحویل کلید',
    summaryHighlightEn:
      'Designed for buyers seeking a simplified two-step settlement with zero intermediate construction installments until final key handover.',
    summaryHighlightFa:
      'طراحی‌شده برای خریدارانی که پرداخت ساده دو مرحله‌ای بدون اقساط میانی در جریان ساخت را تا زمان تحویل کلید ترجیح می‌دهند.',
    agreementPercent: 75,
    constructionPercent: 0,
    handoverPercent: 25,
    stagesCount: 2,
    milestones: [
      {
        step: 1,
        percent: 75,
        cumulative: 75,
        titleEn: 'On conducting the agreement',
        titleFa: 'هنگام عقد قرارداد رسمی',
        stageEn: 'Stage 01 · Official Contract Signing (Zero Mid-Construction Installments)',
        stageFa: 'مرحله اول · عقد قرارداد رسمی (بدون اقساط میانی ساخت)',
        descEn:
          '75% upfront payment upon conducting the formal purchase agreement. No intermediate payments are required during structure, brickwork, or painting stages.',
        descFa:
          'پرداخت ۷۵٪ هنگام عقد قرارداد رسمی خرید. هیچ پرداخت میانی در مراحل اسکلیت، خشت‌کاری یا رنگ‌مالی نیاز نیست.',
        barColor: 'bg-[#9A712B]',
        badgeBg: 'bg-[#9A712B] text-white',
        icon: 'agreement',
      },
      {
        step: 2,
        percent: 25,
        cumulative: 100,
        titleEn: 'On handover',
        titleFa: 'هنگام تحویل‌دهی کلید اپارتمان',
        stageEn: 'Stage 02 · Final Inspection & Key Handover',
        stageFa: 'مرحله دوم · بررسی نهایی و تسلیمی کلید',
        descEn:
          'Remaining 25% balance paid directly upon completion of the apartment, final quality inspection, and formal handover of keys.',
        descFa:
          'پرداخت ۲۵٪ باقی‌مانده مستقیماً پس از تکمیل کامل اپارتمان، بررسی کیفیت نهایی و تحویل رسمی کلید.',
        barColor: 'bg-[#1F6E43]',
        badgeBg: 'bg-[#1F6E43] text-white',
        icon: 'handover',
      },
    ],
  },
};

const PRESET_PRICES = [95000, 125000, 165000, 230000];

function MilestoneIcon({ type, className = 'w-4 h-4' }: { type: PaymentMilestone['icon']; className?: string }) {
  switch (type) {
    case 'agreement':
      return <FileText className={className} />;
    case 'structure':
      return <Layers className={className} />;
    case 'brickwork':
      return <Hammer className={className} />;
    case 'paint':
      return <Paintbrush className={className} />;
    case 'handover':
      return <KeyRound className={className} />;
  }
}

interface PaymentPlanComparisonCardProps {
  projectName?: string;
  initialPrice?: number;
  isRtl?: boolean;
  compact?: boolean;
}

export const PaymentPlanComparisonCard: React.FC<PaymentPlanComparisonCardProps> = ({
  projectName,
  initialPrice = 125000,
  isRtl = false,
  compact = false,
}) => {
  const [activeView, setActiveView] = useState<'plan1' | 'plan2' | 'compare'>('plan1');
  const [unitPrice, setUnitPrice] = useState<number>(initialPrice);
  const [selectedStep, setSelectedStep] = useState<number | null>(null);

  const currentPlan = activeView === 'plan2' ? PAYMENT_PLANS.plan2 : PAYMENT_PLANS.plan1;

  const formatUsd = (amount: number) =>
    `$${Math.round(amount).toLocaleString('en-US')}`;

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`rounded-2xl bg-white border border-[#E5DEC9] shadow-[0_20px_50px_rgba(29,27,24,0.06)] overflow-hidden ${
        compact ? 'p-5 md:p-6' : 'p-6 md:p-10'
      }`}
    >
      {/* Top Header + Interactive Plan Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-7 border-b border-[#E5DEC9]">
        <div>
          <div className="inline-flex items-center gap-2 text-[#9A712B] text-xs font-bold uppercase tracking-[0.2em] mb-2">
            <ShieldCheck className="w-4 h-4" />
            <span>
              {isRtl
                ? 'پلان‌های رسمی پیش‌فروش املاک عطایی'
                : 'Official Pre-Sale Apartment Payment Plans'}
            </span>
          </div>
          <h2
            className={`${
              compact ? 'text-xl md:text-2xl' : 'text-2xl md:text-4xl'
            } font-bold text-[#1D1B18] tracking-tight`}
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            {isRtl
              ? 'مقایسه هوشمند شرایط پرداخت اقساط'
              : 'Interactive Payment Plan Comparison'}
          </h2>
          <p className="text-sm text-[#5C564B] mt-1.5 max-w-2xl">
            {isRtl
              ? `بین پلان اول (۵ مرحله‌ای مطابق پیشرفت ساخت) و پلان دوم (۲ مرحله‌ای مستقیم) مقایسه کنید${
                  projectName ? ` — ${projectName}` : ''
                }.`
              : `Switch smoothly between our 1st Payment Plan (5 construction milestones) and 2nd Payment Plan (2 direct stages)${
                  projectName ? ` for ${projectName}` : ''
                }.`}
          </p>
        </div>

        {/* Framer Motion Segmented Tab Switcher */}
        <div
          role="tablist"
          aria-label="Payment Plan Switcher"
          className="inline-flex flex-wrap sm:flex-nowrap items-center p-1.5 rounded-xl bg-[#F4EFE6] border border-[#E5DEC9] self-start lg:self-auto"
        >
          {(
            [
              {
                id: 'plan1',
                labelEn: '1st Payment Plan',
                labelFa: 'پلان اول پرداخت',
                badge: '5 Stages',
              },
              {
                id: 'plan2',
                labelEn: '2nd Payment Plan',
                labelFa: 'پلان دوم پرداخت',
                badge: '2 Stages',
              },
              {
                id: 'compare',
                labelEn: 'Side-by-Side',
                labelFa: 'مقایسه همزمان',
                badge: 'Compare',
              },
            ] as const
          ).map((tab) => {
            const isActive = activeView === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                type="button"
                onClick={() => {
                  setActiveView(tab.id);
                  setSelectedStep(null);
                }}
                className={`relative px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-colors duration-200 flex items-center gap-2 cursor-pointer ${
                  isActive ? 'text-white' : 'text-[#5C564B] hover:text-[#1D1B18]'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId={compact ? 'activePaymentTabCompact' : 'activePaymentTabMain'}
                    className="absolute inset-0 rounded-lg bg-[#1D1B18] shadow-md"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="relative z-10">
                  {isRtl ? tab.labelFa : tab.labelEn}
                </span>
                <span
                  className={`relative z-10 text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded ${
                    isActive
                      ? 'bg-[#9A712B] text-white'
                      : 'bg-white/80 text-[#7A7265] border border-[#E5DEC9]'
                  }`}
                >
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Apartment Value Estimator Bar */}
      <div className="mt-6 rounded-xl bg-[#FAF8F5] border border-[#E5DEC9] p-4 md:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#9A712B]/15 border border-[#9A712B]/30 flex items-center justify-center text-[#9A712B] shrink-0">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#7A7265]">
              {isRtl
                ? 'ماشین‌حساب اقساط بر اساس ارزش اپارتمان'
                : 'Interactive Milestone Calculator (USD)'}
            </div>
            <p className="text-xs text-[#5C564B] mt-0.5">
              {isRtl
                ? 'قیمت تخمینی اپارتمان را انتخاب یا وارد کنید تا مبلغ دقیق هر مرحله محاسبه شود.'
                : 'Select or enter an apartment price to calculate exact USD amounts for every milestone.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1.5">
            {PRESET_PRICES.map((preset) => {
              const isSelected = unitPrice === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setUnitPrice(preset)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#9A712B] text-white shadow-sm'
                      : 'bg-white text-[#5C564B] border border-[#E5DEC9] hover:border-[#9A712B]/60 hover:text-[#1D1B18]'
                  }`}
                >
                  ${(preset / 1000).toFixed(0)}k
                </button>
              );
            })}
          </div>

          {/* Custom USD Input */}
          <div className="relative flex items-center">
            <DollarSign className="w-4 h-4 text-[#9A712B] absolute left-3 pointer-events-none" />
            <input
              type="number"
              min={10000}
              max={5000000}
              step={5000}
              value={unitPrice}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (!Number.isNaN(val) && val >= 0) {
                  setUnitPrice(val);
                }
              }}
              aria-label="Estimated Apartment Value in USD"
              className="pl-8 pr-3 py-1.5 w-36 rounded-lg bg-white border border-[#D5CBB8] text-sm font-mono font-bold text-[#1D1B18] focus:outline-none focus:border-[#9A712B]"
            />
          </div>
        </div>
      </div>

      {/* Main Content Area: Single Active Plan View vs Side-by-Side Comparison View */}
      <AnimatePresence mode="wait">
        {activeView !== 'compare' ? (
          <motion.div
            key={currentPlan.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="mt-7 space-y-7"
          >
            {/* Active Plan Summary Banner + 3 Key Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              <div
                className={`lg:col-span-6 rounded-xl p-5 md:p-6 border flex flex-col justify-between ${
                  currentPlan.id === 'plan1'
                    ? 'bg-gradient-to-br from-[#FAF8F5] to-[#F2ECE1] border-[#E5DEC9]'
                    : 'bg-gradient-to-br from-[#1D1B18] to-[#2A2621] border-[#1D1B18] text-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-widest ${
                        currentPlan.id === 'plan1'
                          ? 'bg-[#9A712B]/15 text-[#9A712B] border border-[#9A712B]/30'
                          : 'bg-[#9A712B] text-white'
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      {isRtl ? currentPlan.badgeFa : currentPlan.badgeEn}
                    </span>
                    <span
                      className={`text-xs font-mono font-bold ${
                        currentPlan.id === 'plan1' ? 'text-[#7A7265]' : 'text-[#D6C5A3]'
                      }`}
                    >
                      100% Total · {formatUsd(unitPrice)}
                    </span>
                  </div>

                  <h3
                    className={`text-xl md:text-2xl font-bold ${
                      currentPlan.id === 'plan1' ? 'text-[#1D1B18]' : 'text-white'
                    }`}
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                  >
                    {isRtl ? currentPlan.nameFa : currentPlan.nameEn} —{' '}
                    <span className="text-[#9A712B]">
                      {isRtl ? currentPlan.subtitleFa : currentPlan.subtitleEn}
                    </span>
                  </h3>
                  <p
                    className={`text-xs sm:text-sm mt-2 leading-relaxed ${
                      currentPlan.id === 'plan1' ? 'text-[#5C564B]' : 'text-white/80'
                    }`}
                  >
                    {isRtl ? currentPlan.summaryHighlightFa : currentPlan.summaryHighlightEn}
                  </p>
                </div>

                {/* Quick Switch Prompt */}
                <div className="mt-5 pt-4 border-t border-current/10 flex items-center justify-between text-xs">
                  <span
                    className={
                      currentPlan.id === 'plan1' ? 'text-[#7A7265]' : 'text-white/70'
                    }
                  >
                    {currentPlan.id === 'plan1'
                      ? isRtl
                        ? 'می‌خواهید بدون اقساط میانی پرداخت کنید؟'
                        : 'Prefer zero installments during construction?'
                      : isRtl
                        ? 'می‌خواهید پرداخت را در ۵ مرحله تقسیم کنید؟'
                        : 'Prefer spreading payments across 5 build stages?'}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveView(currentPlan.id === 'plan1' ? 'plan2' : 'plan1')
                    }
                    className="inline-flex items-center gap-1.5 font-bold text-[#9A712B] hover:underline cursor-pointer"
                  >
                    <span>
                      {currentPlan.id === 'plan1'
                        ? isRtl
                          ? 'مشاهده پلان دوم (۷۵٪ / ۲۵٪)'
                          : 'Switch to 2nd Plan (75% / 25%)'
                        : isRtl
                          ? 'مشاهده پلان اول (۵ مرحله‌ای)'
                          : 'Switch to 1st Plan (5 Stages)'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 3 Phase Allocation Cards */}
              <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Phase A: Agreement */}
                <div className="rounded-xl bg-[#FAF8F5] border border-[#E5DEC9] p-4 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7A7265] block">
                      {isRtl ? '۱. هنگام عقد قرارداد' : '1. On Agreement'}
                    </span>
                    <motion.div
                      key={`agree-${currentPlan.agreementPercent}`}
                      initial={{ scale: 0.92, opacity: 0.5 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-2xl md:text-3xl font-mono font-bold text-[#9A712B] mt-1"
                    >
                      {currentPlan.agreementPercent}%
                    </motion.div>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-[#E5DEC9]">
                    <div className="text-xs font-mono font-bold text-[#1D1B18]">
                      {formatUsd((unitPrice * currentPlan.agreementPercent) / 100)}
                    </div>
                    <div className="text-[11px] text-[#7A7265]">
                      {isRtl ? 'پیش‌پرداخت اول' : 'Initial Contract Signing'}
                    </div>
                  </div>
                </div>

                {/* Phase B: Construction Milestones */}
                <div className="rounded-xl bg-[#FAF8F5] border border-[#E5DEC9] p-4 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7A7265] block">
                      {isRtl ? '۲. در جریان ساخت' : '2. Construction Stages'}
                    </span>
                    <motion.div
                      key={`const-${currentPlan.constructionPercent}`}
                      initial={{ scale: 0.92, opacity: 0.5 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-2xl md:text-3xl font-mono font-bold text-[#1D1B18] mt-1"
                    >
                      {currentPlan.constructionPercent}%
                    </motion.div>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-[#E5DEC9]">
                    <div className="text-xs font-mono font-bold text-[#1D1B18]">
                      {formatUsd((unitPrice * currentPlan.constructionPercent) / 100)}
                    </div>
                    <div className="text-[11px] text-[#7A7265]">
                      {currentPlan.constructionPercent > 0
                        ? isRtl
                          ? 'در ۳ مرحله (۱۵٪ + ۱۵٪ + ۱۰٪)'
                          : 'Across 3 stages (15% + 15% + 10%)'
                        : isRtl
                          ? 'بدون اقساط میانی (۰٪)'
                          : 'Zero mid-construction fees'}
                    </div>
                  </div>
                </div>

                {/* Phase C: Final Handover */}
                <div className="rounded-xl bg-[#FAF8F5] border border-[#E5DEC9] p-4 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7A7265] block">
                      {isRtl ? '۳. هنگام تحویل کلید' : '3. On Key Handover'}
                    </span>
                    <motion.div
                      key={`handover-${currentPlan.handoverPercent}`}
                      initial={{ scale: 0.92, opacity: 0.5 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-2xl md:text-3xl font-mono font-bold text-[#1F6E43] mt-1"
                    >
                      {currentPlan.handoverPercent}%
                    </motion.div>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-[#E5DEC9]">
                    <div className="text-xs font-mono font-bold text-[#1D1B18]">
                      {formatUsd((unitPrice * currentPlan.handoverPercent) / 100)}
                    </div>
                    <div className="text-[11px] text-[#7A7265]">
                      {isRtl ? 'تصفیه نهایی تحویل واحد' : 'Final Key Handover Balance'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Segmented Progress Bar with Animated Widths */}
            <div className="rounded-xl bg-[#FAF8F5] border border-[#E5DEC9] p-4 md:p-5">
              <div className="flex items-center justify-between text-xs font-bold text-[#5C564B] mb-2.5">
                <span className="uppercase tracking-wider">
                  {isRtl
                    ? 'نمودار تناسب مراحل پرداخت (کلیک روی هر مرحله)'
                    : 'Milestone Distribution Timeline (Click any segment to inspect)'}
                </span>
                <span className="font-mono text-[#9A712B]">
                  {currentPlan.stagesCount}{' '}
                  {isRtl ? 'مرحله رسمی' : 'Verified Milestones'} = 100%
                </span>
              </div>

              <div className="h-5 w-full rounded-xl overflow-hidden flex bg-[#E5DEC9] p-0.5 gap-1">
                {currentPlan.milestones.map((m) => {
                  const isFocused = selectedStep === m.step;
                  return (
                    <motion.button
                      key={`${currentPlan.id}-bar-${m.step}`}
                      type="button"
                      layout
                      initial={{ width: 0 }}
                      animate={{ width: `${m.percent}%` }}
                      transition={{ type: 'spring', stiffness: 220, damping: 28 }}
                      onClick={() =>
                        setSelectedStep(selectedStep === m.step ? null : m.step)
                      }
                      title={`${m.step}. ${m.titleEn} (${m.percent}%)`}
                      className={`h-full first:rounded-l-lg last:rounded-r-lg ${m.barColor} relative group cursor-pointer transition-opacity ${
                        selectedStep !== null && !isFocused
                          ? 'opacity-45'
                          : 'opacity-100'
                      }`}
                    >
                      <span className="sr-only">
                        {m.titleEn} {m.percent}%
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Legend pills */}
              <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
                <div className="flex flex-wrap items-center gap-2">
                  {currentPlan.milestones.map((m) => (
                    <button
                      key={`${currentPlan.id}-legend-${m.step}`}
                      type="button"
                      onClick={() =>
                        setSelectedStep(selectedStep === m.step ? null : m.step)
                      }
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-all cursor-pointer ${
                        selectedStep === m.step
                          ? 'bg-[#1D1B18] text-white font-bold shadow-sm'
                          : 'bg-white border border-[#E5DEC9] text-[#5C564B] hover:border-[#9A712B]'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${m.barColor}`} />
                      <span className="font-mono font-bold">{m.percent}%</span>
                      <span className="truncate max-w-[160px]">
                        {isRtl ? m.titleFa : m.titleEn}
                      </span>
                    </button>
                  ))}
                </div>
                {selectedStep !== null && (
                  <button
                    type="button"
                    onClick={() => setSelectedStep(null)}
                    className="text-xs font-bold text-[#9A712B] hover:underline cursor-pointer"
                  >
                    {isRtl ? 'نمایش همه مراحل' : 'Show all milestones'}
                  </button>
                )}
              </div>
            </div>

            {/* Detailed Milestone Breakdown Cards */}
            <div className="space-y-3">
              {currentPlan.milestones.map((item, idx) => {
                const milestoneUsd = (unitPrice * item.percent) / 100;
                const cumulativeUsd = (unitPrice * item.cumulative) / 100;
                const isHighlighted = selectedStep === item.step;

                return (
                  <motion.div
                    key={`${currentPlan.id}-step-${item.step}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.25,
                      delay: idx * 0.05,
                      ease: 'easeOut',
                    }}
                    onClick={() =>
                      setSelectedStep(selectedStep === item.step ? null : item.step)
                    }
                    className={`rounded-xl border transition-all p-4 md:p-5 cursor-pointer ${
                      isHighlighted
                        ? 'bg-[#FAF8F5] border-[#9A712B] ring-2 ring-[#9A712B]/20 shadow-md'
                        : 'bg-white border-[#E5DEC9] hover:border-[#9A712B]/60 hover:bg-[#FAF8F5]/60'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Left: Step Number, Icon, Title & Description */}
                      <div className="flex items-start gap-3.5 md:gap-4">
                        <div
                          className={`w-10 h-10 rounded-xl font-mono text-sm font-bold flex items-center justify-center shrink-0 shadow-sm ${item.badgeBg}`}
                        >
                          {item.step}
                        </div>
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#9A712B]">
                              <MilestoneIcon
                                type={item.icon}
                                className="w-3.5 h-3.5"
                              />
                              {isRtl ? item.stageFa : item.stageEn}
                            </span>
                            <span className="text-[11px] font-mono text-[#7A7265] bg-[#F4EFE6] px-2 py-0.5 rounded">
                              {isRtl
                                ? `مجموع پرداختی تا این مرحله: ${item.cumulative}%`
                                : `Cumulative Paid: ${item.cumulative}% (${formatUsd(
                                    cumulativeUsd
                                  )})`}
                            </span>
                          </div>

                          <h4 className="text-base md:text-lg font-bold text-[#1D1B18]">
                            {item.step}. {isRtl ? item.titleFa : item.titleEn}
                          </h4>

                          <p className="text-xs sm:text-sm text-[#5C564B] leading-relaxed max-w-3xl">
                            {isRtl ? item.descFa : item.descEn}
                          </p>
                        </div>
                      </div>

                      {/* Right: Percentage Share + USD Amount + Mini Progress Bar */}
                      <div className="flex sm:items-center md:flex-col md:items-end justify-between gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-[#E5DEC9] shrink-0 md:min-w-[175px]">
                        <div className="flex items-baseline gap-2 md:justify-end">
                          <span className="text-2xl md:text-3xl font-mono font-bold text-[#1D1B18]">
                            {item.percent}%
                          </span>
                          <span className="text-sm font-mono font-bold text-[#9A712B]">
                            {formatUsd(milestoneUsd)}
                          </span>
                        </div>
                        <div className="w-32 md:w-full h-2 rounded-full bg-[#EFECE6] overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${item.percent}%` }}
                            transition={{
                              duration: 0.45,
                              delay: idx * 0.05,
                              ease: 'easeOut',
                            }}
                            className={`h-full rounded-full ${item.barColor}`}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ) : (
          /* Side-by-Side Comparison View */
          <motion.div
            key="compare-view"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="mt-7 space-y-6"
          >
            {/* Side-by-Side Matrix Table */}
            <div className="overflow-x-auto rounded-xl border border-[#E5DEC9]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FAF8F5] border-b border-[#E5DEC9]">
                    <th className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-[#7A7265]">
                      {isRtl ? 'مرحله ساخت و تحویل' : 'Construction & Contract Stage'}
                    </th>
                    <th className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-[#9A712B] bg-[#9A712B]/5">
                      {isRtl
                        ? 'پلان اول پرداخت (۵ مرحله‌ای)'
                        : '1st Payment Plan (5 Stages)'}
                    </th>
                    <th className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-[#1D1B18]">
                      {isRtl
                        ? 'پلان دوم پرداخت (۲ مرحله‌ای)'
                        : '2nd Payment Plan (2 Stages)'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5DEC9] text-sm">
                  {[
                    {
                      stageEn: '1. On conducting the agreement',
                      stageFa: '۱. هنگام عقد قرارداد رسمی',
                      p1: 50,
                      p2: 75,
                    },
                    {
                      stageEn: '2. On finishing the structure',
                      stageFa: '۲. هنگام تکمیل اسکلیت ساختمان',
                      p1: 15,
                      p2: 0,
                    },
                    {
                      stageEn: '3. On finishing the brickworks',
                      stageFa: '۳. هنگام تکمیل خشت‌کاری',
                      p1: 15,
                      p2: 0,
                    },
                    {
                      stageEn: '4. On finishing the paint job',
                      stageFa: '۴. هنگام تکمیل رنگ‌مالی',
                      p1: 10,
                      p2: 0,
                    },
                    {
                      stageEn: '5. On handover',
                      stageFa: '۵. هنگام تحویل کلید اپارتمان',
                      p1: 10,
                      p2: 25,
                    },
                  ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#FAF8F5]/80 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-[#1D1B18]">
                        {isRtl ? row.stageFa : row.stageEn}
                      </td>
                      <td className="py-3.5 px-4 font-mono bg-[#9A712B]/5">
                        <span className="font-bold text-[#1D1B18]">{row.p1}%</span>
                        <span className="text-xs text-[#9A712B] ml-2">
                          ({formatUsd((unitPrice * row.p1) / 100)})
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        {row.p2 > 0 ? (
                          <>
                            <span className="font-bold text-[#1D1B18]">
                              {row.p2}%
                            </span>
                            <span className="text-xs text-[#7A7265] ml-2">
                              ({formatUsd((unitPrice * row.p2) / 100)})
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-[#7A7265] italic">
                            {isRtl
                              ? '۰٪ — بدون قسط در این مرحله'
                              : '0% — No payment required at this stage'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Dual Cards Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {(['plan1', 'plan2'] as const).map((planKey) => {
                const plan = PAYMENT_PLANS[planKey];
                return (
                  <div
                    key={plan.id}
                    className={`rounded-xl p-5 border flex flex-col justify-between ${
                      plan.id === 'plan1'
                        ? 'bg-[#FAF8F5] border-[#E5DEC9]'
                        : 'bg-[#1D1B18] text-white border-[#1D1B18]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="text-xs font-bold uppercase tracking-widest text-[#9A712B]">
                          {isRtl ? plan.badgeFa : plan.badgeEn}
                        </span>
                        <CheckCircle2 className="w-4 h-4 text-[#9A712B]" />
                      </div>
                      <h4
                        className="text-xl font-bold mb-3"
                        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                      >
                        {isRtl ? plan.nameFa : plan.nameEn}
                      </h4>
                      <ul className="space-y-2 text-xs sm:text-sm">
                        {plan.milestones.map((m) => (
                          <li
                            key={m.step}
                            className={`flex items-center justify-between py-1.5 border-b ${
                              plan.id === 'plan1'
                                ? 'border-[#E5DEC9] text-[#1D1B18]'
                                : 'border-white/10 text-white/90'
                            }`}
                          >
                            <span>
                              {m.step}. {isRtl ? m.titleFa : m.titleEn}
                            </span>
                            <span className="font-mono font-bold text-[#9A712B]">
                              {m.percent}% ({formatUsd((unitPrice * m.percent) / 100)})
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveView(plan.id)}
                      className={`mt-5 w-full py-2.5 px-4 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                        plan.id === 'plan1'
                          ? 'bg-[#1D1B18] text-white hover:bg-[#9A712B]'
                          : 'bg-[#9A712B] text-white hover:bg-[#b08336]'
                      }`}
                    >
                      {isRtl
                        ? `مشاهده جزئیات کامل ${plan.nameFa}`
                        : `Inspect Full ${plan.nameEn} Breakdown`}
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
