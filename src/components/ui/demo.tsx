import React from "react";
import {
  Building2,
  Landmark,
  TowerControl,
  Building,
  Castle,
} from "lucide-react";
import {
  ExpandingCards,
  resolveProjectDetailHref,
  type CardItem,
} from "@/components/ui/expanding-cards";
import { SIGNATURE_PROJECTS, resolveSignatureProjects } from "@/lib/signatureProjects";
import type { Project } from "@/lib/dbService";
import defaultExteriorImg from "@/assets/images/project_exterior_elevation_1793995966183.jpg";

const PROJECT_ICONS = [
  <Building2 size={22} />,
  <Landmark size={22} />,
  <TowerControl size={22} />,
  <Building size={22} />,
  <Castle size={22} />,
];

export function mapProjectsToExpandingCards(projects?: Project[] | null): CardItem[] {
  const list = resolveSignatureProjects(projects);
  return list.map((project, index) => {
    const metaParts = [
      project.status,
      project.available_units !== undefined ? `${project.available_units} Units Open` : null,
      project.delivery_date ? `Delivery ${project.delivery_date}` : null,
    ].filter(Boolean);

    const dynamicHref = resolveProjectDetailHref({
      id: project.id,
      linkHref: `/projects/${project.id}`,
    });

    return {
      id: project.id,
      title: project.name,
      subtitle: project.location,
      description:
        project.description ||
        "Multi-unit residential and commercial development across Kabul's prime growth corridors.",
      imgSrc: project.image_url || defaultExteriorImg,
      icon: PROJECT_ICONS[index % PROJECT_ICONS.length],
      linkHref: dynamicHref,
      linkLabel: "View Project Details",
      meta: metaParts.join(" · "),
    };
  });
}

export const signatureProjectCards: CardItem[] = mapProjectsToExpandingCards(SIGNATURE_PROJECTS);

export default function ExpandingCardsDemo({ projects }: { projects?: Project[] }) {
  const items = React.useMemo(() => mapProjectsToExpandingCards(projects), [projects]);

  return (
    <div className="flex w-full flex-col items-center justify-center space-y-8 bg-brand-cream py-4">
      <ExpandingCards items={items} defaultActiveIndex={0} />
    </div>
  );
}
