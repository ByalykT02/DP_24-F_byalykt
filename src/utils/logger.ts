import winston from 'winston';
import path from 'path';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Tell winston about our colors
winston.addColors(colors);

// Create a custom format with timestamp and colorization
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Create console and file transport
const transports = [
  // Console transport
  new winston.transports.Console({
    format: logFormat,
  }),
  
  // Error log file
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'error.log'),
    level: 'error',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
  }),
  
  // Combined log file
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'combined.log'),
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
  }),
];

// Create the logger
export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  levels,
  transports,
  exitOnError: false,
});

// Additional utility methods
export const logging = {
  /**
   * Log an error with optional metadata
   * @param message Error message
   * @param meta Optional metadata or error object
   */
  error: (message: string, meta?: Record<string, any> | Error) => {
    if (meta instanceof Error) {
      logger.error(message, { 
        errorName: meta.name, 
        errorMessage: meta.message, 
        stack: meta.stack 
      });
    } else {
      logger.error(message, meta);
    }
  },

  /**
   * Log an informational message with optional metadata
   * @param message Info message
   * @param meta Optional metadata
   */
  info: (message: string, meta?: Record<string, any>) => {
    logger.info(message, meta);
  },

  /**
   * Log a warning message with optional metadata
   * @param message Warning message
   * @param meta Optional metadata
   */
  warn: (message: string, meta?: Record<string, any>) => {
    logger.warn(message, meta);
  },

  /**
   * Log a debug message with optional metadata
   * @param message Debug message
   * @param meta Optional metadata
   */
  debug: (message: string, meta?: Record<string, any>) => {
    logger.debug(message, meta);
  },

  /**
   * Create a child logger with additional context
   * @param context Contextual metadata to add to all logs
   */
  child: (context: Record<string, any>) => {
    return logger.child(context);
  }
};

// Handle unhandled rejections and exceptions
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { 
    promise, 
    reason: reason instanceof Error ? reason.message : reason 
  });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', { 
    name: error.name, 
    message: error.message, 
    stack: error.stack 
  });
  process.exit(1);
});