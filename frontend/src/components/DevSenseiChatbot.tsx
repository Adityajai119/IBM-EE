import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Lightbulb, Keyboard, BookOpen
} from 'lucide-react';

interface DevSenseiChatbotProps {
  onKeyboardShortcuts?: () => void;
  onTemplates?: () => void;
  showKeyboardShortcuts?: boolean;
  showTemplates?: boolean;
}

const DevSenseiChatbot: React.FC<DevSenseiChatbotProps> = ({ 
  onKeyboardShortcuts, 
  onTemplates,
  showKeyboardShortcuts = false,
  showTemplates = false
}) => {
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [aiAssistantPulse, setAiAssistantPulse] = useState(true);

  // AI Assistant pulse animation
  useEffect(() => {
    const interval = setInterval(() => {
      setAiAssistantPulse(prev => !prev);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Floating AI Assistant Button */}
      {!showAIAssistant && (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ delay: 1, type: "spring", stiffness: 200 }}
        className="fixed bottom-8 right-8 z-50"
      >
        <motion.button
          onClick={() => setShowAIAssistant(true)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 relative overflow-hidden group"
          title="AI Assistant"
        >
        <motion.div
          animate={{ 
            scale: aiAssistantPulse ? [1, 1.2, 1] : 1,
            rotate: [0, 360]
          }}
          transition={{ 
            scale: { duration: 2, repeat: Infinity },
            rotate: { duration: 8, repeat: Infinity, ease: "linear" }
          }}
        >
          <Sparkles size={24} className="text-white relative z-10" />
        </motion.div>
        
        {/* Pulsing glow effect */}
        <motion.div
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-lg"
        />
        
        {/* Notification dot */}
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"
        />
      </motion.button>
    </motion.div>
    )}

    {/* DevSensei Chatbot */}
    <AnimatePresence>
      {showAIAssistant && (
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed top-20 right-0 h-[calc(100vh-5rem)] w-80 bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-xl border-l border-gray-700/50 z-40 flex flex-col shadow-2xl"
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-700/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center"
              >
                <Sparkles size={16} className="text-white" />
              </motion.div>
              <div>
                <h3 className="text-lg font-bold text-white">DevSensei</h3>
                <p className="text-xs text-gray-400">Your AI coding assistant</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowAIAssistant(false)}
              className="p-1 text-gray-400 hover:text-white rounded-full hover:bg-gray-800/50 transition-all"
            >
              ✕
            </motion.button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={14} className="text-purple-400" />
                <span className="text-sm font-medium text-white">DevSensei</span>
              </div>
              <p className="text-sm text-gray-300">
                Hello! I'm DevSensei, your AI coding assistant. I can help you with:
              </p>
              <ul className="text-xs text-gray-400 mt-2 space-y-1">
                <li>• Code explanations and debugging</li>
                <li>• Best practices and optimizations</li>
                <li>• Quick tips and shortcuts</li>
                <li>• Repository analysis and insights</li>
                <li>• Frontend development guidance</li>
              </ul>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-4 border-t border-gray-700/50">
            <div className="grid grid-cols-2 gap-2 mb-3">
              {(onKeyboardShortcuts || showKeyboardShortcuts) && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    if (onKeyboardShortcuts) {
                      onKeyboardShortcuts();
                      setShowAIAssistant(false);
                    }
                  }}
                  className="p-2 bg-gray-800/80 rounded-lg border border-gray-700/50 hover:border-blue-400/50 transition-all text-left"
                >
                  <Keyboard size={16} className="text-blue-400 mb-1" />
                  <div className="text-xs font-medium text-white">Shortcuts</div>
                </motion.button>
              )}
              
              {(onTemplates || showTemplates) && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    if (onTemplates) {
                      onTemplates();
                      setShowAIAssistant(false);
                    }
                  }}
                  className="p-2 bg-gray-800/80 rounded-lg border border-gray-700/50 hover:border-green-400/50 transition-all text-left"
                >
                  <BookOpen size={16} className="text-green-400 mb-1" />
                  <div className="text-xs font-medium text-white">Templates</div>
                </motion.button>
              )}
            </div>
            
            {/* Chat Input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ask DevSensei anything..."
                className="flex-1 px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:border-purple-400/50"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white text-sm font-medium"
              >
                Send
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
};

export default DevSenseiChatbot;
