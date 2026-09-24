import { stack } from '../data/site';

// The page's one marquee: the stack, as big outlined type.
const words = stack.flatMap((s) => s.items);

const StackMarquee = () => (
  <section aria-label="Technologies" className="overflow-hidden border-y border-line py-8 md:py-10">
    <div className="animate-marquee flex w-max gap-10 whitespace-nowrap motion-reduce:flex-wrap motion-reduce:whitespace-normal">
      {[0, 1].map((copy) => (
        <ul key={copy} aria-hidden={copy === 1} className="flex gap-10">
          {words.map((w, i) => (
            <li
              key={w}
              className={`display text-5xl font-bold md:text-7xl ${i % 3 === 0 ? 'text-accent-fg' : 'text-transparent [-webkit-text-stroke:1px_rgb(var(--muted))]'}`}
            >
              {w}
            </li>
          ))}
        </ul>
      ))}
    </div>
  </section>
);

export default StackMarquee;
