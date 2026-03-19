import { motion, useInView } from 'framer-motion';
import { Calendar, Trophy, GraduationCap, Rocket, Code, Briefcase, Shield, Gamepad2 } from 'lucide-react';
import { useRef } from 'react';

const experiences = [
  {
    title: "Innovate Bharat Hackathon",
    company: "Team Ctrl+Alt+Diablo",
    date: "2026",
    description: "Built Attestr — a decentralized media authenticator with Solidity smart contracts, AI deepfake detection, Error Level Analysis, perceptual hashing, a Chrome extension, and a REST API.",
    tags: ["Solidity", "Web3", "AI Detection", "Chrome Extension"],
    icon: Shield,
    color: "from-emerald-500 to-green-500"
  },
  {
    title: "Web Developer Intern",
    company: "SpeedoExpress",
    date: "2026 - Present",
    description: "Building the production marketing website and internal tools for a logistics startup using Next.js 16, React 19, and Tailwind CSS v4. Live at speedoexpress.org.",
    tags: ["Next.js", "React 19", "Tailwind v4", "Internship"],
    icon: Briefcase,
    color: "from-orange-500 to-amber-500"
  },
  {
    title: "Creator — CodePilot CLI",
    company: "Open Source",
    date: "2025 - Present",
    description: "Built and published an AI coding agent CLI on NPM with multi-provider LLM support (Anthropic, OpenAI, Google, Ollama), parallel sub-agents, plan mode, and file tracking.",
    tags: ["TypeScript", "AI SDK", "CLI", "Open Source"],
    icon: Code,
    color: "from-sky-500 to-cyan-500"
  },
  {
    title: "Freelance Game Developer",
    company: "Roblox Platform",
    date: "",
    description: "Freelance game development on Roblox — built game mechanics, scripted gameplay systems in Lua, and worked with clients on commissions and custom game projects.",
    tags: ["Lua", "Roblox", "Game Dev", "Freelance"],
    icon: Gamepad2,
    color: "from-red-500 to-pink-500"
  },
  {
    title: "Co-Founder & Lead Developer",
    company: "Qlaa (ArtistConnect)",
    date: "2024 - Present",
    description: "Architecting a hyper-local marketplace with booking systems, real-time communication via Socket.io, GEO-based filtering, and secure JWT APIs. Building for scale.",
    tags: ["MERN", "TypeScript", "Socket.io", "PostgreSQL"],
    icon: Rocket,
    color: "from-cyan-500 to-blue-500"
  },
  {
    title: "Top 43 Finalist",
    company: "MIT Pune Startup Event",
    date: "2023 - 2024",
    description: "Selected from 500+ entries for Impact Career Solution — an AI-powered career guidance platform. Pitched to investors and gained market validation experience.",
    tags: ["Startup", "AI Mentorship", "Pitching"],
    icon: Trophy,
    color: "from-amber-500 to-orange-500"
  },
  {
    title: "Debate Champion",
    company: "Voice & Verdict | Le Discourse",
    date: "2023 - 2024",
    description: "1st Rank in 'Voice & Verdict' (54 teams) and 'Le Discourse 2' socio-political debate. MUN delegate representing Sweden (UNHRC) and West Bengal CM (AIPPM).",
    tags: ["Public Speaking", "Critical Thinking", "Leadership"],
    icon: Trophy,
    color: "from-violet-500 to-purple-500"
  },
  {
    title: "Integrated B.Tech + M.Tech",
    company: "NIET, Greater Noida",
    date: "2024 - 2029",
    description: "Dual degree in Computer Science Engineering. Focusing on full-stack development, database design, and AI integration with a strong foundation in DSA.",
    tags: ["CSE", "Full Stack", "AI Integration"],
    icon: GraduationCap,
    color: "from-pink-500 to-rose-500"
  }
];

const Journey = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="journey" className="py-12 overflow-hidden relative">
      {/* Background */}
      <div className="absolute top-0 left-1/2 w-[800px] h-[800px] bg-violet-500/5 rounded-full blur-[200px] -translate-x-1/2" />
      
      <div className="container mx-auto px-6 relative z-10" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-10 text-center"
        >
          <span className="text-cyan-400 font-mono text-sm tracking-wider">{'// My Journey'}</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-3">
            <span className="text-white">Experience & </span>
            <span className="text-gradient-accent">Milestones</span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto font-light text-sm">
            My professional path in software development and entrepreneurship.
          </p>
        </motion.div>

        <div className="relative max-w-4xl mx-auto">
          {/* Central Animated Line */}
          <motion.div 
            className="absolute left-1/2 transform -translate-x-1/2 w-px h-full"
            style={{
              background: 'linear-gradient(180deg, transparent 0%, rgba(6,182,212,0.5) 10%, rgba(139,92,246,0.5) 50%, rgba(236,72,153,0.5) 90%, transparent 100%)',
            }}
            initial={{ scaleY: 0 }}
            animate={isInView ? { scaleY: 1 } : {}}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />

          {experiences.map((exp, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 + index * 0.15 }}
              className={`relative flex items-center justify-between mb-10 last:mb-0 ${
                index % 2 === 0 ? 'flex-row-reverse' : ''
              }`}
            >
              {/* Spacer */}
              <div className="w-5/12 hidden md:block" />

              {/* Center Icon */}
              <div className="absolute left-1/2 transform -translate-x-1/2 z-20">
                <motion.div 
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${exp.color} p-0.5 shadow-lg`}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <div className="w-full h-full rounded-[10px] bg-slate-900 flex items-center justify-center">
                    <exp.icon className="w-4 h-4 text-white" />
                  </div>
                </motion.div>
                {/* Pulse Ring */}
                <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${exp.color} opacity-30 animate-ping`} style={{ animationDuration: '3s' }} />
              </div>

              {/* Content Card */}
              <div className="w-full md:w-5/12">
                <motion.div 
                  className="group glass-scifi p-5 rounded-2xl hover:border-cyan-500/30 transition-all duration-500"
                  whileHover={{ y: -5 }}
                >
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`h-1 w-6 rounded-full bg-gradient-to-r ${exp.color}`} />
                    <span className="text-xs font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400">
                      {exp.company}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-bold mb-1 text-white group-hover:text-cyan-400 transition-colors">
                    {exp.title}
                  </h3>
                  
                  <div className="flex items-center gap-2 text-slate-500 text-[10px] mb-3 uppercase tracking-wider font-medium">
                    <Calendar size={12} />
                    <span>{exp.date}</span>
                  </div>
                  
                  <p className="text-slate-400 text-xs mb-3 leading-relaxed font-light">
                    {exp.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-1.5">
                    {exp.tags.map((tag, i) => (
                      <span 
                        key={i} 
                        className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800/50 border border-slate-700/50 text-slate-300 group-hover:border-cyan-500/20 transition-colors"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Journey;
