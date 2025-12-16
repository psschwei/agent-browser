import { MCPServerConfig, MCPToolSchema } from './mcp-types';
import { MCPClient } from './mcp-client';
import { Tool, ToolParameter } from './types';
import { ToolManager } from './tool-manager';

const STORAGE_KEY = 'agent-browser:mcp-servers';

/**
 * Manages MCP server configurations and tool loading
 */
export class MCPManager {
  private servers: Map<string, MCPServerConfig> = new Map();
  private clients: Map<string, MCPClient> = new Map();

  constructor() {
    this.loadServers();
  }

  /**
   * Add a new MCP server
   */
  addServer(config: Omit<MCPServerConfig, 'id' | 'createdAt'>): MCPServerConfig {
    const server: MCPServerConfig = {
      ...config,
      id: this.generateId(),
      createdAt: Date.now()
    };

    this.servers.set(server.id, server);
    this.saveServers();
    return server;
  }

  /**
   * Remove an MCP server
   */
  removeServer(id: string): void {
    this.servers.delete(id);
    this.clients.delete(id);
    this.saveServers();
  }

  /**
   * Update MCP server config
   */
  updateServer(id: string, updates: Partial<MCPServerConfig>): void {
    const server = this.servers.get(id);
    if (!server) {
      throw new Error(`Server ${id} not found`);
    }

    Object.assign(server, updates);
    this.saveServers();

    // Invalidate client if URL or headers changed
    if (updates.url || updates.headers) {
      this.clients.delete(id);
    }
  }

  /**
   * Get all servers
   */
  getServers(): MCPServerConfig[] {
    return Array.from(this.servers.values());
  }

  /**
   * Get enabled servers
   */
  getEnabledServers(): MCPServerConfig[] {
    return this.getServers().filter(s => s.enabled);
  }

  /**
   * Get MCP client for a server
   */
  private getClient(server: MCPServerConfig): MCPClient {
    if (!this.clients.has(server.id)) {
      this.clients.set(server.id, new MCPClient(server.url, server.headers));
    }
    return this.clients.get(server.id)!;
  }

  /**
   * Load tools from all enabled MCP servers into ToolManager
   */
  async loadMCPTools(toolManager: ToolManager): Promise<{
    loaded: number;
    errors: Array<{ serverId: string; serverName: string; error: string }>;
  }> {
    const enabledServers = this.getEnabledServers();
    let loaded = 0;
    const errors: Array<{ serverId: string; serverName: string; error: string }> = [];

    // First, unregister all existing MCP tools
    this.unloadMCPTools(toolManager);

    // Load tools from each server
    for (const server of enabledServers) {
      try {
        const client = this.getClient(server);
        const mcpTools = await client.listTools();

        for (const mcpTool of mcpTools) {
          const tool = this.convertMCPToolToTool(mcpTool, server, client);
          toolManager.register(tool);
          loaded++;
        }
      } catch (error) {
        errors.push({
          serverId: server.id,
          serverName: server.name,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return { loaded, errors };
  }

  /**
   * Unload all MCP tools from ToolManager
   */
  unloadMCPTools(toolManager: ToolManager): void {
    const tools = toolManager.getTools();
    tools.forEach(tool => {
      if (tool.source === 'mcp') {
        toolManager.unregister(tool.name);
      }
    });
  }

  /**
   * Convert MCP tool schema to our Tool interface
   */
  private convertMCPToolToTool(
    mcpTool: MCPToolSchema,
    server: MCPServerConfig,
    client: MCPClient
  ): Tool {
    const parameters: ToolParameter[] = [];

    if (mcpTool.inputSchema?.properties) {
      for (const [name, schema] of Object.entries(mcpTool.inputSchema.properties)) {
        const propSchema = schema as any;
        parameters.push({
          name,
          type: this.mapJSONSchemaTypeToToolType(propSchema.type),
          description: propSchema.description || '',
          required: mcpTool.inputSchema.required?.includes(name) || false
        });
      }
    }

    return {
      name: mcpTool.name,
      description: mcpTool.description || `MCP tool from ${server.name}`,
      parameters,
      execute: async (params: Record<string, any>) => {
        const result = await client.callTool(mcpTool.name, params);

        // Extract text content from MCP result
        if (result.isError) {
          const errorText = result.content.find(c => c.type === 'text')?.text;
          throw new Error(errorText || 'MCP tool execution failed');
        }

        // Return the first text content, or the full content array
        const textContent = result.content.find(c => c.type === 'text');
        if (textContent?.text) {
          try {
            return JSON.parse(textContent.text);
          } catch {
            return { result: textContent.text };
          }
        }

        return { content: result.content };
      },
      // Add metadata to identify this as an MCP tool
      source: 'mcp',
      serverId: server.id,
      serverName: server.name
    };
  }

  /**
   * Map JSON Schema type to our ToolParameter type
   */
  private mapJSONSchemaTypeToToolType(jsonType: string): ToolParameter['type'] {
    switch (jsonType) {
      case 'string': return 'string';
      case 'number':
      case 'integer': return 'number';
      case 'boolean': return 'boolean';
      case 'object': return 'object';
      case 'array': return 'array';
      default: return 'string';
    }
  }

  /**
   * Test connection to an MCP server
   */
  async testConnection(url: string, headers?: Record<string, string>): Promise<{
    success: boolean;
    error?: string;
    toolCount?: number;
  }> {
    try {
      const client = new MCPClient(url, headers);
      const tools = await client.listTools();
      return {
        success: true,
        toolCount: tools.length
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Load servers from localStorage
   */
  private loadServers(): void {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      try {
        const servers = JSON.parse(data) as MCPServerConfig[];
        servers.forEach(server => this.servers.set(server.id, server));
      } catch (error) {
        console.error('Failed to load MCP servers:', error);
      }
    }
  }

  /**
   * Save servers to localStorage
   */
  private saveServers(): void {
    const servers = Array.from(this.servers.values());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(servers));
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `mcp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
