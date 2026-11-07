import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Thumbs, Keyboard } from 'swiper/modules';
import type { Swiper as SwiperClass } from 'swiper';
import gsap from 'gsap';
import { X, ZoomIn, Images, Maximize2 } from 'lucide-react';

interface Props {
  images: string[];
  alt: string;
}

export function ImageGallery({ images, alt }: Props) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperClass | null>(null);
  const galleryContainerRef = useRef<HTMLDivElement>(null);

  // GSAP Image Reveal on mount
  useEffect(() => {
    if (!galleryContainerRef.current || !images.length) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        galleryContainerRef.current,
        { opacity: 0, scale: 0.985, y: 14 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.75,
          ease: 'power3.out',
        }
      );
    }, galleryContainerRef);

    return () => ctx.revert();
  }, [images.length]);

  useEffect(() => {
    if (!lightbox) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightbox]);

  if (!images.length) return null;

  const single = images.length === 1;

  return (
    <div ref={galleryContainerRef}>
      {/* Main Swiper Gallery */}
      <div className="relative w-full h-[58vh] min-h-[420px] overflow-hidden bg-brand-navy rounded-b-2xl group">
        <Swiper
          modules={[Navigation, Pagination, Thumbs, Keyboard]}
          navigation={!single}
          pagination={!single ? { clickable: true, dynamicBullets: true } : false}
          keyboard={{ enabled: true }}
          thumbs={{
            swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null,
          }}
          onSlideChange={(swiper) => setActive(swiper.activeIndex)}
          className="w-full h-full"
        >
          {images.map((src, idx) => (
            <SwiperSlide key={`${alt}-slide-${idx}`}>
              <div className="relative w-full h-full">
                <img
                  src={src}
                  alt={`${alt} — photo ${idx + 1}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/75 via-brand-navy/15 to-transparent pointer-events-none" />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Fullscreen Lightbox Trigger (21st.dev interactive control) */}
        <button
          type="button"
          onClick={() => setLightbox(true)}
          aria-label="Open fullscreen gallery"
          className="absolute top-5 right-5 z-20 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-brand-navy/80 backdrop-blur-md border border-white/15 text-white text-xs font-bold hover:bg-brand-gold transition-colors cursor-pointer shadow-lg"
        >
          <Maximize2 size={15} />
          <span>Fullscreen Gallery</span>
        </button>

        {/* Photo Counter & Badge */}
        {!single && (
          <div className="absolute bottom-6 right-5 z-20 px-3.5 py-1.5 rounded-xl bg-brand-navy/80 backdrop-blur-md border border-white/15 text-white text-xs font-bold tabular-nums pointer-events-none">
            {active + 1} / {images.length}
          </div>
        )}

        {!single && (
          <div className="absolute bottom-6 left-5 z-20 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-navy/80 backdrop-blur-md border border-white/15 text-white text-xs font-bold pointer-events-none tabular-nums">
            <Images size={14} className="text-brand-gold" />
            <span>{images.length} Architectural Photos</span>
          </div>
        )}
      </div>

      {/* Synchronized Swiper Thumbnail Strip */}
      {!single && (
        <div className="container-custom pt-3">
          <Swiper
            modules={[Thumbs]}
            onSwiper={setThumbsSwiper}
            spaceBetween={10}
            slidesPerView="auto"
            watchSlidesProgress
            className="py-1"
          >
            {images.map((src, i) => (
              <SwiperSlide key={`thumb-${i}`} style={{ width: '92px' }}>
                <button
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={`View photo ${i + 1}`}
                  className={`block w-full h-16 rounded-xl overflow-hidden border-2 transition-all duration-200 cursor-pointer ${
                    i === active
                      ? 'border-brand-gold shadow-gold-sm scale-[1.03]'
                      : 'border-transparent opacity-60 hover:opacity-95'
                  }`}
                >
                  <img
                    src={src}
                    alt={`Thumbnail ${i + 1}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}

      {/* Fullscreen Swiper Lightbox with Motion.dev Gallery-to-Detail Transition */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-[100] bg-brand-navy-deep/95 backdrop-blur-xl flex flex-col justify-between p-4 md:p-8"
            onClick={() => setLightbox(false)}
          >
            {/* Top Bar */}
            <div
              className="flex items-center justify-between text-white z-20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-lg bg-white/10 text-xs font-bold tabular-nums">
                  {active + 1} / {images.length}
                </span>
                <span className="text-sm font-semibold text-white/85 truncate max-w-md">
                  {alt}
                </span>
              </div>
              <button
                type="button"
                className="p-2.5 rounded-xl bg-white/10 text-white hover:bg-brand-gold transition-colors cursor-pointer"
                aria-label="Close fullscreen gallery"
                onClick={() => setLightbox(false)}
              >
                <X size={20} />
              </button>
            </div>

            {/* Center Fullscreen Swiper */}
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-6xl mx-auto h-[72vh] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <Swiper
                modules={[Navigation, Pagination, Keyboard]}
                initialSlide={active}
                navigation={!single}
                pagination={{ clickable: true }}
                keyboard={{ enabled: true }}
                onSlideChange={(s) => setActive(s.activeIndex)}
                className="w-full h-full"
              >
                {images.map((src, idx) => (
                  <SwiperSlide
                    key={`lightbox-${idx}`}
                    className="flex items-center justify-center"
                  >
                    <div className="w-full h-full flex items-center justify-center">
                      <img
                        src={src}
                        alt={`${alt} — fullscreen photo ${idx + 1}`}
                        referrerPolicy="no-referrer"
                        className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
                      />
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </motion.div>

            {/* Bottom hint */}
            <div className="text-center text-xs text-white/50">
              Use arrow keys or swipe to navigate · Press Esc to exit
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
