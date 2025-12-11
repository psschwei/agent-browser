# Browser AI Agent Framework - Design Plan

## Overview
A lightweight, browser-native framework for running AI agents using a ReAct (Reasoning + Acting) loop. Agents run entirely in the browser, making HTTP calls to LLM providers and tool servers as needed.

## Key Requirements
- **Browser-first**: Everything runs in the browser, no server-side dependencies required
- **Provider-agnostic**: Use LiteLLM or OpenRouter gateway for multiple LLM providers
- **Interactive playground**: UI for chatting with agents and seeing their reasoning
- **Custom tools**: Easy plugin system for JavaScript/TypeScript functions
- **Persistent state**: Conversations saved to browser storage (localStorage)
- **Future-ready**: Architecture that can later support MCP servers, web scraping, browser APIs

## Technology Stack
- **Language**: TypeScript
- **Bundler**: Vite (fast dev server, small production bundles)
- **UI**: Vanilla HTML/CSS/JavaScript (no framework dependency)
- **State**: localStorage (simple JSON serialization)
- **LLM API**: OpenAI-compatible REST APIs (batch responses for v1)

## Architecture

### Project Structure
```
agent-browser/
├── src/
│   ├── core/
│   │   ├── agent.ts          # Main ReAct loop implementation
│   │   ├── llm-client.ts     # HTTP client for LLM gateway
│   │   ├── tool-manager.ts   # Tool registration & execution
│   │   └── state-manager.ts  # localStorage persistence
│   ├── ui/
│   │   ├── playground.ts     # Main UI controller
│   │   └── styles.css        # Playground styles
│   ├── tools/
│   │   └── examples.ts       # Example tool implementations
│   └── main.ts               # Entry point
├── index.html                # Playground HTML
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

### Core Components

#### 1. Tool System
Simple interface for defining and executing tools:

```typescript
interface Tool {
  name: string;
  description: string;
  parameters: ToolParameter[];
  execute: (params: Record<string, any>) => Promise<any>;
}

interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required?: boolean;
}
```

**Tool Manager** responsibilities:
- Register tools: `toolManager.register(tool)`
- Execute tools: `toolManager.execute(toolName, params)`
- Convert tools to LLM tool schema format
- Handle errors and timeouts

**Example tools to include**:
- Calculator (basic math operations)
- Web fetch (make HTTP requests)
- Current time/date
- Random number generator

#### 2. LLM Client
HTTP client for OpenAI-compatible APIs:

```typescript
interface LLMConfig {
  endpoint: string;      // e.g., "https://api.openai.com/v1" or LiteLLM proxy
  apiKey: string;
  model: string;         // e.g., "gpt-4", "claude-3-5-sonnet-20241022"
}

interface LLMClient {
  chat(messages: Message[], tools?: Tool[]): Promise<LLMResponse>;
}
```

**Features**:
- Configurable endpoint and API key
- Support for tool/function calling
- Error handling and retries
- Response parsing

#### 3. ReAct Agent Loop
Core agent implementation:

```typescript
class Agent {
  constructor(llmClient: LLMClient, toolManager: ToolManager);

  async run(userMessage: string, maxIterations?: number): Promise<void>;

  // Event hooks for UI updates
  on(event: 'thinking' | 'tool_call' | 'observation' | 'complete',
     callback: Function): void;
}
```

**ReAct Loop Flow**:
1. **Think**: Send conversation history to LLM with available tools
2. **Act**: If LLM returns tool calls, execute them via ToolManager
3. **Observe**: Add tool results to conversation history
4. **Repeat**: Continue until LLM returns final answer or max iterations reached

**Safety limits**:
- Max iterations (default: 10) to prevent infinite loops
- Tool execution timeout
- Error handling for failed tool calls

#### 4. State Management
Simple localStorage-based persistence:

```typescript
interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

class StateManager {
  saveConversation(conversation: Conversation): void;
  loadConversation(id: string): Conversation | null;
  listConversations(): Conversation[];
  deleteConversation(id: string): void;
  exportConversation(id: string): string; // JSON export
}
```

**Storage strategy**:
- Each conversation stored as separate localStorage key
- Index stored for quick listing
- Auto-save after each agent response
- Export/import as JSON for portability

#### 5. Playground UI
Interactive demo interface:

**Components**:
- **Chat area**: Display messages (user, assistant, tool calls)
- **Input box**: User message entry
- **Settings panel**: Configure API key, endpoint, model
- **Tool log**: Expandable view of tool executions
- **Conversation list**: Load previous sessions

**Visual design**:
- Clean, terminal-like aesthetic
- Color coding: user (blue), assistant (green), tools (yellow), errors (red)
- Real-time updates during agent execution
- Loading states and progress indicators

## Implementation Phases

### Phase 1: Core Framework (MVP)
1. Set up TypeScript + Vite project
2. Implement Tool interface and ToolManager
3. Build LLM client with OpenAI-compatible API support
4. Create ReAct agent loop with tool calling
5. Add localStorage state management
6. Include 2-3 example tools (calculator, fetch, time)

### Phase 2: Playground UI
1. Create HTML structure and CSS styles
2. Build chat interface with message rendering
3. Add settings panel for API configuration
4. Implement tool execution visualization
5. Add conversation persistence UI

### Phase 3: Documentation & Polish
1. Write comprehensive README
2. Add inline code documentation
3. Create example usage snippets
4. Test with different LLM providers

### Phase 4: Future Enhancements
- MCP server integration
- Browser API tools (DOM manipulation, localStorage access)
- Web scraping/navigation tools (using fetch + parsing)
- Streaming LLM responses
- Multi-agent support
- Chrome extension packaging
- WASM for performance-critical operations

## Design Decisions

### Why batch responses?
Streaming adds complexity in parsing tool calls. Starting with batch keeps the implementation simple and we can add streaming later.

### Why localStorage over IndexedDB?
For conversation history, localStorage is sufficient and much simpler. We can migrate to IndexedDB if we need to store large amounts of data (e.g., embeddings, large tool outputs).

### Why vanilla JS for UI?
Keeps the bundle small and the code approachable. Developers can easily understand and modify it without learning a framework. The agent core is framework-agnostic anyway.

### How to handle MCP later?
The Tool interface is designed to be compatible with MCP schemas. We'll add an MCP adapter that:
1. Fetches tool schemas from MCP server
2. Converts them to our Tool format
3. Proxies tool executions to the MCP server

### How to support multiple agents?
Each agent instance is independent with its own state. To run multiple agents:
```typescript
const agent1 = new Agent(llmClient1, toolManager1);
const agent2 = new Agent(llmClient2, toolManager2);

// Run in parallel
await Promise.all([
  agent1.run("Task 1"),
  agent2.run("Task 2")
]);
```

## API Examples

### Basic Usage
```typescript
// Configure LLM client
const llmClient = new LLMClient({
  endpoint: 'https://openrouter.ai/api/v1',
  apiKey: 'your-key',
  model: 'anthropic/claude-3-5-sonnet'
});

// Set up tools
const toolManager = new ToolManager();
toolManager.register({
  name: 'calculator',
  description: 'Perform basic math operations',
  parameters: [
    { name: 'operation', type: 'string', description: 'Operation: add, subtract, multiply, divide', required: true },
    { name: 'a', type: 'number', description: 'First number', required: true },
    { name: 'b', type: 'number', description: 'Second number', required: true }
  ],
  execute: async ({ operation, a, b }) => {
    switch (operation) {
      case 'add': return a + b;
      case 'subtract': return a - b;
      case 'multiply': return a * b;
      case 'divide': return a / b;
      default: throw new Error('Invalid operation');
    }
  }
});

// Create and run agent
const agent = new Agent(llmClient, toolManager);

// Listen to events
agent.on('thinking', (message) => console.log('Agent thinking:', message));
agent.on('tool_call', (tool, params) => console.log('Calling tool:', tool, params));
agent.on('observation', (result) => console.log('Tool result:', result));
agent.on('complete', (answer) => console.log('Final answer:', answer));

// Run the agent
await agent.run('What is 15 multiplied by 23?');
```

### Custom Tool Example
```typescript
// Weather tool (calls external API)
toolManager.register({
  name: 'get_weather',
  description: 'Get current weather for a location',
  parameters: [
    { name: 'location', type: 'string', description: 'City name', required: true }
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
});
```

## Success Criteria
- [ ] Agent can successfully execute multi-step tasks using tools
- [ ] Works with at least 2 different LLM providers (via OpenRouter/LiteLLM)
- [ ] Playground UI is functional and intuitive
- [ ] Conversations persist across browser sessions
- [ ] Bundle size < 100KB (gzipped)
- [ ] Clear documentation and examples
- [ ] No server-side dependencies required to run

## Open Questions
1. Should we support image inputs for multimodal models?
2. Do we need a way to cancel running agents?
3. Should tools be able to call other tools?
4. How do we handle rate limiting from LLM providers?
5. Should we add telemetry/debugging tools?
