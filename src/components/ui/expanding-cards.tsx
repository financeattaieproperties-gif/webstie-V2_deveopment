"use client";

import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import defaultExteriorImg from "@/assets/images/project_exterior_elevation_1793995966183.jpg";
import {
  CriticalImagePreloader,
  usePreloadProjectImages,
} from "@/components/ui/CriticalImagePreloader";
import {
  extractCriticalProjectImageUrls,
  isImagePreloaded,
  preloadCriticalProjectImages,
  preloadImageAsset,
} from "@/lib/imagePreloader";

export {
  CriticalImagePreloader,
  usePreloadProjectImages,
  extractCriticalProjectImageUrls,
  isImagePreloaded,
  preloadCriticalProjectImages,
  preloadImageAsset,
};

export interface CardItem {
  id: string | number;
  title: string;
  description: string;
  imgSrc: string;
  icon: React.ReactNode;
  linkHref: string;
  linkLabel?: string;
  subtitle?: string;
  meta?: string;
}

export interface ExpandingCardsProps extends React.HTMLAttributes<HTMLUListElement> {
  items: CardItem[];
  defaultActiveIndex?: number;
}

export function resolveProjectDetailHref(
  item: Pick<CardItem, "id" | "linkHref">,
): string {
  if (item.linkHref && item.linkHref.trim() !== "" && item.linkHref !== "#") {
    return item.linkHref;
  }
  return `/projects/${encodeURIComponent(String(item.id))}`;
}

export const ExpandingCards = React.forwardRef<
  HTMLUListElement,
  ExpandingCardsProps
>(({ className, items, defaultActiveIndex = 0, ...props }, ref) => {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = React.useState<number>(
    defaultActiveIndex,
  );

  const { isUrlReady } = usePreloadProjectImages(items, {
    priorityIndex: activeIndex,
    fallbackUrl: defaultExteriorImg,
  });

  const handleInteraction = React.useCallback((index: number) => {
    setActiveIndex((prev) => (prev === index ? prev : index));
  }, []);

  const handleCardClick = React.useCallback(
    (index: number, href: string) => {
      if (activeIndex === index) {
        navigate(href);
      } else {
        setActiveIndex(index);
      }
    },
    [activeIndex, navigate],
  );

  const handleCardKeyDown = React.useCallback(
    (
      e: React.KeyboardEvent<HTMLLIElement>,
      index: number,
      href: string,
    ) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (activeIndex === index) {
          navigate(href);
        } else {
          setActiveIndex(index);
        }
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % items.length);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
      }
    },
    [activeIndex, items.length, navigate],
  );

  return (
    <>
      <CriticalImagePreloader
        items={items}
        priorityIndex={activeIndex}
        fallbackUrl={defaultExteriorImg}
      />
      <ul
        className={cn(
          "w-full max-w-7xl mx-auto",
          "flex flex-col md:flex-row",
          "gap-2.5 sm:gap-3 lg:gap-3.5",
          "h-[560px] sm:h-[600px] md:h-[460px] lg:h-[520px]",
          "[contain:layout_paint]",
          className,
        )}
        ref={ref}
        {...props}
      >
        {items.map((item, index) => {
          const isActive = activeIndex === index;
          const projectDetailHref = resolveProjectDetailHref(item);
          const resolvedImgSrc = item.imgSrc || defaultExteriorImg;
          const imageReady = isUrlReady(resolvedImgSrc);

          return (
            <li
              key={item.id}
              className={cn(
                "group relative cursor-pointer overflow-hidden rounded-2xl border border-brand-navy/15 bg-brand-navy text-white shadow-brand-md",
                "min-h-[60px] md:min-h-0 md:min-w-[68px] lg:min-w-[84px] min-w-0 [contain:layout_paint]",
                "transition-[flex-grow,border-color,box-shadow] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[flex-grow]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold",
                isActive
                  ? "flex-[4.2_1_0%] md:flex-[4.8_1_0%] border-brand-gold/50 shadow-brand-xl"
                  : "flex-[1_1_0%] hover:border-brand-gold/35",
              )}
              onMouseEnter={() => handleInteraction(index)}
              onFocus={() => handleInteraction(index)}
              onClick={() => handleCardClick(index, projectDetailHref)}
              onKeyDown={(e) => handleCardKeyDown(e, index, projectDetailHref)}
              tabIndex={0}
              data-active={isActive}
              data-image-ready={imageReady}
              data-project-id={String(item.id)}
              data-project-href={projectDetailHref}
            >
              <img
                src={resolvedImgSrc}
                onError={(e) => {
                  e.currentTarget.src = defaultExteriorImg;
                }}
                alt={item.title}
                width={1200}
                height={800}
                decoding="async"
                loading="eager"
                fetchPriority={isActive ? "high" : "auto"}
                referrerPolicy="no-referrer"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 ease-out will-change-transform group-data-[active=true]:scale-100 scale-105"
              />
            <div
              className={cn(
                "absolute inset-0 transition-opacity duration-200",
                isActive
                  ? "bg-gradient-to-t from-black/85 via-black/40 to-black/10"
                  : "bg-gradient-to-t from-black/65 via-black/20 to-black/25",
              )}
            />

            {/* Collapsed desktop vertical label in full color card */}
            <span
              aria-hidden={isActive}
              className="pointer-events-none absolute top-5 left-1/2 -translate-x-1/2 hidden text-xs font-bold uppercase tracking-[0.18em] text-white drop-shadow-sm whitespace-nowrap opacity-100 transition-opacity duration-150 ease-out md:block [writing-mode:vertical-rl] group-data-[active=true]:opacity-0"
            >
              {item.title}
            </span>

            {/* Collapsed desktop bottom icon badge */}
            <span
              aria-hidden={isActive}
              className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 hidden h-9 w-9 items-center justify-center rounded-xl bg-black/45 backdrop-blur-xs border border-white/20 text-white transition-opacity duration-150 ease-out md:inline-flex group-data-[active=true]:opacity-0"
            >
              {item.icon}
            </span>

            {/* Collapsed mobile horizontal bar */}
            <span
              aria-hidden={isActive}
              className="pointer-events-none absolute inset-x-4 top-1/2 -translate-y-1/2 flex items-center justify-between gap-3 text-sm font-bold text-white drop-shadow-xs transition-opacity duration-150 ease-out md:hidden group-data-[active=true]:opacity-0"
            >
              <span className="truncate">{item.title}</span>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-black/40 border border-white/20 text-white shrink-0">
                {item.icon}
              </span>
            </span>

            <article
              className={cn(
                " absolute inset-0 flex flex-col justify-end gap-2 sm:gap-2.5 p-4 sm:p-6 lg:p-7",
                "transition-[opacity,transform] duration-200 ease-out will-change-[opacity,transform]",
                isActive
                  ? "pointer-events-auto opacity-100 translate-y-0"
                  : "pointer-events-none opacity-0 translate-y-2",
              )}
            >
              <div className="flex items-center gap-2.5 text-white/95">
                <span className="inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-brand-gold text-white shadow-sm shrink-0">
                  {item.icon}
                </span>
                {item.subtitle && (
                  <span className="text-xs font-semibold text-white/90 truncate">
                    {item.subtitle}
                  </span>
                )}
              </div>

              <h3 className="text-lg sm:text-2xl font-display font-bold text-white leading-tight">
                <Link
                  to={projectDetailHref}
                  tabIndex={isActive ? 0 : -1}
                  onClick={(e) => e.stopPropagation()}
                  className="hover:text-brand-gold-lt transition-colors focus-visible:outline-none focus-visible:underline"
                >
                  {item.title}
                </Link>
              </h3>

              <p className="w-full max-w-lg text-xs sm:text-sm leading-relaxed text-white/90 line-clamp-2 sm:line-clamp-3">
                {item.description}
              </p>

              {item.meta && (
                <p className="text-[11px] sm:text-xs font-medium text-white/80 tabular-nums truncate">
                  {item.meta}
                </p>
              )}

              <div className="pt-1">
                <Link
                  to={projectDetailHref}
                  tabIndex={isActive ? 0 : -1}
                  aria-label={`View project details for ${item.title}`}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 sm:py-2.5 text-xs font-bold text-brand-navy shadow-sm transition-colors hover:bg-brand-gold hover:text-white whitespace-nowrap"
                >
                  <span>{item.linkLabel || "View Project Details"}</span>
                  <ArrowRight size={14} strokeWidth={2.4} />
                </Link>
              </div>
            </article>
          </li>
        );
      })}
      </ul>
    </>
  );
});
ExpandingCards.displayName = "ExpandingCards";
