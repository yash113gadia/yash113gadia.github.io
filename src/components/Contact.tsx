import { useState } from 'react';
import { ArrowUpRight, Check, Copy } from 'lucide-react';
import Reveal from './Reveal';
import RevealText from './RevealText';
import Magnetic from './Magnetic';
import { profile } from '../data/site';

const channels = [
  { label: 'LinkedIn', href: profile.linkedin },
  { label: 'GitHub', href: profile.github },
  { label: 'WhatsApp', href: profile.whatsapp },
];

const field =
  'w-full rounded-lg border border-line bg-canvas px-3.5 py-2.5 text-[15px] text-ink transition-colors focus:border-accent focus:outline-none';

const Contact = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    let result: { success: boolean; error?: string };
    try {
      // Firebase is loaded on demand so it stays out of the initial bundle.
      const { submitContactMessage } = await import('../services/firestore');
      // Firestore retries silently when it can't reach the server; give up after 12s instead of spinning.
      const timeout = new Promise<{ success: false; error: string }>((resolve) =>
        setTimeout(() => resolve({ success: false, error: 'This is taking too long. Please email me instead.' }), 12000),
      );
      result = await Promise.race([submitContactMessage(formData), timeout]);
    } catch {
      result = { success: false, error: 'Could not send right now. Please email me instead.' };
    }
    setIsSubmitting(false);

    if (result.success) {
      setSubmitStatus('success');
      setFormData({ name: '', email: '', message: '' });
    } else {
      setSubmitStatus('error');
      setErrorMessage(result.error || 'Something went wrong. Please try again.');
    }
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.location.href = `mailto:${profile.email}`;
    }
  };

  return (
    <section id="contact" className="border-t border-line">
      <div className="page-x py-24 md:py-32">
        <Reveal>
          <RevealText
            text="Got something to build?"
            accent={['build?']}
            className="display max-w-[12ch] text-[clamp(3.2rem,13vw,8.5rem)] font-bold leading-[0.88]"
          />
          <p className="mt-8 max-w-[46ch] text-lg text-muted">
            Hiring for an internship, need a platform built, or want to talk about one of these projects? Email is
            the fastest way to reach me.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Magnetic strength={0.15}>
              <a
                href={`mailto:${profile.email}`}
                className="btn-primary max-w-full px-6 py-4 text-[15px] sm:px-7 sm:text-lg"
              >
                {profile.email} <ArrowUpRight className="h-5 w-5" strokeWidth={2} />
              </a>
            </Magnetic>
            <button
              type="button"
              onClick={copyEmail}
              aria-label="Copy email address"
              className="grid h-12 w-12 place-items-center rounded-full border border-line text-muted transition-colors hover:text-ink"
            >
              {copied ? <Check className="h-4 w-4 text-accent-fg" strokeWidth={2} /> : <Copy className="h-4 w-4" strokeWidth={1.75} />}
            </button>
            <span className="sr-only" aria-live="polite">{copied ? 'Email copied' : ''}</span>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
            {channels.map((c) => (
              <li key={c.label}>
                <a
                  href={c.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink"
                >
                  {c.label}
                  <ArrowUpRight className="h-3.5 w-3.5 transition-colors group-hover:text-accent-fg" strokeWidth={2} />
                </a>
              </li>
            ))}
          </ul>
        </Reveal>

        <div className="mt-20 grid gap-8 lg:grid-cols-12">
        <Reveal className="lg:col-span-4">
          <h3 className="text-xl font-semibold tracking-tight">Or leave a message</h3>
          <p className="mt-2 text-muted">It lands in my inbox and I reply by email.</p>
        </Reveal>
        <Reveal delay={0.08} className="lg:col-span-8">
          <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-line bg-surface p-6 md:p-8">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="grid gap-2">
                <label htmlFor="name" className="text-sm font-medium">Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  maxLength={100}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={field}
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="email" className="text-sm font-medium">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={200}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={field}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <label htmlFor="message" className="text-sm font-medium">Message</label>
              <textarea
                id="message"
                name="message"
                required
                rows={5}
                maxLength={5000}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className={`${field} resize-y`}
              />
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <button type="submit" disabled={isSubmitting} className="btn-primary disabled:opacity-60">
                {isSubmitting ? 'Sending...' : 'Send message'}
              </button>
              <p role="status" className="text-sm">
                {submitStatus === 'success' && <span className="text-accent-fg">Sent. I'll reply by email.</span>}
                {submitStatus === 'error' && <span className="text-red-600 dark:text-red-400">{errorMessage}</span>}
              </p>
            </div>
          </form>
        </Reveal>
        </div>
      </div>
    </section>
  );
};

export default Contact;
