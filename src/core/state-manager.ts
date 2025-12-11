import { Conversation } from './types';

const STORAGE_PREFIX = 'agent-browser:';
const CONVERSATIONS_INDEX_KEY = `${STORAGE_PREFIX}conversations-index`;

/**
 * Manages conversation persistence using localStorage
 */
export class StateManager {
  /**
   * Save a conversation to localStorage
   */
  saveConversation(conversation: Conversation): void {
    const key = this.getConversationKey(conversation.id);
    localStorage.setItem(key, JSON.stringify(conversation));

    // Update index
    this.updateIndex(conversation.id, conversation.title, conversation.updatedAt);
  }

  /**
   * Load a conversation from localStorage
   */
  loadConversation(id: string): Conversation | null {
    const key = this.getConversationKey(id);
    const data = localStorage.getItem(key);

    if (!data) {
      return null;
    }

    try {
      return JSON.parse(data) as Conversation;
    } catch (error) {
      console.error('Failed to parse conversation:', error);
      return null;
    }
  }

  /**
   * List all conversations
   */
  listConversations(): Array<{ id: string; title: string; updatedAt: number }> {
    const indexData = localStorage.getItem(CONVERSATIONS_INDEX_KEY);

    if (!indexData) {
      return [];
    }

    try {
      const index = JSON.parse(indexData);
      return index.sort((a: any, b: any) => b.updatedAt - a.updatedAt);
    } catch (error) {
      console.error('Failed to parse conversations index:', error);
      return [];
    }
  }

  /**
   * Delete a conversation
   */
  deleteConversation(id: string): void {
    const key = this.getConversationKey(id);
    localStorage.removeItem(key);

    // Update index
    this.removeFromIndex(id);
  }

  /**
   * Export a conversation as JSON string
   */
  exportConversation(id: string): string | null {
    const conversation = this.loadConversation(id);
    return conversation ? JSON.stringify(conversation, null, 2) : null;
  }

  /**
   * Import a conversation from JSON string
   */
  importConversation(jsonData: string): Conversation | null {
    try {
      const conversation = JSON.parse(jsonData) as Conversation;

      // Validate basic structure
      if (!conversation.id || !conversation.messages || !Array.isArray(conversation.messages)) {
        throw new Error('Invalid conversation format');
      }

      this.saveConversation(conversation);
      return conversation;
    } catch (error) {
      console.error('Failed to import conversation:', error);
      return null;
    }
  }

  /**
   * Create a new conversation
   */
  createConversation(title?: string): Conversation {
    const conversation: Conversation = {
      id: this.generateId(),
      title: title || 'New Conversation',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.saveConversation(conversation);
    return conversation;
  }

  /**
   * Clear all conversations
   */
  clearAll(): void {
    const conversations = this.listConversations();
    conversations.forEach(conv => {
      localStorage.removeItem(this.getConversationKey(conv.id));
    });
    localStorage.removeItem(CONVERSATIONS_INDEX_KEY);
  }

  /**
   * Get storage key for a conversation
   */
  private getConversationKey(id: string): string {
    return `${STORAGE_PREFIX}conversation:${id}`;
  }

  /**
   * Update the conversations index
   */
  private updateIndex(id: string, title: string, updatedAt: number): void {
    const index = this.listConversations();

    const existingIndex = index.findIndex(item => item.id === id);
    if (existingIndex >= 0) {
      index[existingIndex] = { id, title, updatedAt };
    } else {
      index.push({ id, title, updatedAt });
    }

    localStorage.setItem(CONVERSATIONS_INDEX_KEY, JSON.stringify(index));
  }

  /**
   * Remove a conversation from the index
   */
  private removeFromIndex(id: string): void {
    const index = this.listConversations();
    const filtered = index.filter(item => item.id !== id);
    localStorage.setItem(CONVERSATIONS_INDEX_KEY, JSON.stringify(filtered));
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
