export type McpToolErrorCode =
  | 'VALIDATION_ERROR'
  | 'CATALOG_MISSING'
  | 'CATALOG_EXPIRED'
  | 'UNKNOWN_TOOL'
  | 'UNAUTHORIZED'
  | 'INTERNAL_ERROR';

export interface McpToolError {
  code: McpToolErrorCode;
  message: string;
  field: string | null;
}

export function makeMcpToolError(
  code: McpToolErrorCode,
  message: string,
  field: string | null = null
): McpToolError {
  return { code, message, field };
}
