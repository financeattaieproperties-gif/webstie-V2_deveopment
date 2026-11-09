import React, { useRef, useState, useCallback } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CarouselProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  cardWidth?: number;
  gap?: number;
}

export function HorizontalCarousel<T>({ items, renderItem, cardWidth = 340, gap = 24 }: CarouselProps<T>) {
  const [current, setCurrent] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const dragStartX = useRef(0);

  const visibleCount = () => {
    if (typeof window === 'undefined') return 3;
    if (window.innerWidth < 640) return 1;
    if (window.innerWidth < 1024) return 2;
    return 3;
  };

  const maxIndex = Math.max(0, items.length - visibleCount());

  const scrollTo = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(index, maxIndex));
    setCurrent(clamped);
    const offset = -(clamped * (cardWidth + gap));
    x.set(offset);
  }, [maxIndex, cardWidth, gap, x]);

  const prev = () => scrollTo(current - 1);
  const next = () => scrollTo(current + 1);

  const onDragEnd = () => {
    const moved = x.get() - dragStartX.current;
    if (moved < -60) scrollTo(current + 1);
    else if (moved > 60) scrollTo(current - 1);
    else scrollTo(current);
  };

  return (
    <div className="relative">
      <div className="overflow-hidden -mx-4 px-4">
        <motion.div
          ref={trackRef}
          className="flex"
          style={{ x, gap }}
          drag="x"
          dragConstraints={{ left: -(maxIndex * (cardWidth + gap)), right: 0 }}
          dragElastic={0.08}
          onDragStart={() => { dragStartX.current = x.get(); }}
          onDragEnd={onDragEnd}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {items.map((item, i) => (
            <motion.div
              key={i}
              style={{ minWidth: cardWidth, maxWidth: cardWidth }}
              className="select-none"
            >
              {renderItem(item, i)}
            </motion.div>
          ))}
        </motion.div>
      </div>

      <div className="flex items-center justify-between mt-8">
        <div className="flex items-center gap-2">
          {Array.from({ length: maxIndex + 1 }).map((_, i) => (
            <button
              key={i}
              onClick={() => scrollTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === current ? 28 : 8,
                height: 8,
                background: i === current ? 'var(--color-brand-gold)' : 'rgba(2,14,58,0.15)',
              }}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            onClick={prev}
            disabled={current === 0}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            aria-label="Previous"
            className="w-11 h-11 rounded-full flex items-center justify-center border-2 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed shadow-xs"
            style={{
              borderColor: current === 0 ? 'rgba(2,14,58,0.15)' : 'var(--color-brand-navy)',
              color: 'var(--color-brand-navy)',
            }}
          >
            <ChevronLeft size={20} strokeWidth={2.4} />
          </motion.button>
          <motion.button
            onClick={next}
            disabled={current === maxIndex}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            aria-label="Next"
            className="w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed shadow-xs"
            style={{
              background: current === maxIndex ? 'rgba(2,14,58,0.1)' : 'var(--color-brand-navy)',
              color: '#ffffff',
            }}
          >
            <ChevronRight size={20} strokeWidth={2.4} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
