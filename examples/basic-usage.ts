/**
 * Basic usage example for Agent Browser
 *
 * This example shows how to:
 * 1. Set up an LLM client
 * 2. Register tools
 * 3. Create and run an agent
 * 4. Listen to agent events
 */

import { Agent, LLMClient, ToolManager, getExampleTools, Tool } from '../src/main';

async function main() {
  console.log('Agent Browser - Basic Usage Example\n');

  // 1. Configure LLM client
  // Replace with your actual API endpoint and key
  const llmClient = new LLMClient({
    endpoint: 'https://api.openai.com/v1',
    apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here',
    model: 'gpt-4'
  });

  // 2. Set up tools
  const toolManager = new ToolManager();

  // Register all example tools
  getExampleTools().forEach(tool => {
    console.log(`Registered tool: ${tool.name}`);
    toolManager.register(tool);
  });

  // Optionally, register custom tools
  const customTool: Tool = {
    name: 'reverse_string',
    description: 'Reverse a string',
    parameters: [
      {
        name: 'text',
        type: 'string',
        description: 'The text to reverse',
        required: true
      }
    ],
    execute: async ({ text }) => {
      return { result: text.split('').reverse().join('') };
    }
  };
  toolManager.register(customTool);
  console.log(`Registered custom tool: ${customTool.name}\n`);

  // 3. Create agent
  const agent = new Agent(llmClient, toolManager);

  // 4. Listen to agent events
  agent.on('thinking', (data) => {
    console.log(`\n[THINKING] Iteration ${data.iteration}`);
  });

  agent.on('tool_call', (data) => {
    console.log(`\n[TOOL CALL] ${data.name}`);
    console.log(`Parameters:`, JSON.stringify(data.params, null, 2));
  });

  agent.on('observation', (data) => {
    console.log(`\n[OBSERVATION] Result from ${data.name}`);
    console.log(`Result:`, JSON.stringify(data.result, null, 2));
  });

  agent.on('error', (data) => {
    console.error(`\n[ERROR]`, data.error);
  });

  agent.on('complete', (data) => {
    console.log(`\n[COMPLETE] Task finished in ${data.iterations} iteration(s)`);
  });

  // 5. Run the agent with different tasks
  try {
    // Example 1: Math calculation
    console.log('\n=== Example 1: Math Calculation ===');
    const answer1 = await agent.run('What is 156 multiplied by 23?');
    console.log(`\nFinal Answer: ${answer1}\n`);

    // Clear messages for next task
    agent.clearMessages();

    // Example 2: Current time
    console.log('\n=== Example 2: Current Time ===');
    const answer2 = await agent.run('What is the current time?');
    console.log(`\nFinal Answer: ${answer2}\n`);

    // Clear messages for next task
    agent.clearMessages();

    // Example 3: Multiple tools
    console.log('\n=== Example 3: Using Multiple Tools ===');
    const answer3 = await agent.run(
      'Generate a random number between 1 and 100, then multiply it by 5'
    );
    console.log(`\nFinal Answer: ${answer3}\n`);

    // Clear messages for next task
    agent.clearMessages();

    // Example 4: Custom tool
    console.log('\n=== Example 4: Custom Tool ===');
    const answer4 = await agent.run('Reverse the string "Hello World"');
    console.log(`\nFinal Answer: ${answer4}\n`);

  } catch (error) {
    console.error('Error running agent:', error);
  }

  // 6. View conversation history
  console.log('\n=== Conversation History ===');
  const messages = agent.getMessages();
  console.log(`Total messages in last conversation: ${messages.length}`);
}

// Run the example
main().catch(console.error);
