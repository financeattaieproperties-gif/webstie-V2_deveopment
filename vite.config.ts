import { defineConfig, loadEnv, type Plugin, type ViteDevServer, type PreviewServer } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import path from 'path';
import type { IncomingMessage, ServerResponse } from 'http';

// Prevent Vite CLI from exiting when stdin sends EOF in non-interactive container environments
process.env.CI = 'true';
const origStdinOn = process.stdin.on.bind(process.stdin);
process.stdin.on = ((event: string, listener: (...args: any[]) => void) => {
  if (event === 'end' || event === 'close') {
    return process.stdin;
  }
  return origStdinOn(event, listener);
}) as typeof process.stdin.on;
process.stdin.addListener = process.stdin.on;

function readBody(req: IncomingMessage): Promise<Record<string, any>> {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

function sendJson(res: ServerResponse, data: unknown, status = 200) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

function createMockPhpApiPlugin(): Plugin {
  let properties: any[] = [
    {
      id: 1,
      serial_number: 'AP-101',
      title: 'Exclusive Luxury Villa in Wazir Akbar Khan',
      price: 650000,
      location: 'Street 13, Wazir Akbar Khan, Kabul',
      beds: 5,
      baths: 6,
      area: 650,
      floor: 2,
      status: 'available',
      type: 'Villa',
      listing_type: 'sale',
      image_url: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80',
      gallery_images: [
        'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
      ],
      video_url: null,
      floor_plan_url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80',
      three_d_plan_url: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80',
      description: 'A prestigious 5-bedroom luxury estate in the heart of diplomatic Wazir Akbar Khan. Features landscaped courtyard gardens, high-security perimeter, imported marble flooring, dual generator backup, and modern central heating.',
      created_at: '2026-01-15T10:00:00.000Z',
    },
    {
      id: 2,
      serial_number: 'AP-102',
      title: 'Contemporary High-Rise Apartment in Shahr-e-Naw',
      price: 185000,
      location: 'Ansari Square, Shahr-e-Naw, Kabul',
      beds: 3,
      baths: 2,
      area: 175,
      floor: 7,
      status: 'available',
      type: 'Apartment',
      listing_type: 'sale',
      image_url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
      gallery_images: [
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
      ],
      video_url: null,
      floor_plan_url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80',
      three_d_plan_url: null,
      description: 'Sunlit 3-bedroom luxury apartment with sweeping views across the Kabul skyline. Includes smart climate control, elevator access with continuous power, underground parking, and 24/7 building reception.',
      created_at: '2026-02-01T12:00:00.000Z',
    },
    {
      id: 3,
      serial_number: 'AP-103',
      title: 'Prime Commercial Plaza Space on Kolola Pushta Main',
      price: 3200,
      location: 'Kolola Pushta Main Boulevard, Kabul',
      beds: null,
      baths: 2,
      area: 320,
      floor: 1,
      status: 'available',
      type: 'Commercial',
      listing_type: 'rent',
      image_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
      gallery_images: [
        'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80',
      ],
      video_url: null,
      floor_plan_url: null,
      three_d_plan_url: null,
      description: 'High-visibility retail and corporate office premises directly fronting Kolola Pushta thoroughfare. Features floor-to-ceiling glass display, dedicated customer parking, and backup generator.',
      created_at: '2026-02-10T14:30:00.000Z',
    },
    {
      id: 4,
      serial_number: 'AP-104',
      title: 'Classic Family Residence with Private Garden',
      price: 290000,
      location: 'Street 5, Karte Se, Kabul',
      beds: 4,
      baths: 3,
      area: 350,
      floor: 2,
      status: 'available',
      type: 'House',
      listing_type: 'sale',
      image_url: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80',
      gallery_images: [
        'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80',
      ],
      video_url: null,
      floor_plan_url: null,
      three_d_plan_url: null,
      description: 'Charming family home in quiet residential Karte Se with fruit trees, traditional Afghan reception room (Mehman Khana), modern kitchen, and solar electrical integration.',
      created_at: '2026-02-15T09:00:00.000Z',
    },
    {
      id: 5,
      serial_number: 'AP-105',
      title: 'Luxury Penthouse with Mountain Panoramas',
      price: 1600,
      location: 'Block 4, Macrorayan, Kabul',
      beds: 3,
      baths: 3,
      area: 220,
      floor: 9,
      status: 'available',
      type: 'Apartment',
      listing_type: 'rent',
      image_url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
      gallery_images: [
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
      ],
      video_url: null,
      floor_plan_url: null,
      three_d_plan_url: null,
      description: 'Top-floor penthouse apartment with wrap-around terrace offering unobstructed views of the Hindu Kush mountains. High security, 24/7 power, and fiber optic connection.',
      created_at: '2026-02-20T11:00:00.000Z',
    },
    {
      id: 6,
      serial_number: 'AP-106',
      title: 'Diplomatic Compound with Enhanced Security',
      price: 850000,
      location: 'Sherpur Diplomatic Enclave, Kabul',
      beds: 6,
      baths: 7,
      area: 780,
      floor: 3,
      status: 'available',
      type: 'Villa',
      listing_type: 'sale',
      image_url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
      gallery_images: [
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
      ],
      video_url: null,
      floor_plan_url: null,
      three_d_plan_url: null,
      description: 'High-spec diplomatic villa with gated vehicular entrance, secure guard post, conference room, swimming pool, and independent staff quarters.',
      created_at: '2026-03-01T08:00:00.000Z',
    },
  ];

  let projects: any[] = [
    {
      id: 1,
      name: 'The Kabul Heights',
      location: 'Ansari Boulevard, Shahr-e-Naw, Kabul',
      delivery_date: 'Q4 2027',
      status: 'Under Construction',
      available_units: 2,
      total_units: 3,
      image_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
      gallery_images: [
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
      ],
      video_url: null,
      masterplan_image: null,
      description: "Kabul's premiere mixed-use architectural landmark. Combining luxury residences with executive retail, fitness center, underground parking, and smart building automation.",
      created_at: '2026-01-10T00:00:00.000Z',
    },
    {
      id: 2,
      name: 'Wazir Luxury Residences',
      location: 'Street 15, Wazir Akbar Khan, Kabul',
      delivery_date: 'Ready to Move',
      status: 'Ready',
      available_units: 6,
      total_units: 18,
      image_url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      gallery_images: [
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      ],
      video_url: null,
      masterplan_image: null,
      description: "A boutique development of ultra-luxury apartments situated in Kabul's most secure diplomatic neighborhood.",
      created_at: '2026-01-20T00:00:00.000Z',
    },
    {
      id: 3,
      name: 'Emerald Business Tower',
      location: 'Kolola Pushta Central, Kabul',
      delivery_date: 'Q2 2027',
      status: 'In Progress',
      available_units: 14,
      total_units: 32,
      image_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
      gallery_images: [
        'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
      ],
      video_url: null,
      masterplan_image: null,
      description: 'State-of-the-art office spaces designed for international organizations, tech companies, and corporate headquarters.',
      created_at: '2026-02-05T00:00:00.000Z',
    },
  ];

  let projectUnits: any[] = [
    {
      id: 1,
      project_id: 1,
      unit_number: 'KH-402',
      title: 'Standard 2-Bedroom Suite',
      beds: 2,
      baths: 2,
      area: 130,
      floor: 4,
      price: 145000,
      currency: 'USD',
      status: 'available',
      image_url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
      description: 'Spacious 2-bedroom with west-facing balcony.',
    },
    {
      id: 2,
      project_id: 1,
      unit_number: 'KH-701',
      title: 'Executive 3-Bedroom Corner Suite',
      beds: 3,
      baths: 3,
      area: 185,
      floor: 7,
      price: 195000,
      currency: 'USD',
      status: 'available',
      image_url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
      description: 'Panoramic corner unit with city views.',
    },
    {
      id: 3,
      project_id: 1,
      unit_number: 'KH-901',
      title: 'Sky Penthouse',
      beds: 4,
      baths: 4,
      area: 270,
      floor: 9,
      price: 320000,
      currency: 'USD',
      status: 'reserved',
      image_url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
      description: 'Top-floor penthouse with private rooftop terrace.',
    },
  ];

  let agents: any[] = [
    {
      id: 1,
      name: 'Ahmad Attaie',
      role: 'Founder & Managing Director',
      background: 'With over 15 years in Afghan and international real estate, Ahmad founded Attaie Properties to bring institutional transparency, security compliance, and premium service to Kabul property transactions.',
      portrait_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=800&q=80',
      phone: '+93 78 222 2279',
      email: 'ahmad@attaieproperties.com',
      whatsapp: '93782222279',
      published: true,
      created_at: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 2,
      name: 'Zahra Karimi',
      role: 'Senior Residential Advisor',
      background: 'Specializing in luxury villas and family residences across Wazir Akbar Khan and Shahr-e-Naw, Zahra guides buyers and expatriate tenants through every stage of their search.',
      portrait_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80',
      phone: '+93 78 222 2280',
      email: 'zahra@attaieproperties.com',
      whatsapp: '93782222280',
      published: true,
      created_at: '2026-01-05T00:00:00.000Z',
    },
    {
      id: 3,
      name: 'Mohammad Ramin',
      role: 'Commercial & Land Specialist',
      background: "Expert in commercial plazas, development plots, and retail leases throughout Kabul's business districts, providing thorough deed verification and valuation.",
      portrait_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=800&q=80',
      phone: '+93 78 222 2281',
      email: 'ramin@attaieproperties.com',
      whatsapp: '93782222281',
      published: true,
      created_at: '2026-01-10T00:00:00.000Z',
    },
  ];

  let branches: any[] = [
    {
      id: 1,
      name: 'Main Headquarters — Wazir Akbar Khan',
      address: 'Street 13, Wazir Akbar Khan, Kabul, Afghanistan',
      phone: '+93 78 222 2279',
      email: 'info@attaieproperties.com',
      created_at: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 2,
      name: 'Shahr-e-Naw Branch',
      address: 'Ansari Square, Beside Park Mall, Shahr-e-Naw, Kabul',
      phone: '+93 78 222 2280',
      email: 'shahrenaw@attaieproperties.com',
      created_at: '2026-01-05T00:00:00.000Z',
    },
    {
      id: 3,
      name: 'Kolola Pushta Office',
      address: 'Opposite Traffic Square, Kolola Pushta, Kabul',
      phone: '+93 78 222 2281',
      email: 'kololapushta@attaieproperties.com',
      created_at: '2026-01-10T00:00:00.000Z',
    },
  ];

  let seoSettings: any = {
    id: 1,
    site_name: 'Attaie Properties',
    default_title: 'Attaie Properties — Premier Real Estate in Kabul, Afghanistan',
    title_template: '%s | Attaie Properties',
    default_description: 'Browse verified luxury villas, modern apartments, commercial spaces, and development projects for sale and rent across Kabul with Attaie Properties.',
    keywords: 'Attaie Properties, Kabul real estate, properties for sale in Kabul, properties for rent in Kabul, luxury villas Kabul, apartments in Kabul, Afghanistan property agency',
    og_image: '/logo.png',
    twitter_image: null,
    twitter_card: 'summary_large_image',
    twitter_site: '@AttaieProps',
    canonical_base_url: 'https://www.attaieproperties.com',
    robots_index: true,
    updated_at: new Date().toISOString(),
  };

  let leads: any[] = [];
  let visitRequests: any[] = [];

  let careerJobs: any[] = [
    {
      id: 1,
      title: 'Senior Real Estate Sales Advisor',
      location: 'Wazir Akbar Khan, Kabul',
      employment_type: 'Full-Time',
      description: 'We are seeking an experienced Senior Real Estate Sales Advisor to represent our luxury residential and diplomatic property portfolio across Wazir Akbar Khan, Sherpur, and Shahr-e-Naw.\n\nYou will advise high-net-worth buyers, corporate clients, and diaspora investors from initial consultation and property tours through negotiation and deed transfer.',
      qualifications: '- Minimum 3 years of experience in real estate brokerage, luxury sales, or client advisory in Kabul\n- Fluency in Dari and Pashto; strong working proficiency in English\n- Deep familiarity with Kabul neighborhoods, property valuation, and legal deed verification\n- Professional communication, negotiation, and CRM follow-up discipline',
      deadline_at: '2027-03-31 23:59:59',
      status: 'published',
      created_at: '2026-10-15T09:00:00.000Z',
      updated_at: '2026-10-15T09:00:00.000Z',
    },
    {
      id: 2,
      title: 'Architectural & 3D Visualization Specialist',
      location: 'Shahr-e-Naw, Kabul',
      employment_type: 'Full-Time',
      description: 'Join our development marketing and technical design team to prepare 2D floor plans, 3D architectural renders, and interactive masterplans for signature residential towers and commercial plazas in Kabul.',
      qualifications: '- Bachelor degree in Architecture, Civil Engineering, or related design field\n- Advanced proficiency in AutoCAD, Revit, 3ds Max / V-Ray, or Lumion\n- Strong portfolio of residential apartment layouts and exterior architectural visualizations\n- Ability to collaborate with site engineers and marketing teams under tight deadlines',
      deadline_at: '2027-02-28 23:59:59',
      status: 'published',
      created_at: '2026-10-20T11:00:00.000Z',
      updated_at: '2026-10-20T11:00:00.000Z',
    },
    {
      id: 3,
      title: 'Digital Marketing & Content Coordinator',
      location: 'Wazir Akbar Khan, Kabul',
      employment_type: 'Full-Time',
      description: 'Lead bilingual (Dari & English) social media campaigns, property video walk-through production, and digital lead generation for Attaie Properties.',
      qualifications: '- 2+ years experience in digital marketing, real estate media, or brand communications\n- Excellent written Dari and English copywriting skills\n- Experience with property photography/videography coordination and social ad campaigns',
      deadline_at: '2026-10-25 23:59:59',
      status: 'closed',
      created_at: '2026-09-25T08:00:00.000Z',
      updated_at: '2026-10-26T08:00:00.000Z',
    },
  ];

  let careerApplications: any[] = [];

  const computeCareerWithStatus = (job: any) => {
    const raw = (job.deadline_at || '').trim();
    const datePart = raw.slice(0, 10);
    const isoCutoff = /^\d{4}-\d{2}-\d{2}$/.test(raw) || raw.endsWith('00:00:00')
      ? `${datePart}T23:59:59+04:30`
      : `${raw.replace(' ', 'T')}+04:30`;
    const cutoffMs = Date.parse(isoCutoff);
    const isExpired = (Number.isFinite(cutoffMs) && Date.now() > cutoffMs) || job.status === 'closed';
    return {
      ...job,
      is_expired: isExpired,
      effective_status: isExpired ? 'closed' : 'published',
      application_count: careerApplications.filter((a) => a.job_id === job.id).length,
    };
  };

  const escapeXml = (str: unknown) =>
    String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

  const toIsoDate = (dateStr?: string | null) => {
    const today = new Date().toISOString().slice(0, 10);
    if (!dateStr || typeof dateStr !== 'string') return today;
    const match = dateStr.match(/^(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : today;
  };

  const buildLiveSitemap = (overrideBaseUrl?: string, persistToDisk = true) => {
    const siteUrl = (
      overrideBaseUrl ||
      seoSettings?.canonical_base_url ||
      'https://www.attaieproperties.com'
    )
      .trim()
      .replace(/\/+$/, '');
    const today = new Date().toISOString().slice(0, 10);
    const nowIso = new Date().toISOString();

    const toAbs = (u?: string | null) => {
      if (!u || typeof u !== 'string') return null;
      const t = u.trim();
      if (!t) return null;
      if (/^https?:\/\//i.test(t)) return t;
      return `${siteUrl}${t.startsWith('/') ? '' : '/'}${t}`;
    };

    const staticRoutes = [
      { path: '/',           changefreq: 'daily',   priority: '1.0', title: 'Home — Attaie Properties' },
      { path: '/properties', changefreq: 'daily',   priority: '0.9', title: 'Properties for Sale & Rent in Kabul' },
      { path: '/projects',   changefreq: 'weekly',  priority: '0.8', title: 'Real Estate Development Projects in Kabul' },
      { path: '/careers',    changefreq: 'daily',   priority: '0.8', title: 'Careers & Job Openings — Attaie Properties' },
      { path: '/agents',     changefreq: 'weekly',  priority: '0.7', title: 'Licensed Property Advisors & Agents' },
      { path: '/about',      changefreq: 'monthly', priority: '0.6', title: 'About Attaie Properties' },
      { path: '/contact',    changefreq: 'monthly', priority: '0.7', title: 'Contact Attaie Properties Kabul' },
    ];

    const entries: Array<{
      loc: string;
      lastmod: string;
      changefreq: string;
      priority: string;
      category: 'static' | 'properties' | 'projects' | 'careers' | 'agents';
      title: string;
      images: Array<{ loc: string; title?: string; caption?: string }>;
    }> = [];

    for (const st of staticRoutes) {
      entries.push({
        loc: `${siteUrl}${st.path}`,
        lastmod: today,
        changefreq: st.changefreq,
        priority: st.priority,
        category: 'static',
        title: st.title,
        images: [],
      });
    }

    let propertyCount = 0;
    for (const prop of properties) {
      const id = Number(prop?.id);
      if (!Number.isInteger(id) || id <= 0) continue;
      propertyCount++;
      const images: Array<{ loc: string; title?: string; caption?: string }> = [];
      const primary = toAbs(prop.image_url);
      if (primary) {
        images.push({
          loc: primary,
          title: `${prop.title || `Property #${id}`}${prop.serial_number ? ` (${prop.serial_number})` : ''}`,
          caption: prop.location ? `${prop.title || 'Property'} in ${prop.location}` : prop.title,
        });
      }
      if (Array.isArray(prop.gallery_images)) {
        for (const g of prop.gallery_images.slice(0, 5)) {
          const absG = toAbs(g);
          if (absG && !images.some((i) => i.loc === absG)) {
            images.push({
              loc: absG,
              title: `${prop.title || `Property #${id}`} — Gallery`,
              caption: prop.location || 'Kabul, Afghanistan',
            });
          }
        }
      }
      const isAvail = !prop.status || prop.status === 'available';
      entries.push({
        loc: `${siteUrl}/properties/${id}`,
        lastmod: toIsoDate(prop.updated_at || prop.created_at),
        changefreq: isAvail ? 'daily' : 'weekly',
        priority: isAvail ? '0.85' : '0.70',
        category: 'properties',
        title: prop.title || `Property #${id}`,
        images,
      });
    }

    let projectCount = 0;
    for (const proj of projects) {
      const id = Number(proj?.id);
      if (!Number.isInteger(id) || id <= 0) continue;
      projectCount++;
      const images: Array<{ loc: string; title?: string; caption?: string }> = [];
      const primary = toAbs(proj.image_url);
      if (primary) {
        images.push({
          loc: primary,
          title: proj.name || `Project #${id}`,
          caption: proj.location ? `${proj.name || 'Project'} — ${proj.location}` : proj.name,
        });
      }
      const mp = toAbs(proj.masterplan_image);
      if (mp && !images.some((i) => i.loc === mp)) {
        images.push({
          loc: mp,
          title: `${proj.name || `Project #${id}`} Masterplan`,
          caption: `Architectural Masterplan — ${proj.name || 'Project'}`,
        });
      }
      entries.push({
        loc: `${siteUrl}/projects/${id}`,
        lastmod: toIsoDate(proj.updated_at || proj.created_at),
        changefreq: 'weekly',
        priority: '0.85',
        category: 'projects',
        title: proj.name || `Project #${id}`,
        images,
      });
    }

    let careerCount = 0;
    for (const job of careerJobs) {
      const id = Number(job?.id);
      if (!Number.isInteger(id) || id <= 0) continue;
      if (job.status === 'draft') continue;
      careerCount++;
      const isOpen = job.status === 'published';
      entries.push({
        loc: `${siteUrl}/careers/${id}`,
        lastmod: toIsoDate(job.updated_at || job.created_at),
        changefreq: isOpen ? 'daily' : 'weekly',
        priority: isOpen ? '0.75' : '0.55',
        category: 'careers',
        title: job.title || `Career Opportunity #${id}`,
        images: [],
      });
    }

    let agentCount = 0;
    for (const agent of agents) {
      const id = Number(agent?.id);
      if (!Number.isInteger(id) || id <= 0 || !agent.published) continue;
      agentCount++;
      const images: Array<{ loc: string; title?: string; caption?: string }> = [];
      const portrait = toAbs(agent.portrait_url);
      if (portrait) {
        images.push({
          loc: portrait,
          title: `${agent.name || `Agent #${id}`} — ${agent.role || 'Property Advisor'}`,
          caption: `${agent.name || 'Agent'} at Attaie Properties`,
        });
      }
      entries.push({
        loc: `${siteUrl}/agents/${id}`,
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
      for (const img of entry.images) {
        xmlLines.push('    <image:image>');
        xmlLines.push(`      <image:loc>${escapeXml(img.loc)}</image:loc>`);
        if (img.title) xmlLines.push(`      <image:title>${escapeXml(img.title)}</image:title>`);
        if (img.caption) xmlLines.push(`      <image:caption>${escapeXml(img.caption)}</image:caption>`);
        xmlLines.push('    </image:image>');
      }
      xmlLines.push('  </url>');
    }
    xmlLines.push('</urlset>');
    xmlLines.push('');
    const xml = xmlLines.join('\n');

    const report = {
      generated_at: nowIso,
      canonical_base_url: siteUrl,
      sitemap_url: `${siteUrl}/sitemap.xml`,
      counts: {
        static: staticRoutes.length,
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
        image_count: e.images.length,
      })),
      xml,
    };

    if (persistToDisk) {
      try {
        const pubDir = path.resolve(import.meta.dirname, './public');
        fs.writeFileSync(path.join(pubDir, 'sitemap.xml'), xml, 'utf8');
        const { xml: _omitXml, ...statusOnly } = report;
        fs.writeFileSync(path.join(pubDir, 'sitemap-status.json'), JSON.stringify(statusOnly, null, 2), 'utf8');
      } catch {
        // ignore write errors in read-only environments
      }
    }

    return report;
  };

  const attachMiddleware = (server: ViteDevServer | PreviewServer) => {
    // Keep process alive if stdin closes in container
    process.stdin.removeAllListeners('end');
    process.stdin.on('error', () => {});

    server.middlewares.use(async (req, res, next) => {
      if (!req.url) return next();

      const parsedUrl = new URL(req.url, 'http://localhost:3000');
      const pathname = parsedUrl.pathname;
      const method = req.method || 'GET';

      if ((pathname === '/sitemap.xml' || pathname === '/sitemap.php') && method === 'GET') {
        const report = buildLiveSitemap(undefined, false);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/xml; charset=utf-8');
        res.end(report.xml);
        return;
      }

      if (pathname === '/sitemap-status.json' && method === 'GET') {
        const { xml: _xml, ...statusOnly } = buildLiveSitemap(undefined, false);
        return sendJson(res, statusOnly);
      }

      if (!pathname.startsWith('/api/')) {
        return next();
      }

      // Public endpoints
      if (pathname === '/api/get-properties.php' && method === 'GET') {
        const status = parsedUrl.searchParams.get('status');
        const type = parsedUrl.searchParams.get('type');
        const listingType = parsedUrl.searchParams.get('listing_type');
        const serialNumber = parsedUrl.searchParams.get('serial_number');
        const search = parsedUrl.searchParams.get('search')?.toLowerCase();

        let result = [...properties];
        if (status) result = result.filter((p) => p.status === status);
        if (type) result = result.filter((p) => p.type === type);
        if (listingType) result = result.filter((p) => p.listing_type === listingType);
        if (serialNumber) result = result.filter((p) => p.serial_number.toLowerCase() === serialNumber.toLowerCase());
        else if (search) {
          result = result.filter(
            (p) =>
              p.serial_number.toLowerCase() === search ||
              p.title.toLowerCase().includes(search) ||
              p.location.toLowerCase().includes(search)
          );
        }
        return sendJson(res, result);
      }

      if (pathname === '/api/get-property.php' && method === 'GET') {
        const id = Number(parsedUrl.searchParams.get('id'));
        const item = properties.find((p) => p.id === id);
        if (!item) return sendJson(res, { error: 'Not found' }, 404);
        return sendJson(res, item);
      }

      if (pathname === '/api/get-projects.php' && method === 'GET') {
        return sendJson(res, projects);
      }

      if (pathname === '/api/get-project.php' && method === 'GET') {
        const id = Number(parsedUrl.searchParams.get('id'));
        const item = projects.find((p) => p.id === id);
        if (!item) return sendJson(res, { error: 'Not found' }, 404);
        return sendJson(res, item);
      }

      if (pathname === '/api/get-project-units.php' && method === 'GET') {
        const projectId = Number(parsedUrl.searchParams.get('project_id') || 0);
        const all = parsedUrl.searchParams.get('all') === '1';
        const status = parsedUrl.searchParams.get('status');
        const page = Math.max(1, Number(parsedUrl.searchParams.get('page') || 1));
        const limit = Math.min(100, Math.max(1, Number(parsedUrl.searchParams.get('limit') || 50)));
        let items = projectId > 0
          ? projectUnits.filter((u) => u.project_id === projectId)
          : all
            ? [...projectUnits]
            : [];
        if (status) items = items.filter((u) => u.status === status);
        items = items.map((u) => {
          const parent = projects.find((p) => p.id === u.project_id);
          return {
            ...u,
            project_name: parent?.name || 'Development Project',
            project_location: parent?.location || 'Kabul',
          };
        });
        const total = items.length;
        const offset = (page - 1) * limit;
        const paged = items.slice(offset, offset + limit);
        return sendJson(res, {
          items: paged,
          page,
          limit,
          total,
          has_more: offset + paged.length < total,
        });
      }

      if (pathname === '/api/get-agents.php' && method === 'GET') {
        return sendJson(res, agents.filter((a) => a.published));
      }

      if (pathname === '/api/get-agent.php' && method === 'GET') {
        const id = Number(parsedUrl.searchParams.get('id'));
        const item = agents.find((a) => a.id === id && a.published);
        if (!item) return sendJson(res, { error: 'Agent not found' }, 404);
        return sendJson(res, item);
      }

      if (pathname === '/api/get-branches.php' && method === 'GET') {
        return sendJson(res, branches);
      }

      if (pathname === '/api/get-careers.php' && method === 'GET') {
        const visible = careerJobs
          .filter((j) => j.status === 'published' || j.status === 'closed')
          .map(computeCareerWithStatus);
        return sendJson(res, visible);
      }

      if (pathname === '/api/get-career.php' && method === 'GET') {
        const id = Number(parsedUrl.searchParams.get('id'));
        const found = careerJobs.find((j) => j.id === id && (j.status === 'published' || j.status === 'closed'));
        if (!found) return sendJson(res, { error: 'Job announcement not found' }, 404);
        return sendJson(res, computeCareerWithStatus(found));
      }

      if (pathname === '/api/submit-career-application.php' && method === 'POST') {
        // Consume request stream for multipart/form-data
        await new Promise<void>((resolve) => {
          req.on('data', () => {});
          req.on('end', () => resolve());
          req.on('error', () => resolve());
        });
        const id = careerApplications.length + 1;
        careerApplications.unshift({
          id,
          job_id: 1,
          job_title: careerJobs[0]?.title || 'Senior Real Estate Sales Advisor',
          name: 'Applicant #' + id,
          father_name: 'Submitted via Preview',
          email: 'applicant@example.com',
          phone: '+93 780 000 000',
          address: 'Kabul, Afghanistan',
          photo_original_name: 'applicant_photo.jpg',
          photo_mime_type: 'image/jpeg',
          photo_size: 145000,
          cv_original_name: 'applicant_cv.pdf',
          cv_mime_type: 'application/pdf',
          cv_size: 320000,
          created_at: new Date().toISOString(),
        });
        return sendJson(res, { success: true, id }, 201);
      }

      if (pathname === '/api/get-seo-settings.php' && method === 'GET') {
        return sendJson(res, seoSettings);
      }

      if (pathname === '/api/submit-lead.php' && method === 'POST') {
        const body = await readBody(req);
        const id = leads.length + 1;
        leads.unshift({
          id,
          name: body.name || '',
          email: body.email || '',
          phone: body.phone || '',
          message: body.message || null,
          property_id: body.propertyId || null,
          property_name: body.propertyName || null,
          stage: 'New',
          source: 'Website',
          status: 'Pending',
          created_at: new Date().toISOString(),
        });
        return sendJson(res, { success: true, id }, 201);
      }

      if (pathname === '/api/submit-visit-request.php' && method === 'POST') {
        const body = await readBody(req);
        const id = visitRequests.length + 1;
        visitRequests.unshift({
          id,
          name: body.name || '',
          phone: body.phone || '',
          listing_name: body.label || 'Property Visit',
          requested_at: body.requestedAt || new Date().toISOString(),
          status: 'pending',
          staff_note: null,
          events: [
            {
              previous_status: null,
              next_status: 'pending',
              actor: 'customer',
              note: 'Requested from website',
              created_at: new Date().toISOString(),
            },
          ],
        });
        return sendJson(res, { success: true, id }, 201);
      }

      if (pathname === '/api/initiate-call.php' && method === 'POST') {
        return sendJson(res, { success: true, message: 'Call initiated' });
      }

      // Admin endpoints
      if (pathname === '/api/admin/csrf.php' && method === 'GET') {
        return sendJson(res, { csrf_token: 'dev-csrf-token' });
      }

      if (pathname === '/api/admin-login.php' && method === 'POST') {
        return sendJson(res, { success: true, csrf_token: 'dev-csrf-token' });
      }

      if (pathname === '/api/admin-logout.php') {
        return sendJson(res, { success: true });
      }

      if (pathname === '/api/admin/properties.php') {
        if (method === 'GET') return sendJson(res, properties);
        if (method === 'POST') {
          const body = await readBody(req);
          const id = properties.reduce((max, p) => Math.max(max, p.id), 0) + 1;
          properties.unshift({ ...body, id, created_at: new Date().toISOString() } as any);
          buildLiveSitemap();
          return sendJson(res, { id }, 201);
        }
        if (method === 'PUT') {
          const body = await readBody(req);
          properties = properties.map((p) => (p.id === Number(body.id) ? { ...p, ...body } : p));
          buildLiveSitemap();
          return sendJson(res, { updated: 1 });
        }
        if (method === 'DELETE') {
          const id = Number(parsedUrl.searchParams.get('id'));
          properties = properties.filter((p) => p.id !== id);
          buildLiveSitemap();
          return sendJson(res, { deleted: 1 });
        }
      }

      if (pathname === '/api/admin/projects.php') {
        if (method === 'GET') return sendJson(res, projects);
        if (method === 'POST') {
          const body = await readBody(req);
          const id = projects.reduce((max, p) => Math.max(max, p.id), 0) + 1;
          projects.unshift({ ...body, id, created_at: new Date().toISOString() } as any);
          buildLiveSitemap();
          return sendJson(res, { id }, 201);
        }
        if (method === 'PUT') {
          const body = await readBody(req);
          projects = projects.map((p) => (p.id === Number(body.id) ? { ...p, ...body } : p));
          buildLiveSitemap();
          return sendJson(res, { updated: 1 });
        }
        if (method === 'DELETE') {
          const id = Number(parsedUrl.searchParams.get('id'));
          projects = projects.filter((p) => p.id !== id);
          buildLiveSitemap();
          return sendJson(res, { deleted: 1 });
        }
      }

      if (pathname === '/api/admin/project-units.php') {
        if (method === 'GET') {
          const projectId = Number(parsedUrl.searchParams.get('project_id'));
          return sendJson(res, projectUnits.filter((u) => u.project_id === projectId));
        }
        if (method === 'POST') {
          const body = await readBody(req);
          const id = projectUnits.reduce((max, u) => Math.max(max, u.id), 0) + 1;
          projectUnits.push({ ...body, id } as any);
          return sendJson(res, { id }, 201);
        }
        if (method === 'PUT') {
          const body = await readBody(req);
          projectUnits = projectUnits.map((u) => (u.id === Number(body.id) ? { ...u, ...body } : u));
          return sendJson(res, { updated: 1 });
        }
        if (method === 'DELETE') {
          const id = Number(parsedUrl.searchParams.get('id'));
          projectUnits = projectUnits.filter((u) => u.id !== id);
          return sendJson(res, { deleted: 1 });
        }
      }

      if (pathname === '/api/admin/agents.php') {
        if (method === 'GET') return sendJson(res, agents);
        if (method === 'POST') {
          const body = await readBody(req);
          const id = agents.reduce((max, a) => Math.max(max, a.id), 0) + 1;
          agents.push({ ...body, id, created_at: new Date().toISOString() } as any);
          buildLiveSitemap();
          return sendJson(res, { id }, 201);
        }
        if (method === 'PUT') {
          const body = await readBody(req);
          agents = agents.map((a) => (a.id === Number(body.id) ? { ...a, ...body } : a));
          buildLiveSitemap();
          return sendJson(res, { updated: 1 });
        }
        if (method === 'DELETE') {
          const id = Number(parsedUrl.searchParams.get('id'));
          agents = agents.filter((a) => a.id !== id);
          buildLiveSitemap();
          return sendJson(res, { deleted: 1 });
        }
      }

      if (pathname === '/api/admin/branches.php') {
        if (method === 'GET') return sendJson(res, branches);
        if (method === 'POST') {
          const body = await readBody(req);
          const id = branches.reduce((max, b) => Math.max(max, b.id), 0) + 1;
          branches.push({ ...body, id, created_at: new Date().toISOString() } as any);
          return sendJson(res, { id }, 201);
        }
        if (method === 'PUT') {
          const body = await readBody(req);
          branches = branches.map((b) => (b.id === Number(body.id) ? { ...b, ...body } : b));
          return sendJson(res, { updated: 1 });
        }
        if (method === 'DELETE') {
          const id = Number(parsedUrl.searchParams.get('id'));
          branches = branches.filter((b) => b.id !== id);
          return sendJson(res, { deleted: 1 });
        }
      }

      if (pathname === '/api/admin/careers.php') {
        if (method === 'GET') {
          return sendJson(res, careerJobs.map(computeCareerWithStatus));
        }
        if (method === 'POST') {
          const body = await readBody(req);
          const id = careerJobs.reduce((max, j) => Math.max(max, j.id), 0) + 1;
          careerJobs.unshift({
            ...body,
            id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          buildLiveSitemap();
          return sendJson(res, { id }, 201);
        }
        if (method === 'PUT') {
          const body = await readBody(req);
          careerJobs = careerJobs.map((j) =>
            j.id === Number(body.id) ? { ...j, ...body, updated_at: new Date().toISOString() } : j
          );
          buildLiveSitemap();
          return sendJson(res, { updated: 1 });
        }
        if (method === 'DELETE') {
          const id = Number(parsedUrl.searchParams.get('id'));
          const hasApps = careerApplications.some((a) => a.job_id === id);
          if (hasApps) {
            return sendJson(
              res,
              { error: 'Cannot delete a job announcement that has received applications. Please close or unpublish it instead.' },
              409
            );
          }
          careerJobs = careerJobs.filter((j) => j.id !== id);
          buildLiveSitemap();
          return sendJson(res, { deleted: 1 });
        }
      }

      if (pathname === '/api/admin/career-applications.php' && method === 'GET') {
        const jobId = Number(parsedUrl.searchParams.get('job_id') || 0);
        const list = jobId > 0
          ? careerApplications.filter((a) => a.job_id === jobId)
          : careerApplications;
        return sendJson(res, list);
      }

      if (pathname === '/api/admin/career-file.php' && method === 'GET') {
        res.writeHead(302, { Location: '/logo.png' });
        res.end();
        return;
      }

      if (pathname === '/api/admin/seo-settings.php') {
        if (method === 'GET') return sendJson(res, seoSettings);
        if (method === 'PUT' || method === 'POST') {
          const body = await readBody(req);
          seoSettings = { ...seoSettings, ...body, updated_at: new Date().toISOString() };
          buildLiveSitemap(seoSettings.canonical_base_url);
          return sendJson(res, seoSettings);
        }
      }

      if (pathname === '/api/admin/sitemap.php') {
        if (method === 'GET') {
          return sendJson(res, buildLiveSitemap(undefined, false));
        }
        if (method === 'POST') {
          const body = await readBody(req);
          const report = buildLiveSitemap(body?.canonical_base_url, true);
          return sendJson(res, report);
        }
      }

      if (pathname === '/api/admin/upload.php' && method === 'POST') {
        // Return a mock URL for uploaded assets
        return sendJson(res, {
          url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
        });
      }

      if (pathname === '/api/admin/leads.php' && method === 'GET') {
        return sendJson(res, leads);
      }

      if (pathname === '/api/admin/visit-requests.php') {
        if (method === 'GET') return sendJson(res, visitRequests);
        if (method === 'PUT') {
          const body = await readBody(req);
          visitRequests = visitRequests.map((v) => {
            if (v.id !== Number(body.id)) return v;
            const nextEvents = [
              ...(v.events || []),
              {
                previous_status: v.status,
                next_status: body.status,
                actor: 'admin',
                note: body.staff_note || null,
                created_at: new Date().toISOString(),
              },
            ];
            return { ...v, status: body.status, staff_note: body.staff_note, events: nextEvents };
          });
          return sendJson(res, { success: true });
        }
      }

      return next();
    });
  };

  return {
    name: 'mock-php-api',
    configureServer(server) {
      attachMiddleware(server);
    },
    configurePreviewServer(server) {
      attachMiddleware(server);
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const gmpKey =
    env.GOOGLE_MAPS_PLATFORM_KEY ||
    env.VITE_GOOGLE_MAPS_API_KEY ||
    env.GOOGLE_MAPS_API_KEY ||
    process.env.GOOGLE_MAPS_PLATFORM_KEY ||
    process.env.VITE_GOOGLE_MAPS_API_KEY ||
    '';

  return {
    define: {
      'process.env.GOOGLE_MAPS_PLATFORM_KEY': JSON.stringify(gmpKey),
      'import.meta.env.VITE_GOOGLE_MAPS_API_KEY': JSON.stringify(gmpKey),
    },
    plugins: [
      react(),
      tailwindcss(),
      createMockPhpApiPlugin(),
    ],
    server: {
      port: 3000,
      host: '0.0.0.0',
      allowedHosts: true,
      hmr: false,
    },
    resolve: {
      alias: { '@': path.resolve(import.meta.dirname, './src') },
    },
    build: {
      outDir: 'dist',
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (
              id.includes('node_modules/react-dom') ||
              id.includes('node_modules/react/') ||
              id.includes('node_modules/react-router')
            ) {
              return 'vendor-core';
            }
            if (id.includes('node_modules/@vis.gl/react-google-maps')) {
              return 'vendor-maps';
            }
            if (id.includes('node_modules/swiper')) {
              return 'vendor-swiper';
            }
            if (id.includes('node_modules/gsap')) {
              return 'vendor-gsap';
            }
            if (id.includes('node_modules/framer-motion') || id.includes('node_modules/motion')) {
              return 'vendor-animations';
            }
            if (id.includes('node_modules/react-hook-form') || id.includes('node_modules/zod')) {
              return 'vendor-forms';
            }
          },
        },
      },
      chunkSizeWarningLimit: 600,
    },
  };
});


