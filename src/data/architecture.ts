// Architecture notes for the "How it works" page. The chat API reads these on the
// server too, so the browser never supplies prompt text.

export interface ArchitectureNote {
  id: string;
  title: string;
  objective: string;
  stack: string;
  architecture: string;
  why: string;
  next: string;
}

export const details: ArchitectureNote[] = [
  {
    id: "speedoexpress",
    title: "SpeedoExpress",
    objective: "To build and operate a B2B last-mile logistics platform for Delhi NCR as the founding engineer, from an empty repository to a live product with businesses, drivers and fleet owners on it.",
    stack: "Next.js, React, Supabase (PostgreSQL + PostGIS), Redis, WebSockets/SSE, Leaflet + OpenStreetMap, WhatsApp Business API (AiSensy), Bubblewrap, TypeScript",
    architecture: "The hard half is live driver tracking. Driver clients publish coordinates that land in Redis under short TTLs, so a stale position expires on its own rather than lingering as a phantom driver; updates are pushed to watching customers over WebSockets with an SSE fallback, and the map renders on Leaflet + OpenStreetMap instead of a metered tile provider. Dispatch and proximity run as PostGIS spatial queries against PostgreSQL. On top of that: a driver app live at driver.speedoexpress.org, a 182-file platform redesign, a WhatsApp-based B2B ordering flow on the WhatsApp Business API, and the whole thing packaged as an installable PWA and shipped to the Play Store via Bubblewrap. Booking state transitions run server-side through SECURITY DEFINER RPCs, row-level security is default-deny, and money is stored as integer paise with idempotent settlement. One production incident stands out: a Node.js heap-exhaustion crash traced from the crash signature back to the allocation that caused it, then fixed.",
    why: "Replaces phone-and-spreadsheet dispatch with a platform that quotes, assigns, tracks and settles on its own, so the operation scales without adding coordinators. Ordering over WhatsApp meets Indian B2B customers where they already are, with no app install required.",
    next: "Promotion from Play closed testing to a staged production rollout, demand-based surge pricing, and a partner API for campus-to-business delivery volume.",
  },
  {
    id: "bitesite",
    title: "BiteSite",
    objective: "To remove the lunch-break queue at college canteens by letting students order and pay from class, while staying multi-tenant enough to onboard any number of colleges without a redeploy.",
    stack: "Java 21, Spring Boot 3.5, Spring JDBC, MySQL 8, Flyway, Spring Security, Spring Session JDBC, Razorpay, Android",
    architecture: "Account-based multi-tenancy: every tenant-scoped table carries a tenant_id, and which college a request sees is derived from the authenticated principal, never from a URL, subdomain or client-supplied value. A TenantResolutionInterceptor sets the tenant context after authentication and every DAO method requires the tenant id as an argument, so guessing an internal ID gets a user nowhere, proven by an isolation suite that runs against a real MySQL instance in CI. Payment is mandatory before the kitchen sees an order: the Razorpay client callback and the server webhook both converge on one idempotent confirmPayment, and OrderStatus.canTransitionTo is the single source of truth for legal transitions. Sessions live in MySQL via Spring Session JDBC, so a restart or a second instance behind a load balancer does not log anyone out.",
    why: "Sells per college rather than per app install: one deployment serves many campuses, each with its own outlets, staff, menu and order queue. Canteens get a live kitchen queue and guaranteed-paid orders; students get their break back.",
    next: "Pre-scheduled orders for fixed break windows, demand forecasting from historical order data, and a canteen-side inventory module.",
  },
  {
    id: "world-express-courier",
    title: "World Express Courier",
    objective: "To give a courier and cargo business its own tracking page instead of sending customers off to nine different partner websites, on infrastructure that costs nothing to run.",
    stack: "Astro 7 (server output), Cloudflare Workers, Cloudflare D1, Web Crypto, read-excel-file, TypeScript",
    architecture: "Marketing pages prerender to static HTML with zero client JavaScript; only tracking, contact and admin run on demand at the edge. Staff create bookings or bulk-import an Excel sheet, the system assigns a structured WEC consignment number, and status updates drive a customer-facing timeline. A partner number for Trackon, DTDC, Blue Dart, Maruti, Shree Tirupati, Ondot, XpressBees, FedEx or DHL is identified by shape and resolved through the official API first, then an authorized public endpoint, falling back to a labelled hand-off button; ambiguous numbers get a chooser and nothing ever auto-redirects. Auth is PBKDF2 hashes plus an HMAC-signed cookie, so no session store is needed. The homepage is 6.6 KB of HTML and 12 KB of CSS.",
    why: "Keeps the customer on the company's own domain for the one interaction they repeat most, which is where trust and repeat bookings are won. Running on free-tier Workers and D1 means the platform carries no monthly hosting cost as volume grows.",
    next: "Automated status polling with customer notifications, rate-card quoting, and a pickup-request flow for business accounts.",
  },
  {
    id: "anvaya-coding-lab",
    title: "Anvaya Coding Lab",
    objective: "To give a college a self-hosted alternative to CodeTantra: locked-scaffold programming questions auto-graded against hidden test cases, without shipping student code to a third party.",
    stack: "Next.js, PostgreSQL, Drizzle ORM, Docker, Java 21 (Temurin), TypeScript",
    architecture: "Student code is treated as hostile by assumption. Every submission runs in a throwaway container with the network off, a read-only filesystem, memory, CPU and PID caps, a non-root user and all Linux capabilities dropped. The locked template lives in Postgres with slot markers; the browser renders it but only ever sends slot contents back, and the server reassembles the source from its own copy, so editing locked code client-side or injecting extra slot keys changes nothing. Test-case delimiters carry a per-run random nonce, so student output cannot forge case boundaries or leak hidden cases. Multi-tenant per college.",
    why: "Colleges pay per seat for hosted assessment platforms and still hand over student data. Self-hosting removes the recurring licence cost and keeps submissions inside the institution.",
    next: "SQL grading against the MySQL container already in the compose file, a proctored test mode, and support for languages beyond Java.",
  },
  {
    id: "attestr",
    title: "Attestr",
    objective: "To make tampered media detectable: fingerprint a file when it is registered, anchor the fingerprint on a public chain, and check any later copy against it.",
    stack: "Solidity, React, Hardhat, Firebase, Three.js, Ethers.js, Python (AI Models), Chrome Extension API",
    architecture: "Registration computes a perceptual hash, which survives resizing and recompression, and records it through a Solidity contract on Ethereum Sepolia, giving an immutable timestamp of origin. Verification re-hashes the file and compares; Error Level Analysis highlights regions that were edited after capture, and a deepfake-detection model gives a first screen. Hashing runs client-side, so the original file never has to be uploaded. The same checks are exposed through a Chrome extension and a REST API.",
    why: "Newsrooms, legal teams and platforms need a cheap way to show a piece of media is the one that was originally published. A public-chain record is verifiable by anyone without trusting the operator.",
    next: "In-browser verification while reading, and a mobile capture app that registers media at the moment it is taken.",
  },
  {
    id: "codepilot",
    title: "CodePilot",
    objective: "To give an AI model safe, reviewable access to a local codebase from the terminal, without tying the tool to a single model provider.",
    stack: "TypeScript, Node.js, AI SDK (Vercel), Ink (CLI UI), Zod, Anthropic/OpenAI APIs, File System API",
    architecture: "Employs a 'Planner-Executor' architecture. The 'Planner' agent analyzes the codebase and user request to create a step-by-step strategy, while specialized 'Executor' agents perform file reads, writes, and shell commands. Implements parallel sub-agents for faster execution.",
    why: "Keeps the agent useful whichever provider a team already pays for, including fully local models through Ollama when code cannot leave the machine.",
    next: "Self-healing CI integration, richer diff review before writes, and editor extensions.",
  },
];

export const architectureContext = details
  .map((p) => `## ${p.title}\nObjective: ${p.objective}\nStack: ${p.stack}\nArchitecture: ${p.architecture}\nWhy it matters: ${p.why}\nNext: ${p.next}`)
  .join('\n\n');
