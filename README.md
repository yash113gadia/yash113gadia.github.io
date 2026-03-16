# Portfolio — Yash Gadia

**[yashgadia.vercel.app](https://yashgadia.vercel.app)**

A 3D animated personal portfolio built with React, Three.js, and a bunch of stuff I probably didn't need but added anyway.

## Features

- Interactive 3D elements with physics (React Three Fiber + Rapier)
- Scroll-driven animations and smooth scrolling via Lenis
- Custom cursor — the default one isn't cool enough
- AI chatbot with personality modes (Professional, GenZ, Boomer, Stoned) powered by Gemini
- Floating orbs, grain overlay, typewriter hero text
- Project showcase with view tracking
- Contact form that saves to Firestore
- Page view analytics via Firebase

## Tech Stack

**Frontend**
- React 19, TypeScript, Vite 7
- Three.js, React Three Fiber, Rapier (physics), Matter.js
- Framer Motion, Tailwind CSS, Lenis

**Backend**
- Express 5
- Firebase (Auth, Firestore, Analytics)
- Google Gemini AI

## Getting Started

```bash
# install dependencies
npm install

# start dev server
npm run dev

# production build
npm run build
```

You'll need Firebase credentials and a Gemini API key — set those up in your environment before running.

## Design

Dark theme. Space Grotesk + JetBrains Mono. Emerald accents. Grain texture overlay. That's the vibe.

## Deployment

Hosted on Vercel. Push to main and it deploys.

---

Built by [Yash Gadia](https://yashgadia.vercel.app)
