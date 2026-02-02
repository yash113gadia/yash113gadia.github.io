import { Mail, MapPin, Send, Github, Linkedin, ArrowUpRight, CheckCircle, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { submitContactMessage } from '../services/firestore';

const socialLinks = [
  {
    name: "GitHub",
    url: "https://github.com/yash113gadia",
    icon: Github,
    handle: "@yash113gadia"
  },
  {
    name: "LinkedIn",
    url: "https://linkedin.com/in/yashgadia",
    icon: Linkedin,
    handle: "Yash Gadia"
  }
];

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    const result = await submitContactMessage(formData);

    setIsSubmitting(false);

    if (result.success) {
      setSubmitStatus('success');
      setFormData({ name: '', email: '', message: '' });
      // Reset success message after 5 seconds
      setTimeout(() => setSubmitStatus('idle'), 5000);
    } else {
      setSubmitStatus('error');
      setErrorMessage(result.error || 'Something went wrong. Please try again.');
    }
  };

  return (
    <section id="contact" className="py-24 px-6 md:px-12 lg:px-24">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16 animate-fade-in-up">
          <span className="text-emerald-400 font-mono text-sm">04.</span>
          <h2 className="text-3xl md:text-5xl font-bold text-white mt-2 mb-4">Get In Touch</h2>
          <p className="text-neutral-400 max-w-lg mx-auto">
            I'm currently looking for new opportunities. Whether you have a question or just want to say hi, I'll try my best to get back to you!
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Contact Form */}
          <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm text-neutral-400 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-neutral-900/50 border border-neutral-800 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm text-neutral-400 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-neutral-900/50 border border-neutral-800 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm text-neutral-400 mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                  rows={5}
                  className="w-full px-4 py-3 bg-neutral-900/50 border border-neutral-800 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all resize-none"
                  placeholder="Your message here..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span>Sending...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Message</span>
                  </>
                )}
              </button>

              {/* Status Messages */}
              {submitStatus === 'success' && (
                <div className="flex items-center gap-2 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  <span>Message sent successfully! I'll get back to you soon.</span>
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </form>
          </div>

          {/* Contact Info */}
          <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            {/* Quick Contact Cards */}
            <div className="grid gap-4">
              <a
                href="mailto:yash@example.com"
                className="bento-card group flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                  <Mail className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-neutral-500">Email</p>
                  <p className="text-white group-hover:text-emerald-400 transition-colors">yash113gadia@gmail.com</p>
                </div>
                <ArrowUpRight className="w-5 h-5 text-neutral-600 group-hover:text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
              </a>

              <div className="bento-card flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Location</p>
                  <p className="text-white">Greater Noida, India</p>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="bento-card">
              <h3 className="text-sm text-neutral-500 mb-4">Connect with me</h3>
              <div className="space-y-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-3 -mx-3 rounded-xl hover:bg-neutral-800/50 transition-colors group"
                  >
                    <social.icon className="w-5 h-5 text-neutral-400 group-hover:text-white transition-colors" />
                    <div className="flex-1">
                      <p className="text-white group-hover:text-emerald-400 transition-colors">{social.name}</p>
                      <p className="text-sm text-neutral-500">{social.handle}</p>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-neutral-600 group-hover:text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                  </a>
                ))}
              </div>
            </div>

            {/* CTA Card */}
            <div className="bento-card bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20">
              <p className="text-white font-medium mb-2">Open to opportunities</p>
              <p className="text-sm text-neutral-400">
                I'm currently seeking full-stack development internships where I can contribute to meaningful projects and grow as a developer.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-24 pt-8 border-t border-neutral-800 text-center animate-fade-in-up">
          <p className="text-neutral-500 text-sm">
            Designed & Built by{' '}
            <span className="text-emerald-400">Yash Gadia</span>
          </p>
          <p className="text-neutral-600 text-xs mt-2">
            © {new Date().getFullYear()} All rights reserved.
          </p>
        </footer>
      </div>
    </section>
  );
};

export default Contact;
