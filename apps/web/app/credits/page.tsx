import Link from 'next/link';
import { LuArrowLeft, LuExternalLink, LuShieldCheck } from 'react-icons/lu';

const AUTHORS = [
  { name: 'Lorc', assets: 'Wolf, werewolf, wraith, undead, and dragon silhouettes' },
  { name: 'Delapouite', assets: 'Vampire, golem, giant, serpent, demon, and bat silhouettes' },
  { name: 'Skoll', assets: 'Skeleton and troll silhouettes' },
  { name: 'Carl Olsen', assets: 'Spider silhouette' },
];

export const metadata = {
  title: 'Art Credits — Bladehound',
  description: 'Third-party art credits and licenses used by Bladehound.',
};

export default function CreditsPage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-12">
      <section className="panel w-full p-6 sm:p-8">
        <div className="mb-6 flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border border-iron bg-charcoal text-bronze">
            <LuShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emberLight">Open art attribution</p>
            <h1 className="mt-1 font-display text-2xl font-semibold text-bone">Art Credits</h1>
            <p className="mt-2 max-w-xl text-sm text-mist">
              Bladehound&apos;s bestiary medallions use adapted silhouettes from Game-icons.net.
              Colors, framing, and presentation were modified for the game&apos;s etched dark-fantasy system.
            </p>
          </div>
        </div>

        <div className="divider mb-6" />

        <div className="grid gap-3 sm:grid-cols-2">
          {AUTHORS.map((author) => (
            <article key={author.name} className="border border-iron/70 bg-charcoal/45 p-4">
              <h2 className="font-display text-sm font-semibold text-bone">{author.name}</h2>
              <p className="mt-1 text-xs leading-relaxed text-stone">{author.assets}</p>
            </article>
          ))}
        </div>

        <div className="mt-6 border border-bronze/25 bg-bronze/5 p-4">
          <p className="text-xs leading-relaxed text-mist">
            Original icons are available from{' '}
            <a className="text-bronzeLight hover:text-bone" href="https://game-icons.net/" target="_blank" rel="noreferrer">
              Game-icons.net <LuExternalLink className="inline h-3 w-3" />
            </a>{' '}
            and licensed under{' '}
            <a className="text-bronzeLight hover:text-bone" href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noreferrer">
              Creative Commons Attribution 3.0
            </a>.
          </p>
        </div>

        <Link href="/" className="mt-6 inline-flex items-center gap-1.5 text-xs text-mist transition-colors hover:text-bone">
          <LuArrowLeft className="h-3.5 w-3.5" /> Return to Bladehound
        </Link>
      </section>
    </div>
  );
}
