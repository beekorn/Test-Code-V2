// Editor state
let editor;
let currentMode = 'code';
let isEditing = false;
let isExpanded = false;
let codeHistory = {
  original: '',
  versions: [],
  currentIndex: -1
};

// Core editor functions
function initializeEditor() {
  const textarea = document.getElementById('codeEditor');
  editor = CodeMirror.fromTextArea(textarea, {
    mode: 'text/html',
    theme: 'monokai',
    lineNumbers: true,
    autoCloseBrackets: true,
    matchBrackets: true,
    indentUnit: 4,
    readOnly: true,
    undoDepth: 200
  });
  
  setEditorValue('<!-- Generated code will appear here -->', 'text/html');
  
  editor.on('change', function() {
    document.getElementById('undoButton').disabled = !editor.historySize().undo;
    document.getElementById('redoButton').disabled = !editor.historySize().redo;
  });
}

function setEditorValue(code, language, isNewGeneration = false) {
  code = code.replace(/^<think>[\s\S]*?<\/think>\s*/g, '');
  const cleanCode = removeComments(code, language || 'text/html');

  if (isNewGeneration) {
    codeHistory.original = cleanCode;
    codeHistory.versions = [cleanCode];
    codeHistory.currentIndex = 0;
  } else {
    if (codeHistory.currentIndex >= 0 && 
      cleanCode !== codeHistory.versions[codeHistory.currentIndex]) {
      codeHistory.versions = codeHistory.versions.slice(0, codeHistory.currentIndex + 1);
      codeHistory.versions.push(cleanCode);
      codeHistory.currentIndex++;
    }
  }

  editor.setValue(cleanCode.trim());
  editor.refresh();
  updatePreview();
  updateUndoRedoButtons();
}

function removeComments(code, language) {
  let cleanCode = code;
  if (language === 'python') {
    cleanCode = code.replace(/#.*$/gm, '');
    cleanCode = cleanCode.replace(/'''[\s\S]*?'''/g, '');
    cleanCode = cleanCode.replace(/"""[\s\S]*?"""/g, '');
  } else if (language === 'javascript' || language === 'text/x-c++src' || language === 'text/x-java' || language === 'text/x-csharp') {
    cleanCode = code.replace(/\/\*[\s\S]*?\*\//g, '');
    cleanCode = cleanCode.replace(/\/\/.*$/gm, '');
  } else if (language === 'text/html') {
    cleanCode = code.replace(/<!--[\s\S]*?-->/g, '');
  }
  return cleanCode.replace(/^\s*[\r\n]/gm, '');
}

// Event handlers
document.addEventListener('DOMContentLoaded', function() {
  initializeEditor();
  setMode('code');
  setTimeout(() => editor.refresh(), 100);
});

// UI Control functions
function updateUndoRedoButtons() {
  document.getElementById('undoButton').disabled = codeHistory.currentIndex <= 0;
  document.getElementById('redoButton').disabled = 
    codeHistory.currentIndex >= codeHistory.versions.length - 1;
}

function undo() {
  if (codeHistory.currentIndex > 0) {
    codeHistory.currentIndex--;
    const previousVersion = codeHistory.versions[codeHistory.currentIndex];
    editor.setValue(previousVersion);
    editor.refresh();
    updatePreview();
    updateUndoRedoButtons();
  }
}

function redo() {
  if (codeHistory.currentIndex < codeHistory.versions.length - 1) {
    codeHistory.currentIndex++;
    const nextVersion = codeHistory.versions[codeHistory.currentIndex];
    editor.setValue(nextVersion);
    editor.refresh();
    updatePreview();
    updateUndoRedoButtons();
  }
}

function resetToOriginal() {
  if (codeHistory.original) {
    editor.setValue(codeHistory.original);
    editor.refresh();
    updatePreview();
    setEditorValue(codeHistory.original, 'text/html');
  }
}

function toggleCode() {
  const codeContent = document.getElementById('codeBoxContent');
  const expandIcon = document.getElementById('expandIcon');
  const expandText = document.getElementById('expandText');
  isExpanded = !isExpanded;
  
  codeContent.classList.toggle('expanded');
  expandIcon.classList.toggle('expanded');
  expandText.textContent = isExpanded ? 'Hide Code' : 'Show Code';
  
  if (isExpanded) {
    setTimeout(() => editor.refresh(), 300);
  }
}

function updatePreview() {
  const code = editor.getValue();
  const preview = document.getElementById('previewContainer');
  
  const cleanCode = removeComments(code, 'text/html');
  
  if (true) {
    preview.style.display = 'block';
    const frame = document.getElementById('previewFrame');
    frame.contentDocument.open();
    frame.contentDocument.write(cleanCode);
    frame.contentDocument.close();
  } else {
    preview.style.display = 'none';
  }
}

function refreshPreview() {
  const previewFrame = document.getElementById('previewFrame');
  const code = editor.getValue();
  
  // Save current scroll position
  const scrollX = previewFrame.contentWindow.scrollX;
  const scrollY = previewFrame.contentWindow.scrollY;
  
  // Clear frame and rewrite content
  previewFrame.contentDocument.open();
  previewFrame.contentDocument.write(code);
  previewFrame.contentDocument.close();

  // Wait for load and restore scroll position
  previewFrame.addEventListener('load', function() {
    previewFrame.contentWindow.scrollTo(scrollX, scrollY);
  }, { once: true });
}

function openInNewWindow() {
  const code = editor.getValue();
  const newWindow = window.open('', '_blank');
  newWindow.document.write(code);
  newWindow.document.close();
}

function downloadCode() {
  const code = editor.getValue();
  const defaultName = 'generated_code.html';
  const fileName = prompt('Enter file name:', defaultName) || defaultName;
  
  // Add default extension if none provided
  const finalName = fileName.includes('.') ? fileName : `${fileName}.html`;
  
  const blob = new Blob([code], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = finalName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Add copy functionality
function copyCode() {
  const code = editor.getValue();
  navigator.clipboard.writeText(code).then(() => {
    const copyButton = document.querySelector('.copy-button');
    copyButton.textContent = '✓ Copied!';
    copyButton.classList.add('copied');
    
    // Reset button after 2 seconds
    setTimeout(() => {
      copyButton.innerHTML = '<span>📋</span> Copy Code';
      copyButton.classList.remove('copied');
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy code:', err);
    alert('Failed to copy code to clipboard');
  });
}

function copyPrompt() {
  const promptText = document.getElementById('prompt').value;
  navigator.clipboard.writeText(promptText).then(() => {
    const copyButton = document.querySelector('.copy-prompt-button');
    copyButton.textContent = '✓ Copied!';
    copyButton.classList.add('copied');
    
    // Reset button after 2 seconds
    setTimeout(() => {
      copyButton.innerHTML = '<span>📋</span> Copy Prompt';
      copyButton.classList.remove('copied');
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy prompt:', err);
    alert('Failed to copy prompt to clipboard');
  });
}

async function pastePrompt() {
  try {
    const text = await navigator.clipboard.readText();
    document.getElementById('prompt').value = text;
  } catch (err) {
    console.error('Failed to paste prompt:', err);
    alert('Failed to paste from clipboard. Make sure you have granted clipboard permissions.');
  }
}

async function pasteCode() {
  try {
    const text = await navigator.clipboard.readText();
    setEditorValue(text, 'text/html');
    const status = document.getElementById('status');
    status.textContent = 'Code pasted successfully!';
    setTimeout(() => {
      status.textContent = '';
    }, 2000);
  } catch (err) {
    console.error('Failed to paste code:', err);
    alert('Failed to paste from clipboard. Make sure you have granted clipboard permissions.');
  }
}

// Mode and editing functions
function setMode(mode) {
  currentMode = mode;
  document.getElementById('chatMode').classList.toggle('active', mode === 'chat');
  document.getElementById('codeMode').classList.toggle('active', mode === 'code');
  
  const promptElement = document.getElementById('prompt');
  const generateButton = document.getElementById('generateButton');
  const codeContainer = document.getElementById('codeContainer');
  const chatOutput = document.getElementById('chatOutput');
  
  if (mode === 'chat') {
    promptElement.placeholder = 'Ask a question about game development...';
    generateButton.textContent = 'Send';
    codeContainer.style.display = 'none';
    chatOutput.style.display = 'block';
  } else {
    promptElement.placeholder = 'Describe the code you want to generate...';
    generateButton.textContent = 'Generate Code';
    codeContainer.style.display = 'block';
    chatOutput.style.display = 'none';
  }
}

function editCode() {
  isEditing = !isEditing;
  editor.setOption('readOnly', !isEditing);
  document.getElementById('editButton').textContent = isEditing ? ' Cancel Edit' : ' Manual Edit';
  document.getElementById('saveButton').style.display = isEditing ? 'inline-block' : 'none';
  document.getElementById('aiEditButton').style.display = isEditing ? 'none' : 'inline-block';
  updatePreview();
}

function saveCode() {
  isEditing = false;
  editor.setOption('readOnly', true);
  document.getElementById('editButton').textContent = ' Manual Edit';
  document.getElementById('saveButton').style.display = 'none';
  document.getElementById('aiEditButton').style.display = 'inline-block';
  updatePreview();
}

function aiEdit() {
  const editPromptContainer = document.getElementById('editPromptContainer');
  editPromptContainer.classList.add('visible');
  const editPrompt = document.getElementById('editPrompt');
  editPrompt.focus();
}

function cancelEdit() {
  const editPromptContainer = document.getElementById('editPromptContainer');
  editPromptContainer.classList.remove('visible');
  document.getElementById('editPrompt').value = '';
}

// API interaction
async function sendPrompt() {
  const prompt = document.getElementById('prompt').value.trim();
  const status = document.getElementById('status');
  const generationStatus = document.getElementById('generationStatus');
  const generateButtonStatus = document.getElementById('generateButtonStatus');
  const selectedModel = localStorage.getItem('selectedModel') || 'groq';
  const apiKeys = JSON.parse(localStorage.getItem('apiKeys') || '{}');
  const temperature = parseFloat(localStorage.getItem('temperature')) || 0.7;
  const maxTokens = parseInt(localStorage.getItem('maxTokens')) || 8192;
  
  // Debug logging
  console.log('Selected Model:', selectedModel);
  console.log('API Keys:', {
    groq: apiKeys.groq ? 'Set' : 'Not set',
    openrouter: apiKeys.openrouter ? 'Set' : 'Not set',
    sambanova: apiKeys.sambanova ? 'Set' : 'Not set'
  });
  
  let apiKey;
  if (selectedModel.startsWith('openrouter')) {
    apiKey = apiKeys.openrouter;
    console.log('Using OpenRouter API key:', apiKey ? 'Key is set' : 'Key is missing');
  } else if (selectedModel.startsWith('sambanova')) {
    apiKey = apiKeys.sambanova;
  } else {
    apiKey = apiKeys[selectedModel];
  }

  if (!apiKey) {
    status.textContent = 'Error: No API key found. Please add your API key in settings.';
    return;
  }

  if (!prompt) {
    status.textContent = 'Please enter a prompt';
    return;
  }

  // Update both status indicators
  generationStatus.classList.add('generating');
  generateButtonStatus.classList.add('generating');
  status.textContent = currentMode === 'chat' ? 'Generating response...' : 'Generating code...';

  try {
    let finalPrompt = prompt;
    if (currentMode === 'code') {
      finalPrompt = `Generate code for the following request. Include only the code without any explanations or markdown. Use proper indentation and comments: ${prompt}`;
    }

    let response;
    let generatedText;
    
    switch(selectedModel) {
      case 'groq':
        response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-r1-distill-llama-70b',
            messages: [{ 
              role: 'user', 
              content: currentMode === 'code' ? 
                'You are an expert programmer. Generate only code without explanations. ' + finalPrompt :
                finalPrompt 
            }],
            temperature: parseFloat(temperature) || 0.7,
            max_tokens: parseInt(maxTokens) || 8192
      })
    });

    if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Groq API Error: ${errorData.error?.message || response.statusText}`);
        }
        
        const groqData = await response.json();
        generatedText = groqData.choices?.[0]?.message?.content;
        if (!generatedText) {
          throw new Error('No response generated from Groq API');
        }
        break;

      case 'openrouter-gemini-flash-lite':
        response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': window.location.origin,
            'X-Title': 'Code Generator'
          },
          body: JSON.stringify({
            model: 'google/gemini-2.0-flash-lite-preview-02-05:free',
            messages: [
              {
                role: 'user',
                content: currentMode === 'code' ? 
                  'You are an expert programmer. Generate only code without explanations. ' + finalPrompt :
                  finalPrompt
              }
            ]
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`OpenRouter API Error: ${errorData.error?.message || response.statusText}`);
        }

        const openRouterData = await response.json();
        generatedText = openRouterData.choices?.[0]?.message?.content;
        
        if (!generatedText) {
          throw new Error('No response generated from OpenRouter API');
        }
        break;

      case 'sambanova-deepseek':
      case 'sambanova-qwen':
      case 'sambanova-qwen-72b':
        const modelConfig = {
          'sambanova-deepseek': 'DeepSeek-R1-Distill-Llama-70B',
          'sambanova-qwen': 'Qwen2.5-Coder-32B-Instruct',
          'sambanova-qwen-72b': 'Qwen2.5-72B-Instruct'
        };

        response = await fetch('https://api.sambanova.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            stream: false,
            model: modelConfig[selectedModel],
            messages: [
              {
                role: 'system',
                content: currentMode === 'code' ? 
                  'You are an expert programmer. Provide only code without explanations.' : 
                  'You are a helpful assistant'
              },
              {
                role: 'user',
                content: finalPrompt
              }
            ]
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`SambaNova API Error: ${errorData.error?.message || response.statusText}`);
        }

        const sambanovaData = await response.json();
        generatedText = sambanovaData.choices?.[0]?.message?.content;
        
        if (!generatedText) {
          throw new Error('No response generated from SambaNova API');
        }
        break;
    }

    if (currentMode === 'code') {
      let codeContent = generatedText || '';  // Add fallback for undefined
      
      // Only try to match if we have text
      if (generatedText) {
      const codeBlockMatch = generatedText.match(/```(?:\w+)?\n([\s\S]+?)\n```/);
      if (codeBlockMatch) {
        codeContent = codeBlockMatch[1];
        }
      }
      
      setEditorValue(codeContent, 'text/html', true);
      document.getElementById('codeContainer').style.display = 'block';
      document.getElementById('chatOutput').style.display = 'none';
      updatePreview();
    } else {
      const cleanResponse = generatedText ? generatedText.replace(/^<think>[\s\S]*?<\/think>\s*/g, '') : 'No response generated';
      document.getElementById('chatOutput').textContent = cleanResponse;
      document.getElementById('codeContainer').style.display = 'none';
      document.getElementById('chatOutput').style.display = 'block';
      document.getElementById('previewContainer').style.display = 'none';
    }

    // Remove generating class from both indicators when complete
    generationStatus.classList.remove('generating');
    generateButtonStatus.classList.remove('generating');
    status.textContent = currentMode === 'chat' ? 'Response complete!' : 'Code generation complete!';
  } catch (error) {
    // Remove generating class from both indicators on error
    generationStatus.classList.remove('generating');
    generateButtonStatus.classList.remove('generating');
    console.error('Error:', error);
    status.textContent = `Error: ${error.message}`;
  }
}

async function submitEdit() {
  const editPrompt = document.getElementById('editPrompt');
  const status = document.getElementById('status');
  const currentCode = editor.getValue();
  const apiKey = localStorage.getItem('groqApiKey') || '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';

  if (!editPrompt.value.trim()) {
    alert('Please describe the changes you want to make');
    return;
  }

  status.textContent = 'Applying AI edits...';

  try {
    const finalPrompt = `You are a code editor. Here is the current code:
\`\`\`
${currentCode}
\`\`\`

Please modify the code according to this request: ${editPrompt.value}

IMPORTANT: Return ONLY the modified code itself. Do not include:
- Any explanations
- Any comments (including explanatory comments like "Okay, let me modify this...")
- Any markdown formatting
- Any descriptions of what you're doing

The response should contain nothing but the actual code.`;

    const generationStatus = document.getElementById('generationStatus');
    generationStatus.classList.add('generating');
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-r1-distill-llama-70b',
        messages: [{ role: 'user', content: finalPrompt }],
        temperature: 0.3,
        max_tokens: 2048
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    let modifiedCode = data.choices?.[0]?.message?.content || 'No changes made';

    modifiedCode = modifiedCode.replace(/^[\s\S]*?(?=[<{(]|function|const|let|var|import|export|class)/, '');
    
    const codeBlockMatch = modifiedCode.match(/```(?:\w+)?\n([\s\S]+?)\n```/);
    if (codeBlockMatch) {
      modifiedCode = codeBlockMatch[1];
    }

    setEditorValue(modifiedCode, 'text/html');

    generationStatus.classList.remove('generating');
    status.textContent = 'AI edits applied successfully!';
    cancelEdit();
  } catch (error) {
    const generationStatus = document.getElementById('generationStatus');
    generationStatus.classList.remove('generating');
    console.error('Error:', error);
    status.textContent = `Error applying edits: ${error.message}`;
  }
}

function resetEverything() {
  // Reset editor content
  editor.setValue('<!-- Generated code will appear here -->');
  editor.clearHistory();
  
  // Reset code history
  codeHistory = {
    original: '',
    versions: [],
    currentIndex: -1
  };
  
  // Reset UI states
  isEditing = false;
  isExpanded = false;
  
  // Reset editor state
  editor.setOption('readOnly', true);
  
  // Reset buttons
  document.getElementById('editButton').textContent = ' Manual Edit';
  document.getElementById('saveButton').style.display = 'none';
  document.getElementById('aiEditButton').style.display = 'inline-block';
  
  // Reset preview
  const previewFrame = document.getElementById('previewFrame');
  previewFrame.contentDocument.open();
  previewFrame.contentDocument.write('');
  previewFrame.contentDocument.close();
  
  // Reset prompt
  document.getElementById('prompt').value = '';
  
  // Reset status
  document.getElementById('status').textContent = '';
  
  // Reset edit prompt
  document.getElementById('editPrompt').value = '';
  document.getElementById('editPromptContainer').classList.remove('visible');
  
  // Reset both generation status indicators
  document.getElementById('generationStatus').classList.remove('generating');
  document.getElementById('generateButtonStatus').classList.remove('generating');
  
  // Reset mode to default
  setMode('code');
  
  // Update UI states
  updateUndoRedoButtons();
  updatePreview();
}

function openFileUpload() {
  document.getElementById('fileUpload').click();
}

async function handleFileUpload(event) {
  const files = event.target.files;
  if (!files || files.length === 0) return;

  const status = document.getElementById('status');
  status.textContent = 'Reading files...';

  try {
    let combinedContent = '';
    
    // Sort files to ensure HTML comes first, followed by CSS, then JS
    const sortedFiles = Array.from(files).sort((a, b) => {
      const getFileOrder = (filename) => {
        if (filename.endsWith('.html')) return 0;
        if (filename.endsWith('.css')) return 1;
        if (filename.endsWith('.js')) return 2;
        return 3;
      };
      return getFileOrder(a.name) - getFileOrder(b.name);
    });

    for (const file of sortedFiles) {
      const content = await readFileAsync(file);
      
      // Add file separator comments for clarity
      if (combinedContent) {
        combinedContent += '\n\n/* ===== ' + file.name + ' ===== */\n\n';
      }
      
      if (file.name.endsWith('.css')) {
        combinedContent += wrapCSSContent(content);
      } else if (file.name.endsWith('.js')) {
        combinedContent += wrapJSContent(content);
      } else {
        combinedContent += content;
      }
    }

    setEditorValue(combinedContent, 'text/html', true);
    
    // Reset file input for future uploads
    document.getElementById('fileUpload').value = '';
    
    // Update status
    status.textContent = `${files.length} file(s) uploaded successfully!`;
    setTimeout(() => {
      status.textContent = '';
    }, 3000);

  } catch (error) {
    console.error('Error reading files:', error);
    status.textContent = `Error reading files: ${error.message}`;
  }
}

function readFileAsync(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(new Error(`Error reading file ${file.name}`));
    reader.readAsText(file);
  });
}

function wrapCSSContent(cssContent) {
  return `<style>\n${cssContent}\n</style>`;
}

function wrapJSContent(jsContent) {
  return `<script>\n${jsContent}\n</script>`;
}

function getLanguageFromFile(file) {
  const extension = file.name.split('.').pop().toLowerCase();
  switch (extension) {
    case 'js':
      return 'javascript';
    case 'html':
      return 'text/html';
    case 'css':
      return 'text/css';
    case 'py':
      return 'python';
    case 'java':
      return 'text/x-java';
    case 'cpp':
    case 'c':
      return 'text/x-c++src';
    case 'cs':
      return 'text/x-csharp';
    default:
      return 'text/plain';
  }
}

// Add these new functions for settings management
function showSettings() {
  document.getElementById('settingsModal').style.display = 'block';
  updateApiKeyVisibility();
}

function updateApiKeyVisibility() {
  const selectedModel = document.getElementById('modelSelect').value;
  const sections = document.querySelectorAll('.api-key-section');
  
  sections.forEach(section => {
    section.classList.remove('active');
  });
  
  if (selectedModel.startsWith('sambanova')) {
    document.getElementById('sambanova-deepseekApiSection').classList.add('active');
  } else if (selectedModel.startsWith('openrouter')) {
    document.getElementById('openrouterApiSection').classList.add('active');
  } else {
    document.getElementById(`${selectedModel}ApiSection`).classList.add('active');
  }
}

function toggleApiKeyVisibility(inputId) {
  const input = document.getElementById(inputId);
  const type = input.type === 'password' ? 'text' : 'password';
  input.type = type;
}

function saveSettings() {
  const selectedModel = document.getElementById('modelSelect').value;
  const maxTokens = document.getElementById('maxTokens').value;
  
  // Get the current model's API key
  let currentApiKey;
  if (selectedModel.startsWith('sambanova')) {
    currentApiKey = document.getElementById('sambanovaApiKey').value;
  } else if (selectedModel.startsWith('openrouter')) {
    currentApiKey = document.getElementById('openrouterApiKey').value;
  } else {
    currentApiKey = document.getElementById(`${selectedModel}ApiKey`).value;
  }
  
  if (!currentApiKey) {
    alert(`Please enter an API key for ${selectedModel}`);
    return;
  }
  
  // Save API keys to localStorage
  const apiKeys = {
    groq: document.getElementById('groqApiKey').value,
    openrouter: document.getElementById('openrouterApiKey').value,
    sambanova: document.getElementById('sambanovaApiKey').value
  };
  
  localStorage.setItem('selectedModel', selectedModel);
  localStorage.setItem('maxTokens', maxTokens);
  localStorage.setItem('apiKeys', JSON.stringify(apiKeys));
  
  updateModelInfo();
  hideSettings();
}

function loadSettings() {
  const selectedModel = localStorage.getItem('selectedModel') || 'groq';
  const maxTokens = localStorage.getItem('maxTokens') || '8192';
  const apiKeys = JSON.parse(localStorage.getItem('apiKeys') || '{}');
  
  document.getElementById('modelSelect').value = selectedModel;
  document.getElementById('maxTokens').value = maxTokens;
  
  if (apiKeys.groq) document.getElementById('groqApiKey').value = apiKeys.groq;
  if (apiKeys.openrouter) document.getElementById('openrouterApiKey').value = apiKeys.openrouter;
  if (apiKeys.sambanova) document.getElementById('sambanovaApiKey').value = apiKeys.sambanova;
  
  updateApiKeyVisibility();
  updateModelInfo();
}

function updateModelInfo() {
  const selectedModel = document.getElementById('modelSelect').value;
  const modelNames = {
    groq: 'Groq DeepSeek-R1-Distill-LLaMA-70B',
    'openrouter-gemini-flash-lite': 'OpenRouter Gemini 2.0 Flash Lite Preview',
    'sambanova-deepseek': 'SambaNova DeepSeek-R1-Distill-Llama-70B',
    'sambanova-qwen': 'SambaNova Qwen2.5-Coder-32B',
    'sambanova-qwen-72b': 'SambaNova Qwen2.5-72B-Instruct'
  };
  
  document.querySelector('.model-info h3').textContent = modelNames[selectedModel];
}

// Add event listeners
document.getElementById('modelSelect').addEventListener('change', updateApiKeyVisibility);

// Load settings when page loads
document.addEventListener('DOMContentLoaded', loadSettings);

// Add this function to handle closing the settings modal
function hideSettings() {
  const modal = document.getElementById('settingsModal');
  modal.style.display = 'none';
  
  // Show success message
    const status = document.getElementById('status');
    status.textContent = 'Settings saved successfully!';
    setTimeout(() => {
      status.textContent = '';
    }, 3000);
}

// Update the window click handler to be more specific
window.onclick = function(event) {
  const modal = document.getElementById('settingsModal');
  const modalContent = document.querySelector('.modal-content');
  if (event.target === modal && !modalContent.contains(event.target)) {
    hideSettings();
  }
}

// Update the close button click handler
document.querySelector('.close-button').onclick = function() {
  hideSettings();
}

function clearPrompt() {
  document.getElementById('prompt').value = '';
  document.getElementById('prompt').focus();
}

async function enhancePrompt() {
  const currentPrompt = document.getElementById('prompt').value.trim();
  if (!currentPrompt) {
    alert('Please enter a prompt to enhance');
    return;
  }

  const status = document.getElementById('status');
  status.textContent = 'Enhancing prompt...';
  
  const selectedModel = localStorage.getItem('selectedModel') || 'groq';
  const apiKeys = JSON.parse(localStorage.getItem('apiKeys') || '{}');
  let apiKey;
  if (selectedModel.startsWith('gemini')) {
    apiKey = apiKeys.gemini;
  } else if (selectedModel.startsWith('sambanova')) {
    apiKey = apiKeys.sambanova;
  } else {
    apiKey = apiKeys[selectedModel];
  }
  const temperature = parseFloat(localStorage.getItem('temperature')) || 0.7;
  const maxTokens = parseInt(localStorage.getItem('maxTokens')) || 2048;

  if (!apiKey) {
    status.textContent = 'Error: No API key found. Please add your API key in settings.';
    return;
  }

  const enhanceSystemPrompt = `You are an expert at improving and optimizing coding prompts.
    When enhancing a prompt, focus on:
    1. Technical completeness and specificity
    2. Modern best practices and standards
    3. Architecture and design patterns
    4. Security and performance considerations
    5. Error handling and edge cases
    6. Testing and maintainability
    7. User experience and accessibility
    
    Provide a structured, detailed prompt that will result in high-quality code.
    Keep the enhanced prompt clear and actionable.`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
      'Content-Type': 'application/json'
      },
      body: JSON.stringify({
      contents: [{
        role: "user",
        parts: [{ text: systemPrompt }, { text: userPrompt }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 128000
      }
      })
    });

    if (!response.ok) {
    throw new Error(`API Error: ${response.status} - ${response.statusText}`);
  }

  const geminiData = await response.json();
  const enhancedPrompt = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!enhancedPrompt) {
    throw new Error('No response generated from Gemini API');
  }
    
    document.getElementById('prompt').value = enhancedPrompt;
    status.textContent = 'Prompt enhanced!';
    setTimeout(() => {
      status.textContent = '';
    }, 3000);
}
