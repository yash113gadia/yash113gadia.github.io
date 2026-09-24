import { useState } from 'react';
import { Command, Menu, X } from 'lucide-react';
import { openPalette } from '../game/store';
import { Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { profile } from '../data/site';

const navLinks = [
  { name: 'Work', href: '/#work' },
  { name: 'Experience', href: '/#experience' },
  { name: 'About', href: '/#about' },
  { name: 'Contact', href: '/#contact' },
  { name: 'Play the game', href: '/play' },
];

const Navigation = () => {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-canvas/85 backdrop-blur-md">
      <nav className="page-x flex h-16 items-center justify-between">
        <Link to="/" onClick={() => setOpen(false)} className="text-[15px] font-semibold tracking-tight">
          {profile.name}
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="rounded-full px-3 py-1.5 text-sm text-muted transition-colors hover:text-ink"
            >
              {link.name}
            </a>
          ))}
          <span className="mx-2 h-5 w-px bg-line" aria-hidden />
          <button
            type="button"
            onClick={openPalette}
            aria-label="Open command palette"
            className="flex h-9 items-center gap-1.5 rounded-full px-2.5 text-muted transition-colors hover:bg-sunken hover:text-ink"
          >
            <Command className="h-3.5 w-3.5" strokeWidth={1.75} />
            <span className="font-mono text-xs">K</span>
          </button>
          <ThemeToggle />
          <a href={profile.resume} className="btn-ghost ml-1 px-4 py-1.5">
            Resume
          </a>
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="grid h-9 w-9 place-items-center rounded-full text-ink hover:bg-sunken"
          >
            {open ? <X className="h-5 w-5" strokeWidth={1.75} /> : <Menu className="h-5 w-5" strokeWidth={1.75} />}
          </button>
        </div>
      </nav>

      {open && (
        <div id="mobile-menu" className="border-t border-line bg-canvas md:hidden">
          <div className="page-x flex flex-col py-3">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setOpen(false)}
                className="py-3 text-base text-ink"
              >
                {link.name}
              </a>
            ))}
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                openPalette();
              }}
              className="py-3 text-left text-base text-ink"
            >
              Command palette
            </button>
            <a href={profile.resume} onClick={() => setOpen(false)} className="py-3 text-base text-accent-fg">
              Resume (PDF)
            </a>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navigation;
