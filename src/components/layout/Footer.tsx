import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { MessageCircle, Mail, MapPin, Phone, ExternalLink } from 'lucide-react';

export const FacebookIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 18,
  className,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

export const YoutubeIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 18,
  className,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
    <path d="m10 15 5-3-5-3z" />
  </svg>
);

export const OFFICIAL_SOCIAL_LINKS = [
  {
    platform: 'facebook' as const,
    label: 'Facebook',
    name: 'رهنما آنلاین عطایی',
    url: 'https://www.facebook.com/profile.php?id=61554275223244',
  },
  {
    platform: 'facebook' as const,
    label: 'Facebook',
    name: 'Attaie properties خدمات املاک عطایی',
    url: 'https://www.facebook.com/attaiepropertiesofficialRahnomaonlineAttaie',
  },
  {
    platform: 'youtube' as const,
    label: 'YouTube',
    name: 'Attaie Properties',
    url: 'https://www.youtube.com/@attaieproperties-buy-sell-Rent',
  },
  {
    platform: 'youtube' as const,
    label: 'YouTube',
    name: 'Attaie Real Estate خدمات املاک عطایی',
    url: 'https://www.youtube.com/@AttaieRealEstate',
  },
];

const Footer = () => {
  const { t } = useTranslation('common');

  return (
    <footer className="bg-brand-ivory border-t-2 border-brand-gold/20 pt-20 pb-10">
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand column */}
          <div>
            <div className="group mb-6">
              <span className="text-2xl font-display font-bold block text-brand-navy transition-all duration-300">
                ATTAIE <span className="text-brand-gold">PROPERTIES</span>
              </span>
            </div>
            <p className="text-neutral-600 mb-6 leading-relaxed text-sm">
              {t('footer.tagline')}
            </p>
            <div className="flex flex-wrap gap-2.5 mb-5">
              <motion.a
                href="https://wa.me/93782222279"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.92 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                className="p-2.5 bg-brand-gold/10 rounded-full text-brand-gold hover:bg-brand-gold hover:text-white transition-colors shadow-sm hover:shadow-gold-sm"
                aria-label="WhatsApp"
                title="WhatsApp (+93 782 222 279)"
              >
                <MessageCircle size={18} />
              </motion.a>
              {OFFICIAL_SOCIAL_LINKS.map((social) => {
                const Icon = social.platform === 'facebook' ? FacebookIcon : YoutubeIcon;
                return (
                  <motion.a
                    key={social.url}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.12 }}
                    whileTap={{ scale: 0.92 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    className="p-2.5 bg-brand-gold/10 rounded-full text-brand-gold hover:bg-brand-gold hover:text-white transition-colors shadow-sm hover:shadow-gold-sm"
                    aria-label={`${social.label} — ${social.name}`}
                    title={`${social.label}: ${social.name}`}
                  >
                    <Icon size={18} />
                  </motion.a>
                );
              })}
            </div>

            {/* Named Official Facebook & YouTube Links */}
            <div className="space-y-2 border-t border-brand-gold/15 pt-4">
              {OFFICIAL_SOCIAL_LINKS.map((social) => {
                const Icon = social.platform === 'facebook' ? FacebookIcon : YoutubeIcon;
                return (
                  <a
                    key={social.url}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between gap-2 text-xs text-neutral-600 hover:text-brand-gold transition-colors py-0.5"
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <Icon size={14} className="text-brand-gold shrink-0" />
                      <span className="truncate font-medium" dir="auto">
                        {social.name}
                      </span>
                    </span>
                    <ExternalLink
                      size={12}
                      className="shrink-0 opacity-40 group-hover:opacity-100 transition-opacity"
                    />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Quick links column */}
          <div>
            <h4 className="text-sm font-bold mb-6 text-brand-navy uppercase tracking-wider border-b-2 border-brand-gold/30 pb-2 inline-block">
              {t('footer.quickLinks')}
            </h4>
            <motion.ul
              className="flex flex-col gap-3"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.07 } },
              }}
            >
              <motion.li variants={{ hidden: { opacity: 0, x: -8 }, visible: { opacity: 1, x: 0 } }}>
                <a href="/" className="text-neutral-600 hover:text-brand-gold transition-colors text-sm link-underline">
                  {t('nav.home')}
                </a>
              </motion.li>
              <motion.li variants={{ hidden: { opacity: 0, x: -8 }, visible: { opacity: 1, x: 0 } }}>
                <a href="/about" className="text-neutral-600 hover:text-brand-gold transition-colors text-sm link-underline">
                  {t('nav.about')}
                </a>
              </motion.li>
              <motion.li variants={{ hidden: { opacity: 0, x: -8 }, visible: { opacity: 1, x: 0 } }}>
                <a href="/properties" className="text-neutral-600 hover:text-brand-gold transition-colors text-sm link-underline">
                  {t('nav.properties')}
                </a>
              </motion.li>
              <motion.li variants={{ hidden: { opacity: 0, x: -8 }, visible: { opacity: 1, x: 0 } }}>
                <a href="/projects" className="text-neutral-600 hover:text-brand-gold transition-colors text-sm link-underline">
                  {t('nav.projects')}
                </a>
              </motion.li>
              <motion.li variants={{ hidden: { opacity: 0, x: -8 }, visible: { opacity: 1, x: 0 } }}>
                <a href="/careers" className="text-neutral-600 hover:text-brand-gold transition-colors text-sm link-underline">
                  {t('nav.careers')}
                </a>
              </motion.li>
            </motion.ul>
          </div>

          {/* Properties section column */}
          <div>
            <h4 className="text-sm font-bold mb-6 text-brand-navy uppercase tracking-wider border-b-2 border-brand-gold/30 pb-2 inline-block">
              {t('footer.propertiesSection')}
            </h4>
            <motion.ul
              className="flex flex-col gap-3"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.07 } },
              }}
            >
              <motion.li variants={{ hidden: { opacity: 0, x: -8 }, visible: { opacity: 1, x: 0 } }}>
                <a href="/properties?purpose=buy" className="text-neutral-600 hover:text-brand-gold transition-colors text-sm link-underline">
                  Buy Property
                </a>
              </motion.li>
              <motion.li variants={{ hidden: { opacity: 0, x: -8 }, visible: { opacity: 1, x: 0 } }}>
                <a href="/properties?purpose=rent" className="text-neutral-600 hover:text-brand-gold transition-colors text-sm link-underline">
                  Rent Property
                </a>
              </motion.li>
              <motion.li variants={{ hidden: { opacity: 0, x: -8 }, visible: { opacity: 1, x: 0 } }}>
                <a href="/properties?type=Commercial" className="text-neutral-600 hover:text-brand-gold transition-colors text-sm link-underline">
                  Commercial
                </a>
              </motion.li>
            </motion.ul>
          </div>

          {/* Contact column */}
          <div>
            <h4 className="text-sm font-bold mb-6 text-brand-navy uppercase tracking-wider border-b-2 border-brand-gold/30 pb-2 inline-block">
              {t('footer.contactUs')}
            </h4>
            <ul className="flex flex-col gap-4">
              <li className="flex gap-3 text-neutral-600 text-sm">
                <MapPin size={18} className="text-brand-gold shrink-0 mt-0.5" />
                <span>Street #13, Wazir Akbar Khan, Kabul, Afghanistan</span>
              </li>
              <li className="flex gap-3 text-neutral-600 text-sm">
                <Phone size={18} className="text-brand-gold shrink-0" />
                <span>+93 782 222 279</span>
              </li>
              <li className="flex gap-3 text-neutral-600 text-sm">
                <Mail size={18} className="text-brand-gold shrink-0" />
                <span>info@attaieproperties.com</span>
              </li>
              <li className="flex gap-3 text-neutral-600 text-sm">
                <span className="text-brand-gold shrink-0 font-bold">@</span>
                <a href="https://www.attaieproperties.com" className="hover:text-brand-gold transition-colors">www.attaieproperties.com</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="relative pt-8 mt-0">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-gold/30 to-transparent" />
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-neutral-500">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-center md:text-start">
              <p className="font-semibold text-brand-navy">
                {t('footer.developerCredit', 'Developed by Roheen Ahmadi')}
              </p>
              <span className="hidden sm:inline text-brand-gold/40">•</span>
              <p>{t('footer.rights')}</p>
            </div>
            <div className="flex gap-6">
              <a href="#" className="hover:text-brand-gold transition-colors link-underline">
                {t('footer.privacy')}
              </a>
              <a href="#" className="hover:text-brand-gold transition-colors link-underline">
                {t('footer.terms')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export { Footer };
