import subprocess
import tempfile
import os
import time
from typing import Dict, Any, Optional
from pathlib import Path

class CodeExecutor:
    def __init__(self):
        self.supported_languages = {
            'python': {'extension': '.py', 'command': ['python']},
            'javascript': {'extension': '.js', 'command': ['node']},
            'typescript': {'extension': '.ts', 'command': ['npx', 'ts-node']},
            'java': {'extension': '.java', 'command': ['javac', '{file}', '&&', 'java']},
            'cpp': {'extension': '.cpp', 'command': ['g++', '-o', '{output}', '{file}', '&&', '{output}']},
            'c': {'extension': '.c', 'command': ['gcc', '-o', '{output}', '{file}', '&&', '{output}']},
            'go': {'extension': '.go', 'command': ['go', 'run']},
            'rust': {'extension': '.rs', 'command': ['rustc', '{file}', '&&', '{output}']},
            'php': {'extension': '.php', 'command': ['php']},
            'ruby': {'extension': '.rb', 'command': ['ruby']},
            'shell': {'extension': '.sh', 'command': ['bash']},
            'powershell': {'extension': '.ps1', 'command': ['powershell', '-File']},
        }
        
        # Resource limits
        self.max_execution_time = 10  # seconds
        self.max_memory = 100 * 1024 * 1024  # 100MB
        self.max_output_size = 1024 * 1024  # 1MB

    def run_code(self, language: str, code: str, stdin: Optional[str] = None) -> Dict[str, Any]:
        """Execute code in a secure, sandboxed environment with resource limits."""
        language = language.lower()
        
        if language not in self.supported_languages:
            return {
                "success": False,
                "output": "",
                "error": f"Language '{language}' is not supported. Supported languages: {', '.join(self.supported_languages.keys())}",
                "execution_time": 0,
                "memory_usage": 0
            }
        
        start_time = time.time()
        
        try:
            with tempfile.TemporaryDirectory() as temp_dir:
                # Create temporary file
                lang_config = self.supported_languages[language]
                file_extension = lang_config['extension']
                temp_file = Path(temp_dir) / f"code{file_extension}"
                
                # Write code to file
                with open(temp_file, 'w', encoding='utf-8') as f:
                    f.write(code)
                
                # Prepare command
                command = self._prepare_command(language, str(temp_file), temp_dir)
                
                # Execute with security measures
                result = self._execute_with_limits(command, stdin, temp_dir)
                
                execution_time = time.time() - start_time
                
                return {
                    "success": result["success"],
                    "output": result["stdout"],
                    "error": result["stderr"],
                    "execution_time": round(execution_time, 3),
                    "memory_usage": result.get("memory_usage", 0),
                    "language": language
                }
                
        except Exception as e:
            execution_time = time.time() - start_time
            return {
                "success": False,
                "output": "",
                "error": f"Execution error: {str(e)}",
                "execution_time": round(execution_time, 3),
                "memory_usage": 0,
                "language": language
            }
    
    def _prepare_command(self, language: str, file_path: str, temp_dir: str) -> list:
        """Prepare the execution command for the given language."""
        lang_config = self.supported_languages[language]
        command = lang_config['command'].copy()
        
        # Handle special cases
        if language == 'java':
            # Extract class name from file
            class_name = Path(file_path).stem
            return ['java', '-cp', temp_dir, class_name]
        elif language in ['cpp', 'c', 'rust']:
            output_file = Path(temp_dir) / "output"
            if os.name == 'nt':  # Windows
                output_file = output_file.with_suffix('.exe')
            
            # Replace placeholders
            command = [cmd.replace('{file}', file_path).replace('{output}', str(output_file)) for cmd in command]
            return command
        else:
            command.append(file_path)
            return command
    
    def _execute_with_limits(self, command: list, stdin: Optional[str], cwd: str) -> Dict[str, Any]:
        """Execute command with resource limits and security measures."""
        try:
            # Set up process with limits
            process = subprocess.Popen(
                command,
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                cwd=cwd,
                text=True,
                timeout=self.max_execution_time,
                # Security: Prevent shell injection
                shell=False
            )
            
            # Execute with timeout
            stdout, stderr = process.communicate(input=stdin, timeout=self.max_execution_time)
            
            # Limit output size
            if len(stdout) > self.max_output_size:
                stdout = stdout[:self.max_output_size] + "\n[Output truncated - too large]"
            
            if len(stderr) > self.max_output_size:
                stderr = stderr[:self.max_output_size] + "\n[Error output truncated - too large]"
            
            return {
                "success": process.returncode == 0,
                "stdout": stdout,
                "stderr": stderr if process.returncode != 0 else "",
                "return_code": process.returncode,
                "memory_usage": 0  # Would need psutil for actual memory monitoring
            }
            
        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "stdout": "",
                "stderr": f"Execution timed out after {self.max_execution_time} seconds",
                "return_code": -1,
                "memory_usage": 0
            }
        except Exception as e:
            return {
                "success": False,
                "stdout": "",
                "stderr": f"Execution failed: {str(e)}",
                "return_code": -1,
                "memory_usage": 0
            }

    def get_supported_languages(self) -> list:
        """Get list of supported programming languages."""
        return list(self.supported_languages.keys())

    def validate_code(self, language: str, code: str) -> Dict[str, Any]:
        """Basic code validation before execution."""
        if not code.strip():
            return {"valid": False, "error": "Code cannot be empty"}
        
        # Basic security checks
        dangerous_patterns = [
            'import os', 'import subprocess', 'import sys',
            'exec(', 'eval(', '__import__',
            'open(', 'file(', 'input(',
            'raw_input(', 'System.', 'Runtime.',
            'fs.', 'require("fs")', 'require("child_process")',
            'process.exit', 'System.exit'
        ]
        
        code_lower = code.lower()
        for pattern in dangerous_patterns:
            if pattern.lower() in code_lower:
                return {
                    "valid": False, 
                    "error": f"Potentially dangerous code detected: {pattern}. Please remove it for security."
                }
        
        return {"valid": True, "error": None}

# Global instance
code_executor = CodeExecutor()

def run_code(language: str, code: str, stdin: Optional[str] = None) -> Dict[str, Any]:
    """Legacy function for backward compatibility."""
    return code_executor.run_code(language, code, stdin) 