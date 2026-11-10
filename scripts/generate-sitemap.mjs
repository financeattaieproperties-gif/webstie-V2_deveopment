#!/usr/bin/env node
/**
 * Automatic Sitemap.xml Crawler & Generator for Attaie Properties
 *
 * Crawls Properties, Projects, Careers, and Agents from:
 *   1. Live PHP API endpoints ({API_BASE}/get-properties.php, get-projects.php, get-careers.php, get-agents.php)
 *   2. Local SQL schema/migrations & seed data fallback when building offline
 *
 * Generates a standards-compliant Sitemap 0.9 + Google Image Sitemap 1.1 XML file at:
 *   - public/sitemap.xml (and dist/sitemap.xml if dist/ exists)
 *   - public/sitemap-status.json (and dist/sitemap-status.json if dist/ exists)
 *
 * Usage:
 *   node scripts/generate-sitemap.mjs
 *   SITE_URL=https://www.attaieproperties.com API_URL=https://www.attaieproperties.com/api node scripts/generate-sitemap.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const SITE_URL = (process.env.SITE_URL || process.env.VITE_SITE_URL || 'https://www.attaieproperties.com').replace(/\/+$/, '');
const API_BASE = (process.env.API_URL || process.env.VITE_API_URL || `${SITE_URL}/api`).replace(/\/+$/, '');
const TODAY = new Date().toISOString().slice(0, 10);
const NOW_ISO = new Date().toISOString();

const STATIC_ROUTES = [
  { path: '/',           changefreq: 'daily',   priority: '1.0', title: 'Home — Attaie Properties' },
  { path: '/properties', changefreq: 'daily',   priority: '0.9', title: 'Properties for Sale & Rent in Kabul' },
  { path: '/projects',   changefreq: 'weekly',  priority: '0.8', title: 'Real Estate Development Projects in Kabul' },
  { path: '/careers',    changefreq: 'daily',   priority: '0.8', title: 'Careers & Job Openings — Attaie Properties' },
  { path: '/agents',     changefreq: 'weekly',  priority: '0.7', title: 'Licensed Property Advisors & Agents' },
  { path: '/about',      changefreq: 'monthly', priority: '0.6', title: 'About Attaie Properties' },
  { path: '/contact',    changefreq: 'monthly', priority: '0.7', title: 'Contact Attaie Properties Kabul' },
];

// Fallback seed data matching the application catalog when building without a live database connection
const SEED_PROPERTIES = [
  {
    id: 1,
    serial_number: 'AP-101',
    title: 'Exclusive Luxury Villa in Wazir Akbar Khan',
    location: 'Street 13, Wazir Akbar Khan, Kabul',
    status: 'available',
    image_url: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    ],
    created_at: '2026-01-15',
  },
  {
    id: 2,
    serial_number: 'AP-102',
    title: 'Contemporary High-Rise Apartment in Shahr-e-Naw',
    location: 'Ansari Square, Shahr-e-Naw, Kabul',
    status: 'available',
    image_url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
    gallery_images: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
    ],
    created_at: '2026-02-01',
  },
  {
    id: 3,
    serial_number: 'AP-103',
    title: 'Prime Commercial Plaza Space on Kolola Pushta Main',
    location: 'Kolola Pushta Main Boulevard, Kabul',
    status: 'available',
    image_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
    gallery_images: [],
    created_at: '2026-02-10',
  },
  {
    id: 4,
    serial_number: 'AP-104',
    title: 'Classic Family Residence with Private Garden',
    location: 'Street 5, Karte Se, Kabul',
    status: 'available',
    image_url: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80',
    gallery_images: [],
    created_at: '2026-02-15',
  },
  {
    id: 5,
    serial_number: 'AP-105',
    title: 'Luxury Penthouse with Mountain Panoramas',
    location: 'Block 4, Macrorayan, Kabul',
    status: 'available',
    image_url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
    gallery_images: [],
    created_at: '2026-02-20',
  },
  {
    id: 6,
    serial_number: 'AP-106',
    title: 'Diplomatic Compound with Enhanced Security',
    location: 'Sherpur Diplomatic Enclave, Kabul',
    status: 'available',
    image_url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
    gallery_images: [],
    created_at: '2026-03-01',
  },
];

const SEED_PROJECTS = [];

const SEED_CAREERS = [
  {
    id: 1,
    title: 'Senior Real Estate Sales Advisor',
    location: 'Wazir Akbar Khan, Kabul',
    employment_type: 'Full-Time',
    status: 'published',
    updated_at: '2026-10-15',
  },
  {
    id: 2,
    title: 'Architectural & 3D Visualization Specialist',
    location: 'Shahr-e-Naw, Kabul',
    employment_type: 'Full-Time',
    status: 'published',
    updated_at: '2026-10-20',
  },
  {
    id: 3,
    title: 'Digital Marketing & Content Coordinator',
    location: 'Wazir Akbar Khan, Kabul',
    employment_type: 'Full-Time',
    status: 'closed',
    updated_at: '2026-10-26',
  },
];

const SEED_AGENTS = [
  {
    id: 1,
    name: 'Ahmad Attaie',
    role: 'Founder & Managing Director',
    portrait_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=800&q=80',
    published: true,
    created_at: '2026-01-01',
  },
  {
    id: 2,
    name: 'Zahra Karimi',
    role: 'Senior Residential Advisor',
    portrait_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80',
    published: true,
    created_at: '2026-01-05',
  },
  {
    id: 3,
    name: 'Mohammad Ramin',
    role: 'Commercial & Land Specialist',
    portrait_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=800&q=80',
    published: true,
    created_at: '2026-01-10',
  },
];

function escapeXml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toIsoDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return TODAY;
  const match = dateStr.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : TODAY;
}

function toAbsoluteUrl(urlOrPath) {
  if (!urlOrPath || typeof urlOrPath !== 'string') return null;
  const trimmed = urlOrPath.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `${SITE_URL}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
}

async function fetchJsonFromCandidates(endpoint) {
  const candidates = [
    `${API_BASE}/${endpoint}`,
    `http://localhost:3000/api/${endpoint}`,
    `http://127.0.0.1:8888/api/${endpoint}`,
  ];

  for (const url of candidates) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) continue;
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('json')) continue;
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch {
      // try next candidate
    }
  }
  return null;
}

async function crawlAndGenerateSitemap() {
  const [liveProperties, liveProjects, liveCareers, liveAgents] = await Promise.all([
    fetchJsonFromCandidates('get-properties.php'),
    fetchJsonFromCandidates('get-projects.php'),
    fetchJsonFromCandidates('get-careers.php'),
    fetchJsonFromCandidates('get-agents.php'),
  ]);

  const properties = liveProperties && liveProperties.length > 0 ? liveProperties : SEED_PROPERTIES;
  const projects   = liveProjects && liveProjects.length > 0     ? liveProjects   : SEED_PROJECTS;
  const careers    = liveCareers && liveCareers.length > 0       ? liveCareers    : SEED_CAREERS;
  const agents     = liveAgents && liveAgents.length > 0         ? liveAgents     : SEED_AGENTS;

  const entries = [];
  let propertyCount = 0;
  let projectCount = 0;
  let careerCount = 0;
  let agentCount = 0;

  // 1. Core Static Pages
  for (const route of STATIC_ROUTES) {
    entries.push({
      loc: `${SITE_URL}${route.path}`,
      lastmod: TODAY,
      changefreq: route.changefreq,
      priority: route.priority,
      category: 'static',
      title: route.title,
      images: [],
    });
  }

  // 2. Crawled Properties (/properties/:id)
  for (const prop of properties) {
    const id = Number(prop?.id);
    if (!Number.isInteger(id) || id <= 0) continue;
    propertyCount++;

    const images = [];
    const primaryImg = toAbsoluteUrl(prop.image_url);
    if (primaryImg) {
      images.push({
        loc: primaryImg,
        title: `${prop.title || `Property #${id}`}${prop.serial_number ? ` (${prop.serial_number})` : ''}`,
        caption: prop.location ? `${prop.title || 'Property'} in ${prop.location}` : (prop.title || 'Attaie Properties Listing'),
      });
    }
    if (Array.isArray(prop.gallery_images)) {
      for (const gUrl of prop.gallery_images.slice(0, 5)) {
        const abs = toAbsoluteUrl(gUrl);
        if (abs && !images.some((img) => img.loc === abs)) {
          images.push({
            loc: abs,
            title: `${prop.title || `Property #${id}`} — Gallery`,
            caption: prop.location || 'Kabul, Afghanistan',
          });
        }
      }
    }

    const isAvailable = !prop.status || prop.status === 'available';
    entries.push({
      loc: `${SITE_URL}/properties/${id}`,
      lastmod: toIsoDate(prop.updated_at || prop.created_at),
      changefreq: isAvailable ? 'daily' : 'weekly',
      priority: isAvailable ? '0.85' : '0.70',
      category: 'properties',
      title: prop.title || `Property #${id}`,
      images,
    });
  }

  // 3. Crawled Projects (/projects/:id)
  for (const proj of projects) {
    const id = Number(proj?.id);
    if (!Number.isInteger(id) || id <= 0) continue;
    projectCount++;

    const images = [];
    const primaryImg = toAbsoluteUrl(proj.image_url);
    if (primaryImg) {
      images.push({
        loc: primaryImg,
        title: proj.name || `Project #${id}`,
        caption: proj.location ? `${proj.name || 'Development Project'} — ${proj.location}` : (proj.name || 'Attaie Properties Project'),
      });
    }
    if (proj.masterplan_image) {
      const mpUrl = toAbsoluteUrl(proj.masterplan_image);
      if (mpUrl && !images.some((img) => img.loc === mpUrl)) {
        images.push({
          loc: mpUrl,
          title: `${proj.name || `Project #${id}`} Masterplan`,
          caption: `Architectural Masterplan — ${proj.name || 'Project'}`,
        });
      }
    }

    entries.push({
      loc: `${SITE_URL}/projects/${id}`,
      lastmod: toIsoDate(proj.updated_at || proj.created_at),
      changefreq: 'weekly',
      priority: '0.85',
      category: 'projects',
      title: proj.name || `Project #${id}`,
      images,
    });
  }

  // 4. Crawled Career Announcements (/careers/:id)
  for (const job of careers) {
    const id = Number(job?.id);
    if (!Number.isInteger(id) || id <= 0) continue;
    if (job.status && job.status === 'draft') continue;
    careerCount++;

    const isOpen = !job.status || job.status === 'published';
    entries.push({
      loc: `${SITE_URL}/careers/${id}`,
      lastmod: toIsoDate(job.updated_at || job.created_at),
      changefreq: isOpen ? 'daily' : 'weekly',
      priority: isOpen ? '0.75' : '0.55',
      category: 'careers',
      title: job.title || `Career Opportunity #${id}`,
      images: [],
    });
  }

  // 5. Crawled Published Agents (/agents/:id)
  for (const agent of agents) {
    const id = Number(agent?.id);
    if (!Number.isInteger(id) || id <= 0 || agent?.published === false) continue;
    agentCount++;

    const images = [];
    const portraitUrl = toAbsoluteUrl(agent.portrait_url);
    if (portraitUrl) {
      images.push({
        loc: portraitUrl,
        title: `${agent.name || `Agent #${id}`} — ${agent.role || 'Property Advisor'}`,
        caption: `${agent.name || 'Agent'} at Attaie Properties`,
      });
    }

    entries.push({
      loc: `${SITE_URL}/agents/${id}`,
      lastmod: toIsoDate(agent.updated_at || agent.created_at),
      changefreq: 'monthly',
      priority: '0.65',
      category: 'agents',
      title: agent.name || `Agent #${id}`,
      images,
    });
  }

  const xmlLines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
  ];

  for (const entry of entries) {
    xmlLines.push('  <url>');
    xmlLines.push(`    <loc>${escapeXml(entry.loc)}</loc>`);
    xmlLines.push(`    <lastmod>${escapeXml(entry.lastmod)}</lastmod>`);
    xmlLines.push(`    <changefreq>${escapeXml(entry.changefreq)}</changefreq>`);
    xmlLines.push(`    <priority>${escapeXml(entry.priority)}</priority>`);

    if (Array.isArray(entry.images) && entry.images.length > 0) {
      for (const img of entry.images) {
        xmlLines.push('    <image:image>');
        xmlLines.push(`      <image:loc>${escapeXml(img.loc)}</image:loc>`);
        if (img.title) {
          xmlLines.push(`      <image:title>${escapeXml(img.title)}</image:title>`);
        }
        if (img.caption) {
          xmlLines.push(`      <image:caption>${escapeXml(img.caption)}</image:caption>`);
        }
        xmlLines.push('    </image:image>');
      }
    }

    xmlLines.push('  </url>');
  }

  xmlLines.push('</urlset>');
  xmlLines.push('');

  const xmlContent = xmlLines.join('\n');

  const crawlReport = {
    generated_at: NOW_ISO,
    canonical_base_url: SITE_URL,
    sitemap_url: `${SITE_URL}/sitemap.xml`,
    counts: {
      static: STATIC_ROUTES.length,
      properties: propertyCount,
      projects: projectCount,
      careers: careerCount,
      agents: agentCount,
      total: entries.length,
    },
    urls: entries.map((e) => ({
      loc: e.loc,
      lastmod: e.lastmod,
      changefreq: e.changefreq,
      priority: e.priority,
      category: e.category,
      title: e.title,
      image_count: Array.isArray(e.images) ? e.images.length : 0,
    })),
  };

  const publicDir = path.join(ROOT_DIR, 'public');
  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), xmlContent, 'utf8');
  fs.writeFileSync(path.join(publicDir, 'sitemap-status.json'), JSON.stringify(crawlReport, null, 2), 'utf8');

  const distDir = path.join(ROOT_DIR, 'dist');
  if (fs.existsSync(distDir)) {
    fs.writeFileSync(path.join(distDir, 'sitemap.xml'), xmlContent, 'utf8');
    fs.writeFileSync(path.join(distDir, 'sitemap-status.json'), JSON.stringify(crawlReport, null, 2), 'utf8');
  }

  console.log(
    `[sitemap] Crawled & generated sitemap.xml with ${entries.length} URLs (${STATIC_ROUTES.length} static, ${propertyCount} properties, ${projectCount} projects, ${careerCount} careers, ${agentCount} agents).`
  );
}

crawlAndGenerateSitemap();
