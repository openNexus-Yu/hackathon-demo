import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Layout from './layouts/Layout';
import { AnimatePresence } from 'framer-motion';

// Pages
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import AuthCallback from './pages/AuthCallback';
import Profile from './pages/Profile';
import Discover from './pages/Discover';
import Org from './pages/Org';
import Incentive from './pages/Incentive';
import Explore from './pages/Explore';
import Chat from './pages/Chat';
import Admin from './pages/Admin';

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <Layout>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/discover" element={<Discover />} />
          {/* Dynamic org routes */}
          <Route path="/org/:orgId" element={<Org />} />
          <Route path="/org" element={<Org />} />
          <Route path="/incentive/:orgId" element={<Incentive />} />
          <Route path="/incentive" element={<Incentive />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/chat/:orgId" element={<Chat />} />
          <Route path="/chat" element={<Chat />} />
          {/* Admin routes */}
          <Route path="/admin/:orgId" element={<Admin />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </AnimatePresence>
    </Layout>
  );
}

function App() {
  return (
    <Router>
      <AnimatedRoutes />
    </Router>
  );
}

export default App;
