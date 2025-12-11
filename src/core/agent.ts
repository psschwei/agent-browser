import { LLMClient } from './llm-client';
import { ToolManager } from './tool-manager';
import { Message, AgentEvent, AgentEventCallback } from './types';

/**
 * ReAct agent that can use tools to accomplish tasks
 */
export class Agent {
  private llmClient: LLMClient;
  private toolManager: ToolManager;
  private messages: Message[] = [];
  private eventListeners: Map<AgentEvent, AgentEventCallback[]> = new Map();
  private maxIterations: number = 10;

  constructor(llmClient: LLMClient, toolManager: ToolManager) {
    this.llmClient = llmClient;
    this.toolManager = toolManager;
  }

  /**
   * Register an event listener
   */
  on(event: AgentEvent, callback: AgentEventCallback): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * Emit an event to all listeners
   */
  private emit(event: AgentEvent, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  /**
   * Run the agent with a user message
   */
  async run(userMessage: string, maxIterations?: number): Promise<string> {
    if (maxIterations) {
      this.maxIterations = maxIterations;
    }

    // Add user message to conversation
    this.messages.push({
      role: 'user',
      content: userMessage
    });

    let iteration = 0;
    let finalAnswer = '';

    try {
      while (iteration < this.maxIterations) {
        iteration++;

        // Think: Get response from LLM
        this.emit('thinking', { iteration, messages: this.messages });

        const tools = this.toolManager.toOpenAIFormat();
        const response = await this.llmClient.chat(this.messages, tools);

        // Add assistant message to conversation
        this.messages.push(response.message);

        // Check if we're done
        if (response.finish_reason === 'stop' || !response.message.tool_calls) {
          finalAnswer = response.message.content;
          this.emit('complete', { answer: finalAnswer, iterations: iteration });
          break;
        }

        // Act: Execute tool calls
        if (response.message.tool_calls && response.message.tool_calls.length > 0) {
          for (const toolCall of response.message.tool_calls) {
            const toolName = toolCall.function.name;
            let toolParams: Record<string, any> = {};

            try {
              toolParams = JSON.parse(toolCall.function.arguments);
            } catch (error) {
              this.emit('error', {
                error: `Failed to parse tool arguments for ${toolName}`,
                toolCall
              });

              // Add error result to conversation
              this.messages.push({
                role: 'tool',
                tool_call_id: toolCall.id,
                name: toolName,
                content: JSON.stringify({
                  error: 'Failed to parse tool arguments',
                  raw_arguments: toolCall.function.arguments
                })
              });
              continue;
            }

            this.emit('tool_call', {
              name: toolName,
              params: toolParams,
              id: toolCall.id
            });

            try {
              // Observe: Get tool result
              const result = await this.toolManager.execute(toolName, toolParams);

              this.emit('observation', {
                name: toolName,
                result,
                id: toolCall.id
              });

              // Add tool result to conversation
              this.messages.push({
                role: 'tool',
                tool_call_id: toolCall.id,
                name: toolName,
                content: typeof result === 'string' ? result : JSON.stringify(result)
              });
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : String(error);

              this.emit('error', {
                error: errorMessage,
                tool: toolName,
                params: toolParams
              });

              // Add error result to conversation
              this.messages.push({
                role: 'tool',
                tool_call_id: toolCall.id,
                name: toolName,
                content: JSON.stringify({ error: errorMessage })
              });
            }
          }
        }
      }

      if (iteration >= this.maxIterations && !finalAnswer) {
        const maxIterError = 'Maximum iterations reached without completing task';
        this.emit('error', { error: maxIterError });
        finalAnswer = 'I was unable to complete the task within the maximum number of iterations.';
      }

      return finalAnswer;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.emit('error', { error: errorMessage });
      throw error;
    }
  }

  /**
   * Get conversation history
   */
  getMessages(): Message[] {
    return [...this.messages];
  }

  /**
   * Clear conversation history
   */
  clearMessages(): void {
    this.messages = [];
  }

  /**
   * Load conversation history
   */
  loadMessages(messages: Message[]): void {
    this.messages = [...messages];
  }

  /**
   * Set max iterations
   */
  setMaxIterations(max: number): void {
    this.maxIterations = max;
  }
}
