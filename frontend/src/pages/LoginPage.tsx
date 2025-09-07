import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Github, 
  Code, 
  Layout, 
  Search, 
  GitBranch,
  Sparkles, 
  Star,
  Users,
  Zap,
  Terminal,
  Cpu,
  Globe,
  Mail,
  Lock,
  Eye,
  EyeOff,
  X
} from 'lucide-react';
import AnimatedBackground from '../components/AnimatedBackground';
import MatrixBackground from '../components/MatrixBackground';
import GoogleAuthButton from '../components/GoogleAuthButton';
import { useAuth } from '../contexts/AuthContext';

const LoginPage: React.FC = () => {
  const [currentDemo, setCurrentDemo] = useState(0);
  const [showStats, setShowStats] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    user,
    signInWithGoogle, 
    signInWithGitHub, 
    signInWithEmail, 
    signUpWithEmail, 
    isLoading, 
    error,
    isAuthenticated 
  } = useAuth();


  // Redirect if already authenticated
  useEffect(() => {
    console.log('LoginPage: Auth state changed', { isAuthenticated, isLoading });
    if (isAuthenticated && !isLoading) {
      console.log('LoginPage: User is authenticated, redirecting to home');
      const from = location.state?.from?.pathname || '/home';
      console.log('LoginPage: Redirecting to:', from);
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, location]);

  const demos = [
    {
      title: "Generate a React Todo App",
      description: "Watch AI create a complete application in seconds",
      icon: <Layout className="w-6 h-6" />,
      color: "from-blue-500 to-purple-600"
    },
    {
      title: "Debug Python Code",
      description: "AI analyzes and fixes errors instantly",
      icon: <Code className="w-6 h-6" />,
      color: "from-green-500 to-emerald-600"
    },
    {
      title: "Explore GitHub Repos",
      description: "Chat with any repository using RAG",
      icon: <Search className="w-6 h-6" />,
      color: "from-pink-500 to-red-600"
    }
  ];

  const stats = [
    { label: "Developers", value: "10K+", icon: <Users className="w-5 h-5" /> },
    { label: "Code Generated", value: "1M+", icon: <Terminal className="w-5 h-5" /> },
    { label: "Languages", value: "15+", icon: <Cpu className="w-5 h-5" /> },
    { label: "Projects", value: "50K+", icon: <Globe className="w-5 h-5" /> }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDemo((prev) => (prev + 1) % demos.length);
    }, 3000);
    
    const statsTimer = setTimeout(() => setShowStats(true), 1000);

    // Mouse tracking for premium interactive effects
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      clearInterval(timer);
      clearTimeout(statsTimer);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Enhanced form validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'Email is required';
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return '';
  };

  const validatePassword = (password: string) => {
    if (!password) return 'Password is required';
    if (isSignUp && password.length < 8) return 'Password must be at least 8 characters';
    return '';
  };

  const handleGitHubLogin = async () => {
    try {
      console.log('LoginPage: handleGitHubLogin called');
      
      // Add small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 200));
      
      await signInWithGitHub();
      console.log('LoginPage: GitHub sign-in successful');
      setShowSuccessToast(true);
      setTimeout(() => {
        const from = location.state?.from?.pathname || '/home';
        navigate(from);
      }, 1500);
    } catch (error: any) {
      console.error('LoginPage: GitHub login failed:', error);
      // Show user-friendly error message
      if (error.message?.includes('cancelled by user')) {
        console.log('LoginPage: User cancelled authentication');
        // Don't show error for user cancellation
      } else if (error.message?.includes('redirect')) {
        console.log('LoginPage: Switching to redirect authentication');
      } else {
        // Show error for other issues
        alert(`Authentication failed: ${error.message}`);
      }
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setEmailError('');
    setPasswordError('');
    
    // Validate inputs
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    
    if (emailErr) {
      setEmailError(emailErr);
      return;
    }
    
    if (passwordErr) {
      setPasswordError(passwordErr);
      return;
    }

    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
      setShowSuccessToast(true);
      setTimeout(() => {
        const from = location.state?.from?.pathname || '/home';
        navigate(from);
      }, 1500);
    } catch (error) {
      console.error('Email login failed:', error);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      console.log('LoginPage: handleGoogleLogin called');
      
      // Add small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 200));
      
      await signInWithGoogle();
      console.log('LoginPage: Google sign-in successful');
      setShowSuccessToast(true);
      setTimeout(() => {
        const from = location.state?.from?.pathname || '/home';
        navigate(from);
      }, 1500);
    } catch (error: any) {
      console.error('LoginPage: Google login failed:', error);
      // Show user-friendly error message
      if (error.message?.includes('cancelled by user')) {
        console.log('LoginPage: User cancelled authentication');
        // Don't show error for user cancellation
      } else if (error.message?.includes('redirect')) {
        console.log('LoginPage: Switching to redirect authentication');
      } else {
        // Show error for other issues
        alert(`Authentication failed: ${error.message}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <AnimatedBackground />
      <MatrixBackground />
      
      {/* Premium Interactive Cursor Effect */}
      <div 
        className="fixed pointer-events-none z-50 w-8 h-8 rounded-full bg-gradient-to-r from-blue-400/20 via-purple-500/20 to-pink-500/20 blur-sm transition-all duration-100 ease-out"
        style={{
          left: mousePosition.x - 16,
          top: mousePosition.y - 16,
          transform: 'translate3d(0, 0, 0)',
        }}
      />
      
      {/* Success Toast Notification */}
      <AnimatePresence>
        {showSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: -100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -100, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-green-500/90 to-emerald-600/90 backdrop-blur-xl border border-green-400/50 rounded-xl px-6 py-4 shadow-2xl"
          >
            <div className="flex items-center space-x-3 text-white">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 400 }}
                className="w-6 h-6 bg-white rounded-full flex items-center justify-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-green-600 font-bold text-sm"
                >
                  ✓
                </motion.div>
              </motion.div>
              <div>
                <div className="font-semibold">Welcome to DevSensei!</div>
                <div className="text-sm text-green-100">Authentication successful</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Toast Notification */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -100, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50 bg-gradient-to-r from-red-500/90 to-red-600/90 backdrop-blur-xl border border-red-400/50 rounded-xl px-6 py-4 shadow-2xl"
          >
            <div className="flex items-center space-x-3 text-white">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 400 }}
                className="w-6 h-6 bg-white rounded-full flex items-center justify-center"
              >
                <X className="w-3 h-3 text-red-500" />
              </motion.div>
              <div>
                <div className="font-semibold">Authentication Failed</div>
                <div className="text-sm text-red-100">{error}</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Hero Section */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Side - Hero Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            {/* Logo */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="flex items-center space-x-3"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                DevSensei
              </h1>
            </motion.div>

            {/* Main Headline */}
            <div className="space-y-4">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight"
              >
                Code at the{' '}
                <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  Speed of Thought
                </span>
              </motion.h2>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-xl text-gray-300 leading-relaxed max-w-2xl"
              >
                Transform ideas into production-ready code instantly. Generate, debug, and deploy applications 
                across 15+ languages with AI that understands your intent.
              </motion.p>
            </div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-4"
            >
              {/* Primary CTAs */}
              <div className="flex flex-col sm:flex-row gap-4">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleGitHubLogin}
                  disabled={isLoading}
                  className="flex items-center justify-center space-x-3 px-8 py-4 bg-white text-black font-semibold rounded-xl hover:bg-gray-100 transition-all duration-300 disabled:opacity-50 flex-1 relative overflow-hidden group shadow-lg hover:shadow-xl"
                >
                  {/* Enhanced GitHub hover animation */}
                  <div className="absolute inset-0">
                    <div className="absolute top-0 left-0 w-full h-full bg-gray-200 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-400 ease-out rounded-xl" />
                    <div className="absolute top-0 left-0 w-full h-full bg-gray-400 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out delay-75 rounded-xl" />
                    <div className="absolute top-0 left-0 w-full h-full bg-gray-600 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-600 ease-out delay-150 rounded-xl" />
                    <div className="absolute top-0 left-0 w-full h-full bg-black transform -translate-x-full group-hover:translate-x-0 transition-transform duration-700 ease-out delay-225 rounded-xl" />
                    {/* Premium glow effect */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300 bg-gradient-to-r from-blue-400 to-purple-500 blur-xl" />
                  </div>

                  <Github className="w-5 h-5 z-10 relative transition-all duration-300 group-hover:scale-110 group-hover:text-white" />
                  <span className="z-10 relative group-hover:text-white transition-colors duration-300 delay-300">{isLoading ? 'Connecting...' : 'Continue with GitHub'}</span>
                  {isLoading && (
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full z-10 relative group-hover:border-white group-hover:border-t-transparent transition-colors duration-300"
                    />
                  )}
                </motion.button>
                
                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-1"
                >
                  <GoogleAuthButton 
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    isLoading={isLoading}
                  />
                </motion.div>
              </div>

              {/* Or Divider */}
              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-black text-gray-400">or continue with email</span>
                </div>
              </div>

              {/* Email Login Button */}
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowLoginForm(true)}
                className="w-full flex items-center justify-center space-x-3 px-8 py-4 bg-gray-800/50 border border-gray-700 text-white font-semibold rounded-xl hover:bg-gray-700/50 hover:border-gray-600 transition-all duration-300 group relative overflow-hidden shadow-lg hover:shadow-xl"
              >
                {/* Subtle gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
                <Mail className="w-5 h-5 relative z-10 group-hover:text-blue-400 transition-colors duration-300" />
                <span className="relative z-10">Sign in with Email</span>
              </motion.button>
            </motion.div>

            {/* Social Proof Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: showStats ? 1 : 0, y: showStats ? 0 : 20 }}
              transition={{ delay: 0.8 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-8 border-t border-gray-800"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 + index * 0.1 }}
                  className="text-center"
                >
                  <div className="flex items-center justify-center mb-2 text-gray-400">
                    {stat.icon}
                  </div>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Side - Interactive Demo */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="relative"
          >
            {/* Demo Window */}
            <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl overflow-hidden shadow-2xl">
              
              {/* Window Header */}
              <div className="flex items-center justify-between px-6 py-4 bg-gray-800/50 border-b border-gray-700/50">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div className="text-sm text-gray-400">DevSensei AI Studio</div>
                <div className="w-12"></div>
              </div>

              {/* Demo Content */}
              <div className="p-6 h-96">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentDemo}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className="h-full flex flex-col"
                  >
                    {/* Demo Header */}
                    <div className="flex items-center space-x-3 mb-6">
                      <div className={`p-2 bg-gradient-to-r ${demos[currentDemo].color} rounded-lg`}>
                        {demos[currentDemo].icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{demos[currentDemo].title}</h3>
                        <p className="text-sm text-gray-400">{demos[currentDemo].description}</p>
                      </div>
                    </div>

                    {/* Mock Code Output */}
                    <div className="bg-black/50 rounded-lg p-4 flex-1 font-mono text-sm">
                      <div className="text-green-400 mb-2">$ devsensei generate</div>
                      <div className="text-gray-300 space-y-1">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                          <span>Analyzing requirements...</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span>Generating components...</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                          <span>Optimizing code...</span>
                        </div>
                      </div>
                      <div className="mt-4 text-green-400">✓ Project ready in 3.2s</div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Demo Navigation */}
              <div className="flex justify-center px-6 pb-6">
                <div className="flex space-x-2">
                  {demos.map((_, index) => (
                    <motion.button
                      key={index}
                      onClick={() => setCurrentDemo(index)}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        currentDemo === index ? 'bg-blue-400 shadow-lg shadow-blue-400/50' : 'bg-gray-600 hover:bg-gray-500'
                      }`}
                      aria-label={`Switch to demo ${index + 1}: ${demos[index].title}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute -top-6 -right-6 w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg"
            >
              <Zap className="w-6 h-6 text-white" />
            </motion.div>
            
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 4, repeat: Infinity, delay: 1 }}
              className="absolute -bottom-6 -left-6 w-12 h-12 bg-gradient-to-r from-pink-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg"
            >
              <Star className="w-6 h-6 text-white" />
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Email Login Modal */}
      <AnimatePresence>
        {showLoginForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setShowLoginForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md mx-auto bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 relative shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              {/* Decorative Elements */}
              <div className="absolute -top-1 -left-1 w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-full blur-xl" />
              <div className="absolute -bottom-1 -right-1 w-16 h-16 bg-gradient-to-br from-pink-500/20 to-red-600/20 rounded-full blur-xl" />
              
              {/* Close Button */}
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowLoginForm(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-full transition-all duration-300 z-10"
                aria-label="Close login form"
              >
                <X className="w-4 h-4" />
              </motion.button>

              {/* Modal Header */}
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-center mb-6"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg"
                >
                  <Mail className="w-8 h-8 text-white" />
                </motion.div>
                <motion.h2 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold text-white mb-2"
                >
                  {isSignUp ? 'Join DevSensei' : 'Welcome Back'}
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-gray-300 text-sm"
                >
                  {isSignUp 
                    ? 'Start building with AI-powered development' 
                    : 'Continue coding at the speed of thought'
                  }
                </motion.p>
              </motion.div>

              {/* OAuth Buttons First - Better UX */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-3 mb-6"
              >
                {/* GitHub Login in Modal */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGitHubLogin}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center space-x-3 py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-100 transition-all duration-300 disabled:opacity-50 relative overflow-hidden group shadow-lg"
                >
                  {/* GitHub hover animation - same as main buttons */}
                  <div className="absolute inset-0">
                    <div className="absolute top-0 left-0 w-full h-full bg-gray-200 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-400 ease-out rounded-lg" />
                    <div className="absolute top-0 left-0 w-full h-full bg-gray-400 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out delay-75 rounded-lg" />
                    <div className="absolute top-0 left-0 w-full h-full bg-gray-600 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-600 ease-out delay-150 rounded-lg" />
                    <div className="absolute top-0 left-0 w-full h-full bg-black transform -translate-x-full group-hover:translate-x-0 transition-transform duration-700 ease-out delay-225 rounded-lg" />
                  </div>
                  <Github className="w-5 h-5 z-10 relative transition-all duration-300 group-hover:scale-110 group-hover:text-white" />
                  <span className="z-10 relative group-hover:text-white transition-colors duration-300 delay-300">Continue with GitHub</span>
                </motion.button>

                {/* Google Login in Modal */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full"
                >
                  <GoogleAuthButton 
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    isLoading={isLoading}
                  />
                </motion.div>
              </motion.div>

              {/* Divider */}
              <motion.div 
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ delay: 0.6 }}
                className="relative py-4"
              >
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-gray-400 font-medium">or continue with email</span>
                </div>
              </motion.div>

              {/* Login Form */}
              <motion.form 
                onSubmit={handleEmailLogin} 
                className="space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <label className="block text-sm font-semibold text-gray-200 mb-2">
                    Email Address
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-400 transition-colors duration-300" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) setEmailError('');
                      }}
                      className={`w-full pl-10 pr-4 py-3 bg-gray-800/70 border ${
                        emailError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30' : 'border-gray-600/50 focus:border-blue-500 focus:ring-blue-500/30'
                      } rounded-lg focus:outline-none focus:ring-2 text-white placeholder-gray-400 transition-all duration-300 backdrop-blur-sm hover:bg-gray-800/90`}
                      placeholder="your.email@example.com"
                      required
                    />
                    {/* Premium focus ring effect */}
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  </div>
                  {emailError && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-400 text-xs mt-1 flex items-center space-x-1"
                    >
                      <div className="w-1 h-1 bg-red-400 rounded-full"></div>
                      <span>{emailError}</span>
                    </motion.p>
                  )}
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 }}
                >
                  <label className="block text-sm font-semibold text-gray-200 mb-2">
                    Password
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-400 transition-colors duration-300" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (passwordError) setPasswordError('');
                      }}
                      className={`w-full pl-10 pr-12 py-3 bg-gray-800/70 border ${
                        passwordError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30' : 'border-gray-600/50 focus:border-blue-500 focus:ring-blue-500/30'
                      } rounded-lg focus:outline-none focus:ring-2 text-white placeholder-gray-400 transition-all duration-300 backdrop-blur-sm hover:bg-gray-800/90`}
                      placeholder={isSignUp ? "Create a strong password" : "Enter your password"}
                      required
                      minLength={isSignUp ? 8 : undefined}
                    />
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-all duration-300 p-1 rounded-lg hover:bg-gray-700/50"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </motion.button>
                    {/* Premium focus ring effect */}
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  </div>
                  {passwordError && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-400 text-xs mt-1 flex items-center space-x-1"
                    >
                      <div className="w-1 h-1 bg-red-400 rounded-full"></div>
                      <span>{passwordError}</span>
                    </motion.p>
                  )}
                  {isSignUp && !passwordError && (
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.0 }}
                      className="text-xs text-gray-400 mt-1 flex items-center space-x-1"
                    >
                      <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                      <span>Password must be at least 8 characters long</span>
                    </motion.p>
                  )}
                </motion.div>

                {/* Forgot Password Link */}
                {!isSignUp && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.0 }}
                    className="text-right"
                  >
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="text-sm text-blue-400 hover:text-blue-300 transition-colors font-medium underline decoration-blue-400/30 hover:decoration-blue-300"
                    >
                      Forgot password?
                    </motion.button>
                  </motion.div>
                )}

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: isLoading ? 1 : 1.02, y: isLoading ? 0 : -1 }}
                  whileTap={{ scale: isLoading ? 1 : 0.98 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1 }}
                  className="w-full py-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-bold rounded-lg hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 shadow-lg hover:shadow-xl hover:shadow-purple-500/25 disabled:hover:scale-100 relative overflow-hidden group"
                >
                  {/* Premium button glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-pink-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-xl" />
                  
                  {isLoading ? (
                    <>
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full relative z-10"
                      />
                      <span className="relative z-10">Please wait...</span>
                    </>
                  ) : (
                    <>
                      <span className="relative z-10">{isSignUp ? 'Create Account' : 'Sign In'}</span>
                      <motion.div
                        initial={{ x: 0 }}
                        whileHover={{ x: 5 }}
                        transition={{ type: "spring", stiffness: 400 }}
                        className="relative z-10"
                      >
                        →
                      </motion.div>
                    </>
                  )}
                </motion.button>
              </motion.form>

              {/* Toggle Sign Up/Sign In */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="mt-6 text-center"
              >
                <p className="text-gray-400 text-sm">
                  {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                  <motion.button
                    type="button"
                    onClick={() => setIsSignUp(!isSignUp)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="text-blue-400 hover:text-blue-300 font-semibold transition-all duration-300 underline decoration-blue-400/30 hover:decoration-blue-300"
                  >
                    {isSignUp ? 'Sign in' : 'Sign up'}
                  </motion.button>
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* Bottom Feature Highlights */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10"
      >
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="flex items-center space-x-8 bg-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl px-6 py-3 shadow-2xl hover:shadow-blue-500/10 transition-all duration-300"
        >
          <motion.div 
            whileHover={{ scale: 1.1 }}
            className="flex items-center space-x-2 text-sm text-gray-300"
          >
            <GitBranch className="w-4 h-4 text-blue-400" />
            <span>GitHub Integration</span>
          </motion.div>
          <motion.div 
            whileHover={{ scale: 1.1 }}
            className="flex items-center space-x-2 text-sm text-gray-300"
          >
            <Terminal className="w-4 h-4 text-green-400" />
            <span>15+ Languages</span>
          </motion.div>
          <motion.div 
            whileHover={{ scale: 1.1 }}
            className="flex items-center space-x-2 text-sm text-gray-300"
          >
            <Cpu className="w-4 h-4 text-purple-400" />
            <span>AI-Powered</span>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoginPage; 