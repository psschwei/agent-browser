/**
 * MCP (Model Context Protocol) type definitions
 */

/**
 * MCP server configuration
 */
export interface MCPServerConfig {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  createdAt: number;
  headers?: Record<string, string>;
}

/**
 * MCP JSON-RPC 2.0 request
 */
export interface MCPRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: any;
}

/**
 * MCP JSON-RPC 2.0 response
 */
export interface MCPResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

/**
 * MCP tool schema (from list_tools response)
 */
export interface MCPToolSchema {
  name: string;
  description?: string;
  inputSchema: {
    type: 'object';
    properties?: Record<string, any>;
    required?: string[];
  };
}

/**
 * MCP tool call result (from call_tool response)
 */
export interface MCPToolResult {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}
