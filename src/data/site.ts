// Single source for everything the portfolio says about Yash.
// Numbers here are the ones Yash has stated publicly (resume / chatbot knowledge base);
// don't add new figures without a source.

export const profile = {
  name: 'Yash Gadia',
  role: 'Full-stack engineer',
  email: 'yash113gadia@gmail.com',
  whatsapp: 'https://wa.me/919950094483',
  github: 'https://github.com/yash113gadia',
  linkedin: 'https://linkedin.com/in/yashgadia',
  resume: '/Yash_Gadia_Resume.pdf',
  location: 'Greater Noida, India',
};

export interface Link {
  label: string;
  href: string;
}

export interface FeaturedProject {
  id: string;
  title: string;
  kind: string;
  summary: string;
  highlights: string[];
  stats?: { value: string; label: string }[];
  tech: string[];
  image?: string;
  /** Intrinsic pixel size, so the card can show the capture uncropped. */
  imageSize?: [number, number];
  imageAlt?: string;
  links: Link[];
}

export const featured: FeaturedProject[] = [
  {
    id: 'speedoexpress',
    title: 'SpeedoExpress',
    kind: 'B2B last-mile logistics, Delhi NCR',
    summary:
      'Founding engineer. Took the platform from an empty repository to production with businesses, drivers and fleet owners on it.',
    highlights: [
      'Live driver GPS: coordinates in Redis under short TTLs, pushed over WebSockets with an SSE fallback, dispatch as PostGIS spatial queries.',
      'Driver app live at driver.speedoexpress.org, WhatsApp B2B ordering, and a PWA shipped to the Play Store with Bubblewrap.',
      'Traced a production Node.js heap-exhaustion crash from its signature back to the allocation, then fixed it.',
    ],
    stats: [
      { value: '104', label: 'API endpoints' },
      { value: '345', label: 'automated tests' },
      { value: '5', label: 'applications' },
      { value: '182', label: 'files in the redesign' },
    ],
    tech: ['Next.js', 'Supabase', 'PostGIS', 'Redis', 'WebSockets', 'Razorpay'],
    image: '/speedoexpress-card.webp',
    imageSize: [1280, 628],
    imageAlt: 'SpeedoExpress homepage with a delivery estimate form over a photo of a loading truck',
    links: [{ label: 'speedoexpress.org', href: 'https://www.speedoexpress.org' }],
  },
  {
    id: 'bitesite',
    title: 'BiteSite',
    kind: 'Multi-tenant canteen SaaS',
    summary:
      'Students order and pay from class, then collect without queueing. One deployment serves many colleges.',
    highlights: [
      'The tenant comes from the authenticated principal, never the URL. An isolation suite proves it against real MySQL in CI.',
      'Razorpay callback and webhook converge on one idempotent confirmPayment.',
    ],
    tech: ['Java 21', 'Spring Boot', 'MySQL', 'Flyway', 'Android'],
    image: '/bitesite-preview.webp',
    imageSize: [1280, 720],
    imageAlt: 'BiteSite homepage reading "Skip the queue. Keep your break." next to an illustrated ramen bowl',
    links: [
      { label: 'bitesite.in', href: 'https://www.bitesite.in' },
      { label: 'Source', href: 'https://github.com/yash113gadia/bitesite-web' },
    ],
  },
  {
    id: 'attestr',
    title: 'Attestr',
    kind: 'Media provenance on Ethereum',
    summary:
      'Built at Innovate Bharat Hackathon 2026. Fingerprints media and anchors it on-chain so tampering can be detected later.',
    highlights: [
      'Perceptual hashing survives resizing and recompression; Error Level Analysis flags edited regions.',
      'Solidity contracts on Sepolia, a Chrome extension and a REST API.',
    ],
    tech: ['Solidity', 'Hardhat', 'React', 'Ethers.js'],
    image: '/attestr-preview.webp',
    imageSize: [1200, 691],
    imageAlt: 'Attestr landing page reading "Prove what\'s real."',
    links: [
      { label: 'Live demo', href: 'https://hackathon-six-eosin.vercel.app' },
      { label: 'Source', href: 'https://github.com/yash113gadia/attestr' },
    ],
  },
  {
    id: 'codepilot',
    title: 'CodePilot',
    kind: 'AI coding agent for the terminal',
    summary:
      'Provider-agnostic agent CLI: Anthropic, OpenAI, Google or a local Ollama model, with plan mode and parallel sub-agents.',
    highlights: ['Terminal UI in Ink, tool schemas in Zod, model calls through the Vercel AI SDK.'],
    tech: ['TypeScript', 'Ink', 'AI SDK', 'Zod'],
    links: [{ label: 'Source', href: 'https://github.com/yash113gadia/CodePilot' }],
  },
];

export interface MinorProject {
  title: string;
  blurb: string;
  tech: string[];
  href?: string;
  source?: string;
}

export const moreProjects: { group: string; items: MinorProject[] }[] = [
  {
    group: 'Client work',
    items: [
      {
        title: 'World Express Courier',
        blurb:
          'Courier platform on Cloudflare’s free tier. Tracks WEC numbers and 9 partner couriers in-page. 6.6 KB homepage, zero client JS.',
        tech: ['Astro', 'Workers', 'D1'],
        href: 'https://worldexpress.in',
      },
      {
        title: 'Anvaya Coding Lab',
        blurb:
          'Self-hosted assessment platform. Java submissions graded in throwaway Docker containers: no network, read-only, non-root.',
        tech: ['Next.js', 'Postgres', 'Docker'],
      },
    ],
  },
  {
    group: 'Products and experiments',
    items: [
      {
        title: 'FitTrack',
        blurb: 'Nutrition tracker with Gemini food recognition and barcode scanning. Offline-first on SQLite.',
        tech: ['React Native', 'Expo', 'Gemini'],
        source: 'https://github.com/yash113gadia/FitTrack',
      },
      {
        title: 'AttendEase',
        blurb: 'Attendance platform with JWT auth, a normalized Postgres schema and an analytics dashboard.',
        tech: ['React', 'Postgres', 'Vercel'],
        href: 'https://attendease-web-eight.vercel.app',
        source: 'https://github.com/yash113gadia/AttendEase-Web',
      },
      {
        title: 'SyllabusAI',
        blurb: 'Paste a syllabus, get a study plan with daily schedules and progress tracking.',
        tech: ['Node.js', 'TypeScript', 'Postgres'],
        href: 'https://client-theta-woad.vercel.app',
        source: 'https://github.com/yash113gadia/SyllabusAI',
      },
      {
        title: 'Poker',
        blurb: 'Real-time multiplayer poker. Game state lives on an Express server, synced over Socket.io.',
        tech: ['React', 'Socket.io'],
        source: 'https://github.com/yash113gadia/poker-game',
      },
      {
        title: 'LabForge',
        blurb: 'Generates personalised lab .docx reports, with Playwright screenshots and live progress over WebSockets.',
        tech: ['FastAPI', 'Playwright'],
      },
      {
        title: 'CampusQuest',
        blurb: 'Campus orientation as a game: quests, achievements and challenges for new students.',
        tech: ['React', 'TypeScript'],
        source: 'https://github.com/yash113gadia/CampusQuest',
      },
    ],
  },
];

export interface Role {
  title: string;
  org: string;
  period: string;
  detail: string;
}

export const experience: Role[] = [
  {
    title: 'Founding Engineer',
    org: 'SpeedoExpress',
    period: '2026 - now',
    detail: 'Live tracking, dispatch, payments and the driver app for a Delhi NCR logistics platform, from first commit to production.',
  },
  {
    title: 'Founder',
    org: 'Anvaya Labs',
    period: '2026 - now',
    detail: 'Udyam-registered software studio. Scoping, delivery and handover for client platforms like World Express Courier.',
  },
  {
    title: 'Lead Developer',
    org: 'BiteSite',
    period: '2026',
    detail: 'Designed and built the multi-tenant canteen platform and its two Android apps.',
  },
  {
    title: 'Vice President',
    org: 'Conventus, NIET MUN & Debate Society',
    period: '2025 - 2026',
    detail: 'Ran VARTALAB (6 days, ~125 participants, zero budget) and CMUN across 5 committees.',
  },
  {
    title: 'Freelance Game Developer',
    org: 'Roblox',
    period: '2025',
    detail: 'Gameplay systems in Lua for client commissions.',
  },
];

export const education = {
  degree: 'Integrated B.Tech + M.Tech, Computer Science',
  school: 'NIET, Greater Noida',
  period: '2024 - 2029',
};

export const recognition: { what: string; where: string }[] = [
  { what: 'Rank 6 of 150+', where: 'Techvanya 2.0 Promptathon, GLA University' },
  { what: 'Top 43 of 500+', where: 'MIT Pune startup event' },
  { what: '1st, 54 teams', where: 'Voice & Verdict debate' },
];

export const stack: { area: string; items: string[] }[] = [
  { area: 'Languages', items: ['TypeScript', 'Java', 'Python', 'SQL', 'C++', 'Solidity'] },
  { area: 'Frontend', items: ['React', 'Next.js', 'React Native', 'Tailwind', 'Astro'] },
  { area: 'Backend', items: ['Node.js', 'Spring Boot', 'FastAPI', 'WebSockets', 'Cloudflare Workers'] },
  { area: 'Data', items: ['PostgreSQL + PostGIS', 'MySQL', 'Redis', 'Supabase', 'D1'] },
  { area: 'Ops', items: ['Docker', 'GitHub Actions', 'Flyway', 'Vercel', 'Azure'] },
];
