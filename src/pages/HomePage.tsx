import React, { useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { LandingPageContent } from '../components/sections/LandingPageContent';
import { useSiteSeoSettings } from '../components/seo/SeoHead';
import { syncDocumentMetaTags } from '../lib/metaTagService';
import {
  resolveHomeMetadata,
  type GenerateHomeMetadataOptions,
} from '../lib/homeMetadata';

export { resolveHomeMetadata, type GenerateHomeMetadataOptions };

/**
 * Dynamically generates and injects optimized `<head>` metadata for the Home page
 * using `react-helmet-async` (including localized title/description, canonical URL,
 * hreflang alternates, OpenGraph, Twitter Cards, and Schema.org JSON-LD).
 */
export function generateMetadata(
  options: GenerateHomeMetadataOptions = {}
): React.ReactElement {
  const headTags = resolveHomeMetadata(options);

  return (
    <Helmet prioritizeSeoTags>
      <html lang={headTags.htmlLang} dir={headTags.htmlDir} />
      <title>{headTags.title}</title>
      <link rel="canonical" href={headTags.canonicalUrl} />
      <link rel="alternate" hrefLang="en" href={headTags.canonicalUrl} />
      <link rel="alternate" hrefLang="fa-AF" href={headTags.canonicalUrl} />
      <link rel="alternate" hrefLang="x-default" href={headTags.canonicalUrl} />

      {headTags.metaTags.map((tag) =>
        tag.property ? (
          <meta key={tag.key} property={tag.property} content={tag.content} />
        ) : (
          <meta key={tag.key} name={tag.name} content={tag.content} />
        )
      )}

      {headTags.jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(headTags.jsonLd)}
        </script>
      )}
    </Helmet>
  );
}

export default function HomePage() {
  const location = useLocation();
  const { i18n } = useTranslation();
  const siteSettings = useSiteSeoSettings();

  const metadataOptions = useMemo<GenerateHomeMetadataOptions>(
    () => ({
      language: i18n.language || 'en',
      pathname: location.pathname || '/',
      search: location.search || '',
      siteSettings,
    }),
    [i18n.language, location.pathname, location.search, siteSettings]
  );

  const headTags = useMemo(
    () => resolveHomeMetadata(metadataOptions),
    [metadataOptions]
  );

  useEffect(() => {
    syncDocumentMetaTags(headTags);
  }, [headTags]);

  return (
    <main className="min-h-screen">
      {generateMetadata(metadataOptions)}
      <Navbar />
      <LandingPageContent />
      <Footer />
    </main>
  );
}


