import { ExternalLink, Github, ArrowUpRight } from 'lucide-react';

const projects = [
  {
    title: "Qlaa",
    subtitle: "Hyper-local Service Marketplace",
    description: "Full-stack marketplace platform with booking system, real-time updates via Socket.io, and GEO-based service discovery. Built for scale with JWT auth and role-based access.",
    tech: ["React", "Node.js", "MongoDB", "Socket.io", "TypeScript"],
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
    github: "https://github.com/yash113gadia",
    demo: "https://qlaa.in",
    featured: true,
    color: "emerald"
  },
  {
    title: "AttendEase",
    subtitle: "Enterprise Attendance System",
    description: "Full-stack attendance management system with Spring Boot REST API, JWT authentication, and React dashboard. Deployed on Render with Neon PostgreSQL for scalable cloud hosting.",
    tech: ["Spring Boot", "React", "PostgreSQL", "JWT", "Docker"],
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80",
    github: "https://github.com/yash113gadia/AttendEase-Web",
    demo: "https://attend-ease-web.vercel.app",
    featured: true,
    color: "violet"
  },
  {
    title: "Syllabus AI",
    subtitle: "Educational Platform",
    description: "AI-integrated learning platform with Node.js/TypeScript backend. PostgreSQL with Sequelize ORM for data modeling and migrations.",
    tech: ["Node.js", "TypeScript", "PostgreSQL", "Sequelize"],
    github: "https://github.com/yash113gadia/SyllabusAI",
    demo: "https://client-theta-woad.vercel.app",
    featured: false,
    color: "sky"
  },
  {
    title: "FitTrack",
    subtitle: "AI Nutrition Assistant",
    description: "Mobile app using Gemini AI to analyze natural language food logs. Offline-first with SQLite storage.",
    tech: ["React Native", "Gemini AI", "SQLite"],
    github: "https://github.com/yash113gadia/FitTrack",
    demo: "#",
    featured: false,
    color: "amber"
  },
  {
    title: "DevAge Platform",
    subtitle: "Agency Dashboard",
    description: "High-performance admin dashboard containerized with Docker for consistent deployments.",
    tech: ["FastAPI", "React", "Docker"],
    github: "https://github.com/yash113gadia/devage-platform",
    demo: "https://frontend-puce-ten-d1v383fm36.vercel.app",
    featured: false,
    color: "rose"
  },
  {
    title: "ADHD Predictor",
    subtitle: "Clinical Screening Tool",
    description: "Digital diagnostic tool based on DSM-5-TR criteria with interactive data visualization.",
    tech: ["React", "TypeScript", "Recharts"],
    github: "https://github.com/yash113gadia/WhatsMyScore",
    demo: "https://adhd-web-dun.vercel.app",
    featured: false,
    color: "emerald"
  }
];

const Projects = () => {
  const featuredProjects = projects.filter(p => p.featured);
  const otherProjects = projects.filter(p => !p.featured);

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

                <div className={`flex gap-4 ${index % 2 === 1 ? 'md:justify-end' : ''}`}>
                  <a
                    href={project.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-400 hover:text-white transition-colors"
                  >
                    <Github className="w-5 h-5" />
                  </a>
                  <a
                    href={project.demo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-400 hover:text-white transition-colors"
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
                <div className="flex gap-3">
                  <a
                    href={project.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-500 hover:text-white transition-colors"
                    title="View on GitHub"
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
