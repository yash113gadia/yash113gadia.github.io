import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

// Floating code symbols and tech icons
const floatingItems = [
  { symbol: '</>', x: '10%', y: '20%', size: 24, delay: 0 },
  { symbol: '{ }', x: '85%', y: '15%', size: 28, delay: 0.5 },
  { symbol: '( )', x: '80%', y: '70%', size: 20, delay: 1 },
  { symbol: '[]', x: '15%', y: '75%', size: 22, delay: 1.5 },
  { symbol: '=>', x: '90%', y: '45%', size: 26, delay: 2 },
  { symbol: '&&', x: '5%', y: '50%', size: 18, delay: 0.3 },
  { symbol: '++', x: '75%', y: '85%', size: 20, delay: 0.8 },
  { symbol: '/**/', x: '20%', y: '90%', size: 16, delay: 1.2 },
];

// Floating orbs with gradients
const floatingOrbs = [
  { x: '70%', y: '20%', size: 300, color: 'emerald', delay: 0 },
  { x: '20%', y: '60%', size: 200, color: 'violet', delay: 0.5 },
  { x: '80%', y: '70%', size: 150, color: 'amber', delay: 1 },
];

export const FloatingCodeSymbols = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {floatingItems.map((item, index) => (
        <motion.div
          key={index}
          className="absolute font-mono text-neutral-800/30 select-none"
          style={{
            left: item.x,
            top: item.y,
            fontSize: item.size,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: [0.2, 0.4, 0.2],
            scale: 1,
            y: [0, -20, 0],
            rotate: [0, 5, -5, 0]
          }}
          transition={{
            opacity: { duration: 4, repeat: Infinity, delay: item.delay },
            scale: { duration: 0.5, delay: item.delay },
            y: { duration: 6, repeat: Infinity, delay: item.delay },
            rotate: { duration: 8, repeat: Infinity, delay: item.delay }
          }}
        >
          {item.symbol}
        </motion.div>
      ))}
    </div>
  );
};

export const FloatingOrbs = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {floatingOrbs.map((orb, index) => (
        <motion.div
          key={index}
          className={`absolute rounded-full blur-3xl opacity-20`}
          style={{
            left: orb.x,
            top: orb.y,
            width: orb.size,
            height: orb.size,
            background: orb.color === 'emerald' 
              ? 'radial-gradient(circle, rgba(16,185,129,0.4) 0%, transparent 70%)'
              : orb.color === 'violet'
              ? 'radial-gradient(circle, rgba(139,92,246,0.4) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(245,158,11,0.3) 0%, transparent 70%)',
            transform: 'translate(-50%, -50%)',
          }}
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 30, 0],
            y: [0, -20, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            delay: orb.delay,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
};

// Animated grid background
export const AnimatedGrid = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.03]">
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-emerald-500/20 via-transparent to-transparent"
        animate={{
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </div>
  );
};

// Particle field effect - reduced count for performance
export const ParticleField = () => {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; size: number; duration: number; delay: number }>>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setParticles(Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 10 + 10,
      delay: Math.random() * 5,
    })));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-emerald-400/30"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
          }}
          animate={{
            y: [0, -100, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "linear"
          }}
        />
      ))}
    </div>
  );
};

// Animated lines connecting points
export const ConnectionLines = () => {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-10">
      <motion.line
        x1="10%"
        y1="20%"
        x2="30%"
        y2="40%"
        stroke="url(#lineGradient)"
        strokeWidth="1"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: [0, 1, 0] }}
        transition={{ duration: 4, repeat: Infinity, delay: 0 }}
      />
      <motion.line
        x1="70%"
        y1="15%"
        x2="85%"
        y2="45%"
        stroke="url(#lineGradient)"
        strokeWidth="1"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: [0, 1, 0] }}
        transition={{ duration: 4, repeat: Infinity, delay: 1 }}
      />
      <motion.line
        x1="20%"
        y1="80%"
        x2="40%"
        y2="60%"
        stroke="url(#lineGradient)"
        strokeWidth="1"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: [0, 1, 0] }}
        transition={{ duration: 4, repeat: Infinity, delay: 2 }}
      />
      <defs>
        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
    </svg>
  );
};
