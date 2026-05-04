import { ExternalLink, Github, ArrowUpRight, Eye } from 'lucide-react';
import { useEffect, useState } from 'react';
import { trackProjectView, getProjectViews } from '../services/firestore';

interface Project {
  title: string;
  subtitle: string;
  description: string;
  tech: string[];
  image?: string;
  github: string;
  demo: string;
  featured: boolean;
  color: string;
}

const projects: Project[] = [
  // === FEATURED PROJECTS (ordered by impact) ===
  {
    title: "Attestr",
    subtitle: "Decentralized Media Authenticator",
    description: "Blockchain-powered media verification platform with Solidity smart contracts, AI deepfake detection, Error Level Analysis, perceptual hashing, and a Chrome extension. Built at Innovate Bharat Hackathon 2026.",
    tech: ["React", "Solidity", "Hardhat", "Firebase", "Three.js", "Ethers.js"],
    image: "/attestr-preview.webp",
    github: "https://github.com/yash113gadia/attestr",
    demo: "https://hackathon-six-eosin.vercel.app",
    featured: true,
    color: "emerald"
  },
  {
    title: "CodePilot",
    subtitle: "AI Coding Agent CLI",
    description: "Multi-provider AI coding assistant published on NPM with parallel sub-agent system, file tracking, plan mode, and model switching. Supports Anthropic, OpenAI, Google, and Ollama.",
    tech: ["TypeScript", "Node.js", "AI SDK", "Ink", "Zod"],
    image: "/codepilot-preview.svg",
    github: "https://github.com/yash113gadia/CodePilot",
    demo: "#",
    featured: true,
    color: "violet"
  },
  {
    title: "Qlaa",
    subtitle: "Live Production Marketplace",
    description: "Full-stack marketplace with Razorpay payments, Firebase Auth (Google OAuth), real-time chat, reviews & ratings, and multi-step artist onboarding. Deployed on custom domain with CI/CD pipeline.",
    tech: ["React", "TypeScript", "Firebase", "Razorpay", "Zustand", "Tailwind"],
    image: "/qlaa-preview.webp",
    github: "https://github.com/yash113gadia",
    demo: "https://qlaa.in",
    featured: true,
    color: "sky"
  },
  // === OTHER NOTEWORTHY PROJECTS ===
  {
    title: "FitTrack",
    subtitle: "AI Nutrition Assistant",
    description: "Cross-platform mobile app (v1.0) with Gemini AI food recognition, barcode scanning, and nutritional analysis. Offline-first with SQLite and Zustand state management.",
    tech: ["React Native", "Gemini AI", "SQLite", "Expo"],
    github: "https://github.com/yash113gadia/FitTrack",
    demo: "#",
    featured: false,
    color: "violet"
  },
  {
    title: "OmniAi",
    subtitle: "AI Content Generator",
    description: "SaaS platform for AI-powered content generation with multiple templates, Stripe payments, and Firebase backend. Fast generation with customizable outputs.",
    tech: ["React", "Firebase", "Stripe", "Vite"],
    github: "https://github.com/yash113gadia/OmniAi",
    demo: "#",
    featured: false,
    color: "rose"
  },
  {
    title: "Poker Game",
    subtitle: "Real-time Multiplayer",
    description: "Live multiplayer poker game with WebSocket-powered real-time gameplay, smooth animations, and an Express.js backend handling game state.",
    tech: ["React", "Socket.io", "Express", "Tailwind"],
    github: "https://github.com/yash113gadia/poker-game",
    demo: "#",
    featured: false,
    color: "amber"
  },
  {
    title: "LabForge",
    subtitle: "Automated Documentation",
    description: "Full-stack tool that auto-generates personalized lab .docx files with Playwright screenshot capture and real-time progress tracking via WebSockets.",
    tech: ["React", "FastAPI", "Socket.io", "Playwright"],
    github: "#",
    demo: "#",
    featured: false,
    color: "sky"
  },
  {
    title: "AttendEase",
    subtitle: "Enterprise Attendance System",
    description: "Full-stack attendance platform with JWT authentication, normalized PostgreSQL schema (Neon), serverless API, and a React analytics dashboard.",
    tech: ["React", "PostgreSQL", "JWT", "Vercel"],
    github: "https://github.com/yash113gadia/AttendEase-Web",
    demo: "https://attendease-web-eight.vercel.app",
    featured: false,
    color: "emerald"
  },
  {
    title: "CrackNIET",
    subtitle: "AI Exam Assistant Extension",
    description: "Chrome Manifest V3 extension with AI-powered exam assistance for Iamneo, HackerRank, and NPTEL. Features free OpenRouter models, auto-paste, MCQ extraction, and stealth injection.",
    tech: ["Chrome Extension", "JavaScript", "AI/LLM", "Manifest V3"],
    github: "https://github.com/yash113gadia/crackniet",
    demo: "#",
    featured: false,
    color: "rose"
  },
  {
    title: "Amazon Scraper",
    subtitle: "Product Data Scraper",
    description: "Web-based tool for scraping Amazon product data (name, category, price, description) with advanced anti-detection, stealth plugins, and CSV export.",
    tech: ["Node.js", "Puppeteer", "Express", "JavaScript"],
    github: "https://github.com/yash113gadia/amazon-scraper",
    demo: "#",
    featured: false,
    color: "amber"
  },
  {
    title: "CampusQuest",
    subtitle: "Campus Exploration Game",
    description: "Interactive gamified campus exploration app for new students to discover their university through challenges, quests, and achievements.",
    tech: ["TypeScript", "React", "Gamification"],
    github: "https://github.com/yash113gadia/CampusQuest",
    demo: "#",
    featured: false,
    color: "violet"
  },
  {
    title: "SyllabusAI",
    subtitle: "AI Study Planner",
    description: "AI-integrated learning platform that auto-generates syllabi and study schedules. Node.js/TypeScript backend with PostgreSQL and Sequelize ORM.",
    tech: ["Node.js", "TypeScript", "PostgreSQL", "Sequelize"],
    github: "https://github.com/yash113gadia/SyllabusAI",
    demo: "https://client-theta-woad.vercel.app",
    featured: false,
    color: "sky"
  },
  {
    title: "SpeedoExpress",
    subtitle: "Logistics Startup Website",
    description: "Production marketing site for a delivery startup built during internship. Features pricing calculator, service showcase, WhatsApp CTA, and SEO optimization with Next.js 16.",
    tech: ["Next.js 16", "React 19", "Tailwind v4", "TypeScript"],
    github: "#",
    demo: "https://www.speedoexpress.org",
    featured: false,
    color: "cyan"
  }
];

// Helper to create URL-safe project ID
const getProjectId = (title: string) => title.toLowerCase().replace(/\s+/g, '-');

const Projects = () => {
  const featuredProjects = projects.filter(p => p.featured);
  const otherProjects = projects.filter(p => !p.featured);
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});

  // Fetch view counts on mount
  useEffect(() => {
    const fetchViews = async () => {
      const counts: Record<string, number> = {};
      for (const project of projects) {
        const id = getProjectId(project.title);
        counts[id] = await getProjectViews(id);
      }
      setViewCounts(counts);
    };
    fetchViews();
  }, []);

  // Track project click
  const handleProjectClick = async (projectTitle: string) => {
    const id = getProjectId(projectTitle);
    await trackProjectView(id);
    // Update local count
    setViewCounts(prev => ({
      ...prev,
      [id]: (prev[id] || 0) + 1
    }));
  };

  return (
    <section id="projects" className="py-24 px-6 md:px-12 lg:px-24">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="mb-16 animate-fade-in-up">
          <span className="text-emerald-400 font-mono text-sm">02.</span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mt-2">Featured Projects</h2>
        </div>

        {/* Featured Projects */}
        <div className="space-y-8 mb-20">
          {featuredProjects.map((project, index) => (
            <div
              key={project.title}
              className={`group relative grid md:grid-cols-2 gap-8 items-center animate-fade-in-up ${
                index % 2 === 1 ? 'md:direction-rtl' : ''
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Image */}
              <div className={`relative overflow-hidden rounded-2xl ${index % 2 === 1 ? 'md:order-2' : ''}`}>
                <div className="aspect-video">
                  <img
                    src={project.image}
                    alt={project.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-br from-${project.color}-500/40 to-transparent mix-blend-multiply`} />
                  {/* Favicon overlay to hide watermark */}
                  <img
                    src="/favicon.svg"
                    alt=""
                    className="absolute bottom-2 right-2 w-8 h-8 opacity-80"
                  />
                </div>
              </div>

              {/* Content */}
              <div className={`${index % 2 === 1 ? 'md:order-1 md:text-right' : ''}`}>
                <span className={`text-${project.color}-400 font-mono text-sm`}>{project.subtitle}</span>
                <h3 className="text-2xl md:text-3xl font-bold text-white mt-2 mb-4">{project.title}</h3>
                
                <div className="bento-card p-6 mb-4">
                  <p className="text-neutral-400 leading-relaxed">{project.description}</p>
                </div>

                <div className={`flex flex-wrap gap-2 mb-6 ${index % 2 === 1 ? 'md:justify-end' : ''}`}>
                  {project.tech.map((tech) => (
                    <span key={tech} className="text-xs font-mono text-neutral-500">
                      {tech}
                    </span>
                  ))}
                </div>

                <div className={`flex items-center gap-4 ${index % 2 === 1 ? 'md:justify-end' : ''}`}>
                  {/* View count */}
                  <span className="flex items-center gap-1 text-xs text-neutral-500">
                    <Eye className="w-3.5 h-3.5" />
                    {viewCounts[getProjectId(project.title)] || 0}
                  </span>
                  <a
                    href={project.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-400 hover:text-white transition-colors"
                    onClick={() => handleProjectClick(project.title)}
                  >
                    <Github className="w-5 h-5" />
                  </a>
                  <a
                    href={project.demo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-400 hover:text-white transition-colors"
                    onClick={() => handleProjectClick(project.title)}
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Other Projects Header */}
        <h3 className="text-xl font-semibold text-white text-center mb-8 animate-fade-in-up">
          Other Noteworthy Projects
        </h3>

        {/* Other Projects Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {otherProjects.map((project, index) => (
            <div
              key={project.title}
              className="bento-card group animate-fade-in-up"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl bg-${project.color}-500/10 flex items-center justify-center`}>
                  <Github className={`w-5 h-5 text-${project.color}-400`} />
                </div>
                <div className="flex items-center gap-3">
                  {/* View count */}
                  <span className="flex items-center gap-1 text-xs text-neutral-600">
                    <Eye className="w-3 h-3" />
                    {viewCounts[getProjectId(project.title)] || 0}
                  </span>
                  <a
                    href={project.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-500 hover:text-white transition-colors"
                    title="View on GitHub"
                    onClick={() => handleProjectClick(project.title)}
                  >
                    <Github className="w-5 h-5" />
                  </a>
                  {project.demo !== "#" && (
                    <a
                      href={project.demo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-neutral-500 hover:text-emerald-400 transition-colors"
                      title="View Live Demo"
                      onClick={() => handleProjectClick(project.title)}
                    >
                      <ExternalLink className="w-5 h-5" />
                    </a>
                  )}
                </div>
              </div>
              
              <h4 className="text-lg font-semibold text-white mb-1 group-hover:text-emerald-400 transition-colors">
                {project.title}
              </h4>
              <p className="text-xs text-neutral-500 mb-3">{project.subtitle}</p>
              <p className="text-sm text-neutral-400 leading-relaxed mb-4">
                {project.description}
              </p>
              
              <div className="flex flex-wrap gap-2 mt-auto">
                {project.tech.slice(0, 3).map((tech) => (
                  <span key={tech} className="text-xs font-mono text-neutral-600">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* View All Link */}
        <div className="text-center mt-12 animate-fade-in-up">
          <a
            href="https://github.com/yash113gadia"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-neutral-400 hover:text-emerald-400 transition-colors"
          >
            <span>View all on GitHub</span>
            <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
};

export default Projects;
