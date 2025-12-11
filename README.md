# Agent Browser

A lightweight, browser-native AI agent framework using the ReAct (Reasoning + Acting) loop pattern. Run autonomous AI agents entirely in your browser with support for custom tools and multiple LLM providers.

## Features

- **Browser-native**: Everything runs in the browser, no server-side dependencies
- **ReAct Loop**: Implements the proven Reasoning + Acting pattern for autonomous task completion
- **Provider-agnostic**: Works with any OpenAI-compatible API (OpenRouter, LiteLLM, OpenAI, etc.)
- **Custom Tools**: Easy-to-use plugin system for JavaScript/TypeScript functions
- **Persistent State**: Conversations automatically saved to browser localStorage
- **Interactive Playground**: Built-in UI for testing and chatting with agents
- **TypeScript**: Fully typed for excellent developer experience
- **Lightweight**: Small bundle size, fast load times

## Quick Start

### Installation

```bash
npm install
```

### Run the Playground

```bash
npm run dev
```

Open your browser to the URL shown (typically http://localhost:5173)

### Configure Your API

1. Click the ⚙️ Settings button
2. Enter your API configuration:
   - **API Endpoint**: Your LLM API endpoint (e.g., `https://api.openai.com/v1` or `https://openrouter.ai/api/v1`)
   - **API Key**: Your API key
   - **Model**: Model name (e.g., `gpt-4`, `anthropic/claude-3-5-sonnet-20241022`)
3. Click "Save Settings"

### Start Chatting

Type a message and watch the agent use tools to complete tasks!

Example prompts:
- "What is 156 multiplied by 23?"
- "Get the current time in Tokyo"
- "Generate 5 random numbers between 1 and 100"

## Using as a Library

### Basic Usage

```typescript
import { Agent, LLMClient, ToolManager, getExampleTools } from 'agent-browser';

// Configure LLM client
const llmClient = new LLMClient({
  endpoint: 'https://api.openai.com/v1',
  apiKey: 'your-api-key',
  model: 'gpt-4'
});

// Set up tools
const toolManager = new ToolManager();
getExampleTools().forEach(tool => toolManager.register(tool));

// Create agent
const agent = new Agent(llmClient, toolManager);

// Listen to events
agent.on('thinking', (data) => console.log('Thinking...', data));
agent.on('tool_call', (data) => console.log('Calling tool:', data));
agent.on('observation', (data) => console.log('Tool result:', data));
agent.on('complete', (data) => console.log('Done:', data));

// Run the agent
const answer = await agent.run('What is 25 times 17?');
console.log(answer);
```

### Creating Custom Tools

```typescript
import { Tool } from 'agent-browser';

const weatherTool: Tool = {
  name: 'get_weather',
  description: 'Get current weather for a location',
  parameters: [
    {
      name: 'location',
      type: 'string',
      description: 'City name',
      required: true
    }
  ],
  execute: async ({ location }) => {
    const response = await fetch(
      `https://api.weatherapi.com/v1/current.json?key=YOUR_KEY&q=${location}`
    );
    const data = await response.json();
    return {
      location: data.location.name,
      temperature: data.current.temp_c,
      condition: data.current.condition.text
    };
  }
};

toolManager.register(weatherTool);
```

### Managing Conversations

```typescript
import { StateManager } from 'agent-browser';

const stateManager = new StateManager();

// Create a new conversation
const conversation = stateManager.createConversation('My Chat');

// Save agent messages to conversation
conversation.messages = agent.getMessages();
conversation.updatedAt = Date.now();
stateManager.saveConversation(conversation);

// Load a conversation
const loaded = stateManager.loadConversation(conversation.id);
if (loaded) {
  agent.loadMessages(loaded.messages);
}

// List all conversations
const conversations = stateManager.listConversations();

// Export conversation
const json = stateManager.exportConversation(conversation.id);

// Import conversation
const imported = stateManager.importConversation(json);
```

## Built-in Tools

The framework includes several example tools:

### Calculator
Performs basic arithmetic operations (add, subtract, multiply, divide)

```typescript
// Example usage by agent:
"What is 156 + 234?"
```

### Current Time
Gets the current date and time, optionally in a specific timezone

```typescript
// Example usage by agent:
"What time is it in Tokyo?"
```

### Web Fetch
Fetches content from a URL (supports GET and POST)

```typescript
// Example usage by agent:
"Fetch data from https://api.example.com/data"
```

### Random Number
Generates random numbers within a specified range

```typescript
// Example usage by agent:
"Give me a random number between 1 and 100"
```

## Architecture

### ReAct Loop

The agent follows a simple but powerful loop:

1. **Think**: Send conversation history to LLM with available tools
2. **Act**: If LLM decides to use tools, execute them
3. **Observe**: Add tool results to conversation
4. **Repeat**: Continue until task is complete or max iterations reached

### Project Structure

```
agent-browser/
├── src/
│   ├── core/
│   │   ├── types.ts          # TypeScript type definitions
│   │   ├── agent.ts          # ReAct agent implementation
│   │   ├── llm-client.ts     # LLM API client
│   │   ├── tool-manager.ts   # Tool registration & execution
│   │   └── state-manager.ts  # localStorage persistence
│   ├── ui/
│   │   ├── playground.ts     # Playground UI controller
│   │   └── styles.css        # Playground styles
│   ├── tools/
│   │   └── examples.ts       # Built-in example tools
│   └── main.ts               # Library entry point
├── index.html                # Playground HTML
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## API Reference

### Agent

```typescript
class Agent {
  constructor(llmClient: LLMClient, toolManager: ToolManager)

  // Run the agent with a user message
  async run(userMessage: string, maxIterations?: number): Promise<string>

  // Event listeners
  on(event: AgentEvent, callback: AgentEventCallback): void

  // Conversation management
  getMessages(): Message[]
  clearMessages(): void
  loadMessages(messages: Message[]): void
  setMaxIterations(max: number): void
}
```

### LLMClient

```typescript
class LLMClient {
  constructor(config: LLMConfig)

  async chat(messages: Message[], tools?: any[]): Promise<LLMResponse>
  updateConfig(config: Partial<LLMConfig>): void
  getConfig(): Omit<LLMConfig, 'apiKey'>
}
```

### ToolManager

```typescript
class ToolManager {
  register(tool: Tool): void
  unregister(name: string): void
  async execute(name: string, params: Record<string, any>): Promise<any>
  getTools(): Tool[]
  getTool(name: string): Tool | undefined
  toOpenAIFormat(): any[]
}
```

### StateManager

```typescript
class StateManager {
  saveConversation(conversation: Conversation): void
  loadConversation(id: string): Conversation | null
  listConversations(): Array<{ id: string; title: string; updatedAt: number }>
  deleteConversation(id: string): void
  exportConversation(id: string): string | null
  importConversation(jsonData: string): Conversation | null
  createConversation(title?: string): Conversation
  clearAll(): void
}
```

## Building for Production

```bash
npm run build
```

This creates production-ready bundles in the `dist/` directory:
- `agent-browser.js` - ES module format
- `agent-browser.umd.js` - UMD format (for browsers and Node.js)

## LLM Provider Setup

### OpenAI

```typescript
const llmClient = new LLMClient({
  endpoint: 'https://api.openai.com/v1',
  apiKey: 'sk-...',
  model: 'gpt-4'
});
```

### Anthropic (via OpenRouter)

```typescript
const llmClient = new LLMClient({
  endpoint: 'https://openrouter.ai/api/v1',
  apiKey: 'sk-or-...',
  model: 'anthropic/claude-3-5-sonnet-20241022'
});
```

### LiteLLM Proxy

First, run a LiteLLM proxy server:

```bash
litellm --model gpt-4
```

Then connect:

```typescript
const llmClient = new LLMClient({
  endpoint: 'http://localhost:8000',
  apiKey: 'anything',
  model: 'gpt-4'
});
```

## Future Roadmap

- [ ] MCP (Model Context Protocol) server integration
- [ ] Browser API tools (DOM manipulation, localStorage access)
- [ ] Web scraping and navigation tools
- [ ] Streaming LLM responses
- [ ] Multi-agent orchestration
- [ ] Chrome extension packaging
- [ ] WASM for performance-critical operations
- [ ] Vector search and embeddings
- [ ] Vision and multimodal support

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## License

Apache-2.0

## Credits

Built with:
- [Vite](https://vitejs.dev/) - Fast build tool
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- Vanilla JavaScript - No framework dependencies

Inspired by:
- [ReAct paper](https://arxiv.org/abs/2210.03629) - Reasoning + Acting pattern
- [LangChain](https://www.langchain.com/) - Agent frameworks
- [AutoGPT](https://github.com/Significant-Gravitas/AutoGPT) - Autonomous agents
