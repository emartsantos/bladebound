import { SectionContent } from '@/components/section-content';
import { SECTION_META, type SectionId } from '@premium-rpg/ui-tokens';
import { notFound } from 'next/navigation';

const VALID_SECTIONS = new Set<string>(Object.keys(SECTION_META));

export function generateStaticParams() {
  return [...VALID_SECTIONS].map((section) => ({ section }));
}

/**
 * /game/:section — every game section is URL-addressable. Direct links,
 * refresh and browser Back/Forward all resolve to the right section while the
 * shell+providers stay mounted in /game/layout.
 */
export default async function GameSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!VALID_SECTIONS.has(section)) notFound();
  return <SectionContent section={section as SectionId} />;
}