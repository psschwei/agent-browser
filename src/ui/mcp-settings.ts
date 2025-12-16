import { MCPManager } from '../core/mcp-manager';
import { MCPServerConfig } from '../core/mcp-types';

/**
 * MCP server management UI component
 */
export class MCPSettingsUI {
  private mcpManager: MCPManager;
  private container: HTMLElement;
  private onRefreshCallback?: () => void;

  constructor(container: HTMLElement, mcpManager: MCPManager) {
    this.container = container;
    this.mcpManager = mcpManager;
    this.render();
  }

  /**
   * Set callback for when MCP tools should be refreshed
   */
  onRefresh(callback: () => void): void {
    this.onRefreshCallback = callback;
  }

  /**
   * Render the MCP settings UI
   */
  render(): void {
    const servers = this.mcpManager.getServers();

    this.container.innerHTML = `
      <div class="mcp-settings">
        <div class="section-header">
          <h3>MCP Servers</h3>
          <button id="addMCPServerBtn" class="icon-btn" title="Add Server">➕</button>
        </div>

        <div id="mcpServerList" class="mcp-server-list">
          ${servers.length === 0
            ? '<p class="empty-state">No MCP servers configured</p>'
            : servers.map(s => this.renderServerItem(s)).join('')
          }
        </div>

        <button id="refreshMCPToolsBtn" class="secondary-btn" style="margin-top: 1rem; width: 100%;">
          Refresh MCP Tools
        </button>

        <div id="addServerForm" class="add-server-form" style="display: none;">
          <h4>Add MCP Server</h4>
          <input type="text" id="mcpServerName" placeholder="Server Name" />
          <input type="text" id="mcpServerUrl" placeholder="http://localhost:3000" />
          <textarea id="mcpServerHeaders" placeholder="Optional headers (JSON)" rows="3"></textarea>
          <div class="button-group">
            <button id="testMCPConnectionBtn" class="secondary-btn">Test Connection</button>
            <button id="saveMCPServerBtn" class="primary-btn">Add Server</button>
            <button id="cancelMCPServerBtn" class="secondary-btn">Cancel</button>
          </div>
          <div id="mcpTestResult"></div>
        </div>
      </div>
    `;

    this.attachEventListeners();
  }

  /**
   * Render a single server item
   */
  private renderServerItem(server: MCPServerConfig): string {
    return `
      <div class="mcp-server-item ${server.enabled ? 'enabled' : 'disabled'}" data-server-id="${server.id}">
        <div class="server-info">
          <div class="server-name">${server.name}</div>
          <div class="server-url">${server.url}</div>
        </div>
        <div class="server-actions">
          <label class="toggle">
            <input type="checkbox" ${server.enabled ? 'checked' : ''}
                   onchange="window.toggleMCPServer('${server.id}', this.checked)" />
            <span class="slider"></span>
          </label>
          <button onclick="window.removeMCPServer('${server.id}')" class="icon-btn danger" title="Remove">🗑️</button>
        </div>
      </div>
    `;
  }

  /**
   * Attach event listeners
   */
  private attachEventListeners(): void {
    // Add server button
    const addBtn = document.getElementById('addMCPServerBtn');
    addBtn?.addEventListener('click', () => this.showAddServerForm());

    // Refresh tools button
    const refreshBtn = document.getElementById('refreshMCPToolsBtn');
    refreshBtn?.addEventListener('click', () => this.refreshTools());

    // Cancel add server
    const cancelBtn = document.getElementById('cancelMCPServerBtn');
    cancelBtn?.addEventListener('click', () => this.hideAddServerForm());

    // Save new server
    const saveBtn = document.getElementById('saveMCPServerBtn');
    saveBtn?.addEventListener('click', () => this.addServer());

    // Test connection
    const testBtn = document.getElementById('testMCPConnectionBtn');
    testBtn?.addEventListener('click', () => this.testConnection());

    // Make toggle/remove functions globally accessible for inline onclick
    (window as any).toggleMCPServer = (id: string, enabled: boolean) => {
      this.mcpManager.updateServer(id, { enabled });
    };

    (window as any).removeMCPServer = (id: string) => {
      if (confirm('Remove this MCP server?')) {
        this.mcpManager.removeServer(id);
        this.render();
      }
    };
  }

  private showAddServerForm(): void {
    const form = document.getElementById('addServerForm');
    if (form) form.style.display = 'block';
  }

  private hideAddServerForm(): void {
    const form = document.getElementById('addServerForm');
    if (form) form.style.display = 'none';

    // Clear inputs
    (document.getElementById('mcpServerName') as HTMLInputElement).value = '';
    (document.getElementById('mcpServerUrl') as HTMLInputElement).value = '';
    (document.getElementById('mcpServerHeaders') as HTMLTextAreaElement).value = '';

    const result = document.getElementById('mcpTestResult');
    if (result) result.innerHTML = '';
  }

  private async testConnection(): Promise<void> {
    const url = (document.getElementById('mcpServerUrl') as HTMLInputElement).value;
    const headersText = (document.getElementById('mcpServerHeaders') as HTMLTextAreaElement).value;

    let headers: Record<string, string> | undefined;
    if (headersText.trim()) {
      try {
        headers = JSON.parse(headersText);
      } catch {
        this.showTestResult(false, 'Invalid JSON in headers field');
        return;
      }
    }

    const result = await this.mcpManager.testConnection(url, headers);

    if (result.success) {
      this.showTestResult(true, `Connected! Found ${result.toolCount} tools.`);
    } else {
      this.showTestResult(false, result.error || 'Connection failed');
    }
  }

  private showTestResult(success: boolean, message: string): void {
    const resultDiv = document.getElementById('mcpTestResult');
    if (resultDiv) {
      resultDiv.innerHTML = `
        <div class="test-result ${success ? 'success' : 'error'}">
          ${success ? '✓' : '✗'} ${message}
        </div>
      `;
    }
  }

  private addServer(): void {
    const name = (document.getElementById('mcpServerName') as HTMLInputElement).value;
    const url = (document.getElementById('mcpServerUrl') as HTMLInputElement).value;
    const headersText = (document.getElementById('mcpServerHeaders') as HTMLTextAreaElement).value;

    if (!name || !url) {
      alert('Name and URL are required');
      return;
    }

    let headers: Record<string, string> | undefined;
    if (headersText.trim()) {
      try {
        headers = JSON.parse(headersText);
      } catch {
        alert('Invalid JSON in headers field');
        return;
      }
    }

    this.mcpManager.addServer({
      name,
      url,
      headers,
      enabled: true
    });

    this.hideAddServerForm();
    this.render();
  }

  private async refreshTools(): Promise<void> {
    if (this.onRefreshCallback) {
      this.onRefreshCallback();
    }
  }
}
