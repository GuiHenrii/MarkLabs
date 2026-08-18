export type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  message: string;
  correlationId?: string;
  teamId?: string;
  userId?: string;
  meta?: Record<string, any>;
}

export class Logger {
  private service: string;

  constructor(service: string) {
    this.service = service;
  }

  private format(level: LogLevel, message: string, meta?: Record<string, any>, correlationId?: string): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      service: this.service,
      message,
      correlationId,
      meta,
    };
  }

  info(message: string, meta?: Record<string, any>, correlationId?: string) {
    console.log(JSON.stringify(this.format("INFO", message, meta, correlationId)));
  }

  warn(message: string, meta?: Record<string, any>, correlationId?: string) {
    console.warn(JSON.stringify(this.format("WARN", message, meta, correlationId)));
  }

  error(message: string, meta?: Record<string, any>, correlationId?: string) {
    console.error(JSON.stringify(this.format("ERROR", message, meta, correlationId)));
  }

  debug(message: string, meta?: Record<string, any>, correlationId?: string) {
    console.debug(JSON.stringify(this.format("DEBUG", message, meta, correlationId)));
  }
}

export const createLogger = (serviceName: string) => new Logger(serviceName);
