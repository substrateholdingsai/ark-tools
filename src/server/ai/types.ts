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
    additionalProperties?: boolean;
  };
  /**
   * Anotaciones de comportamiento (MCP spec: ToolAnnotations).
   * Se exponen tal cual en `tools/list` para que el cliente sepa que la
   * herramienta no muta estado y puede reintentarse sin efectos secundarios.
   */
  annotations?: {
    readOnly: boolean;
    idempotent: boolean;
    destructive?: boolean;
    openWorld?: boolean;
  };
}

export type { McpToolError, McpToolErrorCode } from './mcpErrors';
export { makeMcpToolError } from './mcpErrors';

export interface AiChatRequestBody {
  messages: AiChatMessage[];
  model?: string;
  tenant_id?: string;
  user_id?: string;
  stream?: boolean;
}
