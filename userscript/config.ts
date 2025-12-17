import { LLMConfig } from '../src/core/types';

/**
 * Configuration manager using Tampermonkey's GM_setValue/GM_getValue storage
 */
export class ConfigManager {
  static load(): LLMConfig {
    const config = (GM_getValue as any)('agent_browser_config', {
      endpoint: 'https://api.openai.com/v1',
      model: 'gpt-4',
      apiKey: ''
    });
    return config as LLMConfig;
  }

  static save(config: LLMConfig): void {
    (GM_setValue as any)('agent_browser_config', config);
  }
}

/**
 * Show settings dialog for API key configuration
 */
export function showSettings() {
  const config = ConfigManager.load();
  const apiKey = prompt('Enter your OpenAI API key:', config.apiKey || '');

  if (apiKey !== null) {
    ConfigManager.save({
      ...config,
      apiKey
    });
    alert('API key saved!');
  }
}
