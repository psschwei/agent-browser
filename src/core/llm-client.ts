import { LLMConfig, Message, LLMResponse } from './types';

/**
 * Client for interacting with OpenAI-compatible LLM APIs
 */
export class LLMClient {
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<LLMConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Send a chat request to the LLM
   */
  async chat(messages: Message[], tools?: any[]): Promise<LLMResponse> {
    const requestBody: any = {
      model: this.config.model,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        ...(msg.tool_calls && { tool_calls: msg.tool_calls }),
        ...(msg.tool_call_id && { tool_call_id: msg.tool_call_id }),
        ...(msg.name && { name: msg.name })
      }))
    };

    if (tools && tools.length > 0) {
      requestBody.tools = tools;
    }

    try {
      const response = await fetch(`${this.config.endpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`LLM API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();

      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from LLM');
      }

      const choice = data.choices[0];
      const message: Message = {
        role: 'assistant',
        content: choice.message.content || '',
        ...(choice.message.tool_calls && { tool_calls: choice.message.tool_calls })
      };

      return {
        message,
        finish_reason: choice.finish_reason
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Failed to communicate with LLM: ${String(error)}`);
    }
  }

  /**
   * Get current configuration (without API key for security)
   */
  getConfig(): Omit<LLMConfig, 'apiKey'> {
    return {
      endpoint: this.config.endpoint,
      model: this.config.model
    };
  }
}
