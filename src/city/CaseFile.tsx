import { ArrowUpRight, Github, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { education, experience, featured, moreProjects, profile, recognition } from '../data/site';
import { details } from '../data/architecture';
import { landmark } from './map';

// What opens when you reach a place in the city or finish a mission. Everything here
// comes from the same data as the classic portfolio.

const allMinor = moreProjects.flatMap((g) => g.items);
const slug = (t: string) => t.toLowerCase().replace(/\s+/g, '-');

const Links = ({ links }: { links: { label: string; href: string; icon?: 'gh' }[] }) => (
  <div className="mt-5 flex flex-wrap gap-2">
    {links.map((l) =>
      l.href.startsWith('/') ? (
        <Link key={l.href} to={l.href} className="btn-ghost px-4 py-2 text-[13px]">
          {l.label}
        </Link>
      ) : (
        <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className="btn-ghost px-4 py-2 text-[13px]">
          {l.icon === 'gh' && <Github className="h-3.5 w-3.5" strokeWidth={1.75} />}
          {l.label} <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
        </a>
      ),
    )}
  </div>
);

const ProjectBody = ({ id }: { id: string }) => {
  const f = featured.find((p) => p.id === id);
  const m = allMinor.find((p) => slug(p.title) === id);
  const note = details.find((d) => d.id === id);
  const title = f?.title ?? m?.title ?? note?.title ?? id;
  const summary = f?.summary ?? m?.blurb ?? note?.objective ?? '';
  const tech = f?.tech ?? m?.tech ?? note?.stack.split(', ').slice(0, 6) ?? [];
  const links: { label: string; href: string; icon?: 'gh' }[] = [];
  f?.links.forEach((l) => links.push({ label: l.label, href: l.href, icon: l.label === 'Source' ? 'gh' : undefined }));
  if (m?.href) links.push({ label: 'Live site', href: m.href });
  if (m?.source) links.push({ label: 'Source', href: m.source, icon: 'gh' });
  if (note) links.push({ label: 'How it works', href: `/project_description#${id}` });
  return (
    <>
      <p className="text-sm text-accent-fg">{f?.kind ?? 'Project'}</p>
      <h2 className="display mt-1 text-4xl font-bold leading-none">{title}</h2>
      {f?.image && (
        <div className="mt-5 overflow-hidden rounded-lg border border-line" style={{ aspectRatio: `${f.imageSize?.[0] ?? 16} / ${f.imageSize?.[1] ?? 9}` }}>
          <img src={f.image} alt={f.imageAlt} className="h-full w-full object-cover" />
        </div>
      )}
      <p className="mt-5 leading-relaxed">{summary}</p>
      {f && (
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted">
          {f.highlights.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
      )}
      {f?.stats && (
        <dl className="mt-5 grid grid-cols-4 gap-3">
          {f.stats.map((s) => (
            <div key={s.label}>
              <dd className="display text-2xl font-bold">{s.value}</dd>
              <dt className="text-[11px] text-muted">{s.label}</dt>
            </div>
          ))}
        </dl>
      )}
      <ul className="mt-5 flex flex-wrap gap-1.5">
        {tech.map((t) => (
          <li key={t} className="chip">
            {t}
          </li>
        ))}
      </ul>
      <Links links={links} />
    </>
  );
};

const PlaceBody = ({ id }: { id: string }) => {
  const l = landmark(id);
  if (l.project) return <ProjectBody id={l.project} />;
  if (l.kind === 'experience')
    return (
      <>
        <p className="text-sm text-accent-fg">Hall of Work</p>
        <h2 className="display mt-1 text-4xl font-bold leading-none">Experience</h2>
        <ol className="mt-5 space-y-4">
          {experience.map((r) => (
            <li key={r.title + r.org}>
              <p className="font-mono text-xs text-faint">{r.period}</p>
              <p className="font-semibold">
                {r.title} <span className="font-normal text-muted">at {r.org}</span>
              </p>
              <p className="text-sm text-muted">{r.detail}</p>
            </li>
          ))}
        </ol>
        <Links links={[{ label: 'Resume (PDF)', href: profile.resume }]} />
      </>
    );
  if (l.kind === 'about' || l.kind === 'campus')
    return (
      <>
        <div className="flex items-center gap-4">
          <img src="/my-photo.webp" alt={profile.name} className="h-20 w-20 rounded-full bg-accent object-cover object-top" />
          <div>
            <p className="text-sm text-accent-fg">{l.kind === 'campus' ? 'NIET Campus' : "Yash's Place"}</p>
            <h2 className="display text-3xl font-bold leading-none">{profile.name}</h2>
          </div>
        </div>
        <p className="mt-5 leading-relaxed">
          I'm a CS student at NIET ({education.degree}, {education.period}) who spends most of the week shipping software
          people pay for. Founding engineer at SpeedoExpress, and I run Anvaya Labs, a small studio building platforms for
          local businesses.
        </p>
        <p className="mt-3 text-muted">
          The work I like best is the unglamorous middle of a system: tenant isolation that can't be bypassed, payments that
          settle exactly once, and a map that never shows a driver who left an hour ago.
        </p>
        <ul className="mt-4 space-y-1 text-sm">
          {recognition.map((r) => (
            <li key={r.what}>
              <span className="font-medium">{r.what}</span> <span className="text-muted">{r.where}</span>
            </li>
          ))}
        </ul>
        <Links links={[{ label: 'Resume (PDF)', href: profile.resume }, { label: 'LinkedIn', href: profile.linkedin }]} />
      </>
    );
  if (l.kind === 'contact')
    return (
      <>
        <p className="text-sm text-accent-fg">Post Office</p>
        <h2 className="display mt-1 text-4xl font-bold leading-none">Got something to build?</h2>
        <p className="mt-4 text-muted">Hiring for an internship, need a platform built, or want to talk about the city? Email is fastest.</p>
        <a href={`mailto:${profile.email}`} className="btn-primary mt-5 px-5 py-3">
          {profile.email} <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
        </a>
        <Links
          links={[
            { label: 'LinkedIn', href: profile.linkedin },
            { label: 'GitHub', href: profile.github, icon: 'gh' },
            { label: 'WhatsApp', href: profile.whatsapp },
            { label: 'Leave a message', href: '/#contact' },
          ]}
        />
      </>
    );
  return (
    <>
      <p className="text-sm text-accent-fg">{l.sub}</p>
      <h2 className="display mt-1 text-4xl font-bold leading-none">{l.name}</h2>
      <p className="mt-4 text-muted">Nothing to see here yet. Missions will send you back.</p>
    </>
  );
};

export interface CaseFileProps {
  /** A landmark id, or a mission completion (project id + lesson). */
  place?: string;
  mission?: { title: string; lesson: string; project: string; last: boolean };
  onClose: () => void;
  onNext?: () => void;
}

const CaseFile = ({ place, mission, onClose, onNext }: CaseFileProps) => (
  <div className="fixed inset-0 z-40 flex items-end justify-center bg-canvas/50 backdrop-blur-[2px] sm:items-center sm:p-6" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <div
      role="dialog"
      aria-modal="true"
      aria-label={mission ? `${mission.title} complete` : 'Case file'}
      className="relative max-h-[88dvh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-line bg-surface p-6 shadow-[0_30px_80px_-20px_rgb(0_0_0/0.8)] sm:rounded-2xl sm:p-8"
    >
      <button type="button" onClick={onClose} aria-label="Close" className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-sunken hover:text-ink">
        <X className="h-5 w-5" strokeWidth={1.75} />
      </button>
      {mission && (
        <div className="mb-6 mr-10 rounded-xl border border-accent/30 bg-accent/10 p-4">
          <p className="text-xs font-medium text-accent-fg">Mission complete: {mission.title}</p>
          <p className="mt-1.5 text-sm leading-relaxed">{mission.lesson}</p>
        </div>
      )}
      {mission ? <ProjectBody id={mission.project} /> : place ? <PlaceBody id={place} /> : null}
      <div className="mt-8 flex flex-wrap gap-3 border-t border-line pt-5">
        {mission && onNext && (
          <button type="button" onClick={onNext} className="btn-primary">
            {mission.last ? 'Finish' : 'Next mission'}
          </button>
        )}
        <button type="button" onClick={onClose} className="btn-ghost">
          Back to the city
        </button>
      </div>
    </div>
  </div>
);

export default CaseFile;
