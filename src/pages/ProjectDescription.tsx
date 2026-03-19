import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink, Github, Globe, Layers, TrendingUp, Zap, Database, Layout } from 'lucide-react';
import { Link } from 'react-router-dom';
import Contact from '../components/Contact';

const projectDetails = [
  {
    title: "Attestr",
    objective: "To eliminate media misinformation by providing a decentralized, tamper-proof verification layer for digital content in the era of sophisticated AI deepfakes.",
    techStack: "Solidity, React, Hardhat, Firebase, Three.js, Ethers.js, Python (AI Models), Chrome Extension API",
    detailedArchitecture: "Uses a multi-layered approach: 1. AI Deepfake detection models for initial screening. 2. Perceptual hashing to identify media even after slight edits. 3. Error Level Analysis (ELA) for image forensic. 4. Blockchain anchoring of hashes for immutable proof of origin.",
    businessPerspective: "Targeting news agencies, legal firms, and social media platforms to ensure content integrity and prevent brand damage from fraudulent media. Potential for a B2B SaaS API for automatic media validation.",
    futureScope: "Integration with major browser engines for real-time verification, building a global 'Trust Protocol' for citizen journalism, and mobile app for field reporters.",
    color: "emerald"
  },
  {
    title: "CodePilot CLI",
    objective: "To bridge the gap between AI LLMs and the local file system, enabling autonomous coding tasks through a multi-agent orchestrated CLI.",
    techStack: "TypeScript, Node.js, AI SDK (Vercel), Ink (CLI UI), Zod, Anthropic/OpenAI APIs, File System API",
    detailedArchitecture: "Employs a 'Planner-Executor' architecture. The 'Planner' agent analyzes the codebase and user request to create a step-by-step strategy, while specialized 'Executor' agents perform file reads, writes, and shell commands. Implements parallel sub-agents for faster execution.",
    businessPerspective: "Boosting developer productivity by 40% through automated boilerplate, refactoring, and plan-based execution. Can be integrated into corporate internal tools to maintain code quality and standards.",
    futureScope: "Support for local-only LLMs (Ollama) to ensure enterprise data privacy, self-healing CI/CD pipeline integration, and advanced IDE extensions.",
    color: "violet"
  },
  {
    title: "Qlaa (ArtistConnect)",
    objective: "To democratize the gig economy for local artists by providing a direct-to-consumer marketplace with secure booking and real-time management.",
    techStack: "React, TypeScript, Firebase, Razorpay, Zustand, Tailwind CSS, Socket.io, Node.js, Express",
    detailedArchitecture: "A robust MERN-inspired stack with Firebase as the primary backend. Implements a multi-role user system (Artists vs. Clients), real-time chat via WebSockets, GEO-based discovery, and a secure payment pipeline with Razorpay webhooks for transaction reliability.",
    businessPerspective: "Disrupting traditional artist agencies by lowering commission fees and providing artists with data-driven insights into local demand. Scaling to a nationwide platform for independent performers.",
    futureScope: "AI-driven matching algorithms to suggest artists to event planners based on historical engagement, automated contract generation, and NFT-based ticket sales.",
    color: "sky"
  },
  {
    title: "SpeedoExpress",
    objective: "To build a high-performance, SEO-optimized production website for a logistics startup, focusing on user conversion and internal lead management.",
    techStack: "Next.js 16, React 19, Tailwind CSS v4, TypeScript, Vercel Analytics",
    detailedArchitecture: "Leverages the latest Next.js 16 features for server-side rendering and static site generation. Implements a custom pricing calculator, responsive service showcase, and optimized lead capture forms. Focuses on core web vitals and fast performance.",
    businessPerspective: "Increases online visibility and lead generation for the startup. The professional UI builds trust with potential B2B logistics clients, reducing the sales cycle.",
    futureScope: "Internal tracking dashboard integration, real-time delivery status updates for customers, and a driver management portal.",
    color: "cyan"
  },
  {
    title: "FitTrack",
    objective: "An AI-powered nutrition and fitness assistant that simplifies calorie tracking through computer vision and intelligent analysis.",
    techStack: "React Native, Gemini AI (Computer Vision), SQLite, Zustand, Expo",
    detailedArchitecture: "Uses Gemini AI's multi-modal capabilities to identify food items from photos. Implements an offline-first architecture with SQLite for local data persistence and barcode scanning for packaged products. Cross-platform mobile deployment.",
    businessPerspective: "Targets the growing health and wellness market by reducing the friction of manual data entry, a major pain point in existing fitness apps. Potential for integration with health insurance providers.",
    futureScope: "Personalized AI coaching based on long-term trends, integration with wearable devices (Apple Health/Google Fit), and social community features.",
    color: "rose"
  },
  {
    title: "AttendEase",
    objective: "An enterprise-grade attendance management system designed for scalability and real-time analytics for large organizations.",
    techStack: "React, PostgreSQL (Neon), JWT, Vercel, Serverless Functions, Prisma",
    detailedArchitecture: "Built on a serverless architecture with a highly normalized PostgreSQL schema to ensure data integrity. Implements secure JWT authentication and a comprehensive analytics dashboard for HR/Management to track attendance patterns.",
    businessPerspective: "Solves administrative overhead for educational institutions and corporate offices. Provides actionable data to improve workforce efficiency and accountability.",
    futureScope: "Biometric integration (Fingerprint/Facial Recognition), automated payroll processing integration, and mobile app for employee self-service.",
    color: "amber"
  },
  {
    title: "OmniAi",
    objective: "A SaaS platform for AI content generation, providing a suite of tools for marketing, social media, and technical writing.",
    techStack: "React, Firebase, Stripe, Vite, OpenAI API, Tailwind CSS",
    detailedArchitecture: "Implements a subscription-based business model with Stripe integration. Features a collection of fine-tuned prompts for different content types and a sleek editor for reviewing and exporting AI-generated content.",
    businessPerspective: "Capitalizes on the generative AI boom by providing an easy-to-use interface for businesses to scale their content production. Low overhead with high scalability.",
    futureScope: "Custom model fine-tuning for enterprise clients, team collaboration features, and direct publishing integrations for WordPress/LinkedIn.",
    color: "orange"
  }
];

const ProjectDescription = () => {
  return (
    <div className="min-h-screen bg-bg text-white pt-32 pb-20">
      <div className="container mx-auto px-6 max-w-7xl">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16"
        >
          <Link to="/" className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors mb-6 group">
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            Back to Portfolio
          </Link>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Detailed Project <br />
            <span className="text-gradient-accent text-5xl md:text-7xl">Architecture</span>
          </h1>
          <div className="h-1 w-24 bg-gradient-to-r from-emerald-500 to-violet-500 rounded-full mb-8" />
          <p className="text-slate-400 max-w-3xl text-lg font-light leading-relaxed">
            A comprehensive technical breakdown of my engineering portfolio. Each project represents a unique challenge solved through modern technology, strategic architecture, and user-centric design.
          </p>
        </motion.div>

        {/* Project Navigation (Quick Scroll) */}
        <div className="flex flex-wrap gap-3 mb-12">
          {projectDetails.map((project, i) => (
            <a 
              key={i} 
              href={`#${project.title.toLowerCase().replace(/\s+/g, '-')}`}
              className="px-4 py-2 rounded-full glass-scifi text-xs font-medium hover:border-emerald-500/50 transition-all"
            >
              {project.title}
            </a>
          ))}
        </div>

        {/* Desktop Table Layout */}
        <div className="hidden lg:block overflow-hidden rounded-[2rem] border border-white/5 shadow-2xl bg-white/[0.02] backdrop-blur-3xl mb-32">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="bg-white/[0.03] border-b border-white/10">
                <th className="p-8 text-sm font-bold uppercase tracking-[0.2em] text-emerald-400 w-[20%]">Engineering Project</th>
                <th className="p-8 text-sm font-bold uppercase tracking-[0.2em] text-slate-300 w-[40%]">Technical Architecture</th>
                <th className="p-8 text-sm font-bold uppercase tracking-[0.2em] text-slate-300 w-[40%]">Strategy & Future</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {projectDetails.map((project, i) => (
                <tr 
                  key={i} 
                  id={project.title.toLowerCase().replace(/\s+/g, '-')}
                  className="hover:bg-white/[0.01] transition-all group"
                >
                  <td className="p-8 align-top">
                    <div className="sticky top-40 space-y-4">
                      <div className={`text-2xl font-black text-white group-hover:text-${project.color}-400 transition-colors`}>
                        {project.title}
                      </div>
                      <div className="flex gap-2">
                        <button className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all">
                          <Github size={18} className="text-slate-400" />
                        </button>
                        <button className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all">
                          <ExternalLink size={18} className="text-slate-400" />
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="p-8 align-top">
                    <div className="space-y-8">
                      <div>
                        <div className="flex items-center gap-3 text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-3">
                          <Globe size={14} /> The Objective
                        </div>
                        <p className="text-slate-300 text-base leading-relaxed font-light">{project.objective}</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-3 text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-3">
                          <Database size={14} /> Core Tech Stack
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {project.techStack.split(', ').map((tech, tid) => (
                            <span key={tid} className="px-3 py-1 bg-emerald-500/5 border border-emerald-500/10 rounded-md text-emerald-400 font-mono text-[10px]">
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-3 text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-3">
                          <Layout size={14} /> System Architecture
                        </div>
                        <p className="text-slate-400 text-sm leading-relaxed font-light bg-white/[0.02] p-4 rounded-xl border border-white/5">
                          {project.detailedArchitecture}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-8 align-top">
                    <div className="space-y-8">
                      <div>
                        <div className="flex items-center gap-3 text-[10px] font-black text-violet-500 uppercase tracking-widest mb-3">
                          <TrendingUp size={14} /> Business & Strategic Value
                        </div>
                        <p className="text-slate-300 text-base leading-relaxed font-light">{project.businessPerspective}</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-3 text-[10px] font-black text-violet-500 uppercase tracking-widest mb-3">
                          <Layers size={14} /> Roadmap & Scaling
                        </div>
                        <div className="relative p-4 rounded-xl bg-violet-500/5 border border-violet-500/10 overflow-hidden">
                           <div className="absolute top-0 right-0 p-2 opacity-10"><Zap size={40} /></div>
                           <p className="text-slate-400 text-sm leading-relaxed font-light italic relative z-10">
                            {project.futureScope}
                          </p>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile/Tablet Card Layout */}
        <div className="lg:hidden space-y-12">
          {projectDetails.map((project, i) => (
            <motion.div 
              key={i}
              id={project.title.toLowerCase().replace(/\s+/g, '-')}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass-scifi rounded-3xl border border-white/5 p-8 relative overflow-hidden"
            >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-${project.color}-500/5 rounded-full blur-3xl`} />
              
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-3xl font-black text-white">{project.title}</h3>
                <div className="flex gap-2">
                  <Github size={20} className="text-slate-500" />
                  <ExternalLink size={20} className="text-slate-500" />
                </div>
              </div>
              
              <div className="space-y-10">
                <section>
                  <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-3">The Objective</h4>
                  <p className="text-slate-300 text-base leading-relaxed font-light">{project.objective}</p>
                </section>
                
                <section>
                  <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-3">Architecture</h4>
                  <p className="text-slate-400 text-sm leading-relaxed font-light bg-white/5 p-4 rounded-xl italic">
                    {project.detailedArchitecture}
                  </p>
                </section>

                <section>
                  <h4 className="text-[10px] font-black text-violet-500 uppercase tracking-[0.2em] mb-3">Business Value</h4>
                  <p className="text-slate-300 text-base leading-relaxed font-light">{project.businessPerspective}</p>
                </section>
                
                <section>
                  <h4 className="text-[10px] font-black text-violet-500 uppercase tracking-[0.2em] mb-3">Next Steps</h4>
                  <p className="text-slate-400 text-sm leading-relaxed font-light border-l-2 border-violet-500/30 pl-4">
                    {project.futureScope}
                  </p>
                </section>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-32">
          <Contact />
        </div>
      </div>
    </div>
  );
};

export default ProjectDescription;
