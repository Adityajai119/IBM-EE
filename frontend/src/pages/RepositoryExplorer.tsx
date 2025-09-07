import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Github, Star, GitBranch, Languages, Search, Filter, Clock, ChevronLeft, ChevronRight, Trash2, TrendingUp, Calendar, Eye } from 'lucide-react';
import { githubApi } from '../services/api';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import GithubMark from '../assets/github-mark-white.svg';
import MatrixBackground from '../components/MatrixBackground';
import BackButton from '../components/ui/BackButton';
import SearchInput from '../components/ui/SearchInput';
import StarButton from '../components/ui/StarButton';

interface Repository {
  name: string;
  full_name: string;
  description: string;
  language: string;
  stars: number;
  default_branch: string;
  updated_at?: string;
  watchers_count?: number;
  forks_count?: number;
}

export const RepositoryExplorer: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [filteredRepos, setFilteredRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [sortBy, setSortBy] = useState<'stars' | 'updated' | 'name'>('stars');
  const [showFilters, setShowFilters] = useState(false);
  const [languages, setLanguages] = useState<string[]>([]);
  
  // Premium UI state
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [showConfetti, setShowConfetti] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [animationStep, setAnimationStep] = useState(0);
  const [searchStats, setSearchStats] = useState({ totalRepos: 0, searchTime: 0 });
  
  const navigate = useNavigate();
  
  const reposPerPage = 9;
  const totalPages = Math.ceil(filteredRepos.length / reposPerPage);
  const startIndex = (currentPage - 1) * reposPerPage;
  const endIndex = startIndex + reposPerPage;
  const currentRepos = filteredRepos.slice(startIndex, startIndex + reposPerPage);

  // Premium mouse tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Premium success effects
  const triggerConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  const showSuccessToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Load search history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('github-search-history');
    if (saved) {
      setSearchHistory(JSON.parse(saved));
    }
  }, []);

  // Save search history to localStorage
  const saveSearchHistory = (query: string) => {
    const updated = [query, ...searchHistory.filter(h => h !== query)].slice(0, 5);
    setSearchHistory(updated);
    localStorage.setItem('github-search-history', JSON.stringify(updated));
  };

  // Filter and sort repositories
  useEffect(() => {
    let filtered = [...repositories];

    // Filter by language
    if (selectedLanguage) {
      filtered = filtered.filter(repo => repo.language === selectedLanguage);
    }

    // Sort repositories
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'stars':
          return (b.stars || 0) - (a.stars || 0);
        case 'updated':
          return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    setFilteredRepos(filtered);
    setCurrentPage(1);

    // Extract unique languages
    const uniqueLanguages = [...new Set(repositories.map(repo => repo.language).filter(Boolean))];
    setLanguages(uniqueLanguages);
  }, [repositories, selectedLanguage, sortBy]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    setRepositories([]);
    setFilteredRepos([]);
    setAnimationStep(1);
    const startTime = Date.now();

    try {
      const response = await githubApi.getUserRepos(searchQuery.trim());
      const endTime = Date.now();
      
      setRepositories(response.repositories);
      saveSearchHistory(searchQuery.trim());
      
      // Update search stats
      setSearchStats({
        totalRepos: response.repositories.length,
        searchTime: endTime - startTime
      });
      
      // Premium success effects
      triggerConfetti();
      showSuccessToast(`🎉 Found ${response.repositories.length} repositories in ${endTime - startTime}ms!`);
      setAnimationStep(2);
      
    } catch (err) {
      setError('Failed to fetch repositories for this user. Please check the username and try again.');
      showSuccessToast('❌ Search failed', 'error');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleHistorySearch = (query: string) => {
    setSearchQuery(query);
    setTimeout(() => handleSearch(), 100);
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('github-search-history');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getLanguageColor = (language: string) => {
    const colors: { [key: string]: string } = {
      'JavaScript': '#f1e05a',
      'TypeScript': '#2b7489',
      'Python': '#3572A5',
      'Java': '#b07219',
      'C++': '#f34b7d',
      'C#': '#239120',
      'PHP': '#4F5D95',
      'Ruby': '#701516',
      'Go': '#00ADD8',
      'Rust': '#dea584',
      'Swift': '#ffac45',
      'Kotlin': '#F18E33',
    };
    return colors[language] || '#6b7280';
  };

  // Skeleton Loading Component
  const SkeletonCard = () => (
    <div className="bg-white/10 backdrop-blur-sm border border-gray-800 rounded-lg p-6 animate-pulse">
      <div className="flex items-center mb-2">
        <div className="w-5 h-5 bg-gray-600 rounded mr-2"></div>
        <div className="h-6 bg-gray-600 rounded w-3/4"></div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-gray-600 rounded w-full"></div>
        <div className="h-4 bg-gray-600 rounded w-2/3"></div>
      </div>
      <div className="flex gap-4 mb-2">
        <div className="h-4 bg-gray-600 rounded w-16"></div>
        <div className="h-4 bg-gray-600 rounded w-20"></div>
      </div>
      <div className="h-4 bg-gray-600 rounded w-24 mt-4"></div>
    </div>
  );

  const handleRepositoryClick = (repo: Repository) => {
    const [owner, repoName] = repo.full_name.split('/');
    navigate(`/repository/${owner}/${repoName}`);
  };

  return (
    <Layout>
      <div className="relative min-h-screen w-full flex flex-col items-center py-8 px-4 overflow-hidden">
        {/* Matrix Background Animation */}
        <MatrixBackground />
        
        {/* Premium Confetti Animation */}
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-50">
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  opacity: 1, 
                  y: -100, 
                  x: Math.random() * window.innerWidth,
                  rotate: 0,
                  scale: Math.random() * 0.5 + 0.5
                }}
                animate={{ 
                  opacity: 0, 
                  y: window.innerHeight + 100, 
                  rotate: 360,
                  transition: { 
                    duration: Math.random() * 2 + 2,
                    ease: "easeOut"
                  }
                }}
                className={`absolute w-3 h-3 ${
                  ['bg-purple-400', 'bg-blue-400', 'bg-pink-400', 'bg-yellow-400', 'bg-green-400'][i % 5]
                } rounded-full`}
              />
            ))}
          </div>
        )}

        {/* Premium Toast Notification */}
        <AnimatePresence>
          {showToast && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="fixed top-6 right-6 z-50 bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-3 rounded-xl shadow-2xl backdrop-blur-xl"
              style={{ border: '1px solid rgba(255,255,255,0.2)' }}
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span className="font-medium">{toastMessage}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        <div className="relative z-10 max-w-screen-2xl w-full mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center gap-2 md:gap-4 mb-6 px-2">
              <motion.img 
                src={GithubMark} 
                alt="GitHub Logo" 
                className="w-8 h-8 md:w-12 md:h-12 flex-shrink-0"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              />
              <motion.h1 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent"
              >
                <span className="hidden sm:inline">Repository Explorer Pro</span>
                <span className="sm:hidden">Repo Explorer</span>
              </motion.h1>
            </div>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-gray-300 text-xl mb-6 max-w-3xl mx-auto leading-relaxed"
            >
              Discover and explore GitHub repositories with advanced search capabilities and AI-powered insights
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex items-center justify-center gap-6 text-sm text-gray-400"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Real-time Search</span>
              </div>
              <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span>Advanced Filtering</span>
              </div>
              <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                <span>Smart Analytics</span>
              </div>
            </motion.div>
          </motion.div>

          <div className={`${searchHistory.length > 0 || repositories.length > 0 ? 'flex flex-col lg:flex-row gap-6' : 'flex justify-center'}`}>
            {/* Search History Sidebar - Only show when there's history or repos */}
            {(searchHistory.length > 0 || repositories.length > 0) && (
              <div className="lg:w-80 space-y-4">
                {searchHistory.length > 0 && (
                  <div className="bg-white/5 backdrop-blur-sm border border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-white flex items-center">
                        <Clock className="w-5 h-5 mr-2" />
                        Search History
                      </h3>
                      <button
                        onClick={clearHistory}
                        className="text-gray-400 hover:text-red-400 transition-colors duration-200"
                        title="Clear History"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                      {searchHistory.map((term, index) => (
                        <button
                          key={index}
                          onClick={() => handleHistorySearch(term)}
                          className="w-full text-left p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all duration-200 border border-transparent hover:border-cyan-500/20"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Filters */}
                {repositories.length > 0 && (
                  <div className="bg-white/5 backdrop-blur-sm border border-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-white mb-3">Filters</h3>
                    
                    {/* Language Filter */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">Language</label>
                      <select
                        value={selectedLanguage}
                        onChange={(e) => setSelectedLanguage(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      >
                        <option value="">All Languages</option>
                        {Array.from(new Set(repositories.map(repo => repo.language).filter(Boolean))).map(lang => (
                          <option key={lang} value={lang}>{lang}</option>
                        ))}
                      </select>
                    </div>

                    {/* Sort Options */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Sort By</label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as 'stars' | 'updated' | 'name')}
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      >
                        <option value="stars">⭐ Stars</option>
                        <option value="updated">📅 Last Updated</option>
                        <option value="name">📝 Name</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Main Content */}
            <div className={`${searchHistory.length > 0 || repositories.length > 0 ? 'flex-1' : 'w-full max-w-4xl'}`}>
              <div className="bg-white/10 backdrop-blur-sm border border-gray-800 rounded-lg p-6">
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <SearchInput
                      searchQuery={searchQuery}
                      setSearchQuery={setSearchQuery}
                      onSearch={handleSearch}
                      placeholder="Enter GitHub username..."
                    />
                  </div>
                  <StarButton
                    onClick={handleSearch}
                    disabled={loading}
                    $$allowVisualHover={true}
                    className="flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Searching...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Search
                      </>
                    )}
                  </StarButton>
                </div>

                {loading && (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <SkeletonCard key={index} />
                    ))}
                  </div>
                )}

                {error && (
                  <div className="text-center py-12">
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 max-w-md mx-auto">
                      <p className="text-red-400">{error}</p>
                    </div>
                  </div>
                )}

                {!loading && !error && filteredRepos.length === 0 && repositories.length === 0 && (
                  <div className="text-center py-12">
                    <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-lg p-8 max-w-md mx-auto">
                      <Github className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">Ready to Explore</h3>
                      <p className="text-gray-400">Enter a GitHub username to discover amazing repositories</p>
                    </div>
                  </div>
                )}

                {!loading && !error && repositories.length > 0 && filteredRepos.length === 0 && (
                  <div className="text-center py-12">
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6 max-w-md mx-auto">
                      <p className="text-yellow-400">No repositories match your current filters</p>
                      <button
                        onClick={() => {
                          setSelectedLanguage('');
                          setSortBy('stars');
                        }}
                        className="mt-4 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors duration-200"
                      >
                        Clear Filters
                      </button>
                    </div>
                  </div>
                )}

                {/* Repository Results */}
                {!loading && !error && currentRepos.length > 0 && (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <div className="text-gray-300 flex items-center">
                        <TrendingUp className="w-5 h-5 mr-2" />
                        Showing {startIndex + 1}-{Math.min(endIndex, filteredRepos.length)} of {filteredRepos.length} repositories
                      </div>
                      <div className="text-sm text-gray-400">
                        Total: {repositories.length} repositories
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {currentRepos.map((repo) => (
                        <div
                          key={repo.id}
                          className="bg-white/5 backdrop-blur-sm border border-gray-700 rounded-lg p-6 hover:border-cyan-500/30 transition-all duration-300 hover:bg-white/10 group cursor-pointer"
                          onClick={() => handleRepositoryClick(repo)}
                        >
                          <div className="flex items-center mb-3">
                            <div className="w-5 h-5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded mr-3"></div>
                            <h3 className="text-white font-semibold text-lg truncate flex-1 group-hover:text-cyan-300 transition-colors duration-200">
                              {repo.name}
                            </h3>
                            {repo.stargazers_count > 0 && (
                              <div className="flex items-center text-yellow-400 ml-2">
                                <span className="text-sm">{repo.stargazers_count}</span>
                                <span className="ml-1">⭐</span>
                              </div>
                            )}
                          </div>

                          {repo.description && (
                            <p className="text-gray-300 text-sm mb-4 line-clamp-2">{repo.description}</p>
                          )}

                          <div className="flex flex-wrap gap-2 mb-4">
                            {repo.language && (
                              <span
                                className="px-2 py-1 rounded-full text-xs font-medium text-white flex items-center"
                                style={{ 
                                  backgroundColor: getLanguageColor(repo.language) + '20', 
                                  borderColor: getLanguageColor(repo.language) + '40',
                                  border: '1px solid'
                                }}
                              >
                                <span
                                  className="w-2 h-2 rounded-full mr-1"
                                  style={{ backgroundColor: getLanguageColor(repo.language) }}
                                ></span>
                                {repo.language}
                              </span>
                            )}
                            
                            {repo.forks_count > 0 && (
                              <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded-full text-xs">
                                🍴 {repo.forks_count}
                              </span>
                            )}
                            
                            {repo.watchers_count > 0 && (
                              <span className="px-2 py-1 bg-gray-700 text-gray-300 rounded-full text-xs flex items-center">
                                <Eye className="w-3 h-3 mr-1" />
                                {repo.watchers_count}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="text-xs text-gray-400">
                              {repo.updated_at && (
                                <span className="flex items-center">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  Updated {formatDate(repo.updated_at)}
                                </span>
                              )}
                            </div>
                            <a
                              href={repo.html_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-cyan-400 hover:text-cyan-300 transition-all duration-200 text-sm font-medium flex items-center group-hover:scale-105 transform"
                            >
                              View →
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center mt-8 space-x-2">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="flex items-center px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors duration-200"
                        >
                          <ChevronLeft className="w-4 h-4 mr-1" />
                          Previous
                        </button>
                        
                        <div className="flex items-center space-x-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }
                            
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                                  currentPage === pageNum
                                    ? 'bg-cyan-500 text-white'
                                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-600'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                        </div>
                        
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="flex items-center px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors duration-200"
                        >
                          Next
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};