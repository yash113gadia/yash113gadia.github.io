import Reveal from './Reveal';
import RevealText from './RevealText';
import ChatbotInline from './ChatbotInline';
import { education, profile, recognition } from '../data/site';

const About = () => (
  <section id="about" className="border-t border-line bg-surface/40">
    <div className="page-x grid gap-12 py-24 md:py-32 lg:grid-cols-12">
      <Reveal className="lg:col-span-4">
        <div className="relative aspect-[4/5] max-w-[220px] overflow-hidden rounded-2xl bg-accent sm:max-w-[300px] lg:sticky lg:top-24 lg:mx-auto lg:max-w-[360px]">
          <img
            src="/my-photo.webp"
            alt={profile.name}
            width={1080}
            height={1595}
            loading="lazy"
            className="absolute inset-x-0 bottom-0 h-[94%] w-full object-cover object-top"
          />
        </div>
      </Reveal>

      <div className="lg:col-span-8">
        <Reveal>
          <RevealText text="About" className="display text-[clamp(3rem,9vw,5rem)] font-bold leading-[0.9]" />
          <div className="mt-8 max-w-[60ch] space-y-5 text-lg leading-relaxed">
            <p>
              I'm a CS student at NIET who spends most of the week shipping software that people pay for. Since 2026
              I've been the founding engineer at SpeedoExpress, and I run Anvaya Labs, a small studio that builds
              platforms for local businesses.
            </p>
            <p className="text-muted">
              The work I like best is the unglamorous middle of a system: tenant isolation that can't be bypassed,
              payments that settle exactly once, and a map that never shows a driver who left an hour ago.
            </p>
            <p className="text-muted">Based in {profile.location}. Open to internships and freelance projects.</p>
          </div>
        </Reveal>

        <Reveal className="mt-12 grid gap-10 sm:grid-cols-2">
          <div>
            <h3 className="text-sm font-medium text-muted">Education</h3>
            <p className="mt-3 text-lg font-medium">{education.degree}</p>
            <p className="mt-1 text-sm text-muted">
              {education.school}, {education.period}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted">Recognition</h3>
            <ul className="mt-3 space-y-3">
              {recognition.map((r) => (
                <li key={r.what}>
                  <p className="text-lg font-medium">{r.what}</p>
                  <p className="text-sm text-muted">{r.where}</p>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        <Reveal className="mt-14">
          <ChatbotInline />
        </Reveal>
      </div>
    </div>
  </section>
);

export default About;
