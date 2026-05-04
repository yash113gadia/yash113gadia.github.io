const skillCategories = [
  {
    title: "Frontend",
    skills: ["React", "Next.js", "TypeScript", "Tailwind CSS", "React Native", "Three.js", "Chrome Extensions"],
    dotColor: "bg-emerald-400",
    hoverColor: "hover:border-emerald-400/50 hover:text-emerald-400 hover:bg-emerald-400/10",
  },
  {
    title: "Backend",
    skills: ["Node.js", "Express", "FastAPI", "REST APIs", "Sequelize", "Firebase"],
    dotColor: "bg-violet-400",
    hoverColor: "hover:border-violet-400/50 hover:text-violet-400 hover:bg-violet-400/10",
  },
  {
    title: "Database & Cloud",
    skills: ["PostgreSQL", "MongoDB", "SQLite", "Firebase Firestore", "Neon", "Vercel"],
    dotColor: "bg-amber-400",
    hoverColor: "hover:border-amber-400/50 hover:text-amber-400 hover:bg-amber-400/10",
  },
  {
    title: "Web3 & AI",
    skills: ["Solidity", "Hardhat", "Ethers.js", "Gemini AI", "Groq/Llama", "AI SDK"],
    dotColor: "bg-cyan-400",
    hoverColor: "hover:border-cyan-400/50 hover:text-cyan-400 hover:bg-cyan-400/10",
  },
  {
    title: "DevOps & Tools",
    skills: ["Git", "Docker", "Linux", "Playwright", "Puppeteer", "Expo"],
    dotColor: "bg-rose-400",
    hoverColor: "hover:border-rose-400/50 hover:text-rose-400 hover:bg-rose-400/10",
  }
];

const technologies = [
  "JavaScript", "TypeScript", "Python", "Java", "C++", "SQL", "Solidity",
  "React", "Next.js", "Node.js", "Express", "FastAPI", "Socket.io",
  "PostgreSQL", "MongoDB", "SQLite", "Firebase", "Neon",
  "Docker", "Git", "Linux", "Vercel", "Netlify",
  "Tailwind", "Framer Motion", "Three.js", "Zustand", "Stripe",
  "Expo", "React Native", "Gemini AI", "Hardhat", "Ethers.js", "Playwright",
  "Puppeteer", "Sequelize", "Zod"
];

const Skills = () => {
  return (
    <section id="skills" className="py-24 px-6 md:px-12 lg:px-24 bg-neutral-950/50">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="mb-16 animate-fade-in-up">
          <span className="text-emerald-400 font-mono text-sm">03.</span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mt-2">Skills & Expertise</h2>
        </div>

        {/* Skill Categories Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {skillCategories.map((category, categoryIndex) => (
            <div
              key={category.title}
              className="bento-card animate-fade-in-up"
              style={{ animationDelay: `${categoryIndex * 0.1}s` }}
            >
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-2 h-2 rounded-full ${category.dotColor}`} />
                <h3 className="text-lg font-semibold text-white">{category.title}</h3>
              </div>

              <div className="flex flex-wrap gap-2">
                {category.skills.map((skill) => (
                  <span
                    key={skill}
                    className={`px-3 py-1.5 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-sm text-neutral-300 ${category.hoverColor} transition-colors cursor-default`}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Technology Cloud */}
        <div className="bento-card animate-fade-in-up">
          <h3 className="text-lg font-semibold text-white mb-6">Technologies I Work With</h3>

          <div className="flex flex-wrap gap-3">
            {technologies.map((tech, index) => (
              <span
                key={tech}
                className="px-4 py-2 bg-neutral-800/50 border border-neutral-700/50 rounded-lg text-sm text-neutral-300 hover:text-emerald-400 hover:border-emerald-400/50 hover:bg-emerald-400/10 transition-colors cursor-default animate-fade-in-up"
                style={{ animationDelay: `${index * 0.02}s` }}
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          {[
            { number: "2+", label: "Years Experience" },
            { number: "20+", label: "Projects Built" },
            { number: "35+", label: "Technologies" },
            { number: "1500+", label: "Hours of Code" },
          ].map((stat, index) => (
            <div
              key={stat.label}
              className="bento-card text-center animate-fade-in-up"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <span className="text-3xl md:text-4xl font-bold text-white">{stat.number}</span>
              <p className="text-sm text-neutral-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Skills;
