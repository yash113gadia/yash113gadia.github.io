import { motion } from 'framer-motion';
import { ArrowDown, Github, Linkedin, Mail } from 'lucide-react';
import { FloatingCodeSymbols, FloatingOrbs, ParticleField, AnimatedGrid } from './FloatingElements';
import Typewriter from './Typewriter';

const Hero = () => {
  return (
    <section className="min-h-screen flex flex-col justify-center px-6 md:px-12 lg:px-24 py-20 relative overflow-hidden">
      {/* Animated background elements */}
      <AnimatedGrid />
      <FloatingOrbs />
      <ParticleField />
      <FloatingCodeSymbols />
      
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-violet-500/5 pointer-events-none" />
      
      <div className="max-w-6xl mx-auto w-full relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 lg:gap-12">
          {/* Mobile Profile Photo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex lg:hidden justify-center mb-6"
          >
            <div className="relative">
              {/* Glowing background effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/30 via-violet-500/20 to-emerald-500/30 rounded-full blur-2xl scale-110" />
              {/* Rotating border */}
              <div className="absolute -inset-1.5 bg-gradient-to-r from-emerald-500 via-violet-500 to-emerald-500 rounded-full opacity-50 animate-spin-slow" style={{ animationDuration: '8s' }} />
              {/* Photo container */}
              <div className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-full overflow-hidden border-4 border-neutral-800 bg-neutral-900">
                <img
                  src="/my-photo.png"
                  alt="Yash Gadia"
                  className="w-full h-full object-cover object-top scale-110"
                />
              </div>

              {/* Floating badges - Mobile */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -right-16 sm:-right-20 top-2 px-3 py-1.5 bg-neutral-900/90 backdrop-blur-sm border border-neutral-700 rounded-full shadow-xl"
              >
                <span className="text-emerald-400 font-semibold text-xs">Full-Stack Dev</span>
              </motion.div>

              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute -left-16 sm:-left-20 bottom-4 px-3 py-1.5 bg-neutral-900/90 backdrop-blur-sm border border-neutral-700 rounded-full shadow-xl"
              >
                <span className="text-violet-400 font-semibold text-xs">Co-Founder @ Qlaa</span>
              </motion.div>
            </div>
          </motion.div>

          {/* Left side - Text content */}
          <div className="flex-1 lg:max-w-[60%] text-center lg:text-left">
            {/* Status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center justify-center lg:justify-start gap-3 mb-6 lg:mb-8"
            >
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-neutral-400 text-sm font-medium">Available for opportunities</span>
            </motion.div>

            {/* Main heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-4 lg:mb-6"
            >
              <span className="text-white">Hi, I'm </span>
              <span className="text-emerald-400">Yash</span>
              <span className="text-neutral-600">.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-neutral-400 max-w-3xl mx-auto lg:mx-0 mb-6 lg:mb-8 leading-relaxed"
            >
          Full-Stack Developer building{' '}
          <Typewriter
            words={['marketplace platforms', 'scalable applications', 'AI-powered tools', 'seamless user experiences']}
            className="text-white"
          />
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-base lg:text-lg text-neutral-500 max-w-2xl mx-auto lg:mx-0 mb-8 lg:mb-12 hidden sm:block"
        >
          Passionate about building products that solve real problems.
          I specialize in <span className="text-emerald-400 font-medium">Next.js</span>, <span className="text-emerald-400 font-medium">Node.js</span>, and <span className="text-emerald-400 font-medium">PostgreSQL</span>.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col sm:flex-row justify-center lg:justify-start gap-3 sm:gap-4 mb-10 lg:mb-16"
        >
          <a
            href="#projects"
            className="px-6 sm:px-8 py-3 sm:py-4 bg-white text-black font-semibold rounded-full hover:bg-emerald-400 hover:text-black transition-all duration-300 text-center"
          >
            View My Work
          </a>
          <a
            href="#contact"
            className="px-6 sm:px-8 py-3 sm:py-4 border border-neutral-700 text-white font-semibold rounded-full hover:border-neutral-500 hover:bg-neutral-900 transition-all duration-300 text-center"
          >
            Get In Touch
          </a>
        </motion.div>

        {/* Social Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex justify-center lg:justify-start gap-4"
        >
          {[
            { icon: Github, href: "https://github.com/yash113gadia", label: "GitHub" },
            { icon: Linkedin, href: "https://linkedin.com/in/yashgadia", label: "LinkedIn" },
            { icon: Mail, href: "mailto:yash113gadia@gmail.com", label: "Email" },
          ].map((social) => (
            <a
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-full border border-neutral-800 text-neutral-500 hover:text-white hover:border-neutral-600 hover:bg-neutral-900 transition-all duration-300"
            >
              <social.icon className="w-5 h-5" />
            </a>
          ))}
        </motion.div>
          </div>

          {/* Right side - Profile Photo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="hidden lg:flex flex-1 justify-center items-center"
          >
            <div className="relative">
              {/* Glowing background effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/30 via-violet-500/20 to-emerald-500/30 rounded-full blur-3xl scale-110" />

              {/* Rotating border */}
              <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500 via-violet-500 to-emerald-500 rounded-full opacity-50 animate-spin-slow" style={{ animationDuration: '8s' }} />

              {/* Photo container */}
              <div className="relative w-72 h-72 xl:w-80 xl:h-80 rounded-full overflow-hidden border-4 border-neutral-800 bg-neutral-900">
                <img
                  src="/my-photo.png"
                  alt="Yash Gadia"
                  className="w-full h-full object-cover object-top scale-110"
                />
              </div>

              {/* Floating badges */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -right-4 top-8 px-4 py-2 bg-neutral-900/90 backdrop-blur-sm border border-neutral-700 rounded-full shadow-xl"
              >
                <span className="text-emerald-400 font-semibold text-sm">Full-Stack Dev</span>
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute -left-4 bottom-12 px-4 py-2 bg-neutral-900/90 backdrop-blur-sm border border-neutral-700 rounded-full shadow-xl"
              >
                <span className="text-violet-400 font-semibold text-sm">Co-Founder @ Qlaa</span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator - hidden on mobile */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="hidden sm:flex absolute bottom-8 lg:bottom-12 left-1/2 -translate-x-1/2 flex-col items-center gap-2"
      >
        <span className="text-xs text-neutral-600 uppercase tracking-widest">Scroll</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <ArrowDown className="w-4 h-4 text-neutral-600" />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Hero;
