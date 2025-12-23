
export type Role = 'user' | 'assistant' | 'system';
export type Language = 'pt' | 'en';

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: Date;
  sources?: Array<{
    title: string;
    uri: string;
  }>;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
}

export interface GroundingSource {
  web?: {
    uri: string;
    title: string;
  };
}
