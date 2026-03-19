import Hero from '../components/Hero';
import About from '../components/About';
import Projects from '../components/Projects';
import Skills from '../components/Skills';
import Journey from '../components/Journey';
import Contact from '../components/Contact';
import Marquee from '../components/Marquee';

const Home = () => {
  return (
    <div className="min-h-screen bg-bg text-white">
      <Hero />
      <Marquee text="AI AUTOMATION & DEVELOPMENT" speed={25} className="py-12 opacity-50" />
      <About />
      <Projects />
      <Skills />
      <Journey />
      <Marquee text="LET'S WORK TOGETHER" speed={20} className="py-12 opacity-50" />
      <Contact />
    </div>
  );
};

export default Home;
