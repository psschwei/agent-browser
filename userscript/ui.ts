/**
 * Create the UI overlay panel
 */
export function createUI(runAgent: (prompt: string) => Promise<void>): HTMLElement {
  const overlay = document.createElement('div');
  overlay.id = 'agent-browser-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    right: 0;
    width: 400px;
    height: 100vh;
    background: white;
    box-shadow: -4px 0 12px rgba(0,0,0,0.2);
    z-index: 999998;
    padding: 20px;
    overflow-y: auto;
    font-family: system-ui, -apple-system, sans-serif;
  `;

  overlay.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h2 style="margin: 0; font-size: 20px;">🤖 Agent Browser</h2>
      <button id="agent-browser-close" style="border: none; background: none; font-size: 28px; cursor: pointer; line-height: 1; color: #666;">&times;</button>
    </div>

    <div style="margin-bottom: 15px;">
      <label style="display: block; margin-bottom: 5px; font-size: 14px; font-weight: 500; color: #333;">What should I do on this page?</label>
      <textarea id="agent-browser-prompt"
        placeholder="e.g., Find all products under $100"
        style="width: 100%; height: 100px; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; resize: vertical; font-family: inherit;"></textarea>
    </div>

    <button id="agent-browser-run"
      style="width: 100%; padding: 12px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; font-weight: 500; transition: opacity 0.2s;">
      Run Agent
    </button>

    <div style="margin-top: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <h3 style="margin: 0; font-size: 14px; font-weight: 600; color: #333;">Activity Log</h3>
        <button id="agent-browser-clear" style="border: none; background: none; font-size: 12px; cursor: pointer; color: #667eea; text-decoration: underline;">Clear</button>
      </div>
      <div id="agent-browser-status" style="padding: 10px; background: #f5f5f5; border-radius: 6px; font-size: 13px; min-height: 200px; max-height: 400px; overflow-y: auto; font-family: 'Monaco', 'Menlo', 'Consolas', monospace;"></div>
    </div>
  `;

  // Event listeners
  const closeBtn = overlay.querySelector('#agent-browser-close') as HTMLButtonElement;
  closeBtn.addEventListener('click', () => {
    overlay.style.display = 'none';
  });

  const clearBtn = overlay.querySelector('#agent-browser-clear') as HTMLButtonElement;
  clearBtn.addEventListener('click', () => {
    const status = document.getElementById('agent-browser-status');
    if (status) status.innerHTML = '';
  });

  const runBtn = overlay.querySelector('#agent-browser-run') as HTMLButtonElement;
  const promptTextarea = overlay.querySelector('#agent-browser-prompt') as HTMLTextAreaElement;

  runBtn.addEventListener('click', async () => {
    const prompt = promptTextarea.value.trim();
    if (!prompt) return;

    // Disable button during execution
    runBtn.disabled = true;
    runBtn.style.opacity = '0.6';
    runBtn.textContent = 'Running...';

    try {
      await runAgent(prompt);
    } finally {
      // Re-enable button
      runBtn.disabled = false;
      runBtn.style.opacity = '1';
      runBtn.textContent = 'Run Agent';
    }
  });

  return overlay;
}

/**
 * Update the UI with a status message
 */
export function updateUI(message: string, type: 'info' | 'success' | 'error' = 'info') {
  const status = document.getElementById('agent-browser-status');
  if (!status) return;

  const line = document.createElement('div');
  const timestamp = new Date().toLocaleTimeString();

  // Color coding based on type
  const colors = {
    info: '#666',
    success: '#10b981',
    error: '#ef4444'
  };

  line.style.cssText = `
    margin-bottom: 8px;
    padding: 6px 8px;
    background: white;
    border-radius: 4px;
    border-left: 3px solid ${colors[type]};
    line-height: 1.4;
  `;

  line.innerHTML = `
    <span style="color: #999; font-size: 11px;">[${timestamp}]</span>
    <span style="color: ${colors[type]}; margin-left: 8px;">${escapeHtml(message)}</span>
  `;

  status.appendChild(line);
  status.scrollTop = status.scrollHeight;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Create floating action button
 */
export function createFloatingButton(onClick: () => void): HTMLElement {
  const btn = document.createElement('button');
  btn.id = 'agent-browser-fab';
  btn.innerHTML = '🤖';
  btn.title = 'Agent Browser (Ctrl+Shift+A)';
  btn.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 999999;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    cursor: pointer;
    font-size: 30px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    transition: transform 0.2s, box-shadow 0.2s;
  `;

  btn.addEventListener('mouseenter', () => {
    btn.style.transform = 'scale(1.1)';
    btn.style.boxShadow = '0 6px 16px rgba(0,0,0,0.4)';
  });

  btn.addEventListener('mouseleave', () => {
    btn.style.transform = 'scale(1)';
    btn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
  });

  btn.addEventListener('click', onClick);

  return btn;
}
