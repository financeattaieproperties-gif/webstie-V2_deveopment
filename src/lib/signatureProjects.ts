import type { Project } from './dbService';
import defaultExteriorImg from '../assets/images/project_exterior_elevation_1793995966183.jpg';
import categoryProjectsImg from '../assets/images/category_master_projects_1794037429266.jpg';
import categoryCommercialImg from '../assets/images/category_commercial_plaza_1794037429778.jpg';
import categoryHousesImg from '../assets/images/category_houses_villa_1794037428658.jpg';
import stitchHeroImg from '../assets/images/stitch_hero_kabul_panorama.jpg';

export const SIGNATURE_PROJECTS: Project[] = [
  {
    id: 1,
    name: 'Kabul Plaza Saljuqi',
    location: 'Shahr-e-Naw, District 10, Kabul',
    delivery_date: 'Q4 2027',
    status: 'In Progress',
    available_units: 24,
    total_units: 31,
    image_url: defaultExteriorImg,
    gallery_images: [defaultExteriorImg],
    video_url: null,
    masterplan_image: null,
    description:
      '11-story luxury residential and commercial tower in the heart of Shahr-e-Naw offering 3, 4, and 5-bedroom apartments with private Mehmankhana and 11th-floor VIP penthouses.',
    created_at: '2026-01-01',
  },
  {
    id: 2,
    name: 'Moon Residency',
    location: 'Kart-e-Char, District 3, Kabul',
    delivery_date: 'Q3 2027',
    status: 'Under Construction',
    available_units: 28,
    total_units: 36,
    image_url: categoryProjectsImg,
    gallery_images: [categoryProjectsImg],
    video_url: null,
    masterplan_image: null,
    description:
      '10-story architectural landmark on the main boulevard of Kart-e-Char featuring a 525 m² commercial shopping galleria and four distinct apartment typologies per floor.',
    created_at: '2026-01-20',
  },
  {
    id: 3,
    name: 'Kabul Plaza Burj',
    location: 'Ansari Square, Shahr-e-Naw, Kabul',
    delivery_date: 'Q2 2028',
    status: 'Under Construction',
    available_units: 42,
    total_units: 60,
    image_url: categoryCommercialImg,
    gallery_images: [categoryCommercialImg],
    video_url: null,
    masterplan_image: null,
    description:
      '15-story flagship tower at Ansari Square integrating Kabul Mall retail, executive studio residences, a 5th-floor private sky garden, and 15th-floor grand VIP penthouses.',
    created_at: '2026-01-25',
  },
  {
    id: 4,
    name: 'Kabul Plaza 12',
    location: 'Main Boulevard, Kart-e-Char, Kabul',
    delivery_date: 'Q1 2028',
    status: 'Under Construction',
    available_units: 16,
    total_units: 24,
    image_url: categoryHousesImg,
    gallery_images: [categoryHousesImg],
    video_url: null,
    masterplan_image: null,
    description:
      '10-story mixed-use development on Kart-e-Char Boulevard featuring a commercial shopping center, business level, symmetrical 3+1 residences, and rooftop penthouses.',
    created_at: '2026-01-28',
  },
  {
    id: 5,
    name: 'Kabul Plaza 09 (ABC)',
    location: 'Haj o Awqaf, Shahr-e-Naw, Kabul',
    delivery_date: 'Q4 2027',
    status: 'Under Construction',
    available_units: 11,
    total_units: 18,
    image_url: stitchHeroImg,
    gallery_images: [stitchHeroImg],
    video_url: null,
    masterplan_image: null,
    description:
      'Boutique 9-story residential tower in Haj o Awqaf, Shahr-e-Naw offering spacious 4+1 residences and dramatic two-story sky-roof duplex penthouses.',
    created_at: '2026-02-01',
  },
];

export function resolveSignatureProjects(projects?: Project[] | null): Project[] {
  if (Array.isArray(projects) && projects.length > 0) {
    return projects;
  }
  return SIGNATURE_PROJECTS;
}
