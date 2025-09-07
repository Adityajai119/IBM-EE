import time
import asyncio
from typing import Dict, Any, Optional
from collections import defaultdict, deque
from datetime import datetime
import psutil
import logging

logger = logging.getLogger(__name__)

class RateLimiter:
    def __init__(self):
        # Store for rate limiting: {key: deque of timestamps}
        self.requests = defaultdict(deque)
        self.cleanup_interval = 300  # 5 minutes
        
        # Default rate limits
        self.default_limits = {
            "requests_per_minute": 60,
            "requests_per_hour": 1000,
            "code_executions_per_minute": 10,
            "ai_requests_per_minute": 20
        }
        
        # User-specific limits
        self.user_limits = {
            "admin": {
                "requests_per_minute": 120,
                "requests_per_hour": 5000,
                "code_executions_per_minute": 50,
                "ai_requests_per_minute": 100
            },
            "demo": {
                "requests_per_minute": 30,
                "requests_per_hour": 500,
                "code_executions_per_minute": 5,
                "ai_requests_per_minute": 10
            }
        }

    def is_allowed(self, key: str, limit_type: str = "requests_per_minute", user_type: str = "default") -> bool:
        """Check if request is allowed based on rate limits."""
        now = time.time()
        
        # Get appropriate limits
        limits = self.user_limits.get(user_type, self.default_limits)
        limit = limits.get(limit_type, self.default_limits.get(limit_type, 60))
        
        # Determine time window
        if "minute" in limit_type:
            window = 60
        elif "hour" in limit_type:
            window = 3600
        else:
            window = 60  # default to 1 minute
        
        # Clean old requests
        request_times = self.requests[f"{key}:{limit_type}"]
        while request_times and request_times[0] < now - window:
            request_times.popleft()
        
        # Check if limit exceeded
        if len(request_times) >= limit:
            return False
        
        # Add current request
        request_times.append(now)
        return True

    def get_remaining_requests(self, key: str, limit_type: str = "requests_per_minute", user_type: str = "default") -> int:
        """Get remaining requests for the current window."""
        now = time.time()
        limits = self.user_limits.get(user_type, self.default_limits)
        limit = limits.get(limit_type, self.default_limits.get(limit_type, 60))
        
        if "minute" in limit_type:
            window = 60
        elif "hour" in limit_type:
            window = 3600
        else:
            window = 60
        
        request_times = self.requests[f"{key}:{limit_type}"]
        # Clean old requests
        while request_times and request_times[0] < now - window:
            request_times.popleft()
        
        return max(0, limit - len(request_times))

    async def cleanup_old_requests(self):
        """Periodic cleanup of old request records."""
        while True:
            try:
                now = time.time()
                keys_to_remove = []
                
                for key, request_times in self.requests.items():
                    # Remove requests older than 1 hour
                    while request_times and request_times[0] < now - 3600:
                        request_times.popleft()
                    
                    # Remove empty deques
                    if not request_times:
                        keys_to_remove.append(key)
                
                for key in keys_to_remove:
                    del self.requests[key]
                
                logger.info(f"Cleaned up {len(keys_to_remove)} empty rate limit records")
                
            except Exception as e:
                logger.error(f"Error in rate limit cleanup: {e}")
            
            await asyncio.sleep(self.cleanup_interval)

class PerformanceMonitor:
    def __init__(self):
        self.metrics = {
            "requests_total": 0,
            "requests_errors": 0,
            "response_times": deque(maxlen=1000),
            "cpu_usage": deque(maxlen=100),
            "memory_usage": deque(maxlen=100),
            "active_connections": 0
        }
        self.alert_thresholds = {
            "cpu_usage": 80.0,
            "memory_usage": 85.0,
            "error_rate": 0.05,  # 5%
            "avg_response_time": 2.0  # 2 seconds
        }

    def record_request(self, response_time: float, status_code: int):
        """Record request metrics."""
        self.metrics["requests_total"] += 1
        self.metrics["response_times"].append(response_time)
        
        if status_code >= 400:
            self.metrics["requests_errors"] += 1

    def record_system_metrics(self):
        """Record system performance metrics."""
        try:
            cpu_percent = psutil.cpu_percent(interval=1)
            memory_percent = psutil.virtual_memory().percent
            
            self.metrics["cpu_usage"].append(cpu_percent)
            self.metrics["memory_usage"].append(memory_percent)
            
            # Check for alerts
            self._check_alerts(cpu_percent, memory_percent)
            
        except Exception as e:
            logger.error(f"Error recording system metrics: {e}")

    def _check_alerts(self, cpu_percent: float, memory_percent: float):
        """Check if any metrics exceed alert thresholds."""
        if cpu_percent > self.alert_thresholds["cpu_usage"]:
            logger.warning(f"High CPU usage: {cpu_percent:.1f}%")
        
        if memory_percent > self.alert_thresholds["memory_usage"]:
            logger.warning(f"High memory usage: {memory_percent:.1f}%")
        
        # Check error rate
        if self.metrics["requests_total"] > 100:
            error_rate = self.metrics["requests_errors"] / self.metrics["requests_total"]
            if error_rate > self.alert_thresholds["error_rate"]:
                logger.warning(f"High error rate: {error_rate:.2%}")
        
        # Check average response time
        if len(self.metrics["response_times"]) > 10:
            avg_response_time = sum(list(self.metrics["response_times"])[-100:]) / min(100, len(self.metrics["response_times"]))
            if avg_response_time > self.alert_thresholds["avg_response_time"]:
                logger.warning(f"High average response time: {avg_response_time:.2f}s")

    def get_metrics(self) -> Dict[str, Any]:
        """Get current performance metrics."""
        try:
            cpu_usage = list(self.metrics["cpu_usage"])
            memory_usage = list(self.metrics["memory_usage"])
            response_times = list(self.metrics["response_times"])
            
            return {
                "requests": {
                    "total": self.metrics["requests_total"],
                    "errors": self.metrics["requests_errors"],
                    "error_rate": (self.metrics["requests_errors"] / max(1, self.metrics["requests_total"])) * 100,
                    "active_connections": self.metrics["active_connections"]
                },
                "performance": {
                    "avg_response_time": sum(response_times[-100:]) / max(1, len(response_times[-100:])) if response_times else 0,
                    "p95_response_time": sorted(response_times[-100:])[-5] if len(response_times) >= 5 else 0,
                    "current_cpu": cpu_usage[-1] if cpu_usage else 0,
                    "avg_cpu": sum(cpu_usage[-10:]) / max(1, len(cpu_usage[-10:])) if cpu_usage else 0,
                    "current_memory": memory_usage[-1] if memory_usage else 0,
                    "avg_memory": sum(memory_usage[-10:]) / max(1, len(memory_usage[-10:])) if memory_usage else 0
                },
                "system": {
                    "disk_usage": psutil.disk_usage('/').percent,
                    "network_io": psutil.net_io_counters()._asdict() if psutil.net_io_counters() else {},
                    "process_count": len(psutil.pids()),
                    "uptime": time.time() - psutil.boot_time()
                }
            }
        except Exception as e:
            logger.error(f"Error getting metrics: {e}")
            return {"error": str(e)}

    async def monitor_system(self):
        """Continuous system monitoring."""
        while True:
            try:
                self.record_system_metrics()
                await asyncio.sleep(60)  # Monitor every minute
            except Exception as e:
                logger.error(f"Error in system monitoring: {e}")
                await asyncio.sleep(60)

class CacheService:
    def __init__(self):
        self.cache = {}
        self.cache_ttl = {}
        self.default_ttl = 300  # 5 minutes

    def get(self, key: str) -> Any:
        """Get item from cache."""
        if key in self.cache:
            if key in self.cache_ttl and time.time() > self.cache_ttl[key]:
                # Expired
                del self.cache[key]
                del self.cache_ttl[key]
                return None
            return self.cache[key]
        return None

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """Set item in cache with TTL."""
        self.cache[key] = value
        if ttl is None:
            ttl = self.default_ttl
        self.cache_ttl[key] = time.time() + ttl

    def delete(self, key: str) -> None:
        """Delete item from cache."""
        self.cache.pop(key, None)
        self.cache_ttl.pop(key, None)

    def clear(self) -> None:
        """Clear all cache."""
        self.cache.clear()
        self.cache_ttl.clear()

    async def cleanup_expired(self):
        """Periodic cleanup of expired cache entries."""
        while True:
            try:
                now = time.time()
                expired_keys = [
                    key for key, expiry in self.cache_ttl.items()
                    if now > expiry
                ]
                
                for key in expired_keys:
                    del self.cache[key]
                    del self.cache_ttl[key]
                
                if expired_keys:
                    logger.info(f"Cleaned up {len(expired_keys)} expired cache entries")
                
            except Exception as e:
                logger.error(f"Error in cache cleanup: {e}")
            
            await asyncio.sleep(300)  # Cleanup every 5 minutes

# Global instances
rate_limiter = RateLimiter()
performance_monitor = PerformanceMonitor()
cache_service = CacheService()
