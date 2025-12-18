# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Agent Browser is a browser-native AI agent framework implementing the ReAct (Reasoning + Acting) loop pattern. It runs entirely in the browser with no server-side dependencies, supports custom tools, MCP integration, and ships both as a library and as a portable userscript for web automation.

## Build Commands

```bash
# Development server (runs playground UI)
npm run dev

# Build library (outputs to dist/)
npm run build

# Build userscript (outputs to userscript-dist/)
npm run build:userscript

# Preview production build
npm run preview
```

The TypeScript compiler runs before each build via `tsc && vite build`.

## Core Architecture

### ReAct Loop Implementation

The agent follows a Think-Act-Observe loop in `src/core/agent.ts:58-146`:
1. **Think**: Send conversation history + available tools to LLM
2. **Act**: Execute any tool calls returned by LLM
3. **Observe**: Add tool results to conversation history
4. **Repeat**: Continue until task completes or max iterations reached (default: 10)

The agent emits events (`thinking`, `tool_call`, `observation`, `complete`, `error`) throughout execution, enabling real-time UI updates.

### Tool System

Tools are defined in `src/core/types.ts:14-24` with a simple interface:
- `name`, `description`, `parameters[]` - Tool metadata
- `execute(params)` - Async function that performs the tool action
- Optional MCP metadata (`source`, `serverId`, `serverName`)

`ToolManager` (`src/core/tool-manager.ts`) handles:
- Tool registration/unregistration
- Parameter validation and execution
- Conversion to OpenAI function calling format

### MCP Integration

Model Context Protocol support enables dynamic tool loading from HTTP-based MCP servers:
- `MCPClient` (`src/core/mcp-client.ts`) - JSON-RPC 2.0 client for HTTP MCP servers
- `MCPManager` (`src/core/mcp-manager.ts`) - Multi-server management, tool loading, connection testing
- Browser-only limitation: Only HTTP/HTTPS endpoints supported (no stdio)

MCP tools are automatically tagged with `source: 'mcp'` metadata when loaded.

### State Management

`StateManager` (`src/core/state-manager.ts`) persists conversations to localStorage:
- Each conversation has unique ID, title, messages array, timestamps
- Supports create, load, save, delete, list operations
- Export/import as JSON for conversation portability

## Project Structure

```
src/
├── core/              # Framework core
│   ├── types.ts       # TypeScript type definitions
│   ├── agent.ts       # ReAct agent implementation
│   ├── llm-client.ts  # OpenAI-compatible API client
│   ├── tool-manager.ts      # Tool registry & execution
│   ├── state-manager.ts     # localStorage persistence
│   ├── mcp-types.ts         # MCP protocol types
│   ├── mcp-client.ts        # MCP JSON-RPC client
│   └── mcp-manager.ts       # MCP server management
├── ui/                # Playground UI components
│   ├── playground.ts  # Main playground controller
│   ├── mcp-settings.ts      # MCP server UI
│   └── styles.css     # Playground styles
├── tools/
│   └── examples.ts    # Built-in tools (calculator, time, fetch, random)
└── main.ts            # Library entry point (exports public API)

userscript/            # Userscript for web automation
├── main.ts            # Userscript entry point & initialization
├── dom-tools.ts       # 10 DOM manipulation tools
├── ui.ts              # Floating overlay UI
└── config.ts          # Config storage via GM_setValue

scripts/
└── add-userscript-header.js  # Adds Tampermonkey metadata header

index.html             # Playground HTML
vite.config.ts         # Library build config
vite.config.userscript.ts     # Userscript build (IIFE format)
```

## Userscript Architecture

The userscript (`userscript/main.ts`) provides a complete AI agent that runs on any webpage:
- **Activation**: Floating button (bottom-right), keyboard shortcut (Ctrl+Shift+A), or Tampermonkey menu
- **DOM Tools**: 10 tools for page interaction (query_selector, click_element, fill_form_field, navigate, etc.)
- **Config**: API key stored via Tampermonkey storage APIs (GM_setValue/GM_getValue)
- **Build**: Bundles as IIFE format, then `scripts/add-userscript-header.js` prepends Tampermonkey metadata

When building userscript, ensure the header script properly adds `@name`, `@match`, `@grant` directives.

## LLM Client

`LLMClient` (`src/core/llm-client.ts`) is provider-agnostic, supporting any OpenAI-compatible API:
- OpenAI: `https://api.openai.com/v1`
- OpenRouter: `https://openrouter.ai/api/v1`
- LiteLLM proxy: `http://localhost:8000`

The client handles:
- Chat completions with function calling (tools parameter)
- Message history management
- Error handling and retries
- Config updates without recreating instance

## TypeScript Configuration

Uses strict mode with bundler module resolution. Key settings:
- Target: ES2020
- Strict type checking enabled
- Declaration files emitted to `dist/`
- No unused locals/parameters allowed

## Development Notes

- All code is browser-native JavaScript/TypeScript - no Node.js runtime required
- The playground (`index.html` + `src/ui/`) provides interactive testing without writing code
- Tools can be async and return any JSON-serializable value
- Message history grows with each ReAct iteration - consider truncation for long conversations
- MCP servers must use HTTP transport (browser limitation prevents stdio communication)
