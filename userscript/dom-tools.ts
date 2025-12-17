import { Tool } from '../src/core/types';

/**
 * Tool 1: Click Element
 * Click on an element using CSS selector
 */
export const clickElementTool: Tool = {
  name: 'click_element',
  description: 'Click on an element using CSS selector',
  parameters: [
    { name: 'selector', type: 'string', description: 'CSS selector for element to click', required: true }
  ],
  execute: async ({ selector }) => {
    const el = document.querySelector(selector);
    if (!el) throw new Error(`Element not found: ${selector}`);
    (el as HTMLElement).click();
    return { success: true, selector };
  }
};

/**
 * Tool 2: Query Selector
 * Find elements on page using CSS selector
 */
export const querySelectorTool: Tool = {
  name: 'query_selector',
  description: 'Find elements on page using CSS selector and extract information',
  parameters: [
    { name: 'selector', type: 'string', description: 'CSS selector to query', required: true },
    { name: 'extract', type: 'string', description: 'What to extract: text, html, or attribute name', required: false }
  ],
  execute: async ({ selector, extract = 'text' }) => {
    const elements = Array.from(document.querySelectorAll(selector));
    if (elements.length === 0) {
      return { count: 0, elements: [] };
    }

    const extracted = elements.map(el => {
      if (extract === 'text') return el.textContent?.trim();
      if (extract === 'html') return el.innerHTML;
      return (el as HTMLElement).getAttribute(extract);
    });

    return { count: elements.length, elements: extracted.filter(Boolean).slice(0, 20) }; // Limit to 20 results
  }
};

/**
 * Tool 3: Fill Form Field
 * Fill a form field with specified value
 */
export const fillFormFieldTool: Tool = {
  name: 'fill_form_field',
  description: 'Fill a form field (input, textarea, select) with specified value',
  parameters: [
    { name: 'selector', type: 'string', description: 'CSS selector for input field', required: true },
    { name: 'value', type: 'string', description: 'Value to fill', required: true }
  ],
  execute: async ({ selector, value }) => {
    const el = document.querySelector(selector) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    if (!el) throw new Error(`Element not found: ${selector}`);

    el.value = value;

    // Trigger events that frameworks might be listening to
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));

    return { success: true, selector, value };
  }
};

/**
 * Tool 4: Submit Form
 * Submit a form element
 */
export const submitFormTool: Tool = {
  name: 'submit_form',
  description: 'Submit a form on the page',
  parameters: [
    { name: 'selector', type: 'string', description: 'CSS selector for form element', required: true }
  ],
  execute: async ({ selector }) => {
    const form = document.querySelector(selector) as HTMLFormElement;
    if (!form) throw new Error(`Form not found: ${selector}`);
    if (form.tagName !== 'FORM') throw new Error(`Element is not a form: ${selector}`);

    form.submit();
    return { success: true, selector };
  }
};

/**
 * Tool 5: Get Attribute
 * Get attribute value from an element
 */
export const getAttributeTool: Tool = {
  name: 'get_attribute',
  description: 'Get attribute value from an element',
  parameters: [
    { name: 'selector', type: 'string', description: 'CSS selector for element', required: true },
    { name: 'attribute', type: 'string', description: 'Attribute name to retrieve (e.g., href, src, class)', required: true }
  ],
  execute: async ({ selector, attribute }) => {
    const el = document.querySelector(selector);
    if (!el) throw new Error(`Element not found: ${selector}`);

    const value = (el as HTMLElement).getAttribute(attribute);
    return { selector, attribute, value };
  }
};

/**
 * Tool 6: Wait for Element
 * Wait for element matching selector to appear on page
 */
export const waitForElementTool: Tool = {
  name: 'wait_for_element',
  description: 'Wait for element matching selector to appear on page',
  parameters: [
    { name: 'selector', type: 'string', description: 'CSS selector to wait for', required: true },
    { name: 'timeout', type: 'number', description: 'Max wait time in milliseconds (default: 5000)', required: false }
  ],
  execute: async ({ selector, timeout = 5000 }) => {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const el = document.querySelector(selector);
      if (el) {
        return { success: true, selector, found: true };
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    throw new Error(`Element not found within ${timeout}ms: ${selector}`);
  }
};

/**
 * Tool 7: Get Page URL
 * Get the current page URL
 */
export const getPageUrlTool: Tool = {
  name: 'get_page_url',
  description: 'Get the current page URL',
  parameters: [],
  execute: async () => {
    return {
      url: window.location.href,
      hostname: window.location.hostname,
      pathname: window.location.pathname,
      search: window.location.search
    };
  }
};

/**
 * Tool 8: Navigate
 * Navigate to a different URL
 */
export const navigateTool: Tool = {
  name: 'navigate',
  description: 'Navigate to a different URL',
  parameters: [
    { name: 'url', type: 'string', description: 'URL to navigate to (absolute or relative)', required: true }
  ],
  execute: async ({ url }) => {
    window.location.href = url;
    return { success: true, url };
  }
};

/**
 * Tool 9: Get Page Content
 * Extract readable content from current page
 */
export const getPageContentTool: Tool = {
  name: 'get_page_content',
  description: 'Extract readable content, title, and metadata from current page',
  parameters: [
    { name: 'selector', type: 'string', description: 'Optional CSS selector to scope content extraction', required: false }
  ],
  execute: async ({ selector }) => {
    const target = selector ? document.querySelector(selector) : document.body;
    if (!target) throw new Error('Target element not found');

    // Extract main content
    const text = target.textContent?.trim().slice(0, 10000); // Limit to 10k chars

    // Extract links
    const links = Array.from(target.querySelectorAll('a'))
      .map(a => ({
        text: a.textContent?.trim(),
        href: a.href
      }))
      .filter(link => link.text && link.href)
      .slice(0, 50); // Limit to 50 links

    // Extract headings
    const headings = Array.from(target.querySelectorAll('h1, h2, h3'))
      .map(h => ({
        level: h.tagName,
        text: h.textContent?.trim()
      }))
      .filter(h => h.text)
      .slice(0, 20); // Limit to 20 headings

    return {
      title: document.title,
      url: window.location.href,
      text,
      links,
      headings
    };
  }
};

/**
 * Tool 10: Take Screenshot
 * Take screenshot of page or specific element (returns data URL)
 * Note: This is a simplified version - full screenshot would require browser APIs
 */
export const screenshotTool: Tool = {
  name: 'take_screenshot',
  description: 'Get visual information about the page (element positions and text)',
  parameters: [
    { name: 'selector', type: 'string', description: 'Optional CSS selector for specific element', required: false }
  ],
  execute: async ({ selector }) => {
    const target = selector ? document.querySelector(selector) : document.body;
    if (!target) throw new Error('Target element not found');

    const rect = (target as HTMLElement).getBoundingClientRect();

    // Return element position and basic visual info instead of actual screenshot
    // (Real screenshots would require canvas manipulation or browser extension APIs)
    return {
      selector: selector || 'body',
      position: {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      },
      visible: rect.top < window.innerHeight && rect.bottom > 0,
      text: (target as HTMLElement).textContent?.trim().slice(0, 500)
    };
  }
};

/**
 * Export all DOM tools
 */
export const domTools: Tool[] = [
  clickElementTool,
  querySelectorTool,
  fillFormFieldTool,
  submitFormTool,
  getAttributeTool,
  waitForElementTool,
  getPageUrlTool,
  navigateTool,
  getPageContentTool,
  screenshotTool
];
