import { Calendar, Trophy, GraduationCap, Rocket, Code, Briefcase, Shield, Gamepad2 } from 'lucide-react';
import { useRef } from 'react';

const experiences = [
  {
    title: "Innovate Bharat Hackathon",
    company: "Team Ctrl+Alt+Diablo",
    date: "2026",
    description: "Built Attestr — a decentralized media authenticator with Solidity smart contracts, AI deepfake detection, Error Level Analysis, perceptual hashing, a Chrome extension, and a REST API.",
    tech: ["Solidity", "Web3", "AI Detection", "Chrome Extension"],
    icon: Shield,
    color: "emerald",
    size: "md:col-span-2 lg:col-span-2",
  },
  {
    title: "Web Developer Intern",
    company: "SpeedoExpress",
    date: "2026 - Present",
    description: "Building the production marketing website and internal tools for a logistics startup using Next.js 16, React 19, and Tailwind CSS v4. Live at speedoexpress.org.",
    tech: ["Next.js", "React 19", "Tailwind v4", "Internship"],
    icon: Briefcase,
    color: "amber",
    size: "md:col-span-1 lg:col-span-1",
  },
  {
    title: "Creator — CodePilot CLI",
    company: "Open Source",
    date: "2026",
    description: "Built and published an AI coding agent CLI on NPM with multi-provider LLM support (Anthropic, OpenAI, Google, Ollama), parallel sub-agents, plan mode, and file tracking.",
    tech: ["TypeScript", "AI SDK", "CLI", "Open Source"],
    icon: Code,
    color: "sky",
    size: "md:col-span-2 lg:col-span-2",
  },
  {
    title: "Freelance Game Developer",
    company: "Roblox Platform",
    date: "2025",
    description: "Freelance game development on Roblox — built game mechanics, scripted gameplay systems in Lua, and worked with clients on commissions and custom game projects.",
    tech: ["Lua", "Roblox", "Game Dev", "Freelance"],
    icon: Gamepad2,
    color: "rose",
    size: "md:col-span-1 lg:col-span-1",
  },
  {
    title: "Co-Founder & Lead Developer",
    company: "Qlaa (ArtistConnect)",
    date: "2024",
    description: "Architecting a hyper-local marketplace with booking systems, real-time communication via Socket.io, GEO-based filtering, and secure JWT APIs. Building for scale.",
    tech: ["MERN", "TypeScript", "Socket.io", "PostgreSQL"],
    icon: Rocket,
    color: "cyan",
    size: "md:col-span-1 lg:col-span-1",
  },
  {
    title: "Top 43 Finalist",
    company: "MIT Pune Startup Event",
    date: "2025",
    description: "Selected from 500+ entries for Impact Career Solution — an AI-powered career guidance platform. Pitched to investors and gained market validation experience.",
    tech: ["Startup", "AI Mentorship", "Pitching"],
    icon: Trophy,
    color: "amber",
    size: "md:col-span-1 lg:col-span-1",
  },
  {
    title: "Debate Champion",
    company: "Voice & Verdict | Le Discourse",
    date: "2024 - 2025",
    description: "1st Rank in 'Voice & Verdict' (54 teams) and 'Le Discourse 2' socio-political debate. MUN delegate representing Sweden (UNHRC) and West Bengal CM (AIPPM).",
    tech: ["Public Speaking", "Critical Thinking", "Leadership"],
    icon: Trophy,
    color: "violet",
    size: "md:col-span-1 lg:col-span-1",
  },
  {
    title: "Integrated B.Tech + M.Tech",
    company: "NIET, Greater Noida",
    date: "2024 - 2029",
    description: "Dual degree in Computer Science Engineering. Focusing on full-stack development, database design, and AI integration with a strong foundation in DSA.",
    tech: ["CSE", "Full Stack", "AI Integration"],
    icon: GraduationCap,
    color: "rose",
    size: "md:col-span-3 lg:col-span-3",
  }
];

const Journey = () => {
  const ref = useRef(null);

  return (
    <section id="journey" className="py-24 px-6 md:px-12 lg:px-24">
      <div className="max-w-7xl mx-auto" ref={ref}>
        {/* Section Header */}
        <div className="mb-16 animate-fade-in-up">
          <span className="text-emerald-400 font-mono text-sm">04.</span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mt-2">Professional Journey</h2>
        </div>

        {/* Timeline Flow Container */}
        <div className="relative max-w-7xl mx-auto">
          {/* Vertical Connecting Line */}
          <div className="absolute left-[-1.5rem] md:left-[-2rem] top-0 bottom-0 w-[2px] hidden md:block">
            <div className="h-full w-full bg-gradient-to-b from-emerald-500/50 via-sky-500/50 to-violet-500/50 rounded-full" />
            
            {/* Pulsing Indicators on the line */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.5)] animate-pulse" />
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-sky-400 opacity-50" />
            <div className="absolute top-2/4 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-violet-400 opacity-50" />
            <div className="absolute top-3/4 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-rose-400 opacity-50" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-violet-400 shadow-[0_0_15px_rgba(167,139,250,0.5)] animate-pulse" />
          </div>

          {/* Bento Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
            {experiences.map((exp, index) => (
              <div
                key={index}
                className={`bento-card group animate-fade-in-up flex flex-col ${exp.size}`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* Connecting Horizontal Branch (Desktop Only) */}
                <div className="absolute left-[-2rem] top-12 w-8 h-[2px] bg-neutral-800 hidden md:block group-hover:bg-emerald-500/30 transition-colors duration-500" />
                
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl bg-${exp.color}-500/10 flex items-center justify-center transition-transform duration-500 group-hover:scale-110`}>
                    <exp.icon className={`w-5 h-5 text-${exp.color}-400`} />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-neutral-600 font-mono">
                      <Calendar size={12} />
                      <span>{exp.date}</span>
                    </div>
                  </div>
                </div>

                <div className="flex-grow">
                  <h4 className={`text-lg font-semibold text-white mb-1 group-hover:text-${exp.color}-400 transition-colors`}>
                    {exp.title}
                  </h4>
                  <p className="text-xs text-neutral-500 mb-3 font-mono">{exp.company}</p>
                  <p className="text-sm text-neutral-400 leading-relaxed mb-4">
                    {exp.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 mt-auto">
                  {exp.tech.map((t) => (
                    <span key={t} className="text-xs font-mono text-neutral-600">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Journey;
