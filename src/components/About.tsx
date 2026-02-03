import { MapPin, GraduationCap, Rocket, Trophy } from 'lucide-react';
import { ScrollTextReveal } from './TextReveal';
import TechMarquee from './TechMarquee';
import ChatbotInline from './ChatbotInline';

const About = () => {
  return (
    <section id="about" className="py-24 px-6 md:px-12 lg:px-24">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="mb-16 animate-fade-in-up">
          <span className="text-emerald-400 font-mono text-sm">01.</span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mt-2">About Me</h2>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Main Bio Card - Large */}
          <div
            className="bento-card md:col-span-2 lg:col-span-2 lg:row-span-2 animate-fade-in-up"
            style={{ animationDelay: '0.1s' }}
          >
            <div className="h-full flex flex-col justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  Crafting modern<br />
                  <span className="text-emerald-400">web experiences</span>
                </h3>
                <ScrollTextReveal 
                  text="I'm a full-stack developer passionate about creating products that solve real problems. I've built multiple marketplace platforms, enterprise applications, and AI-powered tools from the ground up."
                  className="text-neutral-400 leading-relaxed mb-4"
                />
                <ScrollTextReveal 
                  text="My expertise lies in designing scalable architectures, normalized database schemas, and intuitive user experiences. I believe in writing clean, maintainable code that stands the test of time."
                  className="text-neutral-500 leading-relaxed"
                />
              </div>
              <div className="flex gap-4 mt-6">
                <div className="flex items-center gap-2 text-sm text-neutral-500">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  Greater Noida, India
                </div>
              </div>
            </div>
          </div>

          {/* Education Card */}
          <div
            className="bento-card accent-violet animate-fade-in-up"
            style={{ animationDelay: '0.2s' }}
          >
            <GraduationCap className="w-8 h-8 text-violet-400 mb-4" />
            <h4 className="text-white font-semibold mb-1">B.Tech + M.Tech</h4>
            <p className="text-sm text-neutral-400">Computer Science</p>
            <p className="text-xs text-neutral-500 mt-2">NIET 2024-2029</p>
          </div>

          {/* Projects Card */}
          <div
            className="bento-card accent-emerald animate-fade-in-up"
            style={{ animationDelay: '0.3s' }}
          >
            <Rocket className="w-8 h-8 text-emerald-400 mb-4" />
            <h4 className="text-white font-semibold mb-1">10+ Projects</h4>
            <p className="text-sm text-neutral-400">Full-Stack Applications</p>
            <p className="text-xs text-neutral-500 mt-2">Marketplaces, AI Tools, Apps</p>
          </div>

          {/* Achievement Card */}
          <div
            className="bento-card accent-amber animate-fade-in-up"
            style={{ animationDelay: '0.4s' }}
          >
            <Trophy className="w-8 h-8 text-amber-400 mb-4" />
            <div className="space-y-3">
              <div>
                <h4 className="text-white font-semibold mb-0.5">Rank 6 / 150+</h4>
                <p className="text-xs text-neutral-400">Techvanya 2.0 Promptathon</p>
                <p className="text-xs text-neutral-500">GLA University, Mathura</p>
              </div>
              <div className="border-t border-neutral-700/50 pt-2">
                <h4 className="text-white font-semibold mb-0.5">Top 43 / 500+</h4>
                <p className="text-xs text-neutral-400">MIT Pune Startup Event</p>
                <p className="text-xs text-neutral-500">Impact Career Solution</p>
              </div>
            </div>
          </div>

          {/* AI Chatbot */}
          <div
            className="md:col-span-2 lg:col-span-2 lg:row-span-2 animate-fade-in-up"
            style={{ animationDelay: '0.5s' }}
          >
            <ChatbotInline />
          </div>

          {/* Tech Stack Marquee */}
          <div
            className="bento-card md:col-span-2 lg:col-span-4 animate-fade-in-up overflow-hidden relative"
            style={{ animationDelay: '0.6s' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-white font-semibold">Tech Stack</h4>
              <span className="text-xs text-neutral-500">What I work with</span>
            </div>
            <TechMarquee />
          </div>

        </div>
      </div>
    </section>
  );
};

export default About;
