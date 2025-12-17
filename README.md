# Agent Browser

A lightweight, browser-native AI agent framework using the ReAct (Reasoning + Acting) loop pattern. Run autonomous AI agents entirely in your browser with support for custom tools and multiple LLM providers.

## Features

- **Browser-native**: Everything runs in the browser, no server-side dependencies
- **ReAct Loop**: Implements the proven Reasoning + Acting pattern for autonomous task completion
- **Provider-agnostic**: Works with any OpenAI-compatible API (OpenRouter, LiteLLM, OpenAI, etc.)
- **Custom Tools**: Easy-to-use plugin system for JavaScript/TypeScript functions
- **MCP Integration**: Dynamic tool loading from Model Context Protocol (MCP) servers
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

## Userscript for Web Automation

Want to run AI agents on any website? Use the **portable userscript** version!

### Installation

1. **Install a userscript manager**:
   - [Tampermonkey](https://www.tampermonkey.net/) (Chrome, Firefox, Edge, Safari)
   - [Violentmonkey](https://violentmonkey.github.io/) (Chrome, Firefox, Edge)
   - [Greasemonkey](https://www.greasespot.net/) (Firefox)

2. **Build the userscript**:
   ```bash
   npm run build:userscript
   ```

3. **Install the userscript**:
   - Open `userscript-dist/agent-browser.user.js` in your browser
   - Your userscript manager will detect it and prompt to install
   - Or drag and drop the file into Tampermonkey dashboard

### Usage

Once installed, the userscript runs on every webpage:

1. **Floating Button**: Click the 🤖 button in the bottom-right corner
2. **Keyboard Shortcut**: Press `Ctrl+Shift+A` (or `Cmd+Shift+A` on Mac)
3. **Tampermonkey Menu**: Right-click the Tampermonkey icon → "Activate Agent"

### Configure API Key

First time setup:
1. Click Tampermonkey icon → "Configure API Key"
2. Enter your OpenAI API key
3. (Key is stored securely in Tampermonkey storage)

### DOM Automation Tools

The userscript includes 10 powerful DOM manipulation tools:

- **get_page_content** - Extract text, links, and headings from the page
- **query_selector** - Find elements by CSS selector and extract data
- **click_element** - Click buttons, links, or any clickable element
- **fill_form_field** - Fill input fields, textareas, and selects
- **submit_form** - Submit forms
- **get_attribute** - Get element attributes (href, src, class, etc.)
- **wait_for_element** - Wait for dynamic elements to appear
- **get_page_url** - Get current URL and path information
- **navigate** - Navigate to a different URL
- **take_screenshot** - Get element position and visibility info

### Example Use Cases

```
On Amazon.com:
"Find laptops under $1000 and show me the top 3 results"

On any website:
"Extract all email addresses from this page"
"Click the 'Sign Up' button and fill the form with test data"
"What are the main topics discussed on this page?"
"Navigate to the pricing page and tell me the cost of the Pro plan"
```

### Distribution

Share your userscript with others:

1. **Direct File**: Share `agent-browser.user.js` directly
2. **GitHub Pages**: Host on GitHub Pages for one-click install
3. **Greasyfork**: Publish to [Greasyfork.org](https://greasyfork.org) for public discovery
4. **Auto-updates**: Edit the `@updateURL` in the userscript header to enable automatic updates

### Customization

The userscript configuration is fully dynamic. Edit `userscript/main.ts` to:

- **Change model**: `model: 'gpt-4o-mini'` for faster/cheaper responses
- **Add system prompt**: Customize agent behavior
- **Select tools**: Register only the tools you need
- **Adjust max iterations**: Control how long the agent runs

Then rebuild with `npm run build:userscript`.

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

## MCP Integration

Agent Browser supports dynamic tool loading from [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) servers, allowing you to extend your agent's capabilities without writing code.

### Using MCP in the Playground

1. **Open Settings** (⚙️ button)
2. **Scroll to MCP Servers section**
3. **Add a Server**:
   - Click the ➕ button
   - Enter server name (e.g., "Weather Tools")
   - Enter server URL (e.g., `http://localhost:3000`)
   - Optionally add custom headers as JSON
   - Click "Test Connection" to verify
   - Click "Add Server"
4. **Enable/Disable Servers**: Toggle servers on/off with the switch
5. **Refresh Tools**: Click "Refresh MCP Tools" to reload from all enabled servers

### Using MCP Programmatically

```typescript
import { MCPManager, ToolManager, Agent, LLMClient } from 'agent-browser';

// Initialize managers
const toolManager = new ToolManager();
const mcpManager = new MCPManager();

// Add an MCP server
mcpManager.addServer({
  name: 'My MCP Server',
  url: 'http://localhost:3000',
  enabled: true,
  headers: {
    'Authorization': 'Bearer token123'  // Optional
  }
});

// Load tools from all enabled MCP servers
const result = await mcpManager.loadMCPTools(toolManager);
console.log(`Loaded ${result.loaded} tools`);

if (result.errors.length > 0) {
  console.error('Errors:', result.errors);
}

// Create agent with both built-in and MCP tools
const agent = new Agent(llmClient, toolManager);
```

### Testing MCP Connections

```typescript
// Test a server before adding it
const testResult = await mcpManager.testConnection(
  'http://localhost:3000',
  { 'Authorization': 'Bearer token' }  // Optional headers
);

if (testResult.success) {
  console.log(`Found ${testResult.toolCount} tools`);
} else {
  console.error(`Connection failed: ${testResult.error}`);
}
```

### MCP Server Requirements

- **HTTP/HTTPS Only**: Browser environment requires HTTP endpoints (no stdio support)
- **JSON-RPC 2.0**: Servers must implement the MCP protocol over HTTP
- **Supported Operations**:
  - `tools/list` - List available tools
  - `tools/call` - Execute a tool

### Creating an HTTP MCP Server

If you have an stdio-based MCP server, you can wrap it with HTTP:

```javascript
// server.js - Simple HTTP wrapper for MCP
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

app.post('/', async (req, res) => {
  const { method, params } = req.body;

  // Handle tools/list
  if (method === 'tools/list') {
    res.json({
      jsonrpc: '2.0',
      id: req.body.id,
      result: {
        tools: [
          {
            name: 'my_tool',
            description: 'Does something useful',
            inputSchema: {
              type: 'object',
              properties: {
                input: { type: 'string', description: 'Input text' }
              },
              required: ['input']
            }
          }
        ]
      }
    });
    return;
  }

  // Handle tools/call
  if (method === 'tools/call') {
    const { name, arguments: args } = params;

    // Execute your tool logic here
    const result = await executeMyTool(name, args);

    res.json({
      jsonrpc: '2.0',
      id: req.body.id,
      result: {
        content: [
          { type: 'text', text: JSON.stringify(result) }
        ]
      }
    });
    return;
  }

  res.status(400).json({ error: 'Unknown method' });
});

app.listen(3000, () => console.log('MCP server on http://localhost:3000'));
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
│   │   ├── state-manager.ts  # localStorage persistence
│   │   ├── mcp-types.ts      # MCP protocol type definitions
│   │   ├── mcp-client.ts     # MCP JSON-RPC client
│   │   └── mcp-manager.ts    # MCP server management
│   ├── ui/
│   │   ├── playground.ts     # Playground UI controller
│   │   ├── mcp-settings.ts   # MCP server management UI
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

### MCPManager

```typescript
class MCPManager {
  // Add a new MCP server
  addServer(config: Omit<MCPServerConfig, 'id' | 'createdAt'>): MCPServerConfig

  // Remove an MCP server
  removeServer(id: string): void

  // Update server configuration
  updateServer(id: string, updates: Partial<MCPServerConfig>): void

  // Get all servers
  getServers(): MCPServerConfig[]

  // Get enabled servers only
  getEnabledServers(): MCPServerConfig[]

  // Load tools from all enabled servers
  async loadMCPTools(toolManager: ToolManager): Promise<{
    loaded: number;
    errors: Array<{ serverId: string; serverName: string; error: string }>;
  }>

  // Remove all MCP tools from tool manager
  unloadMCPTools(toolManager: ToolManager): void

  // Test connection to a server
  async testConnection(url: string, headers?: Record<string, string>): Promise<{
    success: boolean;
    error?: string;
    toolCount?: number;
  }>
}
```

### MCPClient

```typescript
class MCPClient {
  constructor(url: string, headers?: Record<string, string>)

  // List all tools from the MCP server
  async listTools(): Promise<MCPToolSchema[]>

  // Execute a tool on the MCP server
  async callTool(name: string, args: Record<string, any>): Promise<MCPToolResult>

  // Test if server is reachable
  async ping(): Promise<boolean>
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

- [x] MCP (Model Context Protocol) server integration
- [x] Browser API tools (DOM manipulation, localStorage access)
- [x] Web scraping and navigation tools via userscript
- [x] Portable userscript for web automation
- [ ] Streaming LLM responses
- [ ] Multi-agent orchestration
- [ ] Chrome extension packaging (optional - userscript already works)
- [ ] WASM for performance-critical operations
- [ ] Vector search and embeddings
- [ ] Vision and multimodal support
- [ ] MCP resources and prompts support (beyond basic tool serving)

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
