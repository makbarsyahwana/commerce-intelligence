export interface LogContext {
  runId?: string;
  provider?: string;
  duration?: number;
  error?: string;
  [key: string]: unknown;
}

export interface Logger {
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
  debug(message: string, context?: LogContext): void;
}

class StructuredLogger implements Logger {
  private context: LogContext;

  constructor(context: LogContext = {}) {
    this.context = context;
  }

  private log(level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG', message: string, context: LogContext = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...this.context,
      ...context,
    };

    // In production, you might send this to a logging service
    // For now, we'll use structured console logs
    const logMethod = level === 'ERROR' ? console.error : 
                      level === 'WARN' ? console.warn : 
                      level === 'DEBUG' ? console.debug : console.log;
    
    logMethod(JSON.stringify(logEntry));
  }

  info(message: string, context?: LogContext): void {
    this.log('INFO', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('WARN', message, context);
  }

  error(message: string, context?: LogContext): void {
    this.log('ERROR', message, context);
  }

  debug(message: string, context?: LogContext): void {
    this.log('DEBUG', message, context);
  }

  withContext(context: LogContext): Logger {
    return new StructuredLogger({ ...this.context, ...context });
  }
}

// Default logger instance
export const logger = new StructuredLogger();

// Create a logger with context
export function createLogger(context: LogContext): Logger {
  return new StructuredLogger(context);
}
