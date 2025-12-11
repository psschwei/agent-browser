import { Agent, LLMClient, ToolManager, StateManager, Conversation, getExampleTools } from '../main';

class Playground {
  private agent: Agent;
  private llmClient: LLMClient;
  private toolManager: ToolManager;
  private stateManager: StateManager;
  private currentConversation: Conversation | null = null;
  private isRunning = false;

  // DOM elements
  private messagesEl: HTMLElement;
  private userInputEl: HTMLTextAreaElement;
  private sendBtn: HTMLButtonElement;
  private toolLogEl: HTMLElement;
  private conversationListEl: HTMLElement;
  private settingsModal: HTMLElement;

  constructor() {
    // Initialize DOM elements
    this.messagesEl = document.getElementById('messages')!;
    this.userInputEl = document.getElementById('userInput') as HTMLTextAreaElement;
    this.sendBtn = document.getElementById('sendBtn') as HTMLButtonElement;
    this.toolLogEl = document.getElementById('toolLog')!;
    this.conversationListEl = document.getElementById('conversationList')!;
    this.settingsModal = document.getElementById('settingsModal')!;

    // Initialize state manager
    this.stateManager = new StateManager();

    // Load or create configuration
    const config = this.loadConfig();

    // Initialize LLM client
    this.llmClient = new LLMClient(config);

    // Initialize tool manager with example tools
    this.toolManager = new ToolManager();
    getExampleTools().forEach(tool => this.toolManager.register(tool));

    // Initialize agent
    this.agent = new Agent(this.llmClient, this.toolManager);
    this.setupAgentListeners();

    // Set up UI event listeners
    this.setupEventListeners();

    // Load conversations
    this.loadConversationList();

    // Create or load initial conversation
    const conversations = this.stateManager.listConversations();
    if (conversations.length > 0) {
      this.loadConversation(conversations[0].id);
    } else {
      this.createNewConversation();
    }
  }

  private loadConfig() {
    const saved = localStorage.getItem('agent-browser:config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error('Failed to load config:', error);
      }
    }

    // Default config
    return {
      endpoint: 'https://api.openai.com/v1',
      apiKey: '',
      model: 'gpt-4'
    };
  }

  private saveConfig(config: any) {
    localStorage.setItem('agent-browser:config', JSON.stringify(config));
  }

  private setupAgentListeners() {
    this.agent.on('thinking', (data) => {
      this.addToolEvent('thinking', `Iteration ${data.iteration}: Agent is thinking...`);
    });

    this.agent.on('tool_call', (data) => {
      this.addToolEvent('tool_call', `Calling ${data.name}\nParams: ${JSON.stringify(data.params, null, 2)}`);
    });

    this.agent.on('observation', (data) => {
      this.addToolEvent('observation', `Result from ${data.name}\n${JSON.stringify(data.result, null, 2)}`);
    });

    this.agent.on('complete', (data) => {
      this.addToolEvent('complete', `Task completed in ${data.iterations} iteration(s)`);
    });

    this.agent.on('error', (data) => {
      this.addToolEvent('error', `Error: ${data.error}`);
    });
  }

  private setupEventListeners() {
    // Send message
    this.sendBtn.addEventListener('click', () => this.sendMessage());

    this.userInputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Settings
    const settingsBtn = document.getElementById('settingsBtn')!;
    settingsBtn.addEventListener('click', () => this.openSettings());

    const closeBtn = this.settingsModal.querySelector('.close-btn')!;
    closeBtn.addEventListener('click', () => this.closeSettings());

    const saveSettingsBtn = document.getElementById('saveSettingsBtn')!;
    saveSettingsBtn.addEventListener('click', () => this.saveSettings());

    // New conversation
    const newConversationBtn = document.getElementById('newConversationBtn')!;
    newConversationBtn.addEventListener('click', () => this.createNewConversation());

    // Clear data
    const clearDataBtn = document.getElementById('clearDataBtn')!;
    clearDataBtn.addEventListener('click', () => this.clearAllData());

    // Close modal on outside click
    this.settingsModal.addEventListener('click', (e) => {
      if (e.target === this.settingsModal) {
        this.closeSettings();
      }
    });
  }

  private async sendMessage() {
    if (this.isRunning) return;

    const message = this.userInputEl.value.trim();
    if (!message) return;

    // Check if API key is set
    const config = this.loadConfig();
    if (!config.apiKey) {
      alert('Please set your API key in Settings first');
      this.openSettings();
      return;
    }

    this.isRunning = true;
    this.sendBtn.disabled = true;
    this.userInputEl.disabled = true;
    this.userInputEl.value = '';

    // Clear tool log
    this.toolLogEl.innerHTML = '';

    // Add user message to UI
    this.addMessage('user', message);

    try {
      // Run agent
      const response = await this.agent.run(message);

      // Add assistant response to UI
      this.addMessage('assistant', response);

      // Save conversation
      if (this.currentConversation) {
        this.currentConversation.messages = this.agent.getMessages();
        this.currentConversation.updatedAt = Date.now();

        // Update title if this is the first message
        if (this.currentConversation.messages.length === 2) {
          this.currentConversation.title = message.substring(0, 50);
        }

        this.stateManager.saveConversation(this.currentConversation);
        this.loadConversationList();
      }
    } catch (error) {
      console.error('Error running agent:', error);
      this.addMessage('assistant', `Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      this.isRunning = false;
      this.sendBtn.disabled = false;
      this.userInputEl.disabled = false;
      this.userInputEl.focus();
    }
  }

  private addMessage(role: 'user' | 'assistant', content: string) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;

    const headerDiv = document.createElement('div');
    headerDiv.className = 'message-header';

    const roleSpan = document.createElement('span');
    roleSpan.className = 'message-role';
    roleSpan.textContent = role === 'user' ? 'You' : 'Assistant';

    const timeSpan = document.createElement('span');
    timeSpan.textContent = new Date().toLocaleTimeString();

    headerDiv.appendChild(roleSpan);
    headerDiv.appendChild(timeSpan);

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = content;

    messageDiv.appendChild(headerDiv);
    messageDiv.appendChild(contentDiv);

    this.messagesEl.appendChild(messageDiv);
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
  }

  private addToolEvent(type: string, content: string) {
    const eventDiv = document.createElement('div');
    eventDiv.className = `tool-event ${type}`;

    const typeDiv = document.createElement('div');
    typeDiv.className = 'tool-event-type';
    typeDiv.textContent = type.replace('_', ' ');

    const contentDiv = document.createElement('div');
    contentDiv.className = 'tool-event-content';
    contentDiv.textContent = content;

    eventDiv.appendChild(typeDiv);
    eventDiv.appendChild(contentDiv);

    this.toolLogEl.appendChild(eventDiv);
    this.toolLogEl.scrollTop = this.toolLogEl.scrollHeight;
  }

  private loadConversationList() {
    const conversations = this.stateManager.listConversations();

    this.conversationListEl.innerHTML = '';

    conversations.forEach(conv => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'conversation-item';
      if (this.currentConversation && this.currentConversation.id === conv.id) {
        itemDiv.classList.add('active');
      }

      const titleDiv = document.createElement('div');
      titleDiv.className = 'conversation-title';
      titleDiv.textContent = conv.title;

      const dateDiv = document.createElement('div');
      dateDiv.className = 'conversation-date';
      dateDiv.textContent = new Date(conv.updatedAt).toLocaleDateString();

      itemDiv.appendChild(titleDiv);
      itemDiv.appendChild(dateDiv);

      itemDiv.addEventListener('click', () => this.loadConversation(conv.id));

      this.conversationListEl.appendChild(itemDiv);
    });
  }

  private loadConversation(id: string) {
    const conversation = this.stateManager.loadConversation(id);
    if (!conversation) return;

    this.currentConversation = conversation;
    this.agent.loadMessages(conversation.messages);

    // Update UI
    this.messagesEl.innerHTML = '';
    conversation.messages.forEach(msg => {
      if (msg.role === 'user' || msg.role === 'assistant') {
        this.addMessage(msg.role, msg.content);
      }
    });

    this.toolLogEl.innerHTML = '';
    this.loadConversationList();
  }

  private createNewConversation() {
    this.currentConversation = this.stateManager.createConversation('New Conversation');
    this.agent.clearMessages();

    this.messagesEl.innerHTML = '';
    this.toolLogEl.innerHTML = '';

    this.loadConversationList();
  }

  private openSettings() {
    this.settingsModal.classList.add('active');

    // Load current settings
    const config = this.loadConfig();
    (document.getElementById('apiEndpoint') as HTMLInputElement).value = config.endpoint;
    (document.getElementById('apiKey') as HTMLInputElement).value = config.apiKey;
    (document.getElementById('modelName') as HTMLInputElement).value = config.model;

    const maxIter = localStorage.getItem('agent-browser:maxIterations');
    (document.getElementById('maxIterations') as HTMLInputElement).value = maxIter || '10';
  }

  private closeSettings() {
    this.settingsModal.classList.remove('active');
  }

  private saveSettings() {
    const config = {
      endpoint: (document.getElementById('apiEndpoint') as HTMLInputElement).value,
      apiKey: (document.getElementById('apiKey') as HTMLInputElement).value,
      model: (document.getElementById('modelName') as HTMLInputElement).value
    };

    const maxIterations = parseInt((document.getElementById('maxIterations') as HTMLInputElement).value);

    this.saveConfig(config);
    localStorage.setItem('agent-browser:maxIterations', maxIterations.toString());

    this.llmClient.updateConfig(config);
    this.agent.setMaxIterations(maxIterations);

    this.closeSettings();
  }

  private clearAllData() {
    if (confirm('Are you sure you want to clear all conversations? This cannot be undone.')) {
      this.stateManager.clearAll();
      this.createNewConversation();
    }
  }
}

// Initialize playground when DOM is ready
new Playground();
