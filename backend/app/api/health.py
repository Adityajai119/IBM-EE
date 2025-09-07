from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any
import psutil
from datetime import datetime

router = APIRouter()


class HealthResponse(BaseModel):
    status: str
    timestamp: str
    uptime: float
    version: str
    system: Dict[str, Any]


@router.get("/", response_model=HealthResponse)
async def health_check():
    """Get system health status."""
    try:
        # Get system information
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        boot_time = psutil.boot_time()
        uptime = datetime.now().timestamp() - boot_time
        
        return HealthResponse(
            status="healthy",
            timestamp=datetime.utcnow().isoformat(),
            uptime=uptime,
            version="2.0.0",
            system={
                "cpu_percent": psutil.cpu_percent(interval=1),
                "memory": {
                    "total": memory.total,
                    "available": memory.available,
                    "percent": memory.percent
                },
                "disk": {
                    "total": disk.total,
                    "free": disk.free,
                    "percent": (disk.used / disk.total) * 100
                }
            }
        )
    except Exception as e:
        return HealthResponse(
            status="unhealthy",
            timestamp=datetime.utcnow().isoformat(),
            uptime=0.0,
            version="2.0.0",
            system={"error": str(e)}
        )


@router.get("/ready")
async def readiness_check():
    """Check if the service is ready to serve requests."""
    return {"status": "ready", "timestamp": datetime.utcnow().isoformat()}


@router.get("/live")
async def liveness_check():
    """Check if the service is alive."""
    return {"status": "alive", "timestamp": datetime.utcnow().isoformat()}
