import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink, Github, Globe, Layers, TrendingUp, Database, Layout } from 'lucide-react';
import { Link } from 'react-router-dom';
import Contact from '../components/Contact';
import ChatbotInline from '../components/ChatbotInline';

const projectDetails = [
  {
    title: "SpeedoExpress",
    objective: "To build and operate a B2B last-mile logistics platform for Delhi NCR as the founding engineer — from an empty repository to a live product with businesses, drivers and fleet owners on it.",
    techStack: "Next.js, React, Supabase (PostgreSQL + PostGIS), Redis, WebSockets/SSE, Leaflet + OpenStreetMap, WhatsApp Business API (AiSensy), Bubblewrap, TypeScript",
    detailedArchitecture: "The hard half is live driver tracking. Driver clients publish coordinates that land in Redis under short TTLs, so a stale position expires on its own rather than lingering as a phantom driver; updates are pushed to watching customers over WebSockets with an SSE fallback, and the map renders on Leaflet + OpenStreetMap instead of a metered tile provider. Dispatch and proximity run as PostGIS spatial queries against PostgreSQL. On top of that: a driver app live at driver.speedoexpress.org, a 182-file platform redesign, a WhatsApp-based B2B ordering flow on the WhatsApp Business API, and the whole thing packaged as an installable PWA and shipped to the Play Store via Bubblewrap. Booking state transitions run server-side through SECURITY DEFINER RPCs, row-level security is default-deny, and money is stored as integer paise with idempotent settlement. One production incident stands out: a Node.js heap-exhaustion crash traced from the crash signature back to the allocation that caused it, then fixed.",
    businessPerspective: "Replaces phone-and-spreadsheet dispatch with a platform that quotes, assigns, tracks and settles on its own, so the operation scales without adding coordinators. Ordering over WhatsApp meets Indian B2B customers where they already are, with no app install required.",
    futureScope: "Promotion from Play closed testing to a staged production rollout, demand-based surge pricing, and a partner API for campus-to-business delivery volume.",
    color: "cyan"
  },
  {
    title: "BiteSite",
    objective: "To remove the lunch-break queue at college canteens by letting students order and pay from class, while staying multi-tenant enough to onboard any number of colleges without a redeploy.",
    techStack: "Java 21, Spring Boot 3.5, Spring JDBC, MySQL 8, Flyway, Spring Security, Spring Session JDBC, Razorpay, Android",
    detailedArchitecture: "Account-based multi-tenancy: every tenant-scoped table carries a tenant_id, and which college a request sees is derived from the authenticated principal, never from a URL, subdomain or client-supplied value. A TenantResolutionInterceptor sets the tenant context after authentication and every DAO method requires the tenant id as an argument, so guessing an internal ID gets a user nowhere — proven by an isolation suite that runs against a real MySQL instance in CI. Payment is mandatory before the kitchen sees an order: the Razorpay client callback and the server webhook both converge on one idempotent confirmPayment, and OrderStatus.canTransitionTo is the single source of truth for legal transitions. Sessions live in MySQL via Spring Session JDBC, so a restart or a second instance behind a load balancer does not log anyone out.",
    businessPerspective: "Sells per college rather than per app install: one deployment serves many campuses, each with its own outlets, staff, menu and order queue. Canteens get a live kitchen queue and guaranteed-paid orders; students get their break back.",
    futureScope: "Pre-scheduled orders for fixed break windows, demand forecasting from historical order data, and a canteen-side inventory module.",
    color: "amber"
  },
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
  },
  {
    title: "Poker Game",
    objective: "To build a real-time, low-latency multiplayer poker experience with scalable backend logic and smooth UI interactions.",
    techStack: "React, Socket.io, Express, Node.js, Tailwind CSS, Framer Motion",
    detailedArchitecture: "Uses Socket.io for bi-directional event-driven communication. The Node.js backend manages the complete game state (blinds, pot, betting rounds, deck shuffling) in-memory for maximum speed. The React frontend uses Framer Motion for card animations and state-driven UI updates.",
    businessPerspective: "Demonstrates high-level proficiency in real-time systems and complex state management, applicable to fintech, gaming, and collaborative enterprise tools.",
    futureScope: "Database persistence for global player stats, multi-table tournament support, and a cross-platform mobile version via React Native.",
    color: "amber"
  },
  {
    title: "LabForge",
    objective: "To automate laboratory documentation by programmatically capturing simulations and generating formatted academic reports.",
    techStack: "React, FastAPI, Socket.io, Playwright, Python, docx-gen",
    detailedArchitecture: "Employs a Python/FastAPI worker utilizing Playwright for browser automation and screen capture. Socket.io provides real-time feedback during the generation process. Reports are dynamically assembled into .docx format with standardized templates.",
    businessPerspective: "Solves a significant administrative bottleneck in engineering education, reducing report generation time by 90% and ensuring consistency across documentation.",
    futureScope: "Integration with major simulation platforms like MATLAB and Proteus, AI-powered analysis of simulation results, and cloud-based report archival.",
    color: "sky"
  },
  {
    title: "CrackNIET",
    objective: "To build a stealth, AI-powered exam assistance Chrome extension that works across Iamneo, HackerRank, and NPTEL with zero configuration and free LLM models.",
    techStack: "JavaScript, Chrome Extension API, Manifest V3, OpenRouter AI, Content Scripts, Injection Scripts",
    detailedArchitecture: "Uses a multi-layer architecture: Service Worker handles API calls and message routing, Content Scripts inject into exam platforms with stealth DOM manipulation, and Injection Scripts spoof proctoring signals (NeoExamShield). Supports free/pro auth model with BYOK.",
    businessPerspective: "Addresses a massive student pain point with a free-tier model that drives viral adoption. Pro tier with BYOK enables advanced features while keeping operational costs at zero.",
    futureScope: "Support for more exam platforms, local LLM integration for offline use, and collaborative answer sharing with peer verification.",
    color: "rose"
  },
  {
    title: "Amazon Scraper",
    objective: "To create a high-performance web scraper for Amazon product data with advanced anti-detection and a polished real-time UI.",
    techStack: "Node.js, Express, Puppeteer, Puppeteer Stealth Plugin, JavaScript, HTML/CSS",
    detailedArchitecture: "Puppeteer with stealth plugins for anti-detection, resilient CSS selector fallbacks for Amazon's dynamic DOM, Express backend for scraping orchestration, and a real-time progress UI with live data population and CSV export.",
    businessPerspective: "Enables market research and competitive analysis for e-commerce businesses. Reduces manual data collection time from hours to minutes.",
    futureScope: "Multi-marketplace support (Flipkart, eBay), scheduled scraping with email alerts, and price tracking dashboards.",
    color: "amber"
  },
  {
    title: "CampusQuest",
    objective: "To gamify the campus orientation experience for new students through interactive quests, challenges, and achievements.",
    techStack: "TypeScript, React, Gamification Engine, Location Services",
    detailedArchitecture: "React-based SPA with a custom gamification engine handling quest progression, achievement unlocking, and leaderboard ranking. Location-aware challenges tied to campus landmarks.",
    businessPerspective: "Solves the student orientation problem at scale. Can be white-labeled for any university, creating a B2B SaaS opportunity for educational institutions.",
    futureScope: "AR-powered campus tours, social multiplayer quests, and integration with university LMS for credit-based participation.",
    color: "violet"
  },
  {
    title: "SyllabusAI",
    objective: "To automate study planning by using AI to generate personalized syllabi, schedules, and progress tracking for students.",
    techStack: "Node.js, TypeScript, PostgreSQL, Sequelize ORM, React, Vercel",
    detailedArchitecture: "TypeScript backend with Sequelize ORM for data modeling and migrations on PostgreSQL. AI layer generates study plans based on course metadata and student preferences. React frontend with progress tracking dashboards.",
    businessPerspective: "Targets the EdTech market by reducing the cognitive overhead of study planning. Can be integrated into existing LMS platforms as a plugin.",
    futureScope: "Collaborative study groups, spaced-repetition integration, and AI-powered exam preparation with practice question generation.",
    color: "sky"
  },
  {
    title: "World Express Courier",
    objective: "To give a courier and cargo business its own tracking page instead of sending customers off to nine different partner websites, on infrastructure that costs nothing to run.",
    techStack: "Astro 7 (server output), Cloudflare Workers, Cloudflare D1, Web Crypto, read-excel-file, TypeScript",
    detailedArchitecture: "Marketing pages prerender to static HTML with zero client JavaScript; only tracking, contact and admin run on demand at the edge. Staff create bookings or bulk-import an Excel sheet, the system assigns a structured WEC consignment number, and status updates drive a customer-facing timeline. A partner number for Trackon, DTDC, Blue Dart, Maruti, Shree Tirupati, Ondot, XpressBees, FedEx or DHL is identified by shape and resolved through the official API first, then an authorized public endpoint, falling back to a labelled hand-off button; ambiguous numbers get a chooser and nothing ever auto-redirects. Auth is PBKDF2 hashes plus an HMAC-signed cookie, so no session store is needed. The homepage is 6.6 KB of HTML and 12 KB of CSS.",
    businessPerspective: "Keeps the customer on the company's own domain for the one interaction they repeat most, which is where trust and repeat bookings are won. Running on free-tier Workers and D1 means the platform carries no monthly hosting cost as volume grows.",
    futureScope: "Automated status polling with customer notifications, rate-card quoting, and a pickup-request flow for business accounts.",
    color: "sky"
  },
  {
    title: "Anvaya Coding Lab",
    objective: "To give a college a self-hosted alternative to CodeTantra: locked-scaffold programming questions auto-graded against hidden test cases, without shipping student code to a third party.",
    techStack: "Next.js, PostgreSQL, Drizzle ORM, Docker, Java 21 (Temurin), TypeScript",
    detailedArchitecture: "Student code is treated as hostile by assumption. Every submission runs in a throwaway container with the network off, a read-only filesystem, memory, CPU and PID caps, a non-root user and all Linux capabilities dropped. The locked template lives in Postgres with slot markers; the browser renders it but only ever sends slot contents back, and the server reassembles the source from its own copy — so editing locked code client-side or injecting extra slot keys changes nothing. Test-case delimiters carry a per-run random nonce, so student output cannot forge case boundaries or leak hidden cases. Multi-tenant per college.",
    businessPerspective: "Colleges pay per seat for hosted assessment platforms and still hand over student data. Self-hosting removes the recurring licence cost and keeps submissions inside the institution.",
    futureScope: "SQL grading against the MySQL container already in the compose file, a proctored test mode, and support for languages beyond Java.",
    color: "violet"
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

## 3. SPEEDOEXPRESS (B2B Last-Mile Logistics Platform)
- **Objective:** Build and operate a Delhi NCR last-mile logistics platform as the founding engineer.
- **Role:** Founding Engineer — every architectural decision and every line that shipped.
- **Detailed Tech:** Next.js, React, Supabase (PostgreSQL + PostGIS), Redis, WebSockets/SSE, Leaflet + OpenStreetMap, WhatsApp Business API (AiSensy), Bubblewrap, Razorpay, TypeScript.
- **Live driver GPS tracking (the core systems work):**
  1. Driver coordinates are written to Redis under short TTLs, so a stale position expires by itself instead of lingering as a phantom driver.
  2. Position updates are pushed to watching clients over WebSockets, with SSE as the fallback transport.
  3. Maps render on Leaflet + OpenStreetMap rather than a metered tile provider.
  4. Dispatch and proximity run as PostGIS spatial queries against PostgreSQL.
- **Also shipped:** the driver app now live at driver.speedoexpress.org; a full platform redesign touching 182 files; a WhatsApp-based B2B ordering flow on the WhatsApp Business API; and the platform packaged as an installable PWA and published to the Play Store via Bubblewrap.
- **Production incident:** diagnosed and resolved a Node.js heap-exhaustion crash in production, tracing it from the crash signature back to the allocation responsible.
- **Correctness & security:** server-authoritative state transitions through SECURITY DEFINER RPCs, row-level security default-deny, money stored as integer paise with idempotent settlement, webhook-verified Razorpay payments, and a build-time guard that fails the deploy if a secret reaches the browser bundle.
- **Scale:** 5 applications · 104 API endpoints · 65 screens · 345 automated tests · 4 production environments.
- **Live:** speedoexpress.org, app.speedoexpress.org, driver.speedoexpress.org.

## 4. FITTRACK (AI Nutrition Assistant)
- **Objective:** Frictionless calorie tracking.
- **Detailed Tech:** React Native, Gemini AI (Computer Vision), SQLite.
- **System:** Multi-modal analysis of food images to extract nutritional data automatically.

## 5. ATTENDEASE (Enterprise Attendance)
- **Objective:** Scalable workforce management.
- **Detailed Tech:** React, PostgreSQL (Neon), JWT, Serverless.
- **Database:** Highly normalized schema for complex reporting & audit trails.

## 6. OMNIAI (SaaS Content Gen)
- **Objective:** Automated content production.
- **Detailed Tech:** React, Stripe, OpenAI API.
- **Business:** Subscription model with credit-based usage tracking.

## 7. POKER GAME (Real-time Multiplayer)
- **Objective:** Low-latency multiplayer poker experience.
- **Detailed Tech:** React, Socket.io, Express, Node.js.
- **Architecture:** Bi-directional event communication with in-memory state management.

## 8. LABFORGE (Automated Documentation)
- **Objective:** Programmatic laboratory report generation.
- **Detailed Tech:** FastAPI, Playwright, Socket.io, Python.
- **Architecture:** Browser automation for capturing simulation data and dynamic .docx assembly.

## 9. CRACKNIET (AI Exam Assistant Extension)
- **Objective:** Stealth AI-powered exam assistance across Iamneo, HackerRank, NPTEL.
- **Detailed Tech:** Chrome Extension API, Manifest V3, OpenRouter AI, Content Scripts, Injection Scripts.
- **Architecture:**
  - Service Worker handles API calls and message routing.
  - Content Scripts inject with stealth DOM manipulation.
  - NeoExamShield spoofs proctoring signals.
  - Free/Pro auth model with BYOK (Bring Your Own Key).
- **Features:** Auto-paste, MCQ extraction, chatbot toggling, auto-typing.

## 10. AMAZON SCRAPER (Product Data Scraper)
- **Objective:** High-performance Amazon product data scraping with anti-detection.
- **Detailed Tech:** Node.js, Puppeteer + Stealth Plugin, Express.
- **Architecture:** Resilient CSS selector fallbacks, real-time progress UI, CSV export.

## 11. CAMPUSQUEST (Campus Exploration Game)
- **Objective:** Gamified campus orientation for new students.
- **Detailed Tech:** TypeScript, React, Gamification Engine.
- **Features:** Quest progression, achievements, leaderboards, location-aware challenges.

## 12. SYLLABUSAI (AI Study Planner)
- **Objective:** AI-powered syllabus generation and study scheduling.
- **Detailed Tech:** Node.js, TypeScript, PostgreSQL, Sequelize ORM.
- **Architecture:** AI generates personalized study plans, progress tracking dashboards.

## 13. BITESITE (Multi-Tenant Campus Canteen SaaS)
- **Objective:** Let students pre-order and pay for canteen food from class instead of queueing.
- **Detailed Tech:** Java 21, Spring Boot 3.5, Spring JDBC (not JPA, by design), MySQL 8, Flyway, Spring Security, Spring Session JDBC, Razorpay Java SDK, two Android apps.
- **Architecture:**
  1. Account-based multi-tenancy — the tenant is read from the authenticated principal, never from a URL, subdomain or client value.
  2. Every tenant-scoped table carries tenant_id and every DAO method requires it as an argument.
  3. Tenant isolation is proven by a test suite running against a real MySQL instance in CI.
  4. Payment is mandatory before the kitchen sees an order; client callback and server webhook converge on one idempotent confirmPayment.
  5. OrderStatus.canTransitionTo is the single source of truth for legal order transitions.
  6. Sessions live in MySQL, so restarts and horizontal scaling do not log users out.
- **Live:** bitesite.in (marketing), app.bitesite.in (students), outlet.bitesite.in (canteen staff).

## 14. WORLD EXPRESS COURIER (Courier & Cargo Tracking)
- **Objective:** Give a courier business its own tracking page instead of sending customers to nine partner websites.
- **Detailed Tech:** Astro 7 (server output), Cloudflare Workers, Cloudflare D1, Web Crypto (PBKDF2 + HMAC cookies), Excel import/export.
- **Architecture:** Marketing pages prerender with zero client JS; only tracking, contact and admin run at the edge. Staff book or bulk-import consignments and post status updates; partner numbers for Trackon, DTDC, Blue Dart, Maruti, Shree Tirupati, Ondot, XpressBees, FedEx and DHL are identified and resolved in-page, with a labelled hand-off when an API is unavailable. No session store needed.
- **Performance:** 6.6 KB homepage HTML + 12 KB CSS, no JavaScript. Runs entirely on Cloudflare free tier.
- **Live:** worldexpress.in

## 15. ANVAYA CODING LAB (Self-Hosted Assessment Platform)
- **Objective:** A self-hosted CodeTantra alternative for a college — locked-scaffold questions graded against hidden test cases.
- **Detailed Tech:** Next.js, PostgreSQL, Drizzle ORM, Docker sandboxing, Java 21 runner.
- **Security model (student code is hostile by assumption):**
  1. Every submission runs in a throwaway container: network off, read-only filesystem, memory/CPU/PID caps, non-root, all capabilities dropped.
  2. Locked templates live server-side with slot markers; the client only sends slot contents and the server reassembles the source, so client-side tampering is inert.
  3. Test-case delimiters carry a per-run random nonce, so student output cannot forge case boundaries or leak hidden cases.
- **Tenancy:** Multi-tenant per college.
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
                  "How does SpeedoExpress track drivers live?",
                  "How is BiteSite's tenant isolation enforced?",
                  "Explain Attestr's forensic layer",
                  "How does CodePilot orchestrate agents?"
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
