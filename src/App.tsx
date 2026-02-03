import { useState } from 'react';
import Hero from './components/Hero';
import About from './components/About';
import Projects from './components/Projects';
import Skills from './components/Skills';
import Contact from './components/Contact';
import CustomCursor from './components/CustomCursor';
import PageLoader from './components/PageLoader';
import ScrollProgress from './components/ScrollProgress';
import FloatingContactButton from './components/FloatingContactButton';
import GrainOverlay from './components/GrainOverlay';
import Marquee from './components/Marquee';
import Navigation from './components/Navigation';
import ScrollToTop from './components/ScrollToTop';
import Chatbot from './components/Chatbot';

function App() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <>
      {isLoading && <PageLoader onComplete={() => setIsLoading(false)} />}
      {!isLoading && (
        <>
          <CustomCursor />
          <ScrollProgress />
          <Navigation />
          <FloatingContactButton />
          <ScrollToTop />
          <Chatbot />
          <GrainOverlay />
          <div className="min-h-screen bg-bg text-white">
            <Hero />
            <Marquee text="FULL STACK DEVELOPER" speed={25} className="py-12 opacity-50" />
            <About />
            <Projects />
            <Skills />
            <Marquee text="LET'S WORK TOGETHER" speed={20} className="py-12 opacity-50" />
            <Contact />
          </div>
        </>
      )}
    </>
  );
}

export default App;
