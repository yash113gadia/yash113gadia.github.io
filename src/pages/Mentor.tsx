import { motion } from 'framer-motion';
import { Rocket, Shield, MessageSquare, Coffee, GraduationCap, ArrowRight, Bot } from 'lucide-react';
import Contact from '../components/Contact';
import Marquee from '../components/Marquee';

const Mentor = () => {
  const mentorOfferings = [
    {
      title: "AI Agents & Automation",
      description: "Learn to build autonomous coding agents like CodePilot CLI. Master LLM orchestration, parallel sub-agents, and building tools that actually save developers time.",
      icon: Bot,
      color: "from-emerald-500 to-green-500"
    },
    {
      title: "Production Marketplaces",
      description: "Insights from building Qlaa (ArtistConnect). Master complex onboarding flows, payment integrations with Razorpay, and real-time communication systems.",
      icon: Rocket,
      color: "from-cyan-500 to-blue-500"
    },
    {
      title: "Web3 & Security",
      description: "Deep dive into decentralized systems based on my work with Attestr. Learn Solidity, media authentication, and building tamper-proof AI detection systems.",
      icon: Shield,
      color: "from-amber-500 to-orange-500"
    },
    {
      title: "Full-Stack Architecture",
      description: "From database normalization in PostgreSQL to scalable serverless APIs. Build systems that handle real users and production-level traffic.",
      icon: GraduationCap,
      color: "from-violet-500 to-purple-500"
    }
  ];

  return (
    <div className="min-h-screen bg-bg text-white pt-32">
      <div className="container mx-auto px-6 max-w-7xl">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <span className="text-emerald-400 font-mono text-sm tracking-wider uppercase">{'// Mentorship'}</span>
          <h1 className="text-4xl md:text-6xl font-bold mt-4 mb-6">
            Grow Faster with <br />
            <span className="text-gradient-accent">Personalized Mentorship</span>
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg font-light leading-relaxed">
            I've spent years building complex systems and helping others do the same. 
            Now, I'm opening up limited slots to help you reach your full potential in tech.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mt-10">
            <a 
              href="https://wa.me/919950094483?text=Hi%20Yash,%20I'm%20interested%20in%20your%20mentorship%20program!" 
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-full transition-all flex items-center gap-2"
            >
              Book a Session <ArrowRight size={18} />
            </a>
            <a 
              href="#offerings" 
              className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all"
            >
              View Offerings
            </a>
          </div>
        </motion.div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20">
          {[
            { label: "Students Helped", value: "80+" },
            { label: "Mentorship Sessions", value: "50+" },
            { label: "Projects Guided", value: "10+" },
            { label: "Success Rate", value: "95%" }
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="glass-scifi p-6 rounded-2xl text-center"
            >
              <div className="text-2xl md:text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-xs text-slate-500 uppercase tracking-widest">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Offerings Grid */}
        <div id="offerings" className="mb-32">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold">What I Offer</h2>
            <div className="h-1 w-20 bg-emerald-500 mx-auto mt-4 rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mentorOfferings.map((offering, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
                whileHover={{ y: -5 }}
                className="group glass-scifi p-8 rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${offering.color} p-0.5 mb-6`}>
                  <div className="w-full h-full rounded-[10px] bg-slate-900 flex items-center justify-center">
                    <offering.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3 text-white group-hover:text-emerald-400 transition-colors">
                  {offering.title}
                </h3>
                <p className="text-slate-400 leading-relaxed font-light">
                  {offering.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="glass-scifi p-10 md:p-16 rounded-[2rem] border border-emerald-500/20 relative overflow-hidden mb-32">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] -mr-32 -mt-32" />
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to build the future?</h2>
            <p className="text-slate-400 text-lg mb-8 font-light">
              Whether you're a beginner or looking to level up your existing skills, I'm here to help you navigate the world of AI automation and intelligent software engineering.
            </p>
            <div className="flex flex-wrap gap-4">
              <a 
                href="https://wa.me/919950094483?text=Hi%20Yash,%20I'd%20like%20to%20inquire%20about%20mentorship." 
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-emerald-400 transition-all flex items-center gap-2"
              >
                <MessageSquare size={18} />
                Send an Inquiry
              </a>
              <div className="flex items-center gap-2 text-slate-500 px-4 py-3">
                <Coffee size={18} className="text-amber-400" />
                <span>Limited slots available</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Marquee text="MENTORSHIP • GUIDANCE • GROWTH •" speed={15} className="py-12 opacity-50" />
      <Contact />
    </div>
  );
};

export default Mentor;
