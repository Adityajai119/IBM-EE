from github import Github
from app.config import config
from typing import List, Dict, Any, Optional
import logging
import asyncio
from functools import lru_cache
import time

logger = logging.getLogger(__name__)

class GitHubService:
    def __init__(self):
        self.github = Github(config.GITHUB_TOKEN)
        self.is_available = True
        self._cache = {}
        self._cache_timeout = 300  # 5 minutes cache

    def _is_cache_valid(self, key: str) -> bool:
        if key not in self._cache:
            return False
        return time.time() - self._cache[key]["timestamp"] < self._cache_timeout

    def _get_from_cache(self, key: str):
        if self._is_cache_valid(key):
            return self._cache[key]["data"]
        return None

    def _set_cache(self, key: str, data: any):
        self._cache[key] = {
            "data": data,
            "timestamp": time.time()
        }

    async def search_repositories(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        cache_key = f"search_{query}_{limit}"
        cached_result = self._get_from_cache(cache_key)
        if cached_result:
            logger.info(f"Returning cached result for query: {query}")
            return cached_result

        try:
            # Optimize: Search with limited results and faster processing
            repos = self.github.search_repositories(
                query=query, 
                sort="stars", 
                order="desc"
            )
            
            results = []
            count = 0
            
            # Process repositories with early termination for speed
            for repo in repos:
                if count >= limit:
                    break
                    
                try:
                    # Get basic info quickly without expensive API calls
                    result = {
                        "name": repo.name,
                        "full_name": repo.full_name,
                        "description": repo.description or "No description available",
                        "language": repo.language or "Unknown",
                        "stars": repo.stargazers_count,
                        "forks": repo.forks_count,
                        "url": repo.html_url,
                        "default_branch": repo.default_branch,
                        "owner": repo.owner.login if repo.owner else "Unknown"
                    }
                    
                    # Skip expensive topic calls for faster response
                    result["topics"] = []
                    
                    results.append(result)
                    count += 1
                    
                except Exception as e:
                    logger.warning(f"Error processing repo {repo.name}: {e}")
                    continue
            
            # Cache the results
            self._set_cache(cache_key, results)
            logger.info(f"GitHub search completed: {len(results)} repos for query '{query}'")
            return results
            
        except Exception as e:
            logger.error(f"Error in GitHub repository search: {e}")
            return []

    async def get_user_repositories(self, username: str) -> List[Dict[str, Any]]:
        try:
            user = self.github.get_user(username)
            repos = user.get_repos()
            results = []
            for repo in repos:
                results.append({
                    "name": repo.name,
                    "full_name": repo.full_name,
                    "description": repo.description,
                    "language": repo.language,
                    "stars": repo.stargazers_count,
                    "forks": repo.forks_count,
                    "url": repo.html_url,
                    "default_branch": repo.default_branch,
                    "topics": list(repo.get_topics()) if repo.get_topics() else []
                })
            return results
        except Exception as e:
            logger.error(f"Error in GitHub user repositories: {e}")
            return []

    async def get_repository_info(self, owner: str, repo_name: str) -> Dict[str, Any]:
        try:
            repo = self.github.get_repo(f"{owner}/{repo_name}")
            return {
                "name": repo.name,
                "full_name": repo.full_name,
                "description": repo.description,
                "language": repo.language,
                "stars": repo.stargazers_count,
                "forks": repo.forks_count,
                "url": repo.html_url,
                "default_branch": repo.default_branch,
                "topics": list(repo.get_topics()) if repo.get_topics() else [],
                "created_at": repo.created_at.isoformat(),
                "updated_at": repo.updated_at.isoformat(),
                "size": repo.size,
                "open_issues": repo.open_issues_count,
                "license": repo.license.name if repo.license else None,
                "readme": await self._get_readme_content(repo)
            }
        except Exception as e:
            logger.error(f"Error in GitHub repository info: {e}")
            return {}

    async def get_repository_files(self, owner: str, repo_name: str, path: str = "") -> List[Dict[str, Any]]:
        try:
            repo = self.github.get_repo(f"{owner}/{repo_name}")
            contents = repo.get_contents(path)
            results = []
            for content in contents:
                file_info = {
                    "name": content.name,
                    "path": content.path,
                    "type": content.type,
                    "size": content.size,
                    "url": content.html_url,
                    "download_url": content.download_url
                }
                if content.type == "file" and content.size < 1024 * 1024:
                    try:
                        file_content = content.decoded_content.decode('utf-8')
                        file_info["content"] = file_content
                        file_info["language"] = self._detect_language(content.name)
                    except:
                        file_info["content"] = None
                        file_info["language"] = None
                results.append(file_info)
            return results
        except Exception as e:
            logger.error(f"Error in GitHub repository files: {e}")
            return []

    async def get_repository_structure(self, owner: str, repo_name: str) -> Dict[str, Any]:
        try:
            repo = self.github.get_repo(f"{owner}/{repo_name}")
            def get_directory_structure(path=""):
                try:
                    contents = repo.get_contents(path)
                    structure = {}
                    for content in contents:
                        if content.type == "dir":
                            structure[content.name] = {
                                "type": "directory",
                                "path": content.path,
                                "children": get_directory_structure(content.path)
                            }
                        else:
                            structure[content.name] = {
                                "type": "file",
                                "path": content.path,
                                "size": content.size,
                                "language": self._detect_language(content.name)
                            }
                    return structure
                except:
                    return {}
            return {
                "repo_name": repo_name,
                "owner": owner,
                "structure": get_directory_structure()
            }
        except Exception as e:
            logger.error(f"Error in GitHub repository structure: {e}")
            return {}

    async def _get_readme_content(self, repo) -> Optional[str]:
        try:
            readme = repo.get_readme()
            return readme.decoded_content.decode('utf-8')
        except:
            return None

    def _detect_language(self, filename: str) -> Optional[str]:
        extensions = {
            '.py': 'python',
            '.js': 'javascript',
            '.ts': 'typescript',
            '.java': 'java',
            '.cpp': 'cpp',
            '.c': 'c',
            '.go': 'go',
            '.rs': 'rust',
            '.rb': 'ruby',
            '.php': 'php',
            '.html': 'html',
            '.css': 'css',
            '.md': 'markdown',
            '.json': 'json',
            '.xml': 'xml',
            '.yml': 'yaml',
            '.yaml': 'yaml'
        }
        for ext, lang in extensions.items():
            if filename.endswith(ext):
                return lang
        return None

github_service = GitHubService() 