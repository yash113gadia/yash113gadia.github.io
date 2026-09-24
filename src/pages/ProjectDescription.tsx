import { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { game } from '../game/store';
import { Link } from 'react-router-dom';
import Reveal from '../components/Reveal';
import ChatbotInline from '../components/ChatbotInline';
import { details } from '../data/architecture';

const ProjectDescription = () => {
  useEffect(() => game.unlock('under-the-hood'), []);
  return (
  <div className="page-x pb-24 pt-12 md:pt-16">
    <Link to="/#work" className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink">
      <ArrowLeft className="h-4 w-4" strokeWidth={2} /> Back to work
    </Link>
    <h1 className="display mt-8 max-w-[14ch] text-[clamp(2.8rem,7vw,5.5rem)] font-bold leading-[0.92]">
      How the projects work
    </h1>
    <p className="mt-5 max-w-[60ch] text-lg leading-relaxed text-muted">
      The architecture behind each system: what it had to do, how it is built, and what comes next.
    </p>

    <div className="mt-16 grid gap-12 lg:grid-cols-12">
      <nav aria-label="Projects on this page" className="hidden lg:col-span-3 lg:block">
        <ul className="sticky top-24 space-y-2 text-sm">
          {details.map((p) => (
            <li key={p.id}>
              <a href={`#${p.id}`} className="text-muted hover:text-ink">{p.title}</a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="space-y-20 lg:col-span-9">
        {details.map((p) => (
          <Reveal key={p.id}>
            <article id={p.id} className="scroll-mt-24">
              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">{p.title}</h2>
              <p className="mt-4 max-w-[68ch] text-[17px] leading-relaxed text-ink/90">{p.objective}</p>
              <ul className="mt-5 flex flex-wrap gap-1.5">
                {p.stack.split(', ').map((t) => (
                  <li key={t} className="chip">{t}</li>
                ))}
              </ul>

              <h3 className="mt-10 text-sm font-medium text-muted">Architecture</h3>
              <p className="mt-2 max-w-[68ch] leading-relaxed">{p.architecture}</p>

              <div className="mt-10 grid gap-8 rounded-xl bg-sunken p-6 md:grid-cols-2">
                <div>
                  <h3 className="text-sm font-medium text-muted">Why it matters</h3>
                  <p className="mt-2 text-[15px] leading-relaxed">{p.why}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted">Next</h3>
                  <p className="mt-2 text-[15px] leading-relaxed">{p.next}</p>
                </div>
              </div>
            </article>
          </Reveal>
        ))}

        <Reveal>
          <section aria-labelledby="ask" className="max-w-2xl">
            <h2 id="ask" className="text-2xl font-semibold tracking-tight">Ask a follow-up</h2>
            <p className="mt-2 text-muted">An assistant that has read the notes above.</p>
            <div className="mt-6">
              <ChatbotInline
                title="Architecture questions"
                placeholder="Ask about a design decision"
                mode="architecture"
                suggestedQuestions={[
                  'Why Redis TTLs for driver positions?',
                  "How is BiteSite's tenant isolation tested?",
                  'How is student code sandboxed?',
                ]}
              />
            </div>
          </section>
        </Reveal>
      </div>
    </div>
  </div>
);
};

export default ProjectDescription;
