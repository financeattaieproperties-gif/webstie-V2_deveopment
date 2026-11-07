import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MapPin, Calendar, Home, ArrowRight, Building2 } from 'lucide-react';
import { Badge } from './Badge';

export interface ProjectCardProps {
  id: string;
  name: string;
  location: string;
  deliveryDate?: string;
  status: 'Coming Soon' | 'In Progress' | 'Sold Out' | 'Under Construction' | 'Ready';
  availableUnits?: number;
  totalUnits?: number;
  description?: string | null;
  image?: string | null;
}

export const ProjectCard = ({
  id,
  name,
  location,
  deliveryDate,
  status,
  availableUnits,
  totalUnits,
  description,
  image,
}: ProjectCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const statusColor =
    status === 'Sold Out' ? 'sold' : status === 'Ready' ? 'available' : 'pending';
  const displayStatus = status === 'Under Construction' ? 'In Progress' : status;

  const availabilityPct =
    availableUnits !== undefined && totalUnits && totalUnits > 0
      ? Math.min(100, Math.max(8, Math.round((availableUnits / totalUnits) * 100)))
      : null;

  return (
    <motion.a
      href={`/projects/${id}`}
      layout
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      style={{ boxShadow: isHovered ? 'var(--shadow-xl)' : 'var(--shadow-md)' }}
      className="group flex flex-col h-full bg-white rounded-2xl overflow-hidden transition-colors duration-300 border border-brand-navy/8 hover:border-brand-gold/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
    >
      {/* Editorial Image Header */}
      <motion.div
        className="relative aspect-[16/10] w-full overflow-hidden bg-brand-navy"
        whileHover="hovered"
      >
        {image ? (
          <motion.img
            src={image}
            alt={`${name} — ${status} development in ${location}`}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
            variants={{
              hovered: {
                scale: 1.07,
                transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
              },
            }}
            initial={false}
            style={{
              filter: imgLoaded ? 'none' : 'blur(8px)',
              transition: 'filter 0.4s ease',
            }}
            onLoad={() => setImgLoaded(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center islamic-pattern text-white/30">
            <Building2 size={32} />
          </div>
        )}

        {/* Measured Contrast Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/85 via-brand-navy/25 to-transparent" />

        {/* Status badge */}
        <div className="absolute top-3 left-3 z-10">
          <Badge
            status={statusColor as 'available' | 'pending' | 'sold' | 'rented'}
            className="bg-white/95 backdrop-blur-sm shadow-md"
          >
            {displayStatus}
          </Badge>
        </div>

        {/* Units available overlay */}
        {availableUnits !== undefined && (
          <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 bg-brand-gold/95 text-white text-xs font-bold px-3 py-1 rounded-lg shadow-md backdrop-blur-xs tabular-nums">
              <Home size={12} />
              {availableUnits}
              {totalUnits ? ` / ${totalUnits}` : ''} Units Available
            </span>
          </div>
        )}
      </motion.div>

      {/* Editorial Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-gold mb-1">
            Signature Development
          </p>
          <h3 className="font-heading text-xl font-bold text-brand-navy mb-1.5 group-hover:text-brand-gold transition-colors duration-200 line-clamp-1">
            {name}
          </h3>
          <div className="flex items-center text-neutral-500 mb-3 text-sm">
            <MapPin size={14} className="mr-1.5 text-brand-gold shrink-0" />
            <span className="line-clamp-1">{location}</span>
          </div>

          {description && (
            <p className="text-xs text-neutral-600 leading-relaxed line-clamp-2 mb-4">
              {description}
            </p>
          )}

          {availabilityPct !== null && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-[11px] text-neutral-500 mb-1 tabular-nums">
                <span>Inventory Availability</span>
                <span className="font-bold text-brand-navy">{availabilityPct}% Open</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-neutral-100 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${availabilityPct}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full rounded-full bg-brand-gold"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
          <div className="flex items-center gap-2 text-neutral-600 text-xs tabular-nums">
            <Calendar size={14} className="text-brand-gold shrink-0" />
            <span>
              Delivery:{' '}
              <span className="font-bold text-brand-navy">{deliveryDate || 'Scheduled'}</span>
            </span>
          </div>
          <motion.div
            whileHover={{ scale: 1.12, x: 3 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-gold/10 text-brand-gold group-hover:bg-brand-gold group-hover:text-white text-xs font-bold transition-colors duration-300 shrink-0"
          >
            <span>Explore</span>
            <ArrowRight size={13} />
          </motion.div>
        </div>
      </div>
    </motion.a>
  );
};
