export interface User {
  id: string;
  name: string;
  email: string;
}

export interface ApiKey {
  id: string;
  provider: 'openai' | 'anthropic' | 'gemini' | 'openrouter';
  createdAt: number;
}

export interface Chat {
  id: string;
  title: string;
  provider: 'openai' | 'anthropic' | 'gemini' | 'openrouter';
  createdAt: number;
  updatedAt: number;
}

export interface Message {
  id: string;
  chatId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: number;
}

export interface ChatFile {
  id: string;
  chatId: string;
  filename: string;
  filepath: string;
  mimetype: string;
  createdAt: number;
}

export interface ChatDetails extends Chat {
  messages: Message[];
  files: ChatFile[];
}
