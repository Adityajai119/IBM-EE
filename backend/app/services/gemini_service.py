import google.generativeai as genai
from app.config import config
import json
import logging
from typing import List, Dict, Any, Optional
import re
import base64
import io
from PIL import Image

logger = logging.getLogger(__name__)

class GeminiService:
    def __init__(self):
        genai.configure(api_key=config.GEMINI_API_KEY)
        self.model = genai.GenerativeModel('gemini-2.0-flash-exp')

    async def chat(self, messages: List[Dict[str, str]], repo_context: Optional[str] = None) -> str:
        try:
            formatted_messages = []
            for msg in messages:
                if msg['role'] == 'user':
                    formatted_messages.append(f"User: {msg['content']}")
                elif msg['role'] == 'assistant':
                    formatted_messages.append(f"Assistant: {msg['content']}")
            if repo_context:
                formatted_messages.insert(0, f"Repository Context:\n{repo_context}\n")
            prompt = "\n".join(formatted_messages)
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            logger.error(f"Error in Gemini chat: {e}")
            return "[Gemini API error]"

    async def chat_with_image(self, messages: List[Dict[str, str]], image_data: str, image_type: Optional[str] = None, repo_context: Optional[str] = None) -> str:
        """Chat with Gemini using both text and image input"""
        try:
            # Process the base64 image data
            if image_data.startswith('data:'):
                # Remove data URL prefix if present
                image_data = image_data.split(',')[1]
            
            # Decode base64 image
            image_bytes = base64.b64decode(image_data)
            
            # Create PIL Image for processing
            image = Image.open(io.BytesIO(image_bytes))
            
            # Convert to RGB if necessary (for JPEG compatibility)
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Resize image if too large (Gemini has size limits)
            max_size = 1024
            if max(image.size) > max_size:
                ratio = max_size / max(image.size)
                new_size = (int(image.size[0] * ratio), int(image.size[1] * ratio))
                image = image.resize(new_size, Image.Resampling.LANCZOS)
            
            # Convert back to bytes for Gemini
            buffer = io.BytesIO()
            image.save(buffer, format='JPEG')
            processed_image_data = buffer.getvalue()
            
            # Format text messages
            formatted_messages = []
            for msg in messages:
                if msg['role'] == 'user':
                    formatted_messages.append(f"User: {msg['content']}")
                elif msg['role'] == 'assistant':
                    formatted_messages.append(f"Assistant: {msg['content']}")
            
            if repo_context:
                formatted_messages.insert(0, f"Repository Context:\n{repo_context}\n")
            
            prompt = "\n".join(formatted_messages)
            
            # Create content with both text and image
            content = [
                prompt,
                {
                    "mime_type": "image/jpeg",
                    "data": processed_image_data
                }
            ]
            
            response = self.model.generate_content(content)
            return response.text
            
        except Exception as e:
            logger.error(f"Error in Gemini chat with image: {e}")
            # Fallback to text-only chat
            try:
                return await self.chat(messages, repo_context)
            except:
                return f"[Error processing image: {str(e)}. Please try with text only.]"

    async def generate_code(self, prompt: str, language: str, context: Optional[str] = None) -> str:
        try:
            full_prompt = f"""
            Generate production-ready, idiomatic, and practical {language} code for the following prompt:
            
            Prompt: {prompt}
            
            {f"Context: {context}" if context else ""}
            
            Requirements:
            1. Write clean, idiomatic, and efficient code as used in real-world projects.
            2. Follow {language} best practices and style guidelines.
            3. Include proper error handling and input validation where appropriate.
            4. ALWAYS include example usage with print statements to demonstrate the function/feature.
            5. Do NOT use input() or any interactive input.
            6. Assume all inputs are provided as function arguments or variables.
            7. The code should run in a web-based execution environment without user interaction.
            8. CRITICAL: Always include example usage that will produce visible output when executed.
            9. If you create a function, include a call to that function with example values and print the result.
            10. Add meaningful comments explaining complex logic.
            11. Use descriptive variable names and follow naming conventions.
            12. Include edge case handling where relevant.
            
            Example format:
            def my_function(param1, param2):
                \"\"\"Calculate the sum of two numbers.\"\"\"
                return param1 + param2
            
            # Example usage
            result = my_function(5, 3)
            print(f"Result: {{result}}")
            
            Please provide only the code without any markdown formatting.
            """
            response = self.model.generate_content(full_prompt)
            return response.text
        except Exception as e:
            logger.error(f"Error in Gemini code generation: {e}")
            return "[Gemini API error]"

    async def analyze_code(self, code: str, language: str) -> Dict[str, Any]:
        try:
            prompt = f"""
            Analyze the following {language} code and provide a comprehensive analysis:
            
            Code:
            {code}
            
            Please provide analysis in the following JSON format:
            {{
                "summary": "Brief summary of what the code does",
                "complexity": "Low/Medium/High",
                "functions": ["list of function names"],
                "classes": ["list of class names"],
                "variables": ["list of important variables"],
                "suggestions": ["list of improvement suggestions"],
                "quality_score": 85,
                "security_issues": ["list of potential security issues"],
                "performance_tips": ["list of performance optimization tips"],
                "best_practices": ["list of best practices applied"],
                "code_smells": ["list of code smells or anti-patterns"],
                "documentation_quality": "Good/Fair/Poor",
                "testability": "High/Medium/Low"
            }}
            """
            response = self.model.generate_content(prompt)
            try:
                return json.loads(response.text)
            except json.JSONDecodeError:
                return {}
        except Exception as e:
            logger.error(f"Error in Gemini code analysis: {e}")
            return {}

    async def explain_code(self, code: str, language: str) -> str:
        try:
            prompt = f"""
            Explain the following {language} code in detail:
            
            {code}
            
            Please provide:
            1. What the code does (purpose and functionality)
            2. How it works step by step
            3. Key concepts and patterns used
            4. Important algorithms or data structures
            5. Time and space complexity analysis
            6. Potential improvements or optimizations
            7. Common use cases and applications
            8. Related concepts and technologies
            
            Format the explanation in a clear, educational manner suitable for developers.
            """
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            logger.error(f"Error in Gemini code explanation: {e}")
            return "[Gemini API error]"

    async def optimize_code(self, code: str, language: str, optimization_type: str = "performance") -> str:
        try:
            # Check if this is simple code (less than 10 lines and contains basic operations)
            simple_patterns = ['print', 'sum', 'add', 'multiply', 'divide', 'subtract', 'a=', 'b=', 'x=', 'y=']
            is_simple = any(pattern.lower() in code.lower() for pattern in simple_patterns) and len(code.split('\n')) <= 10
            
            if is_simple:
                prompt = f"""
                You are a code optimizer. Optimize this simple {language} code. Keep it practical and straightforward.
                
                IMPORTANT RULES:
                1. Return ONLY valid, complete, executable code
                2. Do NOT include explanations, comments, or markdown
                3. Do NOT add unnecessary complexity or classes
                4. Ensure all parentheses, brackets, and quotes are properly closed
                5. Keep the same functionality exactly
                6. For simple arithmetic, stay simple - NO classes needed
                
                Code to optimize:
                {code}
                
                Return only the clean, optimized code:
                """
            else:
                prompt = f"""
                You are a code optimizer. Optimize this {language} code for {optimization_type}.
                
                CRITICAL REQUIREMENTS:
                1. Return ONLY valid, complete, executable code
                2. Do NOT include explanations, markdown formatting, or comments
                3. Ensure all syntax is correct and complete
                4. All parentheses, brackets, and quotes must be properly closed
                5. Preserve original functionality
                6. Focus on {optimization_type} improvements
                
                Original Code:
                {code}
                
                Return only the optimized code:
                """
            
            response = self.model.generate_content(prompt)
            result = response.text.strip()
            
            # Clean up the response - remove markdown formatting if present
            if '```' in result:
                # Extract code from markdown blocks
                lines = result.split('\n')
                code_lines = []
                in_code_block = False
                
                for line in lines:
                    if line.strip().startswith('```'):
                        in_code_block = not in_code_block
                        continue
                    if in_code_block:
                        code_lines.append(line)
                
                if code_lines:
                    result = '\n'.join(code_lines).strip()
            
            # Basic validation - ensure the code looks valid
            if not result or len(result.strip()) < 5:
                return code  # Return original if optimization failed
            
            # Check for basic syntax issues
            if language.lower() == 'python':
                # Count parentheses
                open_parens = result.count('(')
                close_parens = result.count(')')
                if open_parens != close_parens:
                    logger.warning("Parentheses mismatch in optimized code, returning original")
                    return code
                
                # Check for incomplete lines
                lines = result.split('\n')
                for line in lines:
                    stripped = line.strip()
                    if stripped and (stripped.endswith('(') or stripped.endswith(',') and not stripped.endswith('",') and not stripped.endswith("',")):
                        logger.warning("Incomplete line detected in optimized code, returning original")
                        return code
            
            return result
            
        except Exception as e:
            logger.error(f"Error in Gemini code optimization: {e}")
            return code  # Return original code if optimization fails

    async def debug_code(self, code: str, language: str, error_message: str) -> str:
        try:
            prompt = f"""
            Debug and fix the following {language} code that has an error:
            
            Code:
            {code}
            
            Error:
            {error_message}
            
            Please provide:
            1. Fixed code with proper error handling
            2. Explanation of what caused the error
            3. How the fix resolves the issue
            4. Prevention tips for similar errors
            5. Best practices to avoid this type of error
            
            Make sure the fixed code is production-ready and follows best practices.
            """
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            logger.error(f"Error in Gemini code debugging: {e}")
            return "[Gemini API error]"

    async def generate_tests(self, code: str, language: str) -> str:
        try:
            prompt = f"""
            Generate comprehensive unit tests for the following {language} code:
            
            Code:
            {code}
            
            Requirements:
            1. Test all functions and methods
            2. Include edge cases and error conditions
            3. Use appropriate testing framework for {language}
            4. Add meaningful test descriptions
            5. Include both positive and negative test cases
            6. Test input validation and error handling
            7. Provide test coverage analysis
            
            Please provide complete test code that can be executed.
            """
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            logger.error(f"Error in Gemini test generation: {e}")
            return "[Gemini API error]"

    async def refactor_code(self, code: str, language: str, refactoring_type: str = "general") -> str:
        try:
            prompt = f"""
            Refactor the following {language} code with {refactoring_type} improvements:
            
            Code to refactor:
            {code}
            
            Refactoring goals:
            1. Apply {refactoring_type} refactoring patterns
            2. Improve code structure and organization
            3. Enhance readability and maintainability
            4. Follow best practices and design principles
            5. Preserve functionality while improving design
            
            Please provide the refactored code with explanations of changes made.
            """
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            logger.error(f"Error in Gemini code refactoring: {e}")
            return "[Gemini API error]"

    async def generate_frontend(self, prompt: str, stack: str) -> Dict[str, Any]:
        """Generate multiple frontend files for a complete project"""
        try:
            # Determine the file structure based on stack
            if stack.lower() in ['html', 'vanilla', 'javascript', 'css']:
                file_structure = {
                    'index.html': 'html',
                    'style.css': 'css', 
                    'script.js': 'javascript'
                }
            elif stack.lower() in ['react', 'jsx']:
                file_structure = {
                    'App.jsx': 'javascript',
                    'App.css': 'css',
                    'index.html': 'html'
                }
            elif stack.lower() in ['vue']:
                file_structure = {
                    'App.vue': 'javascript',
                    'style.css': 'css',
                    'index.html': 'html'
                }
            else:
                # Default to vanilla HTML/CSS/JS
                file_structure = {
                    'index.html': 'html',
                    'style.css': 'css',
                    'script.js': 'javascript'
                }

            project_prompt = f"""
            Create a complete {stack} web project based on this description: {prompt}
            
            Generate a multi-file project with the following structure:
            {', '.join(file_structure.keys())}
            
            Requirements:
            1. Create a fully functional, complete application
            2. Include proper HTML structure, styling, and interactivity
            3. Use modern best practices for {stack}
            4. Make it responsive and visually appealing
            5. Include proper event handling and functionality
            6. Add comments explaining key parts of the code
            
            Return the response in this EXACT JSON format:
            {{
                "files": {{
                    "filename1": "file content here",
                    "filename2": "file content here",
                    ...
                }}
            }}
            
            IMPORTANT: 
            - Return ONLY valid JSON, no additional text or explanations
            - Ensure all files work together as a complete project
            - Include all necessary HTML structure, CSS styling, and JavaScript functionality
            - Make sure the code is production-ready and error-free
            """
            
            response = self.model.generate_content(project_prompt)
            result_text = response.text.strip()
            
            # Try to extract JSON from the response
            try:
                # Look for JSON in the response
                import json
                import re
                
                # Find JSON block in the response
                json_match = re.search(r'\{.*\}', result_text, re.DOTALL)
                if json_match:
                    json_str = json_match.group()
                    parsed_result = json.loads(json_str)
                    
                    if 'files' in parsed_result:
                        return {
                            "files": parsed_result['files'],
                            "stack": stack,
                            "structure": file_structure
                        }
                
                # Fallback: create single file if JSON parsing fails
                logger.warning("Failed to parse JSON response, creating single file fallback")
                return self._create_single_file_fallback(result_text, stack, prompt)
                
            except (json.JSONDecodeError, AttributeError) as e:
                logger.warning(f"JSON parsing failed: {e}, creating fallback")
                return self._create_single_file_fallback(result_text, stack, prompt)
                
        except Exception as e:
            logger.error(f"Error in frontend generation: {e}")
            return self._create_single_file_fallback("", stack, prompt)

    def _create_single_file_fallback(self, content: str, stack: str, prompt: str) -> Dict[str, Any]:
        """Create a single file fallback when multi-file generation fails"""
        if stack.lower() in ['react', 'jsx']:
            return {
                "files": {
                    "App.jsx": content or f"""// Generated React component for: {prompt}
import React from 'react';

function App() {{
  return (
    <div>
      <h1>Hello World</h1>
      <p>Generated from: {prompt}</p>
    </div>
  );
}}

export default App;"""
                },
                "stack": stack,
                "structure": {"App.jsx": "javascript"}
            }
        else:
            return {
                "files": {
                    "index.html": content or f"""<!DOCTYPE html>
<html>
<head>
    <title>Generated Project</title>
</head>
<body>
    <h1>Hello World</h1>
    <p>Generated from: {prompt}</p>
</body>
</html>"""
                },
                "stack": stack,
                "structure": {"index.html": "html"}
            }

    async def generate_project(self, prompt: str, stack: str = "vanilla", project_type: str = "web") -> Dict[str, Any]:
        """Generate a complete project with multiple files based on prompt and stack"""
        try:
            # Create comprehensive prompt for multi-file project generation
            multi_file_prompt = f"""
Create a complete {stack} {project_type} project based on: "{prompt}"

IMPORTANT REQUIREMENTS:
1. Generate MULTIPLE FILES for a complete project structure
2. Return ONLY a valid JSON object with the exact structure shown below
3. Include all necessary files (HTML, CSS, JavaScript, etc.)
4. Make the project functional and production-ready
5. Use modern best practices and clean code

For {stack} stack, generate appropriate files:
- If vanilla: HTML, CSS, JS files
- If React: JSX components, CSS modules, package.json
- If Vue: Vue components, CSS, JavaScript
- If Angular: Components, services, modules
- If Calculator project: Include proper styling and functionality

Required JSON Response Format:
{{
  "files": {{
    "filename1.ext": "file content here",
    "filename2.ext": "file content here",
    "filename3.ext": "file content here"
  }},
  "stack": "{stack}",
  "structure": {{
    "filename1.ext": "language_type",
    "filename2.ext": "language_type"
  }}
}}

Project Description: {prompt}
Stack: {stack}
Type: {project_type}

Generate a complete, functional project with proper file structure.
"""

            response = self.model.generate_content(multi_file_prompt)
            result_text = response.text.strip()
            
            # Try to extract JSON from the response
            try:
                # Look for JSON content between ```json and ``` or just raw JSON
                if '```json' in result_text:
                    json_start = result_text.find('```json') + 7
                    json_end = result_text.find('```', json_start)
                    json_content = result_text[json_start:json_end].strip()
                elif '```' in result_text:
                    json_start = result_text.find('```') + 3
                    json_end = result_text.find('```', json_start)
                    json_content = result_text[json_start:json_end].strip()
                else:
                    # Try to find JSON object in the response
                    start_brace = result_text.find('{')
                    if start_brace != -1:
                        # Find the matching closing brace
                        brace_count = 0
                        end_brace = start_brace
                        for i, char in enumerate(result_text[start_brace:], start_brace):
                            if char == '{':
                                brace_count += 1
                            elif char == '}':
                                brace_count -= 1
                                if brace_count == 0:
                                    end_brace = i + 1
                                    break
                        json_content = result_text[start_brace:end_brace]
                    else:
                        json_content = result_text
                
                import json
                project_data = json.loads(json_content)
                
                # Validate the structure
                if 'files' not in project_data or not isinstance(project_data['files'], dict):
                    raise ValueError("Invalid project structure: missing 'files' object")
                
                # Ensure we have at least one file
                if not project_data['files']:
                    raise ValueError("No files generated")
                
                # Add missing fields if not present
                if 'stack' not in project_data:
                    project_data['stack'] = stack
                if 'structure' not in project_data:
                    project_data['structure'] = {}
                    # Auto-detect structure based on file extensions
                    for filename in project_data['files'].keys():
                        ext = filename.split('.')[-1].lower()
                        if ext in ['html', 'htm']:
                            project_data['structure'][filename] = 'html'
                        elif ext in ['css']:
                            project_data['structure'][filename] = 'css'
                        elif ext in ['js', 'jsx']:
                            project_data['structure'][filename] = 'javascript'
                        elif ext in ['ts', 'tsx']:
                            project_data['structure'][filename] = 'typescript'
                        elif ext in ['vue']:
                            project_data['structure'][filename] = 'vue'
                        elif ext in ['json']:
                            project_data['structure'][filename] = 'json'
                        else:
                            project_data['structure'][filename] = 'plaintext'
                
                logger.info(f"Successfully generated {len(project_data['files'])} files for {stack} project")
                return project_data
                
            except json.JSONDecodeError as je:
                logger.warning(f"Failed to parse JSON response, using fallback: {je}")
                return self._create_multi_file_fallback(prompt, stack, project_type)
            except Exception as pe:
                logger.warning(f"Failed to process project data, using fallback: {pe}")
                return self._create_multi_file_fallback(prompt, stack, project_type)
                
        except Exception as e:
            logger.error(f"Error in project generation: {e}")
            return self._create_multi_file_fallback(prompt, stack, project_type)

    def _create_multi_file_fallback(self, prompt: str, stack: str, project_type: str) -> Dict[str, Any]:
        """Create a multi-file fallback when AI generation fails"""
        if 'calculator' in prompt.lower():
            return self._create_calculator_project(stack)
        elif 'todo' in prompt.lower():
            return self._create_todo_project(stack)
        else:
            return self._create_basic_project(prompt, stack)

    def _create_calculator_project(self, stack: str) -> Dict[str, Any]:
        """Create a calculator project with multiple files"""
        if stack.lower() in ['react', 'jsx']:
            return {
                "files": {
                    "package.json": """{
  "name": "calculator-app",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.3",
    "vite": "^4.4.5"
  }
}""",
                    "vite.config.js": """import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  }
})""",
                    "index.html": """<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Calculator App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>""",
                    "src/main.jsx": """import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)""",
                    "src/App.jsx": """import React, { useState } from 'react';
import './App.css';

const App = () => {
  const [displayValue, setDisplayValue] = useState('0');
  const [previousValue, setPreviousValue] = useState(null);
  const [operation, setOperation] = useState(null);

  const handleButtonClick = (value) => {
    if (value === 'C') {
      setDisplayValue('0');
      setPreviousValue(null);
      setOperation(null);
    } else if (value === '=') {
      if (operation && previousValue !== null) {
        const current = parseFloat(displayValue);
        const previous = parseFloat(previousValue);
        let result;
        
        switch (operation) {
          case '+':
            result = previous + current;
            break;
          case '-':
            result = previous - current;
            break;
          case '*':
            result = previous * current;
            break;
          case '/':
            result = current !== 0 ? previous / current : 0;
            break;
          default:
            return;
        }
        
        setDisplayValue(result.toString());
        setPreviousValue(null);
        setOperation(null);
      }
    } else if (['+', '-', '*', '/'].includes(value)) {
      setPreviousValue(displayValue);
      setOperation(value);
      setDisplayValue('0');
    } else {
      setDisplayValue(displayValue === '0' ? value : displayValue + value);
    }
  };

  const buttons = [
    'C', '/', '*', '-',
    '7', '8', '9', '+',
    '4', '5', '6', '',
    '1', '2', '3', '=',
    '0', '.', '', ''
  ];

  return (
    <div className="calculator">
      <div className="display">
        <div className="display-value">{displayValue}</div>
      </div>
      <div className="buttons">
        {buttons.map((btn, index) => (
          btn && (
            <button
              key={index}
              onClick={() => handleButtonClick(btn)}
              className={`button ${['/', '*', '-', '+', '='].includes(btn) ? 'operator' : ''} ${btn === '=' ? 'equals' : ''} ${btn === '0' ? 'zero' : ''}`}
            >
              {btn}
            </button>
          )
        ))}
      </div>
    </div>
  );
};

export default App;""",
                    "src/App.css": """.calculator {
  max-width: 300px;
  margin: 50px auto;
  background: linear-gradient(145deg, #1e1e1e, #2a2a2a);
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

.display {
  background: #000;
  border-radius: 15px;
  padding: 20px;
  margin-bottom: 20px;
  text-align: right;
  box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.8);
}

.display-value {
  color: #fff;
  font-size: 2.5rem;
  font-family: 'Courier New', monospace;
  min-height: 40px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.buttons {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
}

.button {
  height: 60px;
  border: none;
  border-radius: 15px;
  font-size: 1.5rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  background: linear-gradient(145deg, #3a3a3a, #2a2a2a);
  color: #fff;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
}

.button:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.button.operator {
  background: linear-gradient(145deg, #ff9500, #ff8000);
  color: white;
}

.button.equals {
  background: linear-gradient(145deg, #ff9500, #ff8000);
  grid-column: span 1;
}

.button.zero {
  grid-column: span 2;
}""",
                    "src/index.css": """body {
  margin: 0;
  padding: 0;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#root {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}"""
                },
                "stack": stack,
                "structure": {
                    "package.json": "json",
                    "vite.config.js": "javascript",
                    "index.html": "html",
                    "src/main.jsx": "javascript",
                    "src/App.jsx": "javascript",
                    "src/App.css": "css",
                    "src/index.css": "css"
                }
            }
        else:
            return {
                "files": {
                    "index.html": """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Calculator</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="calculator">
        <div class="display">
            <div class="display-value" id="display">0</div>
        </div>
        <div class="buttons">
            <button onclick="clearCalculator()">C</button>
            <button onclick="inputValue('/')">/</button>
            <button onclick="inputValue('*')">*</button>
            <button onclick="inputValue('-')">-</button>
            <button onclick="inputValue('7')">7</button>
            <button onclick="inputValue('8')">8</button>
            <button onclick="inputValue('9')">9</button>
            <button onclick="inputValue('+')">+</button>
            <button onclick="inputValue('4')">4</button>
            <button onclick="inputValue('5')">5</button>
            <button onclick="inputValue('6')">6</button>
            <button onclick="calculate()" class="equals">=</button>
            <button onclick="inputValue('1')">1</button>
            <button onclick="inputValue('2')">2</button>
            <button onclick="inputValue('3')">3</button>
            <button onclick="inputValue('0')" class="zero">0</button>
            <button onclick="inputValue('.')">.</button>
        </div>
    </div>
    <script src="script.js"></script>
</body>
</html>""",
                    "style.css": """.calculator {
  max-width: 300px;
  margin: 50px auto;
  background: linear-gradient(145deg, #1e1e1e, #2a2a2a);
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

.display {
  background: #000;
  border-radius: 15px;
  padding: 20px;
  margin-bottom: 20px;
  text-align: right;
  box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.8);
}

.display-value {
  color: #fff;
  font-size: 2.5rem;
  font-family: 'Courier New', monospace;
  min-height: 40px;
}

.buttons {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
}

button {
  height: 60px;
  border: none;
  border-radius: 15px;
  font-size: 1.5rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  background: linear-gradient(145deg, #3a3a3a, #2a2a2a);
  color: #fff;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
}

button:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.equals {
  background: linear-gradient(145deg, #ff9500, #ff8000);
  grid-row: span 2;
}

.zero {
  grid-column: span 2;
}

body {
  font-family: Arial, sans-serif;
  background: #f0f0f0;
  margin: 0;
  padding: 0;
}""",
                    "script.js": """let displayValue = '0';
let previousValue = null;
let operation = null;

function updateDisplay() {
    document.getElementById('display').textContent = displayValue;
}

function inputValue(value) {
    if (['+', '-', '*', '/'].includes(value)) {
        if (operation && previousValue !== null) {
            calculate();
        }
        previousValue = displayValue;
        operation = value;
        displayValue = '0';
    } else if (value === '.') {
        if (!displayValue.includes('.')) {
            displayValue += '.';
        }
    } else {
        displayValue = displayValue === '0' ? value : displayValue + value;
    }
    updateDisplay();
}

function calculate() {
    if (operation && previousValue !== null) {
        const current = parseFloat(displayValue);
        const previous = parseFloat(previousValue);
        let result;
        
        switch (operation) {
            case '+':
                result = previous + current;
                break;
            case '-':
                result = previous - current;
                break;
            case '*':
                result = previous * current;
                break;
            case '/':
                result = current !== 0 ? previous / current : 0;
                break;
            default:
                return;
        }
        
        displayValue = result.toString();
        previousValue = null;
        operation = null;
    }
    updateDisplay();
}

function clearCalculator() {
    displayValue = '0';
    previousValue = null;
    operation = null;
    updateDisplay();
}"""
                },
                "stack": stack,
                "structure": {
                    "index.html": "html",
                    "style.css": "css",
                    "script.js": "javascript"
                }
            }

    def _create_todo_project(self, stack: str) -> Dict[str, Any]:
        """Create a todo app project with multiple files"""
        if stack.lower() in ['react', 'jsx']:
            return {
                "files": {
                    "package.json": """{
  "name": "todo-app",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.3",
    "vite": "^4.4.5"
  }
}""",
                    "vite.config.js": """import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  }
})""",
                    "index.html": """<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Todo App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>""",
                    "src/main.jsx": """import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)""",
                    "src/App.jsx": """import React, { useState } from 'react';
import './App.css';

function App() {
  const [todos, setTodos] = useState([]);
  const [inputValue, setInputValue] = useState('');

  const addTodo = () => {
    if (inputValue.trim() !== '') {
      setTodos([...todos, { id: Date.now(), text: inputValue, completed: false }]);
      setInputValue('');
    }
  };

  const toggleTodo = (id) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      addTodo();
    }
  };

  return (
    <div className="app">
      <div className="todo-container">
        <h1>Todo App</h1>
        <div className="input-section">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Add a new todo..."
            className="todo-input"
          />
          <button onClick={addTodo} className="add-button">Add</button>
        </div>
        <div className="todo-list">
          {todos.map(todo => (
            <div key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo(todo.id)}
                className="todo-checkbox"
              />
              <span className="todo-text">{todo.text}</span>
              <button onClick={() => deleteTodo(todo.id)} className="delete-button">Delete</button>
            </div>
          ))}
        </div>
        {todos.length === 0 && (
          <p className="empty-message">No todos yet. Add one above!</p>
        )}
      </div>
    </div>
  );
}

export default App;""",
                    "src/App.css": """.app {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.todo-container {
  max-width: 600px;
  margin: 0 auto;
  background: white;
  border-radius: 15px;
  padding: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
  font-size: 2.5rem;
}

.input-section {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
}

.todo-input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 16px;
  outline: none;
  transition: border-color 0.2s;
}

.todo-input:focus {
  border-color: #667eea;
}

.add-button {
  padding: 12px 24px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.2s;
}

.add-button:hover {
  background: #5a6fd8;
}

.todo-list {
  space-y: 10px;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 10px;
  transition: all 0.2s;
}

.todo-item:hover {
  background: #e9ecef;
}

.todo-item.completed {
  opacity: 0.7;
  background: #e8f5e8;
}

.todo-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.todo-text {
  flex: 1;
  font-size: 16px;
  color: #333;
}

.todo-item.completed .todo-text {
  text-decoration: line-through;
  color: #666;
}

.delete-button {
  padding: 6px 12px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.delete-button:hover {
  background: #c82333;
}

.empty-message {
  text-align: center;
  color: #666;
  font-style: italic;
  padding: 40px 0;
}""",
                    "src/index.css": """body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

* {
  box-sizing: border-box;
}

#root {
  min-height: 100vh;
}"""
                },
                "stack": stack,
                "structure": {
                    "package.json": "json",
                    "vite.config.js": "javascript",
                    "index.html": "html",
                    "src/main.jsx": "javascript",
                    "src/App.jsx": "javascript",
                    "src/App.css": "css",
                    "src/index.css": "css"
                }
            }
        else:
            # Vanilla HTML/CSS/JS version
            return {
                "files": {
                    "index.html": """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Todo App</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="app">
        <div class="todo-container">
            <h1>Todo App</h1>
            <div class="input-section">
                <input type="text" id="todoInput" placeholder="Add a new todo..." class="todo-input">
                <button onclick="addTodo()" class="add-button">Add</button>
            </div>
            <div id="todoList" class="todo-list"></div>
            <p id="emptyMessage" class="empty-message" style="display: none;">No todos yet. Add one above!</p>
        </div>
    </div>
    <script src="script.js"></script>
</body>
</html>""",
                    "style.css": """.app {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.todo-container {
  max-width: 600px;
  margin: 0 auto;
  background: white;
  border-radius: 15px;
  padding: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
  font-size: 2.5rem;
}

.input-section {
  display: flex;
  gap: 10px;
  margin-bottom: 30px;
}

.todo-input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 16px;
  outline: none;
  transition: border-color 0.2s;
}

.todo-input:focus {
  border-color: #667eea;
}

.add-button {
  padding: 12px 24px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.2s;
}

.add-button:hover {
  background: #5a6fd8;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 10px;
  transition: all 0.2s;
}

.todo-item:hover {
  background: #e9ecef;
}

.todo-item.completed {
  opacity: 0.7;
  background: #e8f5e8;
}

.todo-item.completed .todo-text {
  text-decoration: line-through;
  color: #666;
}

.todo-text {
  flex: 1;
  font-size: 16px;
  color: #333;
}

.delete-button {
  padding: 6px 12px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.delete-button:hover {
  background: #c82333;
}

.empty-message {
  text-align: center;
  color: #666;
  font-style: italic;
  padding: 40px 0;
}""",
                    "script.js": """let todos = [];
let nextId = 1;

function addTodo() {
    const input = document.getElementById('todoInput');
    const text = input.value.trim();
    
    if (text !== '') {
        todos.push({
            id: nextId++,
            text: text,
            completed: false
        });
        input.value = '';
        renderTodos();
    }
}

function toggleTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        renderTodos();
    }
}

function deleteTodo(id) {
    todos = todos.filter(t => t.id !== id);
    renderTodos();
}

function renderTodos() {
    const todoList = document.getElementById('todoList');
    const emptyMessage = document.getElementById('emptyMessage');
    
    todoList.innerHTML = '';
    
    if (todos.length === 0) {
        emptyMessage.style.display = 'block';
    } else {
        emptyMessage.style.display = 'none';
        
        todos.forEach(todo => {
            const todoItem = document.createElement('div');
            todoItem.className = `todo-item ${todo.completed ? 'completed' : ''}`;
            
            todoItem.innerHTML = `
                <input type="checkbox" ${todo.completed ? 'checked' : ''} 
                       onchange="toggleTodo(${todo.id})" class="todo-checkbox">
                <span class="todo-text">${todo.text}</span>
                <button onclick="deleteTodo(${todo.id})" class="delete-button">Delete</button>
            `;
            
            todoList.appendChild(todoItem);
        });
    }
}

// Add Enter key support
document.getElementById('todoInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        addTodo();
    }
});

// Initialize
renderTodos();"""
                },
                "stack": stack,
                "structure": {
                    "index.html": "html",
                    "style.css": "css",
                    "script.js": "javascript"
                }
            }

    def _create_basic_project(self, prompt: str, stack: str) -> Dict[str, Any]:
        """Create a basic project with multiple files"""
        if stack.lower() in ['react', 'jsx']:
            return {
                "files": {
                    "package.json": """{
  "name": "react-app",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.3",
    "vite": "^4.4.5"
  }
}""",
                    "vite.config.js": """import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true
  }
})""",
                    "index.html": """<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>""",
                    "src/main.jsx": """import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)""",
                    "src/App.jsx": f"""import React from 'react';
import './App.css';

function App() {{
  return (
    <div className="app">
      <header className="app-header">
        <h1>Welcome to {prompt}</h1>
        <p>Built with React</p>
      </header>
      <main className="app-main">
        <p>Your application content goes here.</p>
      </main>
    </div>
  );
}}

export default App;""",
                    "src/App.css": """.app {
  text-align: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  color: white;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.app-header {
  margin-bottom: 30px;
}

.app-header h1 {
  font-size: 2.5rem;
  margin-bottom: 10px;
}

.app-main {
  font-size: 1.2rem;
}""",
                    "src/index.css": """body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#root {
  min-height: 100vh;
}"""
                },
                "stack": stack,
                "structure": {
                    "package.json": "json",
                    "vite.config.js": "javascript",
                    "index.html": "html",
                    "src/main.jsx": "javascript",
                    "src/App.jsx": "javascript",
                    "src/App.css": "css",
                    "src/index.css": "css"
                }
            }
        else:
            return {
                "files": {
                    "index.html": f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{prompt}</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <header>
            <h1>Welcome to {prompt}</h1>
        </header>
        <main>
            <p>Your application content goes here.</p>
        </main>
    </div>
    <script src="script.js"></script>
</body>
</html>""",
                    "style.css": """body {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 0;
  background-color: #f0f0f0;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background-color: white;
  box-shadow: 0 0 10px rgba(0,0,0,0.1);
  min-height: 100vh;
}

header {
  text-align: center;
  margin-bottom: 30px;
}

h1 {
  color: #333;
  font-size: 2.5rem;
}

main {
  font-size: 1.1rem;
  line-height: 1.6;
}""",
                    "script.js": """document.addEventListener('DOMContentLoaded', function() {
    console.log('Application loaded successfully!');
    
    // Add your JavaScript functionality here
});"""
                },
                "stack": stack,
                "structure": {
                    "index.html": "html",
                    "style.css": "css",
                    "script.js": "javascript"
                }
            }

# Global instance
gemini_service = GeminiService() 