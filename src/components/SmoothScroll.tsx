import { useEffect } from 'react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

// Gentle momentum scrolling. Skipped entirely under reduced motion.
const SmoothScroll = ({ enabled = true }: { enabled?: boolean }) => {
  useEffect(() => {
    if (!enabled || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const lenis = new Lenis({ autoRaf: true, lerp: 0.11, anchors: { offset: -72 }, stopInertiaOnNavigate: true });
    return () => lenis.destroy();
  }, [enabled]);
  return null;
};

export default SmoothScroll;
