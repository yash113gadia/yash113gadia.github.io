import { motion } from 'framer-motion';

// Technology data with icons (using CDN for dev icons)
const technologies = [
  { name: 'TypeScript', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg' },
  { name: 'React', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg' },
  { name: 'Next.js', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg', invert: true },
  { name: 'Node.js', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg' },
  { name: 'Python', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg' },
  { name: 'PostgreSQL', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg' },
  { name: 'MongoDB', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg' },
  { name: 'Firebase', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/firebase/firebase-plain.svg' },
  { name: 'Docker', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg' },
  { name: 'Tailwind', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg' },
  { name: 'Git', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg' },
  { name: 'Java', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg' },
  { name: 'Express', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg', invert: true },
  { name: 'FastAPI', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/fastapi/fastapi-original.svg' },
  { name: 'SQLite', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/sqlite/sqlite-original.svg' },
  { name: 'Figma', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/figma/figma-original.svg' },
];

const TechMarquee = () => {
  // Duplicate the array for seamless loop
  const doubledTech = [...technologies, ...technologies];

  return (
    <div className="w-full overflow-hidden py-4">
      {/* First row - moves left */}
      <div className="relative mb-4">
        <motion.div
          className="flex gap-6"
          animate={{
            x: [0, -50 * technologies.length],
          }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 25,
              ease: "linear",
            },
          }}
        >
          {doubledTech.map((tech, index) => (
            <div
              key={`${tech.name}-${index}`}
              className="flex items-center gap-3 px-4 py-2 bg-neutral-800/50 rounded-full border border-neutral-700/50 hover:border-emerald-500/50 hover:bg-neutral-800 transition-all duration-300 flex-shrink-0 group"
            >
              <img
                src={tech.icon}
                alt={tech.name}
                className={`w-6 h-6 ${tech.invert ? 'invert' : ''} group-hover:scale-110 transition-transform`}
              />
              <span className="text-sm text-neutral-300 whitespace-nowrap group-hover:text-emerald-400 transition-colors">
                {tech.name}
              </span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Second row - moves right */}
      <div className="relative">
        <motion.div
          className="flex gap-6"
          animate={{
            x: [-50 * technologies.length, 0],
          }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 25,
              ease: "linear",
            },
          }}
        >
          {doubledTech.reverse().map((tech, index) => (
            <div
              key={`${tech.name}-rev-${index}`}
              className="flex items-center gap-3 px-4 py-2 bg-neutral-800/50 rounded-full border border-neutral-700/50 hover:border-violet-500/50 hover:bg-neutral-800 transition-all duration-300 flex-shrink-0 group"
            >
              <img
                src={tech.icon}
                alt={tech.name}
                className={`w-6 h-6 ${tech.invert ? 'invert' : ''} group-hover:scale-110 transition-transform`}
              />
              <span className="text-sm text-neutral-300 whitespace-nowrap group-hover:text-violet-400 transition-colors">
                {tech.name}
              </span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Gradient overlays for fade effect */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-neutral-950 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-neutral-950 to-transparent" />
    </div>
  );
};

export default TechMarquee;
