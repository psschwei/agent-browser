/**
 * Agent Browser - Browser-native AI agent framework
 *
 * Main entry point for the library
 */

// Export core types
export * from './core/types';

// Export core classes
export { Agent } from './core/agent';
export { LLMClient } from './core/llm-client';
export { ToolManager } from './core/tool-manager';
export { StateManager } from './core/state-manager';

// Export example tools
export {
  calculatorTool,
  currentTimeTool,
  webFetchTool,
  randomNumberTool,
  getExampleTools
} from './tools/examples';

// Export MCP classes
export { MCPManager } from './core/mcp-manager';
export { MCPClient } from './core/mcp-client';
export * from './core/mcp-types';
