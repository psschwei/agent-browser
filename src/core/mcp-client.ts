import { MCPRequest, MCPResponse, MCPToolSchema, MCPToolResult } from './mcp-types';

/**
 * MCP protocol communication client
 * Handles JSON-RPC 2.0 communication with MCP servers over HTTP
 */
export class MCPClient {
  private url: string;
  private headers: Record<string, string>;
  private requestId: number = 0;

  constructor(url: string, headers?: Record<string, string>) {
    this.url = url;
    this.headers = headers || {};
  }

  /**
   * Send JSON-RPC 2.0 request to MCP server
   */
  private async request(method: string, params?: any): Promise<any> {
    const request: MCPRequest = {
      jsonrpc: '2.0',
      id: ++this.requestId,
      method,
      params
    };

    const response = await fetch(this.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.headers
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`MCP request failed: ${response.status} ${response.statusText}`);
    }

    const data: MCPResponse = await response.json();

    if (data.error) {
      throw new Error(`MCP error: ${data.error.message} (code: ${data.error.code})`);
    }

    return data.result;
  }

  /**
   * List all available tools from MCP server
   */
  async listTools(): Promise<MCPToolSchema[]> {
    const result = await this.request('tools/list');
    return result.tools || [];
  }

  /**
   * Call a tool on the MCP server
   */
  async callTool(name: string, args: Record<string, any>): Promise<MCPToolResult> {
    const result = await this.request('tools/call', {
      name,
      arguments: args
    });
    return result;
  }

  /**
   * Test connection to MCP server
   */
  async ping(): Promise<boolean> {
    try {
      await this.listTools();
      return true;
    } catch (error) {
      return false;
    }
  }
}
