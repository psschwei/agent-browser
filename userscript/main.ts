import { Agent } from '../src/core/agent';
import { LLMClient } from '../src/core/llm-client';
import { ToolManager } from '../src/core/tool-manager';
import { domTools } from './dom-tools';
import { createUI, createFloatingButton, updateUI } from './ui';
import { ConfigManager, showSettings } from './config';

// Global state
let agentInstance: Agent | null = null;
let uiOverlay: HTMLElement | null = null;

/**
 * Run the agent with the given prompt
 */
async function runAgent(prompt: string): Promise<void> {
  // Load config
  const config = ConfigManager.load();
  if (!config.apiKey) {
    alert('Please configure your API key first (Tampermonkey menu → Configure API Key)');
    showSettings();
    return;
  }

  updateUI('Starting agent...', 'info');

  try {
    // Create LLM client
    const llmClient = new LLMClient(config);
    const toolManager = new ToolManager();

    // Register DOM tools
    domTools.forEach(tool => toolManager.register(tool));
    updateUI(`Registered ${domTools.length} DOM tools`, 'info');

    // Create agent
    agentInstance = new Agent(llmClient, toolManager);

    // Listen to events
    agentInstance.on('thinking', (data) => {
      updateUI(`🤔 Thinking... (iteration ${data.iteration})`, 'info');
    });

    agentInstance.on('tool_call', (data) => {
      const params = JSON.stringify(data.params);
      updateUI(`🔧 Calling: ${data.name}(${params.length > 50 ? params.substring(0, 50) + '...' : params})`, 'info');
    });

    agentInstance.on('observation', (data) => {
      const result = typeof data.result === 'string' ? data.result : JSON.stringify(data.result);
      updateUI(`✓ Result: ${result.length > 100 ? result.substring(0, 100) + '...' : result}`, 'success');
    });

    agentInstance.on('error', (data) => {
      updateUI(`❌ Error: ${data.error}`, 'error');
    });

    agentInstance.on('complete', (data) => {
      updateUI(`✅ Complete! ${data.answer}`, 'success');
    });

    // Run agent
    const result = await agentInstance.run(prompt);
    updateUI(`Final answer: ${result}`, 'success');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    updateUI(`Failed to run agent: ${errorMessage}`, 'error');
    console.error('[Agent Browser] Error:', error);
  }
}

/**
 * Show or create the agent UI
 */
function showAgentUI() {
  if (!uiOverlay) {
    uiOverlay = createUI(runAgent);
    document.body.appendChild(uiOverlay);
  } else {
    uiOverlay.style.display = 'block';
  }
}

/**
 * Initialize the userscript
 */
function init() {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
    return;
  }

  console.log('[Agent Browser] Userscript loaded ✓');

  // Register Tampermonkey menu commands
  if (typeof GM_registerMenuCommand !== 'undefined') {
    (GM_registerMenuCommand as any)('Activate Agent', showAgentUI);
    (GM_registerMenuCommand as any)('Configure API Key', showSettings);
  }

  // Setup keyboard shortcut (Ctrl+Shift+A)
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'A') {
      e.preventDefault();
      showAgentUI();
    }
  });

  // Create floating action button (with slight delay to ensure body exists)
  setTimeout(() => {
    if (document.body) {
      const fab = createFloatingButton(showAgentUI);
      document.body.appendChild(fab);
    }
  }, 100);
}

// Start initialization
init();
