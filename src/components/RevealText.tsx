import { motion, useInView, useReducedMotion } from 'framer-motion';
import { Fragment, useRef, type ElementType } from 'react';

// Headings whose words rise out of a mask as they scroll into view.
// `accent` words (matched case-sensitively) get the accent colour.
const RevealText = ({
  text,
  as: Tag = 'h2',
  className,
  accent = [],
  id,
}: {
  text: string;
  as?: ElementType;
  className?: string;
  accent?: string[];
  id?: string;
}) => {
  const reduce = useReducedMotion();
  // Watch the heading, not the words: masked words sit outside their clip box, so the
  // browser reports them as never visible.
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const words = text.split(' ');
  return (
    <Tag ref={ref} id={id} aria-label={text} className={className}>
      {words.map((word, i) => (
        <Fragment key={i}>
          {i > 0 && ' '}
          <span aria-hidden className="inline-block overflow-hidden pb-[0.1em] align-bottom">
            <motion.span
              className={`inline-block ${accent.includes(word) ? 'text-accent-fg' : ''}`}
              initial={reduce ? false : { y: '110%' }}
              animate={reduce || inView ? { y: 0 } : { y: '110%' }}
              transition={{ duration: 0.9, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
            >
              {word}
            </motion.span>
          </span>
        </Fragment>
      ))}
    </Tag>
  );
};

export default RevealText;
