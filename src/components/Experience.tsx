import { useRef } from 'react';
import { motion, useReducedMotion, useScroll } from 'framer-motion';
import Reveal from './Reveal';
import RevealText from './RevealText';
import { experience } from '../data/site';

const Experience = () => {
  const listRef = useRef<HTMLOListElement>(null);
  const reduce = useReducedMotion();
  // The timeline rule draws itself as the list scrolls past.
  const { scrollYProgress } = useScroll({ target: listRef, offset: ['start 75%', 'end 60%'] });

  return (
    <section id="experience" className="page-x grid gap-12 py-24 md:py-32 lg:grid-cols-12">
      <Reveal className="min-w-0 [container-type:inline-size] lg:col-span-4">
        <div className="lg:sticky lg:top-28">
          <RevealText text="Experience" className="display text-[min(5rem,19cqi)] font-bold leading-[0.9]" />
        </div>
      </Reveal>
      <ol ref={listRef} className="relative space-y-12 pl-8 lg:col-span-8">
        <span aria-hidden className="absolute left-0 top-2 h-[calc(100%-1rem)] w-px bg-line" />
        <motion.span
          aria-hidden
          style={reduce ? undefined : { scaleY: scrollYProgress }}
          className="absolute left-0 top-2 h-[calc(100%-1rem)] w-px origin-top bg-accent"
        />
        {experience.map((r, i) => (
          <Reveal as="li" key={`${r.org}-${r.title}`} delay={i * 0.04} className="relative">
            <span aria-hidden className="absolute -left-8 top-2 h-2 w-2 -translate-x-1/2 rounded-full border border-accent bg-canvas" />
            <p className="font-mono text-sm text-faint">{r.period}</p>
            <h3 className="mt-1 text-xl font-semibold tracking-tight md:text-2xl">
              {r.title} <span className="font-normal text-muted">at {r.org}</span>
            </h3>
            <p className="mt-2 max-w-[60ch] leading-relaxed text-muted">{r.detail}</p>
          </Reveal>
        ))}
      </ol>
    </section>
  );
};

export default Experience;
