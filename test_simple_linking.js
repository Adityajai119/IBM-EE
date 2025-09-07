console.log('🧪 Testing multi-file project generation and combination...');

// Test project with HTML, CSS, and JS files
const testProject = {
  files: {
    "index.html": `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Todo App</title>
</head>
<body>
    <div class="container">
        <h1>Todo App</h1>
        <input type="text" id="todoInput" placeholder="Add a new todo...">
        <button onclick="addTodo()">Add Todo</button>
        <ul id="todoList"></ul>
    </div>
</body>
</html>`,
    "style.css": `.container { max-width: 600px; margin: 0 auto; padding: 20px; }`,
    "script.js": `function addTodo() { console.log('Adding todo'); }`
  }
};

console.log('✅ Created test project with files:', Object.keys(testProject.files));

// Test file linking logic
const files = testProject.files;
const hasHtmlFile = Object.keys(files).some(path => path.endsWith('.html'));
const hasCssFile = Object.keys(files).some(path => path.endsWith('.css'));
const hasJsFile = Object.keys(files).some(path => path.endsWith('.js'));

console.log('🔍 File analysis:');
console.log('  - HTML files:', hasHtmlFile);
console.log('  - CSS files:', hasCssFile);
console.log('  - JS files:', hasJsFile);

if (hasHtmlFile && (hasCssFile || hasJsFile)) {
  console.log('📝 Vanilla HTML project detected - testing file linking...');
  
  // Get the main HTML file
  const htmlFilePath = Object.keys(files).find(path => 
    path.endsWith('index.html') || path === 'index.html'
  ) || Object.keys(files).find(path => path.endsWith('.html'));
  
  if (htmlFilePath) {
    let htmlContent = files[htmlFilePath];
    let updated = false;
    
    // Test CSS linking
    if (hasCssFile) {
      const cssFiles = Object.keys(files).filter(path => path.endsWith('.css'));
      cssFiles.forEach(cssPath => {
        const cssFileName = cssPath.split('/').pop() || cssPath;
        if (!htmlContent.includes(cssFileName)) {
          const headCloseTag = htmlContent.indexOf('</head>');
          if (headCloseTag !== -1) {
            const cssLink = '    <link rel="stylesheet" href="./' + cssFileName + '">\n';
            htmlContent = htmlContent.slice(0, headCloseTag) + cssLink + htmlContent.slice(headCloseTag);
            updated = true;
            console.log('🔗 Would link CSS file:', cssFileName);
          }
        }
      });
    }
    
    // Test JS linking
    if (hasJsFile) {
      const jsFiles = Object.keys(files).filter(path => path.endsWith('.js'));
      jsFiles.forEach(jsPath => {
        const jsFileName = jsPath.split('/').pop() || jsPath;
        if (!htmlContent.includes(jsFileName)) {
          const bodyCloseTag = htmlContent.lastIndexOf('</body>');
          if (bodyCloseTag !== -1) {
            const jsScript = '    <script src="./' + jsFileName + '"></script>\n';
            htmlContent = htmlContent.slice(0, bodyCloseTag) + jsScript + htmlContent.slice(bodyCloseTag);
            updated = true;
            console.log('🔗 Would link JS file:', jsFileName);
          }
        }
      });
    }
    
    if (updated) {
      console.log('✅ HTML file would be updated with proper asset links');
      console.log('🔍 Updated HTML preview:');
      console.log('--- HTML Content ---');
      console.log(htmlContent);
      console.log('--- End HTML Content ---');
    } else {
      console.log('ℹ️ No updates needed - files already linked');
    }
  }
}

console.log('✅ Multi-file project test completed successfully!');
