import Hero from '../components/Hero';
import Work from '../components/Work';
import StackMarquee from '../components/StackMarquee';
import Experience from '../components/Experience';
import About from '../components/About';
import Contact from '../components/Contact';

const Home = () => (
  <>
    <Hero />
    <Work />
    <div className="mt-24 md:mt-32">
      <StackMarquee />
    </div>
    <Experience />
    <About />
    <Contact />
  </>
);

export default Home;
