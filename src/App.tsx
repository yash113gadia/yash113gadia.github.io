import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import ScrollToTopOnRoute from './components/ScrollToTopOnRoute';
import SmoothScroll from './components/SmoothScroll';
import GameLayer from './game/GameLayer';
import CommandPalette from './game/CommandPalette';
import CityGame from './city/CityGame';
import SwarmGame from './swarm/SwarmGame';
import Home from './pages/Home';
import Mentor from './pages/Mentor';
import ProjectDescription from './pages/ProjectDescription';

const PortfolioRedirect = () => {
  const { hash } = useLocation();
  return <Navigate to={{ pathname: '/', hash }} replace />;
};

// The games are full-screen and bring their own HUD; every other page gets the site chrome.
const Shell = () => {
  const { pathname } = useLocation();
  const game = pathname === '/play' || pathname === '/city';
  return (
    <>
      <SmoothScroll enabled={!game} />
      <ScrollToTopOnRoute />
      {!game && <Navigation />}
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/play" element={<SwarmGame />} />
          <Route path="/city" element={<CityGame />} />
          {/* The portfolio briefly lived here; keep old links (and their #section) working. */}
          <Route path="/portfolio" element={<PortfolioRedirect />} />
          <Route path="/Mentor" element={<Mentor />} />
          <Route path="/project_description" element={<ProjectDescription />} />
        </Routes>
      </main>
      {!game && <Footer />}
      {!game && <GameLayer />}
      <CommandPalette />
    </>
  );
};

function App() {
  return (
    <Router>
      <Shell />
    </Router>
  );
}

export default App;
