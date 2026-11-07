import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import {
  MapPin,
  Bed,
  Bath,
  Maximize2,
  Layers,
  Heart,
  Building2,
  Images,
} from 'lucide-react';
import { Badge } from './Badge';

export interface PropertyCardProps {
  id: string;
  serialNumber?: string;
  title: string;
  price: number;
  location: string;
  beds?: number;
  baths?: number;
  area?: number;
  floor?: number;
  status: 'available' | 'pending' | 'sold' | 'rented';
  type: string;
  image?: string | null;
  galleryImages?: string[];
  listingType?: 'sale' | 'rent';
  tag?: string;
}

export const PropertyCard = ({
  id,
  serialNumber,
  title,
  price,
  location,
  beds,
  baths,
  area,
  floor,
  status,
  type,
  image,
  galleryImages,
  listingType,
  tag,
}: PropertyCardProps) => {
  const [saved, setSaved] = useState(false);
  const [heartAnim, setHeartAnim] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const priceDisplay =
    listingType === 'rent' ? `$${price.toLocaleString()}/mo` : `$${price.toLocaleString()}`;

  // Consolidate primary image + galleryImages into a unique array for the Swiper photo slider
  const photoList = React.useMemo(() => {
    const raw = [
      ...(image ? [image] : []),
      ...(Array.isArray(galleryImages) ? galleryImages.filter(Boolean) : []),
    ];
    return Array.from(new Set(raw));
  }, [image, galleryImages]);

  const hasMultiplePhotos = photoList.length > 1;

  return (
    <>
      <motion.a
        href={`/properties/${id}`}
        layout
        className="group flex flex-col h-full bg-white/90 backdrop-blur-md rounded-2xl overflow-hidden transition-colors duration-300 border border-brand-navy/8 hover:border-brand-gold/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
        whileHover={{ y: -6 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
        style={{
          boxShadow: isHovered
            ? '0 20px 60px -12px rgba(2,14,58,0.20), 0 8px 24px -8px rgba(2,14,58,0.10)'
            : '0 1px 4px 0 rgba(2,14,58,0.07), 0 2px 8px -2px rgba(2,14,58,0.06)',
        }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        {/* Image / Swiper Photo Carousel */}
        <motion.div
          className="relative aspect-[4/3] w-full overflow-hidden bg-brand-navy"
          whileHover="hovered"
        >
          {hasMultiplePhotos ? (
            <div
              className="w-full h-full"
              onClick={(e) => {
                // Allow clicking pagination/arrows without navigating away
                const target = e.target as HTMLElement;
                if (
                  target.closest('.swiper-button-prev') ||
                  target.closest('.swiper-button-next') ||
                  target.closest('.swiper-pagination')
                ) {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
            >
              <Swiper
                modules={[Navigation, Pagination]}
                navigation
                pagination={{ clickable: true, dynamicBullets: true }}
                loop={photoList.length > 2}
                className="w-full h-full property-card-swiper"
              >
                {photoList.map((src, idx) => (
                  <SwiperSlide key={`${id}-photo-${idx}`}>
                    <img
                      src={src}
                      alt={`${title} — photo ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  </SwiperSlide>
                ))}
              </Swiper>
              <span className="absolute bottom-3 right-3 z-20 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/55 backdrop-blur-xs text-[11px] font-semibold text-white pointer-events-none tabular-nums">
                <Images size={11} />
                {photoList.length}
              </span>
            </div>
          ) : photoList.length === 1 ? (
            <motion.img
              src={photoList[0]}
              alt={`${title} — ${type} for ${listingType === 'rent' ? 'rent' : 'sale'} in ${location}`}
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
            <div className="w-full h-full flex flex-col items-center justify-center islamic-pattern text-white/30 gap-2">
              <Building2 size={32} />
            </div>
          )}

          {/* Measured bottom contrast scrim */}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/65 to-transparent pointer-events-none z-10" />

          {/* Tag override / For Sale / For Rent badge */}
          {(tag || listingType) && (
            <div className="absolute top-3 left-3 z-20">
              <span
                className={`text-xs font-bold px-3 py-1.5 rounded-xl shadow-md whitespace-nowrap ${
                  tag
                    ? 'bg-red-500 text-white'
                    : listingType === 'rent'
                    ? 'bg-brand-navy text-white'
                    : 'bg-brand-gold text-white'
                }`}
              >
                {tag ?? (listingType === 'rent' ? 'For Rent' : 'For Sale')}
              </span>
            </div>
          )}

          {/* Status badge */}
          <div className="absolute top-3 right-12 z-20">
            <Badge status={status} className="bg-white/90 backdrop-blur-sm shadow-md" />
          </div>

          {/* Save button */}
          <motion.button
            type="button"
            aria-label={saved ? 'Remove from saved' : 'Save property'}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setSaved((s) => !s);
              setHeartAnim(true);
              setTimeout(() => setHeartAnim(false), 400);
            }}
            animate={heartAnim ? { scale: [1, 1.4, 1] } : { scale: 1 }}
            transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
            className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-md hover:scale-110 transition-transform cursor-pointer"
          >
            <Heart
              size={15}
              className={saved ? 'text-red-500 fill-red-500' : 'text-neutral-400'}
            />
          </motion.button>

          {/* Price overlay at bottom of image */}
          <div className="absolute bottom-3 left-3 z-20 pointer-events-none">
            <span className="text-white font-bold text-xl drop-shadow-lg tabular-nums">
              {priceDisplay}
            </span>
          </div>
        </motion.div>

        {/* Content */}
        <div className="p-5 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5 text-xs text-neutral-500">
              <span className="font-semibold text-brand-navy">{type}</span>
              {serialNumber && (
                <span className="font-mono text-xs font-semibold tracking-wide text-brand-gold tabular-nums">
                  Ref. {serialNumber}
                </span>
              )}
            </div>
            <h3 className="font-heading text-lg font-bold text-brand-navy mt-1 mb-1.5 line-clamp-1 group-hover:text-brand-gold transition-colors duration-200">
              {title}
            </h3>
            <div className="flex items-center text-neutral-500 mb-4 text-sm">
              <MapPin size={14} className="mr-1.5 text-brand-gold shrink-0" />
              <span className="line-clamp-1">{location}</span>
            </div>
          </div>

          <div className="space-y-4">
            {/* Visual property feature icons */}
            <div
              aria-label="Property features"
              className="grid grid-cols-2 sm:flex sm:items-center sm:flex-wrap gap-2.5 pt-4 border-t border-neutral-100 text-neutral-700 text-xs tabular-nums"
            >
              {beds !== undefined && (
                <div className="flex items-center gap-2" title={`${beds} Bedrooms`}>
                  <span className="w-7 h-7 rounded-lg bg-brand-gold/10 text-brand-gold flex items-center justify-center shrink-0">
                    <Bed size={15} aria-hidden="true" />
                  </span>
                  <div className="leading-tight">
                    <span className="font-bold text-brand-navy">{beds}</span>{' '}
                    <span className="text-neutral-500">Beds</span>
                  </div>
                </div>
              )}
              {baths !== undefined && (
                <div className="flex items-center gap-2" title={`${baths} Bathrooms`}>
                  <span className="w-7 h-7 rounded-lg bg-brand-gold/10 text-brand-gold flex items-center justify-center shrink-0">
                    <Bath size={15} aria-hidden="true" />
                  </span>
                  <div className="leading-tight">
                    <span className="font-bold text-brand-navy">{baths}</span>{' '}
                    <span className="text-neutral-500">Baths</span>
                  </div>
                </div>
              )}
              {area !== undefined && (
                <div className="flex items-center gap-2" title={`Area: ${area} m²`}>
                  <span className="w-7 h-7 rounded-lg bg-brand-gold/10 text-brand-gold flex items-center justify-center shrink-0">
                    <Maximize2 size={14} aria-hidden="true" />
                  </span>
                  <div className="leading-tight">
                    <span className="font-bold text-brand-navy">{area}</span>{' '}
                    <span className="text-neutral-500">m²</span>
                  </div>
                </div>
              )}
              {floor !== undefined && (
                <div className="flex items-center gap-2" title={`Floor ${floor}`}>
                  <span className="w-7 h-7 rounded-lg bg-brand-gold/10 text-brand-gold flex items-center justify-center shrink-0">
                    <Layers size={14} aria-hidden="true" />
                  </span>
                  <div className="leading-tight">
                    <span className="text-neutral-500">Fl.</span>{' '}
                    <span className="font-bold text-brand-navy">{floor}</span>
                  </div>
                </div>
              )}
            </div>

            {/* View Details action bar */}
            <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-neutral-500 group-hover:text-brand-gold transition-colors whitespace-nowrap">
                View Details →
              </span>
            </div>
          </div>
        </div>
      </motion.a>
    </>
  );
};
