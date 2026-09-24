import { ArrowUpRight } from 'lucide-react';
import Reveal from '../components/Reveal';
import { profile } from '../data/site';

const offerings = [
  {
    title: 'AI agents and automation',
    description:
      'Building agent tools like CodePilot: LLM orchestration, tool schemas, parallel sub-agents, and making them useful rather than impressive.',
  },
  {
    title: 'Real-time systems',
    description:
      'What live driver tracking at SpeedoExpress taught me: Redis TTLs for ephemeral state, WebSocket and SSE push, PostGIS queries, payments that survive a dropped connection.',
  },
  {
    title: 'Web3 and media security',
    description: 'From the Attestr build: Solidity basics, perceptual hashing, and verifying media without trusting the operator.',
  },
  {
    title: 'Full-stack architecture',
    description: 'Schema design in PostgreSQL and MySQL, multi-tenancy, migrations, and APIs that hold up with real users on them.',
  },
];

const bookHref = `${profile.whatsapp}?text=${encodeURIComponent("Hi Yash, I'm interested in a mentorship session.")}`;

const Mentor = () => (
  <div className="page-x pb-24 pt-12 md:pt-20">
    <Reveal>
      <h1 className="display max-w-[14ch] text-[clamp(2.8rem,7vw,5.5rem)] font-bold leading-[0.92]">
        One-on-one mentorship
      </h1>
      <p className="mt-5 max-w-[56ch] text-lg leading-relaxed text-muted">
        Sessions for students and early developers who want to build and ship real systems, based on the work on
        this site.
      </p>
      <a href={bookHref} target="_blank" rel="noopener noreferrer" className="btn-primary mt-8">
        Book a session <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
      </a>
    </Reveal>

    <div className="mt-20 grid gap-x-12 gap-y-10 md:grid-cols-2">
      {offerings.map((o, i) => (
        <Reveal key={o.title} delay={(i % 2) * 0.06} className="border-t border-line pt-6">
          <h2 className="text-xl font-semibold tracking-tight">{o.title}</h2>
          <p className="mt-2 leading-relaxed text-muted">{o.description}</p>
        </Reveal>
      ))}
    </div>
  </div>
);

export default Mentor;
