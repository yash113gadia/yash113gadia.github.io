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
    title: "Qlaa",
    subtitle: "Live Production Marketplace",
    description: "Full-stack marketplace with Razorpay payments, Firebase Auth (Google OAuth), real-time chat, reviews & ratings, and multi-step artist onboarding. Deployed on custom domain with CI/CD pipeline.",
    tech: ["React", "TypeScript", "Firebase", "Razorpay", "Zustand", "Tailwind"],
    image: "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&q=80",
    github: "https://github.com/yash113gadia",
    demo: "https://qlaa.in",
    featured: true,
    color: "emerald"
  },
  {
    title: "AttendEase",
    subtitle: "Enterprise Attendance System",
    description: "End-to-end attendance platform with Spring Boot REST API (13+ endpoints), JWT authentication, normalized PostgreSQL schema, and React dashboard. Containerized with Docker.",
    tech: ["Spring Boot", "React", "PostgreSQL", "JWT", "Docker"],
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80",
    github: "https://github.com/yash113gadia/AttendEase-Web",
    demo: "https://attendease-web-eight.vercel.app",
    featured: true,
    color: "violet"
  },
  {
    title: "ADHD Predictor",
    subtitle: "Clinical Screening Tool",
    description: "Digital diagnostic tool implementing DSM-5-TR criteria for ADHD screening. Features interactive questionnaire, real-time scoring algorithm, and comprehensive data visualization with clinical insights using Recharts.",
    tech: ["React", "TypeScript", "Recharts", "Tailwind"],
    image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80",
    github: "https://github.com/yash113gadia/WhatsMyScore",
    demo: "https://adhd-web-dun.vercel.app",
    featured: true,
    color: "sky"
  },
  // === OTHER NOTEWORTHY PROJECTS ===
  {
    title: "DevAge Platform",
    subtitle: "Agency Management Dashboard",
    description: "High-performance admin dashboard with Python FastAPI backend, React frontend, and Docker containerization for consistent deployments.",
    tech: ["FastAPI", "React", "Docker", "Python"],
    github: "https://github.com/yash113gadia/devage-platform",
    demo: "https://frontend-puce-ten-d1v383fm36.vercel.app",
    featured: false,
    color: "rose"
  },
  {
    title: "Syllabus AI",
    subtitle: "Educational Platform",
    description: "AI-integrated learning platform with Node.js/TypeScript backend and PostgreSQL database using Sequelize ORM.",
    tech: ["Node.js", "TypeScript", "PostgreSQL", "Sequelize"],
    github: "https://github.com/yash113gadia/SyllabusAI",
    demo: "https://client-theta-woad.vercel.app",
    featured: false,
    color: "amber"
  },
  {
    title: "FitTrack",
    subtitle: "AI Nutrition Assistant",
    description: "Cross-platform mobile app using Gemini AI to analyze natural language food logs. Offline-first architecture with SQLite.",
    tech: ["React Native", "Gemini AI", "SQLite", "Expo"],
    github: "https://github.com/yash113gadia/FitTrack",
    demo: "#",
    featured: false,
    color: "violet"
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
