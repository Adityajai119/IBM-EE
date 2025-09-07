import React, { useState } from 'react';
import { motion } from 'framer-motion';
import CyberCard from './ui/CyberCard';
import { Search, GitBranch, Code, Layout } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import VideoModal from './VideoModal';
import repositoryVideo from '../assets/repository.mp4';
import codeVideo from '../assets/code.mp4';
import frontendVideo from '../assets/frontend.mp4';

const Features: React.FC = () => {
  const navigate = useNavigate();
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<string>('');
  const [pendingRoute, setPendingRoute] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  
  const features = [
    {
      icon: <Search className="w-8 h-8" />,
      title: 'Smart Repo Discovery',
      description: 'Ask "Find React gaming projects" and get instant GitHub repository recommendations with intelligent filtering.',
      color: 'from-pink-500 to-purple-500',
      route: '/repo-search',
      video: repositoryVideo,
      badge: 'Most Popular',
      action: 'Search Now',
      metrics: '1M+ Repos Indexed',
      featured: false,
    },
    {
      icon: <GitBranch className="w-8 h-8" />,
      title: 'Repository Intelligence',
      description: 'Dive deep into any GitHub repo with AI-powered analysis, automated documentation, and contextual Q&A.',
      color: 'from-blue-500 to-cyan-500',
      route: '/repository-explorer',
      video: repositoryVideo,
      badge: 'AI Powered',
      action: 'Explore Repos',
      metrics: 'RAG-Enhanced Chat',
      featured: true,
    },
    {
      icon: <Code className="w-8 h-8" />,
      title: 'Universal Code Studio',
      description: 'Write, debug, and execute code in 10+ languages with AI assistance. From Python to Rust, instant compilation.',
      color: 'from-green-500 to-emerald-500',
      route: '/code-playground',
      video: codeVideo,
      badge: 'Developer Favorite',
      action: 'Start Coding',
      metrics: '10+ Languages',
      featured: true,
    },
    {
      icon: <Layout className="w-8 h-8" />,
      title: 'Frontend Wizard',
      description: 'Generate complete web applications from natural language. "Build a todo app" → Full React project with live preview.',
      color: 'from-orange-500 to-red-500',
      route: '/frontend-playground',
      video: frontendVideo,
      badge: 'New',
      action: 'Create App',
      metrics: 'Live Preview',
      featured: false,
    },
  ];

  const handleExplore = async (route: string, video: string) => {
    setIsLoading(true);
    setCurrentVideo(video);
    setPendingRoute(route);
    setIsVideoModalOpen(true);
    
    // Add haptic feedback simulation
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const handleVideoEnd = () => {
    setIsVideoModalOpen(false);
    setIsLoading(false);
    if (pendingRoute) {
      // Direct navigation without adding extra history entries
      setTimeout(() => {
        navigate(pendingRoute);
        setPendingRoute('');
      }, 300);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <section className="py-20 px-4 bg-black text-white" role="main" aria-label="DevSensei Features">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="gradient-text">Powerful AI-Driven Tools</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Four revolutionary tools that redefine how developers work with code, repositories, and frontend applications
          </p>
          
          {/* Loading Skeleton */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 text-blue-400 text-sm"
            >
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce animate-bounce-1"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce animate-bounce-2"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce animate-bounce-3"></div>
                <span className="ml-2">Loading preview...</span>
              </div>
            </motion.div>
          )}
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-8 md:gap-10 lg:gap-12 xl:gap-6 justify-items-center max-w-7xl mx-auto px-4"
        >
          {features.map((feature, index) => (
            <motion.div 
              key={index} 
              variants={itemVariants}
              className={`${feature.featured ? 'md:col-span-1 lg:scale-105' : ''} transition-all duration-300`}
            >
              <CyberCard
                title={feature.title}
                subtitle="AI"
                description={feature.description}
                icon={feature.icon}
                onClick={() => handleExplore(feature.route, feature.video)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleExplore(feature.route, feature.video);
                  }
                }}
                color={feature.color}
                badge={feature.badge}
                action={feature.action}
                metrics={feature.metrics}
                featured={feature.featured}
                tabIndex={0}
                role="button"
                aria-label={`Explore ${feature.title}: ${feature.description}`}
              />
            </motion.div>
          ))}
        </motion.div>
        
        {/* Additional CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="text-center mt-16"
        >
          <p className="text-gray-400 text-lg mb-6">
            Ready to supercharge your development workflow?
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleExplore('/code-playground', codeVideo)}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
              aria-label="Start with AI Code Studio"
            >
              Start with AI Studio
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleExplore('/frontend-playground', frontendVideo)}
              className="px-8 py-3 border border-gray-600 rounded-lg font-semibold hover:border-gray-400 hover:bg-gray-800/50 transition-all duration-300"
              aria-label="Try Frontend Wizard"
            >
              Try Frontend Wizard
            </motion.button>
          </div>
        </motion.div>
      </div>
      
      <VideoModal
        isOpen={isVideoModalOpen}
        onClose={handleVideoEnd}
        videoSrc={currentVideo}
      />
    </section>
  );
};

export default Features; 