from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import psutil
import time
import asyncio
import os
from datetime import datetime, timedelta
import json

router = APIRouter()

class SystemMetrics(BaseModel):
    cpu_usage: float
    memory_usage: float
    disk_usage: float
    network_io: Dict[str, float]
    uptime: float
    load_average: List[float]
    active_connections: int
    timestamp: datetime

class PerformanceMetrics(BaseModel):
    response_time: float
    throughput: float
    error_rate: float
    memory_leak: bool
    cpu_spikes: List[float]
    slow_queries: List[Dict[str, Any]]

class HealthCheck(BaseModel):
    status: str
    services: Dict[str, str]
    checks: List[Dict[str, Any]]
    timestamp: datetime

# Global metrics storage
system_metrics_history: List[SystemMetrics] = []
performance_metrics_history: List[PerformanceMetrics] = []

@router.get("/health", response_model=HealthCheck)
async def health_check():
    """Comprehensive system health check"""
    checks = []
    services = {}
    
    # CPU Check
    cpu_percent = psutil.cpu_percent(interval=1)
    cpu_healthy = cpu_percent < 80
    checks.append({
        "name": "CPU Usage",
        "status": "healthy" if cpu_healthy else "warning",
        "value": f"{cpu_percent}%",
        "threshold": "80%"
    })
    services["cpu"] = "healthy" if cpu_healthy else "warning"
    
    # Memory Check
    memory = psutil.virtual_memory()
    memory_healthy = memory.percent < 85
    checks.append({
        "name": "Memory Usage",
        "status": "healthy" if memory_healthy else "warning",
        "value": f"{memory.percent}%",
        "threshold": "85%"
    })
    services["memory"] = "healthy" if memory_healthy else "warning"
    
    # Disk Check
    disk = psutil.disk_usage('/')
    disk_healthy = disk.percent < 90
    checks.append({
        "name": "Disk Usage",
        "status": "healthy" if disk_healthy else "warning",
        "value": f"{disk.percent}%",
        "threshold": "90%"
    })
    services["disk"] = "healthy" if disk_healthy else "warning"
    
    # Network Check
    network = psutil.net_io_counters()
    checks.append({
        "name": "Network I/O",
        "status": "healthy",
        "value": f"↑{network.bytes_sent/1024/1024:.1f}MB ↓{network.bytes_recv/1024/1024:.1f}MB",
        "threshold": "N/A"
    })
    services["network"] = "healthy"
    
    # Overall Status
    overall_healthy = all([
        cpu_healthy,
        memory_healthy,
        disk_healthy
    ])
    
    return HealthCheck(
        status="healthy" if overall_healthy else "warning",
        services=services,
        checks=checks,
        timestamp=datetime.now()
    )

@router.get("/metrics/system", response_model=SystemMetrics)
async def get_system_metrics():
    """Get detailed system metrics"""
    # CPU metrics
    cpu_percent = psutil.cpu_percent(interval=1)
    cpu_count = psutil.cpu_count()
    load_avg = psutil.getloadavg() if hasattr(psutil, 'getloadavg') else [0, 0, 0]
    
    # Memory metrics
    memory = psutil.virtual_memory()
    
    # Disk metrics
    disk = psutil.disk_usage('/')
    
    # Network metrics
    network = psutil.net_io_counters()
    network_io = {
        "bytes_sent": network.bytes_sent,
        "bytes_recv": network.bytes_recv,
        "packets_sent": network.packets_sent,
        "packets_recv": network.packets_recv
    }
    
    # Uptime
    uptime = time.time() - psutil.boot_time()
    
    # Active connections (simulated)
    active_connections = len(psutil.net_connections()) if hasattr(psutil, 'net_connections') else 0
    
    metrics = SystemMetrics(
        cpu_usage=cpu_percent,
        memory_usage=memory.percent,
        disk_usage=disk.percent,
        network_io=network_io,
        uptime=uptime,
        load_average=list(load_avg),
        active_connections=active_connections,
        timestamp=datetime.now()
    )
    
    # Store in history (keep last 100 entries)
    system_metrics_history.append(metrics)
    if len(system_metrics_history) > 100:
        system_metrics_history.pop(0)
    
    return metrics

@router.get("/metrics/performance", response_model=PerformanceMetrics)
async def get_performance_metrics():
    """Get application performance metrics"""
    # Simulated performance data
    response_time = 0.15  # Average response time in seconds
    throughput = 150  # Requests per second
    error_rate = 0.02  # 2% error rate
    
    # Memory leak detection
    memory = psutil.virtual_memory()
    memory_leak = memory.percent > 85
    
    # CPU spikes detection
    cpu_percent = psutil.cpu_percent(interval=1)
    cpu_spikes = [cpu_percent] if cpu_percent > 80 else []
    
    # Slow queries (simulated)
    slow_queries = [
        {
            "query": "SELECT * FROM large_table",
            "duration": 2.5,
            "timestamp": datetime.now().isoformat()
        }
    ] if response_time > 1.0 else []
    
    metrics = PerformanceMetrics(
        response_time=response_time,
        throughput=throughput,
        error_rate=error_rate,
        memory_leak=memory_leak,
        cpu_spikes=cpu_spikes,
        slow_queries=slow_queries
    )
    
    # Store in history
    performance_metrics_history.append(metrics)
    if len(performance_metrics_history) > 100:
        performance_metrics_history.pop(0)
    
    return metrics

@router.get("/metrics/history")
async def get_metrics_history(hours: int = 24):
    """Get historical metrics for the specified time period"""
    cutoff_time = datetime.now() - timedelta(hours=hours)
    
    # Filter recent metrics
    recent_system_metrics = [
        m for m in system_metrics_history 
        if m.timestamp > cutoff_time
    ]
    
    recent_performance_metrics = [
        m for m in performance_metrics_history 
        if hasattr(m, 'timestamp') and m.timestamp > cutoff_time
    ]
    
    return {
        "system_metrics": recent_system_metrics,
        "performance_metrics": recent_performance_metrics,
        "period_hours": hours,
        "total_points": len(recent_system_metrics)
    }

@router.get("/alerts")
async def get_system_alerts():
    """Get current system alerts"""
    alerts = []
    
    # CPU alerts
    cpu_percent = psutil.cpu_percent(interval=1)
    if cpu_percent > 90:
        alerts.append({
            "level": "critical",
            "message": f"CPU usage is critically high: {cpu_percent}%",
            "timestamp": datetime.now().isoformat(),
            "service": "cpu"
        })
    elif cpu_percent > 80:
        alerts.append({
            "level": "warning",
            "message": f"CPU usage is high: {cpu_percent}%",
            "timestamp": datetime.now().isoformat(),
            "service": "cpu"
        })
    
    # Memory alerts
    memory = psutil.virtual_memory()
    if memory.percent > 95:
        alerts.append({
            "level": "critical",
            "message": f"Memory usage is critically high: {memory.percent}%",
            "timestamp": datetime.now().isoformat(),
            "service": "memory"
        })
    elif memory.percent > 85:
        alerts.append({
            "level": "warning",
            "message": f"Memory usage is high: {memory.percent}%",
            "timestamp": datetime.now().isoformat(),
            "service": "memory"
        })
    
    # Disk alerts
    disk = psutil.disk_usage('/')
    if disk.percent > 95:
        alerts.append({
            "level": "critical",
            "message": f"Disk usage is critically high: {disk.percent}%",
            "timestamp": datetime.now().isoformat(),
            "service": "disk"
        })
    elif disk.percent > 90:
        alerts.append({
            "level": "warning",
            "message": f"Disk usage is high: {disk.percent}%",
            "timestamp": datetime.now().isoformat(),
            "service": "disk"
        })
    
    return {
        "alerts": alerts,
        "total_alerts": len(alerts),
        "critical_alerts": len([a for a in alerts if a["level"] == "critical"]),
        "warning_alerts": len([a for a in alerts if a["level"] == "warning"])
    }

@router.get("/status")
async def get_system_status():
    """Get comprehensive system status"""
    # Basic system info
    system_info = {
        "platform": os.name,
        "python_version": f"{os.sys.version_info.major}.{os.sys.version_info.minor}.{os.sys.version_info.micro}",
        "hostname": os.uname().nodename if hasattr(os, 'uname') else "unknown",
        "uptime": time.time() - psutil.boot_time(),
        "boot_time": datetime.fromtimestamp(psutil.boot_time()).isoformat()
    }
    
    # Current metrics
    cpu_percent = psutil.cpu_percent(interval=1)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    
    # Process info
    process = psutil.Process()
    process_info = {
        "pid": process.pid,
        "memory_usage": process.memory_info().rss / 1024 / 1024,  # MB
        "cpu_percent": process.cpu_percent(),
        "create_time": datetime.fromtimestamp(process.create_time()).isoformat(),
        "num_threads": process.num_threads(),
        "open_files": len(process.open_files()) if hasattr(process, 'open_files') else 0
    }
    
    return {
        "system_info": system_info,
        "current_metrics": {
            "cpu_percent": cpu_percent,
            "memory_percent": memory.percent,
            "disk_percent": disk.percent,
            "timestamp": datetime.now().isoformat()
        },
        "process_info": process_info,
        "status": "operational" if cpu_percent < 80 and memory.percent < 85 else "degraded"
    }
