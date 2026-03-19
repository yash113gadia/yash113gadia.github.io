import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink, Github, Globe, Layers, TrendingUp, Database, Layout } from 'lucide-react';
import { Link } from 'react-router-dom';
import Contact from '../components/Contact';
import ChatbotInline from '../components/ChatbotInline';

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
  const specializedProjectContext = `
# SYSTEM ARCHITECTURE & PROJECT DEEP DIVE

## 1. ATTESTR (Decentralized Media Authenticator)
- **Objective:** Eliminate media misinformation via blockchain + AI forensics.
- **Detailed Tech:** React, Solidity (Smart Contracts), Hardhat, Firebase, Three.js, Ethers.js, Python (Inference), Chrome Extension API.
- **Architecture Layers:**
  1. AI Inference: Uses Deepfake detection models to analyze pixel-level inconsistencies.
  2. Perceptual Hashing: Generates a unique fingerprint of media that survives resizing/compression.
  3. Image Forensics: Error Level Analysis (ELA) to detect manipulated regions.
  4. Blockchain Layer: Anchors hashes on-chain for immutable timestamping and origin proof.
- **Business Value:** Prevents brand damage for high-profile figures and news agencies.
- **Roadmap:** Real-time browser verification & Trust Protocol for journalists.

## 2. CODEPILOT CLI (AI Coding Agent)
- **Objective:** Autonomous codebase manipulation via CLI.
- **Detailed Tech:** TypeScript, Node.js, AI SDK (Vercel), Ink (React for CLI), Zod, Anthropic/OpenAI/Ollama.
- **Architecture:** 
  - Planner-Executor model: Planner creates a multi-step execution strategy.
  - Parallel sub-agents for high-volume file processing.
  - File tracking & self-healing mode.
- **Productivity:** Targeted 40% boost in developer speed.
- **Roadmap:** Local-only LLM support for enterprise privacy.

## 3. QLAA / ArtistConnect (Marketplace)
- **Objective:** Gig economy for creative professionals.
- **Detailed Tech:** MERN-Firebase Hybrid, Razorpay, Socket.io, Zustand.
- **Key Features:** Real-time chat, automated artist onboarding, Razorpay webhook pipeline, SEO optimization.
- **Business Value:** Disrupts traditional high-commission talent agencies.
- **Roadmap:** AI-driven artist-client matching & NFT contract generation.

## 4. SPEEDOEXPRESS (Logistics Startup)
- **Objective:** High-conversion production marketing site.
- **Detailed Tech:** Next.js 16, React 19, Tailwind CSS v4.
- **Engineering:** Focus on Core Web Vitals, SSR for SEO, custom pricing algorithms.

## 5. FITTRACK (AI Nutrition Assistant)
- **Objective:** Frictionless calorie tracking.
- **Detailed Tech:** React Native, Gemini AI (Computer Vision), SQLite.
- **System:** Multi-modal analysis of food images to extract nutritional data automatically.

## 6. ATTENDEASE (Enterprise Attendance)
- **Objective:** Scalable workforce management.
- **Detailed Tech:** React, PostgreSQL (Neon), JWT, Serverless.
- **Database:** Highly normalized schema for complex reporting & audit trails.

## 7. OMNIAI (SaaS Content Gen)
- **Objective:** Automated content production.
- **Detailed Tech:** React, Stripe, OpenAI API.
- **Business:** Subscription model with credit-based usage tracking.
`;

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

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Side: Project Navigation & Table (8 cols) */}
          <div className="lg:col-span-8 space-y-12">
            {/* Project Navigation (Quick Scroll) */}
            <div className="flex flex-wrap gap-3">
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
            <div className="hidden lg:block overflow-hidden rounded-[2rem] border border-white/5 shadow-2xl bg-white/[0.02] backdrop-blur-3xl">
              <table className="w-full text-left border-collapse table-fixed">
                <thead>
                  <tr className="bg-white/[0.03] border-b border-white/10">
                    <th className="p-6 text-xs font-bold uppercase tracking-[0.2em] text-emerald-400 w-[25%]">Engineering Project</th>
                    <th className="p-6 text-xs font-bold uppercase tracking-[0.2em] text-slate-300 w-[75%]">Detailed Architecture & Strategy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {projectDetails.map((project, i) => (
                    <tr 
                      key={i} 
                      id={project.title.toLowerCase().replace(/\s+/g, '-')}
                      className="hover:bg-white/[0.01] transition-all group"
                    >
                      <td className="p-6 align-top">
                        <div className="sticky top-40 space-y-4">
                          <div className={`text-xl font-black text-white group-hover:text-${project.color}-400 transition-colors`}>
                            {project.title}
                          </div>
                          <div className="flex gap-2">
                            <button className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all">
                              <Github size={16} className="text-slate-400" />
                            </button>
                            <button className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all">
                              <ExternalLink size={16} className="text-slate-400" />
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="p-6 align-top">
                        <div className="grid grid-cols-1 gap-8">
                          <div>
                            <div className="flex items-center gap-3 text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-3">
                              <Globe size={14} /> The Objective
                            </div>
                            <p className="text-slate-300 text-sm leading-relaxed font-light">{project.objective}</p>
                          </div>
                          <div>
                            <div className="flex items-center gap-3 text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-3">
                              <Database size={14} /> Tech Stack
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {project.techStack.split(', ').map((tech, tid) => (
                                <span key={tid} className="px-2 py-0.5 bg-emerald-500/5 border border-emerald-500/10 rounded-md text-emerald-400 font-mono text-[9px]">
                                  {tech}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center gap-3 text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-3">
                              <Layout size={14} /> System Architecture
                            </div>
                            <p className="text-slate-400 text-xs leading-relaxed font-light bg-white/[0.02] p-4 rounded-xl border border-white/5">
                              {project.detailedArchitecture}
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                            <div>
                              <div className="flex items-center gap-3 text-[10px] font-black text-violet-500 uppercase tracking-widest mb-3">
                                <TrendingUp size={14} /> Business Value
                              </div>
                              <p className="text-slate-300 text-xs leading-relaxed font-light">{project.businessPerspective}</p>
                            </div>
                            <div>
                              <div className="flex items-center gap-3 text-[10px] font-black text-violet-500 uppercase tracking-widest mb-3">
                                <Layers size={14} /> Roadmap
                              </div>
                              <p className="text-slate-400 text-xs leading-relaxed font-light italic">{project.futureScope}</p>
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
                      <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-3">Tech Stack</h4>
                      <div className="flex flex-wrap gap-2">
                        {project.techStack.split(', ').map((tech, tid) => (
                          <span key={tid} className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-emerald-400 font-mono text-[10px]">
                            {tech}
                          </span>
                        ))}
                      </div>
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
          </div>

          {/* Right Side: Sticky Chatbot (4 cols) */}
          <div className="lg:col-span-4 lg:sticky lg:top-32 space-y-6">
            <div className="flex items-center gap-4 mb-2">
              <h2 className="text-xl md:text-2xl font-bold">Project <span className="text-emerald-400">Expert AI</span></h2>
              <div className="flex-1 h-px bg-white/10" />
            </div>
            <div className="glass-scifi rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
              <ChatbotInline 
                title="Architecture Consultant"
                placeholder="Ask technical questions..."
                specializedContext={specializedProjectContext}
                suggestedQuestions={[
                  "How does CodePilot orchestrate agents?",
                  "Explain Attestr's forensic layer",
                  "Tell me about Qlaa's payment pipeline",
                  "What makes AttendEase scalable?"
                ]}
              />
            </div>
            <p className="text-[10px] text-slate-500 text-center uppercase tracking-widest px-4">
              Direct technical access to my system design decisions.
            </p>
          </div>

        </div>

        <div className="mt-32">
          <Contact />
        </div>
      </div>
    </div>
  );
};

export default ProjectDescription;
