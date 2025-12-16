/**
 * Core type definitions for the agent framework
 */

export type ToolParameterType = 'string' | 'number' | 'boolean' | 'object' | 'array';

export interface ToolParameter {
  name: string;
  type: ToolParameterType;
  description: string;
  required?: boolean;
}

export interface Tool {
  name: string;
  description: string;
  parameters: ToolParameter[];
  execute: (params: Record<string, any>) => Promise<any>;

  // MCP metadata (optional, only present for MCP tools)
  source?: 'local' | 'mcp';
  serverId?: string;
  serverName?: string;
}

export interface Message {
  role: 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface LLMResponse {
  message: Message;
  finish_reason: 'stop' | 'tool_calls' | 'length';
}

export interface LLMConfig {
  endpoint: string;
  apiKey: string;
  model: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export type AgentEvent = 'thinking' | 'tool_call' | 'observation' | 'complete' | 'error';

export type AgentEventCallback = (data: any) => void;
