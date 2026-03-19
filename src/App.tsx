import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CustomCursor from './components/CustomCursor';
import PageLoader from './components/PageLoader';
import ScrollProgress from './components/ScrollProgress';
import FloatingContactButton from './components/FloatingContactButton';
import GrainOverlay from './components/GrainOverlay';
import Navigation from './components/Navigation';
import ScrollToTop from './components/ScrollToTop';
import ScrollToTopOnRoute from './components/ScrollToTopOnRoute';
import Home from './pages/Home';
import Mentor from './pages/Mentor';
import ProjectDescription from './pages/ProjectDescription';

function App() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <Router>
      <ScrollToTopOnRoute />
      {isLoading && <PageLoader onComplete={() => setIsLoading(false)} />}
      {!isLoading && (
        <>
          <CustomCursor />
          <ScrollProgress />
          <Navigation />
          <FloatingContactButton />
          <ScrollToTop />
          <GrainOverlay />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/Mentor" element={<Mentor />} />
            <Route path="/project_description" element={<ProjectDescription />} />
          </Routes>
        </>
      )}
    </Router>
  );
}

export default App;
