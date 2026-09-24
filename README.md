# Portfolio: Yash Gadia

**[yashgadia.vercel.app](https://yashgadia.vercel.app)**

Personal site. The hero is a live dispatch simulation in the spirit of SpeedoExpress: drivers move on a generated street graph, position trails expire on a TTL, and clicking the map sends the nearest driver by road distance (Dijkstra) to a pickup.

## Stack

- React 19, TypeScript, Vite 7, Tailwind CSS 3
- Framer Motion for scroll-linked motion (stacking project cards, timeline, reveals), all disabled under `prefers-reduced-motion`
- Canvas 2D for the dispatch map (`src/components/LiveMap.tsx`), paused when off-screen
- Firebase Firestore for the contact form and project view counts, loaded on demand
- Groq (Llama 3.3) chatbot behind `/api/chat`

## Layout

- `src/data/site.ts`: all profile and project copy
- `src/data/architecture.ts`: the "How it works" notes, also used by the chatbot
- `src/server/chat.ts`: chat prompt and Groq call, shared by `api/chat.ts` (Vercel), `netlify/functions/chat.ts` and the dev server
- `firestore.rules`: contact form shape validation; view counters can only go up by one

## Running it

```bash
npm install
cp .env.example .env   # add GROQ_API_KEY and the VITE_FIREBASE_* values
npm run dev            # serves /api/chat locally too
npm run build
```

Hosted on Vercel; pushing to `main` deploys. Firestore rules deploy separately with `firebase deploy --only firestore:rules`.
