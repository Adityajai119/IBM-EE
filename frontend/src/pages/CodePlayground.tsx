import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Loader2, Code, Bug, Zap, MessageSquare, Save, FolderOpen, 
  Download, Share2, Clock, Gauge, FileText, Lightbulb,
  Terminal, Keyboard, Maximize, Check, Star, BookOpen,
  Shield, TestTube, BarChart3, Sparkles
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import { codeApi } from '../services/api';
import MatrixBackground from '../components/MatrixBackground';
import BackButton from '../components/ui/BackButton';
import StarButton from '../components/ui/StarButton';

interface Language {
  id: string;
  name: string;
  monacoId: string;
}

interface CodeFile {
  id: string;
  name: string;
  content: string;
  language: string;
  lastModified: Date;
  size: number;
}

interface ExecutionMetrics {
  executionTime: number;
  memoryUsage: number;
  linesOfCode: number;
  complexity: number;
}

interface CodeTemplate {
  id: string;
  name: string;
  description: string;
  language: string;
  code: string;
  category: string;
}

interface KeyboardShortcut {
  key: string;
  description: string;
  action: () => void;
}

const languageMap: Record<string, Language> = {
  python: { id: 'python', name: 'Python', monacoId: 'python' },
  javascript: { id: 'javascript', name: 'JavaScript', monacoId: 'javascript' },
  typescript: { id: 'typescript', name: 'TypeScript', monacoId: 'typescript' },
  java: { id: 'java', name: 'Java', monacoId: 'java' },
  cpp: { id: 'cpp', name: 'C++', monacoId: 'cpp' },
  c: { id: 'c', name: 'C', monacoId: 'c' },
  go: { id: 'go', name: 'Go', monacoId: 'go' },
  rust: { id: 'rust', name: 'Rust', monacoId: 'rust' },
  ruby: { id: 'ruby', name: 'Ruby', monacoId: 'ruby' },
  php: { id: 'php', name: 'PHP', monacoId: 'php' },
};

const codeTemplates: CodeTemplate[] = [
  {
    id: 'python-hello',
    name: 'Hello World',
    description: 'Basic Python hello world program',
    language: 'python',
    category: 'Basic',
    code: '# Hello World in Python\nprint("Hello, World!")\n\n# Your code here...'
  },
  {
    id: 'python-fibonacci',
    name: 'Fibonacci Sequence',
    description: 'Generate Fibonacci numbers',
    language: 'python',
    category: 'Algorithms',
    code: '# Fibonacci Sequence\ndef fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)\n\n# Generate first 10 numbers\nfor i in range(10):\n    print(f"F({i}) = {fibonacci(i)}")'
  },
  {
    id: 'js-async',
    name: 'Async/Await Pattern',
    description: 'Modern JavaScript async programming',
    language: 'javascript',
    category: 'Modern JS',
    code: '// Async/Await Example\nasync function fetchData(url) {\n  try {\n    const response = await fetch(url);\n    const data = await response.json();\n    return data;\n  } catch (error) {\n    console.error("Error:", error);\n  }\n}\n\n// Usage\nfetchData("https://api.example.com/data")\n  .then(data => console.log(data));'
  },
  {
    id: 'java-class',
    name: 'Basic Class Structure',
    description: 'Java class with constructor and methods',
    language: 'java',
    category: 'OOP',
    code: 'public class Person {\n    private String name;\n    private int age;\n    \n    public Person(String name, int age) {\n        this.name = name;\n        this.age = age;\n    }\n    \n    public void introduce() {\n        System.out.println("Hi, I\'m " + name + " and I\'m " + age + " years old.");\n    }\n    \n    public static void main(String[] args) {\n        Person person = new Person("Alice", 25);\n        person.introduce();\n    }\n}'
  }
];

export const CodePlayground: React.FC = () => {
  // Core state
  const [code, setCode] = useState('# Write your code here\nprint("Hello, World!")');
  const [language, setLanguage] = useState('python');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [showExplanation, setShowExplanation] = useState(false);
  const [explanation, setExplanation] = useState('');

  // Premium features state
  const [files, setFiles] = useState<CodeFile[]>([]);
  const [currentFileId, setCurrentFileId] = useState<string | null>(null);
  const [showFileManager, setShowFileManager] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [executionMetrics, setExecutionMetrics] = useState<ExecutionMetrics | null>(null);
  const [autoSave] = useState(true);
  const [editorTheme] = useState('vs-dark');
  const [fontSize] = useState(14);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [codeReview, setCodeReview] = useState('');
  const [securityIssues, setSecurityIssues] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Premium 10/10 UI state additions
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');
  const [isStarred, setIsStarred] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [editorZoom, setEditorZoom] = useState(100);
  const [outputPanelHeight, setOutputPanelHeight] = useState(250);
  const [isDraggingPanel, setIsDraggingPanel] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [metricsAnimated, setMetricsAnimated] = useState(false);
  const [showRefactor, setShowRefactor] = useState(false);
  const [refactoredCode, setRefactoredCode] = useState('');
  const [showTests, setShowTests] = useState(false);
  const [generatedTests, setGeneratedTests] = useState('');

  // Premium toast notification system
  const showToastNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Premium confetti effect
  const triggerConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  // Premium mouse tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Auto-save functionality with premium feedback
  useEffect(() => {
    if (autoSave && code && currentFileId) {
      const timeoutId = setTimeout(() => {
        saveCurrentFile();
        showToastNotification('Auto-saved successfully', 'info');
      }, 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [code, autoSave, currentFileId]);

  // Premium mouse tracking for interactive effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Keyboard shortcuts
  // Fullscreen functionality
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.log('Fullscreen not supported or failed:', error);
      // Fallback to visual fullscreen
      setIsFullscreen(!isFullscreen);
    }
  };

  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'r':
            e.preventDefault();
            executeCode();
            break;
          case 's':
            e.preventDefault();
            saveCurrentFile();
            break;
          case 'n':
            e.preventDefault();
            createNewFile();
            break;
          case 'o':
            e.preventDefault();
            setShowFileManager(true);
            break;
          case 'k':
            e.preventDefault();
            setShowKeyboardShortcuts(true);
            break;
          case 'Enter':
            e.preventDefault();
            if (prompt.trim()) generateCode();
            break;
        }
      }
      if (e.key === 'F11') {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    window.addEventListener('keydown', handleKeyboard);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      window.removeEventListener('keydown', handleKeyboard);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [prompt, isFullscreen]);

  // File management functions
  const createNewFile = () => {
    const newFile: CodeFile = {
      id: Date.now().toString(),
      name: `new-file.${language === 'javascript' ? 'js' : language === 'typescript' ? 'ts' : language === 'python' ? 'py' : 'txt'}`,
      content: codeTemplates.find(t => t.language === language)?.code || '// New file',
      language,
      lastModified: new Date(),
      size: 0
    };
    setFiles([...files, newFile]);
    setCurrentFileId(newFile.id);
    setCode(newFile.content);
  };

  const saveCurrentFile = () => {
    if (currentFileId) {
      setFiles(files.map(f => 
        f.id === currentFileId 
          ? { ...f, content: code, lastModified: new Date(), size: code.length }
          : f
      ));
      triggerSuccessAnimation();
    }
  };

  const loadFile = (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (file) {
      setCurrentFileId(fileId);
      setCode(file.content);
      setLanguage(file.language);
    }
  };

  const deleteFile = (fileId: string) => {
    setFiles(files.filter(f => f.id !== fileId));
    if (currentFileId === fileId) {
      setCurrentFileId(null);
      setCode('');
    }
  };

  const triggerSuccessAnimation = () => {
    setShowSuccessAnimation(true);
    setShowConfetti(true);
    setMetricsAnimated(true);
    setTimeout(() => {
      setShowSuccessAnimation(false);
      setShowConfetti(false);
    }, 2000);
  };

  const calculateMetrics = (code: string): ExecutionMetrics => {
    const lines = code.split('\n').length;
    const complexity = Math.floor(Math.random() * 10) + 1; // Mock complexity
    return {
      executionTime: Math.random() * 1000, // Mock execution time
      memoryUsage: Math.random() * 100, // Mock memory usage
      linesOfCode: lines,
      complexity
    };
  };

  const executeCode = async () => {
    setLoading(true);
    setError('');
    setOutput('');
    const startTime = Date.now();
    
    try {
      const result = await codeApi.execute(code, language, input);
      const endTime = Date.now();
      
      setOutput(result.output || '');
      setError(result.error || '');
      
      // Calculate metrics
      const metrics = calculateMetrics(code);
      metrics.executionTime = endTime - startTime;
      setExecutionMetrics(metrics);
      setMetricsAnimated(true);
      
      if (!result.error) {
        // Premium success effects
        triggerConfetti();
        showToastNotification('🎉 Code executed successfully!', 'success');
        triggerSuccessAnimation();
      } else {
        showToastNotification('❌ Execution failed', 'error');
      }
    } catch {
      setError('Failed to execute code');
      showToastNotification('❌ Execution error', 'error');
    } finally {
      setLoading(false);
    }
  };

  const generateCode = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    try {
      const result = await codeApi.generate(prompt, language);
      setCode(result.code);
      setPrompt('');
      
      // Premium success effects
      triggerConfetti();
      showToastNotification('✨ Code generated successfully!', 'success');
      triggerSuccessAnimation();
      
    } catch {
      setError('Failed to generate code');
      showToastNotification('❌ Generation failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const explainCode = async () => {
    setLoading(true);
    try {
      const result = await codeApi.explain(code, language);
      setExplanation(result.explanation);
      setShowExplanation(true);
    } catch {
      setError('Failed to explain code');
    } finally {
      setLoading(false);
    }
  };

  const debugCode = async () => {
    setLoading(true);
    try {
      console.log('CodePlayground: Debugging code with error:', error);
      const result = await codeApi.debug(code, language, error);
      console.log('CodePlayground: Debug result:', result);
      
      // Use the correct field name from the API response
      const fixedCode = result.debugged_code || result.fixed_code || code;
      setCode(fixedCode);
      
      if (result.suggestions) {
        setExplanation(result.suggestions.join('\n'));
        setShowExplanation(true);
      }
      triggerSuccessAnimation();
    } catch (err) {
      console.error('CodePlayground: Debug error:', err);
      setError('Failed to debug code');
    } finally {
      setLoading(false);
    }
  };

  const optimizeCode = async () => {
    setLoading(true);
    try {
      console.log('CodePlayground: Optimizing code');
      const result = await codeApi.optimize(code, language);
      console.log('CodePlayground: Optimize result:', result);
      
      setCode(result.optimized_code);
      if (result.improvements) {
        setExplanation(result.improvements.join('\n'));
        setShowExplanation(true);
      }
      triggerSuccessAnimation();
    } catch (err) {
      console.error('CodePlayground: Optimize error:', err);
      setError('Failed to optimize code');
    } finally {
      setLoading(false);
    }
  };

  const reviewCode = async () => {
    setLoading(true);
    try {
      const result = await codeApi.analyze(code, language);
      setCodeReview(result.summary || "Code analysis completed");
      setSecurityIssues(result.security_issues || []);
      setSuggestions(result.suggestions || []);
      setShowExplanation(true);
    } catch {
      setError('Failed to review code');
    } finally {
      setLoading(false);
    }
  };

  const refactorCode = async () => {
    setLoading(true);
    try {
      const result = await codeApi.refactor(code, language);
      setRefactoredCode(result.refactored_code);
      setShowRefactor(true);
      triggerSuccessAnimation();
    } catch {
      setError('Failed to refactor code');
    } finally {
      setLoading(false);
    }
  };

  const generateTests = async () => {
    setLoading(true);
    try {
      const result = await codeApi.generate(code, language, undefined);
      if (result.tests) {
        setGeneratedTests(result.tests);
        setShowTests(true);
      }
      triggerSuccessAnimation();
    } catch {
      setError('Failed to generate tests');
    } finally {
      setLoading(false);
    }
  };

  const shareCode = async () => {
    const encodedCode = btoa(code);
    const url = `${window.location.origin}/shared/${encodedCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadCode = () => {
    const extension = language === 'javascript' ? 'js' : language === 'typescript' ? 'ts' : language === 'python' ? 'py' : 'txt';
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadTemplate = (template: CodeTemplate) => {
    setCode(template.code);
    setLanguage(template.language);
    setShowTemplates(false);
    triggerSuccessAnimation();
  };

  const keyboardShortcuts: KeyboardShortcut[] = [
    { key: 'Ctrl+R', description: 'Run code', action: executeCode },
    { key: 'Ctrl+S', description: 'Save file', action: saveCurrentFile },
    { key: 'Ctrl+N', description: 'New file', action: createNewFile },
    { key: 'Ctrl+O', description: 'Open file manager', action: () => setShowFileManager(true) },
    { key: 'Ctrl+K', description: 'Show shortcuts', action: () => setShowKeyboardShortcuts(true) },
    { key: 'F11', description: 'Toggle fullscreen', action: toggleFullscreen },
    { key: 'Ctrl+Enter', description: 'Generate code', action: generateCode },
  ];

  return (
    <div className={`min-h-screen bg-black text-white transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-[200] p-4' : 'pt-20 px-8 pb-8'} relative overflow-hidden`}>
      {/* Matrix Background Animation */}
      <MatrixBackground />
      
      {/* Premium Confetti Animation */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(60)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                opacity: 1, 
                y: -50, 
                x: Math.random() * window.innerWidth,
                rotate: 0,
                scale: Math.random() * 0.7 + 0.3
              }}
              animate={{ 
                opacity: 0, 
                y: window.innerHeight + 100, 
                rotate: 720,
                transition: { 
                  duration: Math.random() * 2.5 + 2,
                  ease: "easeOut"
                }
              }}
              className={`absolute w-4 h-4 ${
                ['bg-purple-400', 'bg-blue-400', 'bg-pink-400', 'bg-yellow-400', 'bg-green-400', 'bg-red-400'][i % 6]
              } ${Math.random() > 0.5 ? 'rounded-full' : 'rounded-sm'}`}
            />
          ))}
        </div>
      )}
      
      {/* Premium Interactive Cursor Effect */}
      <div 
        className="fixed pointer-events-none z-50 w-8 h-8 rounded-full bg-gradient-to-r from-blue-400/20 via-purple-500/20 to-pink-500/20 blur-sm transition-all duration-100 ease-out"
        style={{
          left: mousePosition.x - 16,
          top: mousePosition.y - 16,
          transform: 'translate3d(0, 0, 0)',
        }}
      />
      
      {/* Premium Toast Notification System */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -100, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={`fixed top-8 right-8 z-50 backdrop-blur-xl border rounded-xl px-6 py-4 shadow-2xl ${
              toastType === 'success' ? 'bg-gradient-to-r from-green-500/90 to-emerald-600/90 border-green-400/50' :
              toastType === 'error' ? 'bg-gradient-to-r from-red-500/90 to-red-600/90 border-red-400/50' :
              'bg-gradient-to-r from-blue-500/90 to-blue-600/90 border-blue-400/50'
            }`}
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
                  className={`font-bold text-sm ${
                    toastType === 'success' ? 'text-green-600' :
                    toastType === 'error' ? 'text-red-600' :
                    'text-blue-600'
                  }`}
                >
                  {toastType === 'success' ? '✓' : toastType === 'error' ? '✗' : 'ℹ'}
                </motion.div>
              </motion.div>
              <div>
                <div className="font-semibold">{toastMessage}</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Success Animation - Enhanced with Confetti */}
      <AnimatePresence>
        {showSuccessAnimation && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: -50 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-gradient-to-r from-green-500/95 to-emerald-600/95 backdrop-blur-xl border border-green-400/50 text-white px-8 py-6 rounded-2xl flex items-center gap-4 shadow-2xl"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <Check size={32} className="text-white" />
            </motion.div>
            <div>
              <div className="text-xl font-bold">Execution Successful!</div>
              <div className="text-green-100">Code executed without errors</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Premium Confetti Animation */}
      <AnimatePresence>
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-40">
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  opacity: 1, 
                  y: -20, 
                  x: Math.random() * window.innerWidth,
                  rotate: 0 
                }}
                animate={{ 
                  opacity: 0, 
                  y: window.innerHeight + 100,
                  rotate: 360 * 3
                }}
                transition={{ 
                  duration: 3 + Math.random() * 2,
                  ease: "easeOut",
                  delay: Math.random() * 0.5
                }}
                className={`absolute w-3 h-3 ${
                  ['bg-yellow-400', 'bg-green-400', 'bg-blue-400', 'bg-purple-400', 'bg-pink-400'][Math.floor(Math.random() * 5)]
                } rounded-full`}
              />
            ))}
          </div>
        )}
      </AnimatePresence>
      
      {/* Back Button - Top Left Corner */}
      {!isFullscreen && (
        <div className="absolute top-20 left-4 z-20">
          <BackButton />
        </div>
      )}
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto relative z-10 px-4 md:px-6 lg:px-8"
      >
        {/* Header with Premium Features */}
        <div className="flex items-center justify-between mb-6 mt-8 px-2 md:px-4">
          <div className="flex-1 min-w-0">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl md:text-3xl lg:text-4xl font-bold text-white flex items-center gap-2 md:gap-3 justify-center relative overflow-hidden"
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="flex-shrink-0"
              >
                <Sparkles className="text-cyan-400 w-6 h-6 md:w-8 md:h-8" />
              </motion.div>
              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                <span className="hidden sm:inline">Code Playground Pro</span>
                <span className="sm:hidden">Code Pro</span>
              </span>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="flex-shrink-0"
              >
                <Star className="text-yellow-400 w-6 h-6 md:w-8 md:h-8" />
              </motion.div>
              
              {/* Premium glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 via-blue-500/20 to-purple-600/20 blur-xl opacity-50 -z-10" />
            </motion.h1>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Quick Actions with Premium Hover Effects */}
            <motion.button
              onHoverStart={() => setHoveredButton('templates')}
              onHoverEnd={() => setHoveredButton(null)}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowTemplates(true)}
              className="p-3 bg-gray-800/80 hover:bg-gray-700/80 rounded-xl transition-all duration-300 backdrop-blur-sm border border-gray-700/50 hover:border-cyan-400/50 relative overflow-hidden group"
              title="Code Templates"
            >
              <BookOpen size={18} className="relative z-10 text-gray-300 group-hover:text-cyan-400 transition-colors" />
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.button>
            
            <motion.button
              onHoverStart={() => setHoveredButton('files')}
              onHoverEnd={() => setHoveredButton(null)}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFileManager(true)}
              className="p-3 bg-gray-800/80 hover:bg-gray-700/80 rounded-xl transition-all duration-300 backdrop-blur-sm border border-gray-700/50 hover:border-green-400/50 relative overflow-hidden group"
              title="File Manager"
            >
              <FolderOpen size={18} className="relative z-10 text-gray-300 group-hover:text-green-400 transition-colors" />
              <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.button>
            
            <motion.button
              onHoverStart={() => setHoveredButton('share')}
              onHoverEnd={() => setHoveredButton(null)}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={shareCode}
              className="p-3 bg-gray-800/80 hover:bg-gray-700/80 rounded-xl transition-all duration-300 backdrop-blur-sm border border-gray-700/50 hover:border-purple-400/50 relative overflow-hidden group"
              title="Share Code"
            >
              {copied ? (
                <Check size={18} className="text-green-400 relative z-10" />
              ) : (
                <Share2 size={18} className="relative z-10 text-gray-300 group-hover:text-purple-400 transition-colors" />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.button>
            
            <motion.button
              onHoverStart={() => setHoveredButton('download')}
              onHoverEnd={() => setHoveredButton(null)}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={downloadCode}
              className="p-3 bg-gray-800/80 hover:bg-gray-700/80 rounded-xl transition-all duration-300 backdrop-blur-sm border border-gray-700/50 hover:border-yellow-400/50 relative overflow-hidden group"
              title="Download"
            >
              <Download size={18} className="relative z-10 text-gray-300 group-hover:text-yellow-400 transition-colors" />
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.button>
            
            <motion.button
              onHoverStart={() => setHoveredButton('shortcuts')}
              onHoverEnd={() => setHoveredButton(null)}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowKeyboardShortcuts(true)}
              className="p-3 bg-gray-800/80 hover:bg-gray-700/80 rounded-xl transition-all duration-300 backdrop-blur-sm border border-gray-700/50 hover:border-blue-400/50 relative overflow-hidden group"
              title="Keyboard Shortcuts"
            >
              <Keyboard size={18} className="relative z-10 text-gray-300 group-hover:text-blue-400 transition-colors" />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.button>
            
            <motion.button
              onHoverStart={() => setHoveredButton('fullscreen')}
              onHoverEnd={() => setHoveredButton(null)}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleFullscreen}
              className="p-3 bg-gray-800/80 hover:bg-gray-700/80 rounded-xl transition-all duration-300 backdrop-blur-sm border border-gray-700/50 hover:border-red-400/50 relative overflow-hidden group"
              title="Fullscreen"
            >
              <Maximize size={18} className="relative z-10 text-gray-300 group-hover:text-red-400 transition-colors" />
              <div className="absolute inset-0 bg-gradient-to-r from-red-400/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.button>
          </div>
        </div>

        {/* File Tabs */}
        {files.length > 0 && (
          <div className="flex items-center gap-2 mb-4 overflow-x-auto">
            {files.map(file => (
              <button
                key={file.id}
                onClick={() => loadFile(file.id)}
                className={`px-3 py-1 rounded-lg text-sm whitespace-nowrap flex items-center gap-2 ${
                  currentFileId === file.id 
                    ? 'bg-cyan-600 text-white' 
                    : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                }`}
              >
                <FileText size={14} />
                {file.name}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteFile(file.id);
                  }}
                  className="text-red-400 hover:text-red-300"
                >
                  ×
                </button>
              </button>
            ))}
            <button
              onClick={createNewFile}
              className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300"
            >
              + New
            </button>
          </div>
        )}

        {/* Code Generation Prompt */}
        <div className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Describe what code you want to generate... (Ctrl+Enter to generate)"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && generateCode()}
              className="flex-1 px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:border-cyan-500"
            />
            <StarButton
              onClick={generateCode}
              disabled={loading || !prompt.trim()}
              $$allowVisualHover={true}
            >
              <Code size={18} />
              Generate
            </StarButton>
          </div>
        </div>

        {/* Code Editor */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Terminal size={20} />
              Code Editor
              {autoSave && currentFileId && (
                <span className="text-sm text-green-400 flex items-center gap-1">
                  <Save size={14} />
                  Auto-saving...
                </span>
              )}
            </h2>
            <div className="flex items-center gap-4">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none"
                title="Select programming language"
              >
                {Object.values(languageMap).map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.name}
                  </option>
                ))}
              </select>
              <button
                onClick={saveCurrentFile}
                className="px-3 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg text-sm flex items-center gap-2"
                title="Save (Ctrl+S)"
              >
                <Save size={14} />
                Save
              </button>
            </div>
          </div>
          
          <div className="h-96 rounded-lg overflow-hidden border border-gray-800">
            <Editor
              height="100%"
              theme={editorTheme}
              language={languageMap[language].monacoId}
              value={code}
              onChange={(value: string | undefined) => setCode(value || '')}
              options={{
                minimap: { enabled: false },
                fontSize: fontSize,
                wordWrap: 'on',
                automaticLayout: true,
                suggestOnTriggerCharacters: true,
                quickSuggestions: true,
                folding: true,
                lineNumbers: 'on',
                renderLineHighlight: 'all',
              }}
            />
          </div>

          {/* Enhanced Action Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mt-4">
            <StarButton
              onClick={executeCode}
              disabled={loading}
              $$allowVisualHover={true}
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} />}
              Run
            </StarButton>
            <StarButton
              onClick={explainCode}
              disabled={loading}
              $$allowVisualHover={true}
            >
              <MessageSquare size={18} />
              Explain
            </StarButton>
            <StarButton
              onClick={debugCode}
              disabled={loading || !error}
              $$allowVisualHover={true}
            >
              <Bug size={18} />
              Debug
            </StarButton>
            <StarButton
              onClick={optimizeCode}
              disabled={loading}
              $$allowVisualHover={true}
            >
              <Zap size={18} />
              Optimize
            </StarButton>
            <StarButton
              onClick={reviewCode}
              disabled={loading}
              $$allowVisualHover={true}
            >
              <Shield size={18} />
              Review
            </StarButton>
            <StarButton
              onClick={refactorCode}
              disabled={loading}
              $$allowVisualHover={true}
            >
              <Code size={18} />
              Refactor
            </StarButton>
            <StarButton
              onClick={generateTests}
              disabled={loading}
              $$allowVisualHover={true}
            >
              <TestTube size={18} />
              Tests
            </StarButton>
          </div>

          {/* Input */}
          <div>
            <h3 className="text-sm font-medium mb-2 text-gray-400 flex items-center gap-2">
              <Terminal size={14} />
              Program Input
            </h3>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter input for your program..."
              className="w-full h-24 px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:border-cyan-500 font-mono text-sm"
            />
          </div>
        </div>

        {/* Enhanced Output Section */}
        <div className="space-y-4 mt-8">
          {/* Execution Metrics */}
          {executionMetrics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-gray-900 p-3 rounded-lg border border-gray-800">
                <div className="flex items-center gap-2 text-cyan-400 mb-1">
                  <Clock size={14} />
                  <span className="text-sm font-medium">Execution Time</span>
                </div>
                <span className="text-white font-mono">{executionMetrics.executionTime.toFixed(2)}ms</span>
              </div>
              <div className="bg-gray-900 p-3 rounded-lg border border-gray-800">
                <div className="flex items-center gap-2 text-green-400 mb-1">
                  <Gauge size={14} />
                  <span className="text-sm font-medium">Memory Usage</span>
                </div>
                <span className="text-white font-mono">{executionMetrics.memoryUsage.toFixed(1)}MB</span>
              </div>
              <div className="bg-gray-900 p-3 rounded-lg border border-gray-800">
                <div className="flex items-center gap-2 text-blue-400 mb-1">
                  <FileText size={14} />
                  <span className="text-sm font-medium">Lines of Code</span>
                </div>
                <span className="text-white font-mono">{executionMetrics.linesOfCode}</span>
              </div>
              <div className="bg-gray-900 p-3 rounded-lg border border-gray-800">
                <div className="flex items-center gap-2 text-purple-400 mb-1">
                  <BarChart3 size={14} />
                  <span className="text-sm font-medium">Complexity</span>
                </div>
                <span className="text-white font-mono">{executionMetrics.complexity}/10</span>
              </div>
            </div>
          )}

          {/* Output */}
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Terminal size={20} />
              Output
            </h2>
            <div className="h-48 p-4 bg-gray-900 rounded-lg border border-gray-800 overflow-auto">
              {output && (
                <pre className="text-white font-mono text-sm whitespace-pre-wrap">{output}</pre>
              )}
              {error && (
                <pre className="text-red-400 font-mono text-sm whitespace-pre-wrap">{error}</pre>
              )}
              {!output && !error && !loading && (
                <div className="text-gray-500">
                  <p>Output will appear here...</p>
                  <p className="text-xs text-gray-600 mt-1">
                    💡 Tip: Make sure your code includes print statements or function calls to see output
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    🔧 Try clicking "Debug" if your code defines functions but doesn't call them
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    🐛 If you see indentation errors, click "Debug" to automatically fix them
                  </p>
                </div>
              )}
              {loading && (
                <div className="flex items-center gap-2 text-gray-400">
                  <Loader2 className="animate-spin" size={16} />
                  Processing...
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Explanation */}
          {showExplanation && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Lightbulb size={20} />
                  AI Analysis
                </h2>
                <button
                  onClick={() => setShowExplanation(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                {explanation && (
                  <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
                    <h3 className="text-cyan-400 font-semibold mb-2">Code Explanation</h3>
                    <pre className="whitespace-pre-wrap text-sm text-white">{explanation}</pre>
                  </div>
                )}
                {codeReview && (
                  <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
                    <h3 className="text-green-400 font-semibold mb-2">Code Review</h3>
                    <pre className="whitespace-pre-wrap text-sm text-white">{codeReview}</pre>
                  </div>
                )}
                {securityIssues.length > 0 && (
                  <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
                    <h3 className="text-yellow-400 font-semibold mb-2">Security Analysis</h3>
                    <ul className="space-y-1">
                      {securityIssues.map((issue, index) => (
                        <li key={index} className="text-sm text-white flex items-start gap-2">
                          <Shield size={14} className="mt-0.5 text-yellow-400" />
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {suggestions.length > 0 && (
                  <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
                    <h3 className="text-purple-400 font-semibold mb-2">Suggestions</h3>
                    <ul className="space-y-1">
                      {suggestions.map((suggestion, index) => (
                        <li key={index} className="text-sm text-white flex items-start gap-2">
                          <Lightbulb size={14} className="mt-0.5 text-purple-400" />
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Modals */}
      
      {/* Refactor Modal */}
      <AnimatePresence>
        {showRefactor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Code size={24} />
                  Refactored Code
                </h2>
                <button
                  onClick={() => setShowRefactor(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <div className="h-96 rounded-lg overflow-hidden border border-gray-800 mb-4">
                <Editor
                  height="100%"
                  theme={editorTheme}
                  language={languageMap[language].monacoId}
                  value={refactoredCode}
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    fontSize: fontSize,
                    wordWrap: 'on',
                  }}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setCode(refactoredCode);
                    setShowRefactor(false);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  Use Refactored Code
                </button>
                <button
                  onClick={() => setShowRefactor(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tests Modal */}
      <AnimatePresence>
        {showTests && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <TestTube size={24} />
                  Generated Tests
                </h2>
                <button
                  onClick={() => setShowTests(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <div className="h-96 rounded-lg overflow-hidden border border-gray-800 mb-4">
                <Editor
                  height="100%"
                  theme={editorTheme}
                  language={languageMap[language].monacoId}
                  value={generatedTests}
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    fontSize: fontSize,
                    wordWrap: 'on',
                  }}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setCode(generatedTests);
                    setShowTests(false);
                  }}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg"
                >
                  Use Tests
                </button>
                <button
                  onClick={() => setShowTests(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* File Manager Modal */}
      <AnimatePresence>
        {showFileManager && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowFileManager(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-gray-900 p-6 rounded-lg border border-gray-700 max-w-2xl w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <FolderOpen size={20} />
                File Manager
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {files.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No files yet. Create your first file!</p>
                ) : (
                  files.map(file => (
                    <div key={file.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText size={16} />
                        <div>
                          <div className="font-medium">{file.name}</div>
                          <div className="text-sm text-gray-400">
                            {file.size} characters • {file.lastModified.toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            loadFile(file.id);
                            setShowFileManager(false);
                          }}
                          className="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 rounded text-sm"
                        >
                          Open
                        </button>
                        <button
                          onClick={() => deleteFile(file.id)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="flex justify-between mt-4">
                <button
                  onClick={createNewFile}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg"
                >
                  New File
                </button>
                <button
                  onClick={() => setShowFileManager(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Templates Modal */}
      <AnimatePresence>
        {showTemplates && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowTemplates(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-gray-900 p-6 rounded-lg border border-gray-700 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <BookOpen size={20} />
                Code Templates
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {codeTemplates.map(template => (
                  <div key={template.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold">{template.name}</h4>
                        <p className="text-sm text-gray-400">{template.description}</p>
                        <span className="inline-block mt-1 px-2 py-1 bg-gray-700 text-xs rounded">
                          {template.language}
                        </span>
                      </div>
                    </div>
                    <pre className="bg-gray-900 p-2 rounded text-xs overflow-x-auto mb-3 max-h-32">
                      {template.code.substring(0, 200)}...
                    </pre>
                    <button
                      onClick={() => loadTemplate(template)}
                      className="w-full px-3 py-2 bg-cyan-600 hover:bg-cyan-700 rounded text-sm"
                    >
                      Use Template
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setShowTemplates(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard Shortcuts Modal */}
      <AnimatePresence>
        {showKeyboardShortcuts && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowKeyboardShortcuts(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-gray-900 p-6 rounded-lg border border-gray-700 max-w-2xl w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Keyboard size={20} />
                Keyboard Shortcuts
              </h3>
              <div className="space-y-3">
                {keyboardShortcuts.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                    <span className="text-gray-300">{shortcut.description}</span>
                    <kbd className="px-3 py-1 bg-gray-700 rounded text-sm font-mono">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setShowKeyboardShortcuts(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}; 