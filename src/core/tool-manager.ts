import { Tool, ToolParameter } from './types';

/**
 * Manages tool registration and execution
 */
export class ToolManager {
  private tools: Map<string, Tool> = new Map();

  /**
   * Register a new tool
   */
  register(tool: Tool): void {
    if (this.tools.has(tool.name)) {
      // Allow re-registration if same source (for MCP refresh)
      const existing = this.tools.get(tool.name)!;
      if (existing.source !== tool.source) {
        throw new Error(
          `Tool '${tool.name}' is already registered from ${existing.source || 'local'} source`
        );
      }
    }
    this.tools.set(tool.name, tool);
  }

  /**
   * Unregister a tool
   */
  unregister(name: string): void {
    this.tools.delete(name);
  }

  /**
   * Execute a tool by name with given parameters
   */
  async execute(name: string, params: Record<string, any>): Promise<any> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool '${name}' not found`);
    }

    // Validate required parameters
    const missing = tool.parameters
      .filter(p => p.required && !(p.name in params))
      .map(p => p.name);

    if (missing.length > 0) {
      throw new Error(`Missing required parameters: ${missing.join(', ')}`);
    }

    try {
      return await tool.execute(params);
    } catch (error) {
      throw new Error(`Tool execution failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get all registered tools
   */
  getTools(): Tool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get a specific tool by name
   */
  getTool(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  /**
   * Convert tools to OpenAI function calling format
   */
  toOpenAIFormat(): any[] {
    return this.getTools().map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: {
          type: 'object',
          properties: tool.parameters.reduce((acc, param) => {
            acc[param.name] = {
              type: this.mapTypeToJSONSchema(param.type),
              description: param.description
            };
            return acc;
          }, {} as Record<string, any>),
          required: tool.parameters
            .filter(p => p.required)
            .map(p => p.name)
        }
      }
    }));
  }

  /**
   * Map our simple types to JSON Schema types
   */
  private mapTypeToJSONSchema(type: ToolParameter['type']): string {
    switch (type) {
      case 'string':
        return 'string';
      case 'number':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'object':
        return 'object';
      case 'array':
        return 'array';
      default:
        return 'string';
    }
  }
}
