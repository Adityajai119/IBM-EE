from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
from app.services.gemini_service import gemini_service

router = APIRouter()

class GenerateFrontendRequest(BaseModel):
    stack: str
    prompt: str

class RunFrontendRequest(BaseModel):
    stack: str
    code: str

class GenerateProjectRequest(BaseModel):
    stack: str
    prompt: str
    projectType: str = "web"

@router.post("/generate")
async def generate_frontend_code(request: GenerateFrontendRequest):
    """Generate frontend code using AI"""
    try:
        result = await gemini_service.generate_frontend(request.prompt, request.stack)
        return {
            "success": True,
            "files": result.get("files", {}),
            "stack": request.stack,
            "structure": result.get("structure", {}),
            "projectType": "multi-file"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Frontend generation failed: {str(e)}")

@router.post("/generate-project")
async def generate_project(request: GenerateProjectRequest):
    """Generate a complete multi-file project"""
    try:
        result = await gemini_service.generate_frontend(request.prompt, request.stack)
        
        # Ensure we have files
        if not result.get("files"):
            raise HTTPException(status_code=500, detail="No files generated")
        
        return {
            "success": True,
            "project": {
                "name": f"{request.stack.title()} Project",
                "files": result["files"],
                "structure": result.get("structure", {}),
                "stack": request.stack,
                "type": request.projectType
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Project generation failed: {str(e)}")

@router.post("/run")
async def run_frontend_code(request: RunFrontendRequest):
    """Run frontend code (returns the code for now)"""
    # For now, just return the code. In production, run in a secure sandbox/iframe.
    return {"output": request.code, "stack": request.stack} 