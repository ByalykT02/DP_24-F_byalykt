import winston from 'winston';
import path from 'path';

type LogLevels = 'error' | 'warn' | 'info' | 'http' | 'debug';
interface MetaData {
  [key: string]: any;
}

// Define log levels
const levels: Record<LogLevels, number> = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log colors
const colors: Record<LogLevels, string> = {
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

// Function to get transports based on the environment
const getTransports = (): winston.transport[] => {
  const transports: winston.transport[] = [];

  // Console transport
  transports.push(
    new winston.transports.Console({
      format: logFormat,
    })
  );

  // File transports for non-production environments
  if (process.env.NODE_ENV !== 'production') {
    try {
      transports.push(
        new winston.transports.File({
          filename: path.join(process.cwd(), 'logs', 'error.log'),
          level: 'error',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          ),
        })
      );

      transports.push(
        new winston.transports.File({
          filename: path.join(process.cwd(), 'logs', 'combined.log'),
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          ),
        })
      );
    } catch (error) {
      console.error('Failed to create file transports:', error);
    }
  }

  return transports;
};

// Create the logger
export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  levels,
  transports: getTransports(),
  exitOnError: false,
});

// Additional utility methods
export const logging = {
  error: (message: string, meta?: MetaData | Error) => {
    if (meta instanceof Error) {
      logger.error(message, {
        errorName: meta.name,
        errorMessage: meta.message,
        stack: meta.stack,
      });
    } else {
      logger.error(message, meta);
    }
  },
  info: (message: string, meta?: MetaData) => logger.info(message, meta),
  warn: (message: string, meta?: MetaData) => logger.warn(message, meta),
  debug: (message: string, meta?: MetaData) => logger.debug(message, meta),
  child: (context: MetaData) => logger.child(context),
};

// Handle unhandled rejections and exceptions conditionally
if (typeof process !== 'undefined') {
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logger.error('Unhandled Rejection at:', {
      promise,
      reason: reason instanceof Error ? reason.message : reason,
    });
  });

  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });

    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  });
}
