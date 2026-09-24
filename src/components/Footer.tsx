import { motion, useReducedMotion } from 'framer-motion';
import { profile } from '../data/site';

const Footer = () => {
  const reduce = useReducedMotion();
  return (
    <footer className="overflow-hidden border-t border-line">
      <div className="page-x flex flex-col gap-3 pt-10 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} {profile.name}. Built by hand with React and canvas.</p>
        <div className="flex gap-5">
          <a href={profile.github} target="_blank" rel="noopener noreferrer" className="hover:text-ink">GitHub</a>
          <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-ink">LinkedIn</a>
          <a href={`mailto:${profile.email}`} className="hover:text-ink">Email</a>
        </div>
      </div>
      {/* Closing wordmark, rising into view. Sized to span the page width. */}
      <div aria-hidden className="page-x [container-type:inline-size]">
        <motion.p
          initial={reduce ? false : { y: '30%', opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="display select-none whitespace-nowrap bg-gradient-to-b from-ink/90 to-ink/10 bg-clip-text pb-[0.12em] pt-6 text-[18.4cqi] font-bold leading-[0.9] text-transparent"
        >
          {profile.name}
        </motion.p>
      </div>
    </footer>
  );
};

export default Footer;
