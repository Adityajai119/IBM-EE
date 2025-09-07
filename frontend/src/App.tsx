import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Code, Layout, Home, Menu, X, Search, GitBranch } from 'lucide-react';
import { RepositoryExplorer } from './pages/RepositoryExplorer';
import { CodePlayground } from './pages/CodePlayground';
import { FrontendPlayground } from './pages/FrontendPlayground';
import AnimatedBackground from './components/AnimatedBackground';
import styled from 'styled-components';
import RepositoryView from './components/RepositoryView';
import LayoutComponent from './components/Layout';
import VideoModal from './components/VideoModal';
import repositoryVideo from './assets/repository.mp4';
import codeVideo from './assets/code.mp4';
import frontendVideo from './assets/frontend.mp4';
import LoginPage from './pages/LoginPage';
import RepoSearchPage from './pages/RepoSearchPage';
import Features from './components/Features';
import MatrixBackground from './components/MatrixBackground';
import DevSenseiChatbot from './components/DevSenseiChatbot';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

const AppContainer = styled.div`
  position: relative;
  min-height: 100vh;
  color: white;
  overflow-x: hidden;
  background-color: black;
`;

const NavContainer = styled.nav`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: rgba(0, 0, 0, 0.95);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const NavContent = styled.div`
  max-width: 1280px;
  margin: 0 auto;
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const NavLink = styled(motion(Link))`
  color: #e5e7eb;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const MobileMenu = styled(motion.div)`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 300px;
  background: rgba(0, 0, 0, 0.95);
  backdrop-filter: blur(10px);
  padding: 2rem;
  z-index: 1000;
`;

const HomePage: React.FC = () => {
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white py-20 px-4 relative overflow-hidden">
      {/* Matrix Background Animation */}
      <MatrixBackground />
      
      {/* Hero Section with Enhanced Typography */}
      <VideoModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        videoSrc={repositoryVideo}
      />
      <div className="max-w-screen-2xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-20"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="mb-6"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 leading-tight px-4 text-center">
              Transform Code with{' '}
              <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-pulse">
                AI Precision
              </span>
            </h1>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed"
          >
            Experience the future of development with DevSensei's AI-powered toolkit.{' '}
            <span className="text-blue-400 font-semibold">Generate</span>,{' '}
            <span className="text-purple-400 font-semibold">analyze</span>, and{' '}
            <span className="text-pink-400 font-semibold">deploy</span> like never before.
          </motion.p>
          
          {/* Stats Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex justify-center space-x-8 mt-8 text-sm text-gray-400"
          >
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>10+ Languages</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <span>AI-Powered</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
              <span>Real-time Execution</span>
            </div>
          </motion.div>
        </motion.div>
        
        <Features />
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isNavVideoModalOpen, setIsNavVideoModalOpen] = React.useState(false);
  const [currentNavVideo, setCurrentNavVideo] = React.useState<string>('');
  const [pendingNavRoute, setPendingNavRoute] = React.useState<string>('');
  const navigate = useNavigate();
  const location = useLocation();

  // Hide navbar on login pages
  const isLoginPage = location.pathname === '/' || location.pathname === '/login';

  const handleNavVideoClick = (video: string, route: string) => {
    setCurrentNavVideo(video);
    setPendingNavRoute(route);
    setIsNavVideoModalOpen(true);
    setIsMobileMenuOpen(false); // Close mobile menu if open
  };

  const handleNavVideoEnd = () => {
    setIsNavVideoModalOpen(false);
    if (pendingNavRoute) {
      setTimeout(() => {
        navigate(pendingNavRoute);
        setPendingNavRoute('');
      }, 300);
    }
  };

  return (
    <AppContainer>
      {/* Only show navbar if not on login page */}
      {!isLoginPage && (
        <>
          <NavContainer>
            <NavContent>
              <Link to="/" className="flex items-center gap-2 text-xl font-bold text-white">
                <Home size={24} />
                <span className="text-white">DevSensei</span>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center gap-6">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
                  onClick={() => handleNavVideoClick(repositoryVideo, '/repo-search')}
                >
                  <Search size={20} />
                  Repo Search
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
                  onClick={() => handleNavVideoClick(repositoryVideo, '/repository-explorer')}
                >
                  <GitBranch size={20} />
                  Interact with Repo
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
                  onClick={() => handleNavVideoClick(codeVideo, '/code-playground')}
                >
                  <Code size={20} />
                  AI Compiler
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
                  onClick={() => handleNavVideoClick(frontendVideo, '/frontend-playground')}
                >
                  <Layout size={20} />
                  Frontend Playground
                </motion.button>
              </div>

                {/* Mobile Menu Button */}
                <button
                  className="md:hidden text-white p-2"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                  {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </NavContent>
            </NavContainer>

            {/* Mobile Menu */}
            <AnimatePresence>
              {isMobileMenuOpen && (
                <MobileMenu
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 20 }}
                >
                  <div className="flex flex-col gap-4">
                    <button
                      className="flex items-center gap-2 text-white hover:text-gray-300 bg-transparent border-none text-left cursor-pointer"
                      onClick={() => handleNavVideoClick(repositoryVideo, '/repo-search')}
                    >
                      <Search size={20} />
                      Repo Search
                    </button>
                    <button
                      className="flex items-center gap-2 text-white hover:text-gray-300 bg-transparent border-none text-left cursor-pointer"
                      onClick={() => handleNavVideoClick(repositoryVideo, '/repository-explorer')}
                    >
                      <GitBranch size={20} />
                      Interact with Repo
                    </button>
                    <button
                      className="flex items-center gap-2 text-white hover:text-gray-300 bg-transparent border-none text-left cursor-pointer"
                      onClick={() => handleNavVideoClick(codeVideo, '/code-playground')}
                    >
                      <Code size={20} />
                      AI Compiler
                    </button>
                    <button
                      className="flex items-center gap-2 text-white hover:text-gray-300 bg-transparent border-none text-left cursor-pointer"
                      onClick={() => handleNavVideoClick(frontendVideo, '/frontend-playground')}
                    >
                      <Layout size={20} />
                      Frontend Playground
                    </button>
                  </div>
                </MobileMenu>
              )}
            </AnimatePresence>
        </>
      )}

        <Routes>
          <Route path="/login" element={
            <ProtectedRoute requireAuth={false}>
              <LoginPage />
            </ProtectedRoute>
          } />
          <Route path="/" element={
            <ProtectedRoute requireAuth={false}>
              <LoginPage />
            </ProtectedRoute>
          } />
          <Route path="/home" element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          } />
          <Route path="/repository-explorer" element={
            <ProtectedRoute>
              <RepositoryExplorer />
            </ProtectedRoute>
          } />
          <Route path="/code-playground" element={
            <ProtectedRoute>
              <CodePlayground />
            </ProtectedRoute>
          } />
          <Route path="/frontend-playground" element={
            <ProtectedRoute>
              <FrontendPlayground />
            </ProtectedRoute>
          } />
          <Route path="/repository/:username/:repoName" element={
            <ProtectedRoute>
              <RepositoryView />
            </ProtectedRoute>
          } />
          <Route path="/repo-search" element={
            <ProtectedRoute>
              <RepoSearchPage />
            </ProtectedRoute>
          } />
        </Routes>
        
        <VideoModal
          isOpen={isNavVideoModalOpen}
          onClose={handleNavVideoEnd}
          videoSrc={currentNavVideo}
        />

        {/* DevSensei Chatbot - Show on all pages except login */}
        {!isLoginPage && (
          <DevSenseiChatbot 
            showKeyboardShortcuts={location.pathname === '/code-playground'}
            showTemplates={location.pathname === '/code-playground'}
          />
        )}
      </AppContainer>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
};

export default App;
