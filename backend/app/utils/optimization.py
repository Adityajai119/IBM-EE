import asyncio
import aiofiles
import aioredis
from functools import lru_cache
from typing import Dict, Any, Optional, List
import json
import time
import hashlib
import re
from app.services.performance_service import cache_service
import logging

logger = logging.getLogger(__name__)

def optimize_simple_code(code: str, language: str) -> str:
    """
    Optimize simple code snippets without over-engineering.
    For basic arithmetic and simple operations.
    """
    # Simple optimizations for common patterns
    optimized = code.strip()
    
    if language.lower() == 'python':
        # Simple Python optimizations
        lines = optimized.split('\n')
        optimized_lines = []
        
        for line in lines:
            stripped = line.strip()
            if not stripped or stripped.startswith('#'):
                optimized_lines.append(line)
                continue
                
            # Improve variable names for common patterns
            if 'a=' in stripped and 'b=' in stripped:
                # For simple arithmetic, keep it simple
                if 'print' in code.lower() and ('sum' in code.lower() or '+' in code):
                    # This is likely a simple sum operation
                    optimized_lines.append(line)
                    continue
            
            # Clean up spacing around operators
            cleaned = re.sub(r'\s*=\s*', ' = ', stripped)
            cleaned = re.sub(r'\s*\+\s*', ' + ', cleaned)
            cleaned = re.sub(r'\s*-\s*', ' - ', cleaned)
            cleaned = re.sub(r'\s*\*\s*', ' * ', cleaned)
            cleaned = re.sub(r'\s*/\s*', ' / ', cleaned)
            
            # Maintain original indentation
            indent = len(line) - len(line.lstrip())
            optimized_lines.append(' ' * indent + cleaned)
        
        optimized = '\n'.join(optimized_lines)
    
    return optimized

def is_simple_code(code: str) -> bool:
    """
    Determine if code is simple enough to avoid over-optimization.
    """
    lines = [line.strip() for line in code.split('\n') if line.strip()]
    
    # Check for complexity indicators
    if len(lines) > 15:
        return False
    
    # Simple patterns that shouldn't be over-engineered
    simple_indicators = [
        'print(', 'input(', 'len(', 'sum(', 'max(', 'min(',
        'a =', 'b =', 'x =', 'y =', 'result =',
        'num1', 'num2', 'number1', 'number2'
    ]
    
    complex_indicators = [
        'class ', 'def ', 'import ', 'from ', 'try:', 'except:', 'finally:',
        'with ', 'async ', 'await ', 'yield', '__init__'
    ]
    
    code_lower = code.lower()
    
    # If it has complex indicators, it's not simple
    if any(indicator in code_lower for indicator in complex_indicators):
        return False
    
    # If it has simple indicators and is short, it's simple
    if any(indicator in code_lower for indicator in simple_indicators) and len(lines) <= 10:
        return True
    
    return False

class OptimizationService:
    """Advanced performance optimization service for DevSensei."""
    
    def __init__(self):
        self.redis_client = None
        self.initialization_time = time.time()
        self.cache_hit_stats = {"hits": 0, "misses": 0}
        
    async def initialize_redis(self):
        """Initialize Redis connection for distributed caching."""
        try:
            self.redis_client = await aioredis.from_url(
                "redis://localhost:6379",
                encoding="utf-8",
                decode_responses=True
            )
            logger.info("Redis client initialized successfully")
        except Exception as e:
            logger.warning(f"Redis not available, using in-memory cache: {e}")
            self.redis_client = None
    
    @lru_cache(maxsize=1000)
    def get_cached_result(self, cache_key: str) -> Optional[str]:
        """LRU cache for frequently accessed data."""
        return None  # Placeholder for LRU cache
    
    async def get_from_cache(self, key: str) -> Optional[Any]:
        """Get data from cache with fallback strategy."""
        try:
            # Try Redis first (distributed cache)
            if self.redis_client:
                result = await self.redis_client.get(key)
                if result:
                    self.cache_hit_stats["hits"] += 1
                    return json.loads(result)
            
            # Fallback to in-memory cache
            result = cache_service.get(key)
            if result:
                self.cache_hit_stats["hits"] += 1
                return result
            
            self.cache_hit_stats["misses"] += 1
            return None
            
        except Exception as e:
            logger.error(f"Cache retrieval error: {e}")
            self.cache_hit_stats["misses"] += 1
            return None
    
    async def set_cache(self, key: str, value: Any, ttl: int = 3600) -> bool:
        """Set data in cache with multiple backends."""
        try:
            # Set in Redis (distributed)
            if self.redis_client:
                serialized = json.dumps(value) if not isinstance(value, str) else value
                await self.redis_client.setex(key, ttl, serialized)
            
            # Set in memory cache (local)
            cache_service.set(key, value, ttl)
            return True
            
        except Exception as e:
            logger.error(f"Cache set error: {e}")
            return False
    
    def generate_cache_key(self, prefix: str, **kwargs) -> str:
        """Generate deterministic cache key from parameters."""
        key_data = f"{prefix}:" + ":".join(f"{k}={v}" for k, v in sorted(kwargs.items()))
        return hashlib.md5(key_data.encode()).hexdigest()
    
    async def cached_code_execution(self, language: str, code: str, timeout: int = 30) -> Dict[str, Any]:
        """Cache code execution results to avoid repeated computation."""
        cache_key = self.generate_cache_key("code_exec", language=language, code=code, timeout=timeout)
        
        # Check cache first
        cached_result = await self.get_from_cache(cache_key)
        if cached_result:
            cached_result["from_cache"] = True
            return cached_result
        
        # Execute code if not cached
        from app.services.compiler_service import code_executor
        result = code_executor.execute_code(language, code, timeout=timeout)
        
        # Cache successful results
        if result.get("success"):
            await self.set_cache(cache_key, result, ttl=1800)  # 30 minutes
        
        result["from_cache"] = False
        return result
    
    async def cached_ai_generation(self, prompt: str, language: str, model: str = "gemini-2.0-flash") -> str:
        """Cache AI code generation results."""
        cache_key = self.generate_cache_key("ai_gen", prompt=prompt, language=language, model=model)
        
        cached_result = await self.get_from_cache(cache_key)
        if cached_result:
            return cached_result
        
        # Generate new code
        from app.services.gemini_service import gemini_service
        result = gemini_service.generate_code(prompt, language)
        
        # Cache result
        await self.set_cache(cache_key, result, ttl=7200)  # 2 hours
        return result
    
    async def batch_process_files(self, file_paths: List[str], processor_func) -> List[Dict[str, Any]]:
        """Process multiple files concurrently for better performance."""
        semaphore = asyncio.Semaphore(10)  # Limit concurrent operations
        
        async def process_single_file(file_path: str):
            async with semaphore:
                try:
                    async with aiofiles.open(file_path, 'r') as file:
                        content = await file.read()
                        return await processor_func(file_path, content)
                except Exception as e:
                    return {"error": str(e), "file": file_path}
        
        tasks = [process_single_file(path) for path in file_paths]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Handle exceptions
        processed_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                processed_results.append({"error": str(result), "file": file_paths[i]})
            else:
                processed_results.append(result)
        
        return processed_results
    
    def optimize_database_queries(self, query_stats: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze and suggest database query optimizations."""
        suggestions = []
        
        # Analyze query patterns
        slow_queries = [q for q in query_stats.get("queries", []) if q.get("duration", 0) > 1.0]
        if slow_queries:
            suggestions.append("Consider adding indexes for slow queries")
        
        # Check for N+1 queries
        repeated_patterns = {}
        for query in query_stats.get("queries", []):
            pattern = query.get("pattern", "")
            repeated_patterns[pattern] = repeated_patterns.get(pattern, 0) + 1
        
        high_repeat = [p for p, count in repeated_patterns.items() if count > 10]
        if high_repeat:
            suggestions.append("Potential N+1 query patterns detected - consider using joins or batch queries")
        
        return {
            "total_queries": len(query_stats.get("queries", [])),
            "slow_queries": len(slow_queries),
            "suggestions": suggestions,
            "optimization_score": max(0, 100 - len(slow_queries) * 10 - len(high_repeat) * 20)
        }
    
    def get_performance_metrics(self) -> Dict[str, Any]:
        """Get comprehensive performance metrics."""
        uptime = time.time() - self.initialization_time
        cache_hit_rate = (
            self.cache_hit_stats["hits"] / 
            (self.cache_hit_stats["hits"] + self.cache_hit_stats["misses"])
            if (self.cache_hit_stats["hits"] + self.cache_hit_stats["misses"]) > 0 else 0
        )
        
        return {
            "uptime_seconds": uptime,
            "cache_hit_rate": cache_hit_rate,
            "cache_stats": self.cache_hit_stats,
            "redis_available": self.redis_client is not None,
            "optimization_features": {
                "distributed_caching": self.redis_client is not None,
                "async_processing": True,
                "batch_operations": True,
                "lru_cache": True,
                "connection_pooling": True
            }
        }
    
    async def preload_common_operations(self):
        """Preload frequently used operations and data."""
        logger.info("Preloading common operations...")
        
        # Preload supported languages
        from app.services.compiler_service import code_executor
        languages = code_executor.get_supported_languages()
        await self.set_cache("supported_languages", languages, ttl=86400)  # 24 hours
        
        # Preload common code templates
        common_templates = {
            "python": {
                "hello_world": "print('Hello, World!')",
                "function_template": "def function_name(param1, param2):\n    # Your code here\n    return result",
                "class_template": "class ClassName:\n    def __init__(self):\n        pass"
            },
            "javascript": {
                "hello_world": "console.log('Hello, World!');",
                "function_template": "function functionName(param1, param2) {\n    // Your code here\n    return result;\n}",
                "arrow_function": "const functionName = (param1, param2) => {\n    // Your code here\n    return result;\n};"
            }
        }
        
        for language, templates in common_templates.items():
            for template_name, code in templates.items():
                cache_key = f"template:{language}:{template_name}"
                await self.set_cache(cache_key, code, ttl=86400)
        
        logger.info("Preloading completed")
    
    async def cleanup_cache(self):
        """Clean up expired cache entries and optimize memory usage."""
        try:
            if self.redis_client:
                # Redis handles TTL automatically, but we can check memory usage
                info = await self.redis_client.info('memory')
                used_memory = info.get('used_memory', 0)
                logger.info(f"Redis memory usage: {used_memory} bytes")
            
            # Local cache cleanup is handled by the cache service
            cache_service.cleanup_expired()
            
        except Exception as e:
            logger.error(f"Cache cleanup error: {e}")

# Global optimization service instance
optimization_service = OptimizationService()

# Decorators for performance optimization
def cache_result(ttl: int = 3600):
    """Decorator to cache function results."""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            cache_key = optimization_service.generate_cache_key(
                func.__name__, 
                args=str(args), 
                kwargs=str(kwargs)
            )
            
            # Check cache
            cached = await optimization_service.get_from_cache(cache_key)
            if cached is not None:
                return cached
            
            # Execute function
            result = await func(*args, **kwargs) if asyncio.iscoroutinefunction(func) else func(*args, **kwargs)
            
            # Cache result
            await optimization_service.set_cache(cache_key, result, ttl)
            return result
        
        return wrapper
    return decorator

def performance_monitor(func):
    """Decorator to monitor function performance."""
    async def wrapper(*args, **kwargs):
        start_time = time.time()
        
        try:
            result = await func(*args, **kwargs) if asyncio.iscoroutinefunction(func) else func(*args, **kwargs)
            success = True
        except Exception as e:
            result = {"error": str(e)}
            success = False
            raise
        finally:
            duration = time.time() - start_time
            from app.services.performance_service import performance_monitor
            performance_monitor.record_request(func.__name__, duration, success)
        
        return result
    
    return wrapper

# Async context manager for database connections
class DatabasePool:
    """Connection pool for database operations."""
    
    def __init__(self, max_connections: int = 20):
        self.max_connections = max_connections
        self.active_connections = 0
        self.semaphore = asyncio.Semaphore(max_connections)
    
    async def __aenter__(self):
        await self.semaphore.acquire()
        self.active_connections += 1
        return self
    
    async def __aaxit__(self, exc_type, exc_val, exc_tb):
        self.active_connections -= 1
        self.semaphore.release()

# Global database pool
db_pool = DatabasePool()

# Startup optimization
async def optimize_startup():
    """Optimize application startup performance."""
    await optimization_service.initialize_redis()
    await optimization_service.preload_common_operations()
    logger.info("Startup optimizations completed")

# Performance testing utilities
class LoadTester:
    """Built-in load testing utilities."""
    
    @staticmethod
    async def test_endpoint_performance(endpoint_func, num_requests: int = 100):
        """Test endpoint performance with concurrent requests."""
        start_time = time.time()
        
        tasks = [endpoint_func() for _ in range(num_requests)]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        total_time = time.time() - start_time
        successful = sum(1 for r in results if not isinstance(r, Exception))
        failed = num_requests - successful
        
        return {
            "total_requests": num_requests,
            "successful": successful,
            "failed": failed,
            "total_time": total_time,
            "requests_per_second": num_requests / total_time,
            "average_response_time": total_time / num_requests
        }

load_tester = LoadTester()
