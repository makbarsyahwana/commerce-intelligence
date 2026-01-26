import { LogContext, Logger } from "../../types/logger";

// Generate correlation ID for request tracing
function generateCorrelationId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

class StructuredLogger implements Logger {
  private context: LogContext;
  private correlationId: string;

  constructor(context: LogContext = {}) {
    this.context = context;
    this.correlationId = (context.correlationId as string) || generateCorrelationId();
  }

  private log(level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG', message: string, context: LogContext = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      correlationId: this.correlationId,
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

  withCorrelationId(correlationId: string): Logger {
    return new StructuredLogger({ ...this.context, correlationId });
  }

  getCorrelationId(): string {
    return this.correlationId;
  }
}

// Default logger instance
export const logger = new StructuredLogger();

// Create a logger with context
export function createLogger(context: LogContext): Logger {
  return new StructuredLogger(context);
}

// Create a logger with correlation ID for request tracing
export function createRequestLogger(request: Request, additionalContext: LogContext = {}): Logger {
  const correlationId = generateCorrelationId();
  
  return createLogger({
    correlationId,
    method: request.method,
    url: request.url,
    userAgent: request.headers.get('user-agent') || undefined,
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    ...additionalContext,
  });
}
