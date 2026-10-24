/**
 * ARK LEDGER — Workers AI Types & Tool Interfaces
 */

export type AiMessageRole = 'system' | 'user' | 'assistant' | 'tool';

export interface AiToolCall {
  id?: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface AiChatMessage {
  role: AiMessageRole;
  content?: string;
  name?: string;
  tool_calls?: AiToolCall[];
}

export interface AiToolFunction {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface AiChatRequestBody {
  messages: AiChatMessage[];
  model?: string;
  tenant_id?: string;
  user_id?: string;
  stream?: boolean;
}
