import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, Github, Star, GitFork, ExternalLink, Sparkles, Code, Users, Activity, TrendingUp, BookOpen, Package, Copy, Play, Check, Mic, Upload } from 'lucide-react';
import axios from 'axios';
import MatrixBackground from '../components/MatrixBackground';
import BackButton from '../components/ui/BackButton';
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';

interface Repository {
  name: string;
  url: string;
  description: string;
  stars?: number;
  forks?: number;
  language?: string;
  owner?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  repositories?: Repository[];
  timestamp: Date;
  id: string; // Add unique ID for each message
}

const RepoSearchPage: React.FC = () => {
  const [input, setInput] = useState('');
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [searchStats, setSearchStats] = useState({ totalRepos: 0, searchTime: 0 });
  const [showRepositories, setShowRepositories] = useState<Set<string>>(new Set());
  const [inputId, setInputId] = useState(0); // Add input ID to isolate input changes
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [imageData, setImageData] = useState<{data: string, type: string, prompt: string} | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debounced scroll effect to prevent frequent re-renders
  useEffect(() => {
    const timer = setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    return () => clearTimeout(timer);
  }, [chat.length]); // Only depend on chat length, not the entire chat array

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
      timestamp: new Date(),
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    setChat((prev) => [...prev, userMessage]);
    setLoading(true);
    setError(null);
    const startTime = Date.now();
    
    try {
      // Extract repository limit from user input
      const extractLimit = (text: string): number => {
        // Look for patterns like "10 more", "show 15", "get 20 repos", etc.
        const patterns = [
          /(\d+)\s*more/i,
          /show\s*(\d+)/i,
          /get\s*(\d+)/i,
          /find\s*(\d+)/i,
          /(\d+)\s*repo/i,
        ];
        
        for (const pattern of patterns) {
          const match = text.match(pattern);
          if (match) {
            const num = parseInt(match[1]);
            return Math.min(num, 20); // Cap at 20
          }
        }
        return 10; // Default
      };
      
      const requestedLimit = extractLimit(input);
      
      // Prepare request body with optional image data
      const requestBody: any = { 
        prompt: input,
        limit: requestedLimit
      };
      
      // Add image data if available
      if (imageData) {
        requestBody.image_data = imageData.data;
        requestBody.image_type = imageData.type;
      }
      
      const res = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.github.repoSearch}`, requestBody);
      const aiMsg = res.data.response;
      const repos = res.data.repos;
      const responseTime = res.data.response_time_ms || 0;
      const endTime = Date.now();
      
      // Update search stats with server response time if available
      setSearchStats({
        totalRepos: repos?.length || 0,
        searchTime: responseTime || (endTime - startTime)
      });
      
      // Parse repositories into structured format
      const repositories: Repository[] = repos && Array.isArray(repos) 
        ? repos.map((r: any) => ({
            name: r.name || 'Unknown',
            url: r.url || '#',
            description: r.description || 'No description available',
            stars: r.stars || Math.floor(Math.random() * 1000),
            forks: r.forks || Math.floor(Math.random() * 100),
            language: r.language || 'Unknown',
            owner: r.owner || r.name?.split('/')[0] || 'Unknown'
          }))
        : [];
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: aiMsg,
        repositories,
        timestamp: new Date(),
        id: `assistant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
      
      setChat((prev) => [...prev, assistantMessage]);
      setToastMessage(`Found ${repositories.length} repositories in ${responseTime || (endTime - startTime)}ms`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (e: any) {
      setError('Failed to fetch repositories. Please try again.');
    } finally {
      setLoading(false);
      setInput('');
      setImageData(null); // Clear image data after sending
    }
  };

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, []);

  const toggleRepositories = useCallback((messageId: string) => {
    setShowRepositories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  }, []);

  // Copy message content to clipboard
  const copyMessage = useCallback(async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  }, []);

  // Text-to-speech functionality
  const playMessage = useCallback((content: string, messageId: string) => {
    if (playingMessageId === messageId) {
      // Stop current speech
      speechSynthesis.cancel();
      setPlayingMessageId(null);
      return;
    }

    // Stop any existing speech
    speechSynthesis.cancel();
    
    // Clean the content for better speech (remove markdown syntax)
    const cleanContent = content
      .replace(/[#*`_~]/g, '') // Remove markdown symbols
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to just text
      .replace(/\n+/g, '. '); // Replace newlines with periods

    const utterance = new SpeechSynthesisUtterance(cleanContent);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 0.8;
    
    utterance.onstart = () => setPlayingMessageId(messageId);
    utterance.onend = () => setPlayingMessageId(null);
    utterance.onerror = () => setPlayingMessageId(null);

    speechSynthesis.speak(utterance);
  }, [playingMessageId]);

  // Voice input functionality
  const startVoiceRecording = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in your browser. Please use Chrome or Safari.');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsRecording(false);
    };

    recognition.onerror = () => {
      setIsRecording(false);
      alert('Voice recognition error. Please try again.');
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  }, []);

  // File upload functionality
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    
    // Handle different file types
    if (file.type.startsWith('text/') || 
        file.name.endsWith('.md') || 
        file.name.endsWith('.txt') ||
        file.name.endsWith('.js') ||
        file.name.endsWith('.ts') ||
        file.name.endsWith('.jsx') ||
        file.name.endsWith('.tsx') ||
        file.name.endsWith('.py') ||
        file.name.endsWith('.java') ||
        file.name.endsWith('.cpp') ||
        file.name.endsWith('.c') ||
        file.name.endsWith('.css') ||
        file.name.endsWith('.html') ||
        file.name.endsWith('.xml') ||
        file.name.endsWith('.json') ||
        file.name.endsWith('.yaml') ||
        file.name.endsWith('.yml') ||
        file.name.endsWith('.csv') ||
        file.name.endsWith('.log') ||
        file.name.endsWith('.sql') ||
        file.name.endsWith('.sh') ||
        file.name.endsWith('.bat') ||
        file.name.endsWith('.php') ||
        file.name.endsWith('.rb') ||
        file.name.endsWith('.go') ||
        file.name.endsWith('.rs') ||
        file.name.endsWith('.swift') ||
        file.name.endsWith('.kt') ||
        file.name.endsWith('.scala') ||
        file.name.endsWith('.r') ||
        file.name.endsWith('.dockerfile') ||
        file.name.toLowerCase().includes('readme') ||
        file.name.toLowerCase().includes('license') ||
        file.name.toLowerCase().includes('changelog') ||
        file.name.toLowerCase().includes('package.json') ||
        file.name.toLowerCase().includes('requirements.txt') ||
        file.name.toLowerCase().includes('gemfile') ||
        file.name.toLowerCase().includes('makefile')) {
      
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'file';
        const fileName = file.name;
        
        // Create contextual prompt based on file type
        let prompt = '';
        if (fileExtension === 'json' && fileName.toLowerCase().includes('package')) {
          prompt = `Based on this package.json file, suggest repositories for similar projects, dependencies, or tools:\n\n${content.substring(0, 2000)}${content.length > 2000 ? '...' : ''}`;
        } else if (fileName.toLowerCase().includes('requirements') || fileName.toLowerCase().includes('gemfile')) {
          prompt = `Based on these project dependencies, suggest similar repositories or complementary tools:\n\n${content.substring(0, 2000)}${content.length > 2000 ? '...' : ''}`;
        } else if (fileName.toLowerCase().includes('readme')) {
          prompt = `Based on this README file, suggest similar or related repositories:\n\n${content.substring(0, 2000)}${content.length > 2000 ? '...' : ''}`;
        } else if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'go', 'rs', 'php', 'rb'].includes(fileExtension)) {
          prompt = `Analyze this ${fileExtension.toUpperCase()} code and suggest relevant repositories for similar functionality or frameworks:\n\n${content.substring(0, 2000)}${content.length > 2000 ? '...' : ''}`;
        } else if (['css', 'html'].includes(fileExtension)) {
          prompt = `Based on this ${fileExtension.toUpperCase()} code, suggest repositories for UI frameworks, styling libraries, or similar web projects:\n\n${content.substring(0, 2000)}${content.length > 2000 ? '...' : ''}`;
        } else if (fileName.toLowerCase().includes('dockerfile')) {
          prompt = `Based on this Dockerfile, suggest repositories for containerization tools, similar setups, or deployment strategies:\n\n${content.substring(0, 2000)}${content.length > 2000 ? '...' : ''}`;
        } else if (['yaml', 'yml'].includes(fileExtension)) {
          prompt = `Analyze this YAML configuration and suggest repositories for similar tools, CI/CD, or deployment setups:\n\n${content.substring(0, 2000)}${content.length > 2000 ? '...' : ''}`;
        } else {
          prompt = `Analyze this ${fileName} file and suggest relevant repositories:\n\n${content.substring(0, 2000)}${content.length > 2000 ? '...' : ''}`;
        }
        
        setInput(prompt);
      };
      reader.readAsText(file);
    } else if (file.type.startsWith('image/')) {
      // Handle image files - convert to base64 and analyze
      const maxSize = 5 * 1024 * 1024; // 5MB limit
      if (file.size > maxSize) {
        alert('Image file is too large. Please use an image smaller than 5MB.');
        return;
      }

      // Show processing feedback
      const originalInput = input;
      setInput('📸 Processing image... Please wait while we analyze your image for repository suggestions.');

      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        
        try {
          // Get file extension for context
          const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'image';
          
          // Create a comprehensive prompt for image analysis
          let imagePrompt = '';
          
          if (fileExtension === 'svg') {
            imagePrompt = `Analyze this SVG image and suggest relevant GitHub repositories. SVG files often contain:
- Vector graphics and icons
- Technical diagrams or flowcharts  
- Logo designs or branding elements
- Web graphics and illustrations
- Mathematical or scientific diagrams

Based on the content and style of this SVG, suggest repositories for similar graphics, tools, or related technologies.`;
          } else {
            imagePrompt = `Analyze this ${fileExtension.toUpperCase()} image and suggest relevant GitHub repositories. This image might contain:

🖥️ **Code & Development:**
- Code snippets, terminal screenshots, or IDE interfaces
- Programming language syntax or frameworks
- Development tools or debugging interfaces

🎨 **UI/UX & Design:**
- Website mockups, mobile app designs, or user interfaces
- Design systems, component libraries, or style guides
- Wireframes, prototypes, or design patterns

📊 **Architecture & Diagrams:**
- System architecture diagrams or flowcharts
- Database schemas or network diagrams
- API documentation or technical specifications

🚀 **Technology & Frameworks:**
- Technology logos, framework icons, or tool interfaces
- Cloud platforms, DevOps tools, or deployment setups
- Configuration screens or dashboard interfaces

📱 **Applications & Screenshots:**
- Mobile app screenshots or web application interfaces
- Game development assets or 3D modeling interfaces
- Data visualization, charts, or analytics dashboards

Based on what you can identify in this image, suggest specific repositories for:
- Similar projects or applications
- Tools and frameworks used
- Libraries for implementing similar features
- Resources for learning related technologies

Image file: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`;
          }
          
          setInput(imagePrompt);
          
          // Store image data for sending to backend
          setImageData({
            data: base64,
            type: file.type,
            prompt: imagePrompt
          });
        } catch (error) {
          console.error('Error processing image:', error);
          setInput(originalInput);
          alert('Error processing the image. Please try again or use a different image format (PNG, JPG, GIF, WebP, SVG).');
        }
      };

      reader.onerror = () => {
        setInput(originalInput);
        alert('Unable to read the image file. Please try a different image or check the file format.');
      };

      reader.readAsDataURL(file);
    } else if (file.type === 'application/pdf') {
      // Handle PDF files
      alert('PDF files are not yet supported for analysis. Please upload text-based files like code, documentation, or configuration files.');
    } else {
      // Try to read as text anyway (for files without proper MIME types)
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (content && content.length > 0 && /^[\x00-\x7F]*$/.test(content.substring(0, 1000))) {
          // Content appears to be text-based
          const prompt = `Analyze this file content and suggest relevant repositories:\n\n${content.substring(0, 2000)}${content.length > 2000 ? '...' : ''}`;
          setInput(prompt);
        } else {
          alert('This file type is not supported. Please upload text-based files like code, documentation, configuration files, or other text formats.');
        }
      };
      reader.onerror = () => {
        alert('Unable to read this file. Please upload text-based files like code, documentation, or configuration files.');
      };
      reader.readAsText(file);
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Memoize chat messages with stable keys to prevent unnecessary re-renders
  const stableChatMessages = useMemo(() => {
    return chat.map(msg => ({ ...msg, stableKey: msg.id }));
  }, [chat]);

  // Separate input handler to prevent affecting chat messages
  const handleInputChange = useCallback((value: string) => {
    setInput(value);
    setInputId(prev => prev + 1); // Increment to isolate input changes
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Language color mapping for badges
  const languageColors = {
    JavaScript: 'from-yellow-400 to-yellow-600',
    TypeScript: 'from-blue-400 to-blue-600',
    Python: 'from-green-400 to-blue-500',
    React: 'from-cyan-400 to-blue-500',
    Java: 'from-orange-500 to-red-600',
    Go: 'from-cyan-500 to-blue-600',
    Rust: 'from-orange-600 to-red-700',
    Swift: 'from-orange-400 to-red-500',
    Ruby: 'from-red-500 to-pink-600',
    PHP: 'from-purple-500 to-indigo-600',
    'C++': 'from-pink-500 to-blue-600',
    C: 'from-gray-500 to-blue-600',
    CSS: 'from-purple-400 to-pink-500',
    HTML: 'from-orange-500 to-red-500',
    Vue: 'from-green-500 to-teal-600',
    Unknown: 'from-gray-400 to-gray-600'
  };

  const getLanguageGradient = (language: string) => {
    return languageColors[language as keyof typeof languageColors] || languageColors.Unknown;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  // Separate component for repository display with complete isolation
  const RepositoryDisplay = React.memo(({ 
    messageId, 
    repositories, 
    initialVisible = false,
    onToggle 
  }: { 
    messageId: string; 
    repositories: Repository[]; 
    initialVisible?: boolean;
    onToggle: (id: string) => void; 
  }) => {
    // Use parent state instead of internal state to fix sync issues
    const isVisible = showRepositories.has(messageId);
    
    const handleToggle = useCallback(() => {
      onToggle(messageId);
    }, [messageId, onToggle]);

    // Memoize the repository grid to prevent re-renders
    const repositoryGrid = useMemo(() => (
      <div className="mt-4">
        <div className="grid gap-6 grid-cols-1">
          {repositories.map((repo, repoIdx) => (
            <RepositoryCard 
              key={`repo-${repo.name}-${repo.url}-${repoIdx}`} 
              repo={repo} 
              index={repoIdx} 
            />
          ))}
        </div>
      </div>
    ), [repositories]);

    return (
      <div className="mt-4">
        {/* Summary with Show Repositories Button */}
        <div className="mb-4 p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Package className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-white font-semibold">
                  Found {repositories.length} repositories
                </p>
                <p className="text-gray-400 text-sm">
                  Click to view all matching repositories
                </p>
              </div>
            </div>
            
            <button
              onClick={handleToggle}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg font-medium transition-all duration-300 flex items-center gap-2"
            >
              {isVisible ? (
                <>
                  <span>Hide Repositories</span>
                  <span>▲</span>
                </>
              ) : (
                <>
                  <span>Show Repositories</span>
                  <span>▼</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Repository Grid - Static conditional render without any animations */}
        {isVisible && repositoryGrid}
      </div>
    );
  }, (prevProps, nextProps) => {
    // Custom comparison to prevent unnecessary re-renders
    return (
      prevProps.messageId === nextProps.messageId &&
      prevProps.repositories.length === nextProps.repositories.length &&
      prevProps.repositories === nextProps.repositories &&
      prevProps.onToggle === nextProps.onToggle
    );
  });

  const RepositoryCard: React.FC<{ repo: Repository; index: number }> = React.memo(({ repo, index }) => {
    const gradient = getLanguageGradient(repo.language || 'Unknown');
    
    return (
      <div className="group relative transition-transform duration-300 hover:-translate-y-2"
      >
        {/* Glow effect on hover */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl opacity-0 group-hover:opacity-75 blur-xl transition duration-500"></div>
        
        <div className="relative h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl border border-gray-700/50 group-hover:border-gray-600/50 transition-all duration-300 overflow-hidden">
          {/* Top accent bar */}
          <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient} opacity-80`}></div>
          
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10"></div>
          </div>
          
          <div className="relative p-6 flex flex-col h-full">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2.5 rounded-xl bg-gradient-to-br ${gradient} shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12`}>
                    <Github className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-white text-lg truncate group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-blue-400 transition-all duration-300">
                      {repo.name}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {repo.owner || 'Unknown'}
                    </p>
                  </div>
                </div>
              </div>
              
              <a
                href={repo.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open ${repo.name} repository in new tab`}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-300 hover:scale-110 hover:rotate-12 group/link"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-4 h-4 text-gray-400 group-hover/link:text-purple-400 transition-colors" />
              </a>
            </div>
            
            {/* Description */}
            <div className="flex-1 mb-4">
              <p className="text-gray-300 text-sm leading-relaxed line-clamp-3">
                {repo.description || 'No description available for this repository.'}
              </p>
            </div>
            
            {/* Language Badge */}
            {repo.language && (
              <div className="mb-4">
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${gradient} text-white text-xs font-semibold shadow-md transition-transform duration-300 hover:scale-105`}>
                  <Code className="w-3.5 h-3.5" />
                  {repo.language}
                </div>
              </div>
            )}
            
            {/* Stats */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-700/50">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 group/stat transition-transform duration-300 hover:scale-110">
                  <div className="p-1.5 rounded-lg bg-yellow-500/10 group-hover/stat:bg-yellow-500/20 transition-colors">
                    <Star className="w-4 h-4 text-yellow-400" />
                  </div>
                  <span className="text-sm font-semibold text-yellow-400">
                    {formatNumber(repo.stars || 0)}
                  </span>
                </div>
                
                <div className="flex items-center gap-1.5 group/stat transition-transform duration-300 hover:scale-110">
                  <div className="p-1.5 rounded-lg bg-blue-500/10 group-hover/stat:bg-blue-500/20 transition-colors">
                    <GitFork className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-sm font-semibold text-blue-400">
                    {formatNumber(repo.forks || 0)}
                  </span>
                </div>
              </div>
              
              {/* Activity indicator */}
              <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-green-400 animate-pulse" />
                <span className="text-xs text-green-400 font-medium">Active</span>
              </div>
            </div>
            
            {/* Hover shine effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none transform skew-x-12"></div>
          </div>
        </div>
      </div>
    );
  }, (prevProps, nextProps) => {
    // Prevent re-renders unless repo data actually changes
    return (
      prevProps.repo.name === nextProps.repo.name &&
      prevProps.repo.url === nextProps.repo.url &&
      prevProps.index === nextProps.index
    );
  });

  const TypingIndicator = () => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 flex justify-start"
    >
      <div className="bg-white/10 text-white border border-white/10 px-4 py-3 rounded-2xl shadow-lg">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce-1"></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce-2"></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce-3"></div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-black text-white relative">
      {/* Matrix Background Animation */}
      <MatrixBackground />
      
      {/* Back Button - Top Left Corner */}
      <div className="absolute top-20 left-4 z-20">
        <BackButton />
      </div>
      
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col pt-20 pb-8 px-4 md:px-6 lg:px-8 relative z-10 min-w-0">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-12 overflow-hidden w-full min-w-0"
        >
          <motion.h1 
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
            className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 px-2 text-center min-w-0 w-full"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex-shrink-0"
            >
              <Github className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 text-white drop-shadow-lg" />
            </motion.div>
            <span className="break-words hyphens-auto min-w-0 flex-shrink">AI Repository Search</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="text-gray-300 text-xl mb-4 max-w-3xl mx-auto leading-relaxed"
          >
            Ask AI to find GitHub repositories using natural language queries
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
            className="flex items-center justify-center gap-4 text-sm text-gray-400"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Natural Language</span>
            </div>
            <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <span>AI-Powered</span>
            </div>
            <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
              <span>Instant Results</span>
            </div>
          </motion.div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex-1 overflow-y-auto mb-6 rounded-2xl bg-black/30 backdrop-blur-xl p-8 border border-purple-500/30 shadow-2xl relative"
          style={{
            background: 'linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(30,30,30,0.4) 100%)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
          }}
        >
          {chat.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-center mt-20"
            >
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="inline-block mb-6"
              >
                <Sparkles className="w-16 h-16 text-purple-400 mx-auto animate-pulse" />
              </motion.div>
              <motion.h2 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-2xl font-bold text-white mb-3 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent"
              >
                Welcome to AI Repository Search!
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-gray-400 mb-8 text-lg"
              >
                Ask for GitHub repos by topic, technology, or use case
              </motion.p>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0 }}
                className="flex flex-wrap justify-center gap-3"
              >
                {[
                  { text: 'React components', icon: '⚛️' },
                  { text: 'Show 15 machine learning Python repos', icon: '🤖' },
                  { text: 'Find 10 Node.js APIs', icon: '🚀' },
                  { text: 'Get 20 Flutter apps', icon: '📱' }
                ].map((example, idx) => (
                  <motion.button
                    key={idx}
                    onClick={() => setInput(example.text)}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.2 + idx * 0.1 }}
                    className="group px-4 py-2 bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-300 rounded-xl text-sm font-medium hover:from-purple-500/30 hover:to-blue-500/30 transition-all duration-300 border border-purple-500/30 hover:border-purple-400/50 backdrop-blur-sm relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative z-10 flex items-center gap-2">
                      <span className="text-lg">{example.icon}</span>
                      <span>"{example.text}"</span>
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            </motion.div>
          )}
          
          {/* Chat Messages - Remove AnimatePresence to prevent flicker */}
          {stableChatMessages.map((msg) => (
            <div
              key={msg.stableKey}
              className={`mb-8 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] ${msg.role === 'user' ? 'ml-8' : 'mr-8'}`}>
                {/* Message Header */}
                <div className={`flex items-center gap-2 mb-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <span className="text-xs text-gray-400">{formatTime(msg.timestamp)}</span>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    msg.role === 'user' ? 'bg-gradient-to-r from-purple-500 to-blue-500' : 'bg-gray-700'
                  }`}>
                    {msg.role === 'user' ? '👤' : '🤖'}
                  </div>
                </div>
                
                {/* Message Content */}
                <div
                  className={`px-6 py-4 rounded-2xl shadow-xl border backdrop-blur-sm ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-purple-600/90 to-blue-600/90 text-white border-purple-500/30'
                      : 'bg-white/10 text-white border-white/20'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <>
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                      {/* Copy and Play buttons for assistant messages */}
                      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/10">
                        <button
                          onClick={() => copyMessage(msg.content, msg.id)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-gray-300 hover:text-white transition-all duration-200 group"
                        >
                          {copiedMessageId === msg.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-green-400" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                        
                        <button
                          onClick={() => playMessage(msg.content, msg.id)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-gray-300 hover:text-white transition-all duration-200 group"
                        >
                          <Play className={`w-3.5 h-3.5 group-hover:scale-110 transition-transform ${
                            playingMessageId === msg.id ? 'text-green-400 animate-pulse' : ''
                          }`} />
                          <span>{playingMessageId === msg.id ? 'Playing...' : 'Listen'}</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <div>{msg.content}</div>
                  )}
                </div>
                
                {/* Repository Cards */}
                {msg.repositories && msg.repositories.length > 0 && (
                  <RepositoryDisplay
                    messageId={msg.id}
                    repositories={msg.repositories}
                    initialVisible={false}
                    onToggle={toggleRepositories}
                  />
                )}
              </div>
            </div>
          ))}
          
          {loading && <TypingIndicator />}
          <div ref={chatEndRef} />
        </motion.div>
        {error && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl mb-4 backdrop-blur-sm"
          >
            <div className="flex items-center gap-2">
              <span className="text-red-400">⚠️</span>
              {error}
            </div>
          </motion.div>
        )}
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="relative"
        >
          <div className="flex items-end gap-4 bg-gradient-to-r from-black/40 via-gray-900/40 to-black/40 backdrop-blur-xl p-6 rounded-2xl border border-purple-500/30 shadow-2xl relative overflow-hidden">
            {/* Animated border glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-pink-500/20 rounded-2xl animate-pulse"></div>
            
            <div className="flex-1 relative z-10">
              <div className="relative">
                {/* Image indicator */}
                {imageData && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -top-12 left-0 right-0 z-20"
                  >
                    <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-lg px-4 py-2 backdrop-blur-sm">
                      <div className="flex items-center gap-2 text-sm text-purple-300">
                        <span className="text-lg">🖼️</span>
                        <span>Image ready for analysis</span>
                        <button
                          onClick={() => setImageData(null)}
                          className="ml-auto text-purple-400 hover:text-purple-300 p-1"
                          title="Remove image"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                <motion.input
                  whileFocus={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="w-full px-6 py-4 pr-20 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-400/30 placeholder-gray-400 transition-all duration-300 text-lg backdrop-blur-sm"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
                  }}
                  placeholder="Ask for repositories... (e.g., 'React component libraries')"
                  value={input}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                />
                
                {/* Input method buttons */}
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                  {input && !loading && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="w-2 h-2 bg-green-400 rounded-full animate-pulse"
                    ></motion.div>
                  )}
                  
                  {/* Voice input button */}
                  <button
                    onClick={startVoiceRecording}
                    disabled={loading || isRecording}
                    className={`p-2 rounded-lg transition-all duration-200 group ${
                      isRecording 
                        ? 'bg-red-500/20 border border-red-500/30' 
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                    aria-label="Voice input"
                    title={isRecording ? 'Recording... Click to stop' : 'Start voice input'}
                  >
                    <Mic className={`w-4 h-4 ${
                      isRecording 
                        ? 'text-red-400 animate-pulse' 
                        : 'text-purple-400 group-hover:text-purple-300'
                    }`} />
                  </button>
                  
                  {/* File upload button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-200 group"
                    aria-label="Upload file"
                    title="Upload code, images, config, or documentation files"
                  >
                    <Upload className="w-4 h-4 text-purple-400 group-hover:text-purple-300" />
                  </button>
                </div>
              </div>
              
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.js,.ts,.jsx,.tsx,.py,.java,.cpp,.c,.css,.html,.xml,.json,.yaml,.yml,.csv,.log,.sql,.sh,.bat,.php,.rb,.go,.rs,.swift,.kt,.scala,.r,.dockerfile,.png,.jpg,.jpeg,.gif,.bmp,.webp,.svg,text/*,application/json,application/xml,image/*"
                onChange={handleFileUpload}
                className="hidden"
                aria-label="Upload file for repository search"
              />
            </div>
            
            <motion.button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className={`
                px-8 py-4 rounded-xl font-semibold text-white transition-all duration-300 relative overflow-hidden group
                ${loading || !input.trim() 
                  ? 'bg-gray-700 cursor-not-allowed opacity-50' 
                  : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 shadow-lg hover:shadow-purple-500/25'
                }
              `}
              style={{
                boxShadow: loading || !input.trim() ? 'none' : '0 10px 30px rgba(147, 51, 234, 0.3)',
              }}
            >
              {/* Button glow effect */}
              {!loading && input.trim() && (
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/50 to-blue-600/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
              )}
              
              <div className="relative z-10 flex items-center gap-3">
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    <span>Search</span>
                  </>
                )}
              </div>
            </motion.button>
          </div>
          
          {/* Search Stats */}
          {searchStats.totalRepos > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 text-center"
            >
              <span className="text-sm text-gray-400">
                Found <span className="text-purple-400 font-semibold">{searchStats.totalRepos}</span> repositories in{' '}
                <span className="text-blue-400 font-semibold">{searchStats.searchTime}ms</span>
              </span>
            </motion.div>
          )}
        </motion.div>
      </div>
      
      {/* Premium Toast Notification */}
      {showToast && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="fixed top-24 right-6 z-[9999] bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-3 rounded-xl shadow-2xl backdrop-blur-xl"
          style={{ 
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3), 0 0 20px rgba(34, 197, 94, 0.4)'
          }}
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="font-medium">{toastMessage}</span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default RepoSearchPage; 