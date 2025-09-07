from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List
import asyncio
import time
import base64
import io
from PIL import Image
from app.services.github_service import github_service
from app.services.gemini_service import gemini_service

router = APIRouter()

class RepoSearchRequest(BaseModel):
    prompt: str
    limit: Optional[int] = 10
    image_data: Optional[str] = None  # Base64 encoded image data
    image_type: Optional[str] = None  # Image mime type (image/png, image/jpeg, etc.)

@router.post("")
async def repo_search(request: RepoSearchRequest):
    """Search repositories using GitHub API and enhance with AI"""
    start_time = time.time()
    
    try:
        # Allow user-specified limit with a reasonable maximum of 20
        repo_limit = min(request.limit or 10, 20)  # Default 10, max 20 repos
        
        # Adjust timeout based on number of repos requested
        timeout_duration = 15 + (repo_limit * 2)  # Base 15s + 2s per repo (increased for image processing)
        max_timeout = 45  # Increased max timeout for image processing
        timeout_duration = min(timeout_duration, max_timeout)
        
        # Run GitHub search and AI response in parallel
        github_task = asyncio.create_task(
            github_service.search_repositories(request.prompt, repo_limit)
        )
        
        # Generate AI prompt - handle image if provided
        if request.image_data:
            # Process image-based search
            ai_prompt = f"""
            User is searching for repositories with query: '{request.prompt}'
            They have also provided an image for analysis.
            They want to see {repo_limit} repositories.
            
            Based on the image content and the text query, provide a comprehensive analysis and suggest what types of repositories would be most relevant.
            Consider:
            - What technologies, frameworks, or patterns are visible in the image
            - What the image might represent (UI mockup, code snippet, architecture diagram, etc.)
            - How the text query relates to the image content
            - What specific repositories or tools would help implement similar solutions
            
            Be detailed and specific in your analysis while remaining concise.
            """
            
            ai_task = asyncio.create_task(
                gemini_service.chat_with_image([{"role": "user", "content": ai_prompt}], request.image_data, request.image_type)
            )
        else:
            # Generate AI prompt for text-only search
            ai_prompt = f"""
            User is searching for repositories with query: '{request.prompt}'
            They want to see {repo_limit} repositories.
            
            Provide a helpful summary of what types of repositories match this search and why they might be useful.
            Be concise but informative. Do not wait for specific repository data.
            """
            
            ai_task = asyncio.create_task(
                gemini_service.chat([{"role": "user", "content": ai_prompt}])
            )
        
        # Wait for both tasks to complete with dynamic timeout
        try:
            repos, ai_response = await asyncio.wait_for(
                asyncio.gather(github_task, ai_task), 
                timeout=timeout_duration
            )
        except asyncio.TimeoutError:
            # If timeout, return partial results
            repos = await github_task if github_task.done() else []
            ai_response = f"Search completed for {len(repos)} repositories (response optimized for faster performance)"
        
        end_time = time.time()
        response_time = int((end_time - start_time) * 1000)  # Convert to milliseconds
        
        return {
            "response": ai_response,
            "repos": repos,
            "query": request.prompt,
            "response_time_ms": response_time,
            "total_repos": len(repos),
            "requested_limit": repo_limit,
            "has_image": bool(request.image_data)
        }
        
    except Exception as e:
        end_time = time.time()
        response_time = int((end_time - start_time) * 1000)
        
        return {
            "response": f"Error searching repositories: {str(e)}",
            "repos": [],
            "query": request.prompt,
            "response_time_ms": response_time,
            "total_repos": 0,
            "requested_limit": request.limit or 10,
            "has_image": bool(request.image_data)
        } 