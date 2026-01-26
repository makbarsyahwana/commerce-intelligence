// Logger Domain Types

export interface LogContext {
  runId?: string;
  provider?: string;
  duration?: number;
  error?: string;
  operation?: string;
  masterRunId?: string;
  [key: string]: unknown;
}

export interface Logger {
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
  debug(message: string, context?: LogContext): void;
}
