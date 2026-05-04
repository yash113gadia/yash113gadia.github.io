import { motion, useScroll, useTransform, MotionValue } from 'framer-motion';
import { useRef } from 'react';

interface TextRevealProps {
  text: string;
  className?: string;
}

// Reveal text as you scroll - each word appears
export const ScrollTextReveal = ({ text, className = '' }: TextRevealProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 0.95', 'start 0.6'],
  });

  const words = text.split(' ');

  return (
    <div ref={containerRef} className={`flex flex-wrap ${className}`}>
      {words.map((word, i) => {
        const start = i / words.length;
        const end = start + 1 / words.length;
        return (
          <Word key={i} progress={scrollYProgress} range={[start, end]}>
            {word}
          </Word>
        );
      })}
    </div>
  );
};

const Word = ({
  children,
  progress,
  range,
}: {
  children: string;
  progress: MotionValue<number>;
  range: [number, number];
}) => {
  const opacity = useTransform(progress, range, [0.2, 1]);
  const y = useTransform(progress, range, [20, 0]);

  return (
    <motion.span
      className="mr-[0.25em] inline-block"
      style={{ opacity, y }}
    >
      {children}
    </motion.span>
  );
};

// Character by character reveal on scroll
export const CharacterReveal = ({ text, className = '' }: TextRevealProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 0.9', 'start 0.4'],
  });

  const characters = text.split('');

  return (
    <div ref={containerRef} className={className}>
      {characters.map((char, i) => {
        const start = i / characters.length;
        const end = start + 1 / characters.length;
        
        return (
          <Character key={i} char={char} progress={scrollYProgress} range={[start, end]} />
        );
      })}
    </div>
  );
};

const Character = ({ 
  char, 
  progress, 
  range 
}: { 
  char: string; 
  progress: MotionValue<number>; 
  range: [number, number] 
}) => {
  const opacity = useTransform(progress, range, [0.1, 1]);
  
  return (
    <motion.span
      style={{ opacity }}
      className="inline-block"
    >
      {char === ' ' ? '\u00A0' : char}
    </motion.span>
  );
};

// Mask reveal effect - text reveals from behind a mask
export const MaskReveal = ({ text, className = '' }: TextRevealProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 0.9', 'start 0.5'],
  });

  const clipPath = useTransform(
    scrollYProgress,
    [0, 1],
    ['inset(0 100% 0 0)', 'inset(0 0% 0 0)']
  );

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Background text (dimmed) */}
      <span className="text-neutral-800">{text}</span>
      {/* Revealed text */}
      <motion.span
        className="absolute inset-0 text-white"
        style={{ clipPath }}
      >
        {text}
      </motion.span>
    </div>
  );
};
