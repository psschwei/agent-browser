import { Tool } from '../core/types';

/**
 * Calculator tool for basic arithmetic operations
 */
export const calculatorTool: Tool = {
  name: 'calculator',
  description: 'Perform basic arithmetic operations (add, subtract, multiply, divide)',
  parameters: [
    {
      name: 'operation',
      type: 'string',
      description: 'The operation to perform: add, subtract, multiply, or divide',
      required: true
    },
    {
      name: 'a',
      type: 'number',
      description: 'First number',
      required: true
    },
    {
      name: 'b',
      type: 'number',
      description: 'Second number',
      required: true
    }
  ],
  execute: async ({ operation, a, b }) => {
    const numA = Number(a);
    const numB = Number(b);

    if (isNaN(numA) || isNaN(numB)) {
      throw new Error('Both a and b must be valid numbers');
    }

    switch (operation) {
      case 'add':
        return { result: numA + numB };
      case 'subtract':
        return { result: numA - numB };
      case 'multiply':
        return { result: numA * numB };
      case 'divide':
        if (numB === 0) {
          throw new Error('Cannot divide by zero');
        }
        return { result: numA / numB };
      default:
        throw new Error(`Unknown operation: ${operation}. Use add, subtract, multiply, or divide`);
    }
  }
};

/**
 * Current time tool
 */
export const currentTimeTool: Tool = {
  name: 'get_current_time',
  description: 'Get the current date and time',
  parameters: [
    {
      name: 'timezone',
      type: 'string',
      description: 'Optional timezone (e.g., "America/New_York"). Defaults to local timezone.',
      required: false
    }
  ],
  execute: async ({ timezone }) => {
    const now = new Date();

    if (timezone) {
      try {
        return {
          datetime: now.toLocaleString('en-US', { timeZone: timezone }),
          timezone,
          timestamp: now.getTime()
        };
      } catch (error) {
        throw new Error(`Invalid timezone: ${timezone}`);
      }
    }

    return {
      datetime: now.toLocaleString(),
      timestamp: now.getTime(),
      iso: now.toISOString()
    };
  }
};

/**
 * Web fetch tool for making HTTP requests
 */
export const webFetchTool: Tool = {
  name: 'web_fetch',
  description: 'Fetch content from a URL (supports GET requests)',
  parameters: [
    {
      name: 'url',
      type: 'string',
      description: 'The URL to fetch',
      required: true
    },
    {
      name: 'method',
      type: 'string',
      description: 'HTTP method (GET, POST). Default: GET',
      required: false
    }
  ],
  execute: async ({ url, method = 'GET' }) => {
    try {
      const response = await fetch(url, { method });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      let data;

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      return {
        status: response.status,
        statusText: response.statusText,
        contentType,
        data
      };
    } catch (error) {
      throw new Error(`Failed to fetch ${url}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
};

/**
 * Random number generator tool
 */
export const randomNumberTool: Tool = {
  name: 'random_number',
  description: 'Generate a random number within a specified range',
  parameters: [
    {
      name: 'min',
      type: 'number',
      description: 'Minimum value (inclusive)',
      required: true
    },
    {
      name: 'max',
      type: 'number',
      description: 'Maximum value (inclusive)',
      required: true
    }
  ],
  execute: async ({ min, max }) => {
    const minNum = Number(min);
    const maxNum = Number(max);

    if (isNaN(minNum) || isNaN(maxNum)) {
      throw new Error('Both min and max must be valid numbers');
    }

    if (minNum > maxNum) {
      throw new Error('min must be less than or equal to max');
    }

    const result = Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;
    return { result };
  }
};

/**
 * Get all example tools
 */
export function getExampleTools(): Tool[] {
  return [
    calculatorTool,
    currentTimeTool,
    webFetchTool,
    randomNumberTool
  ];
}
