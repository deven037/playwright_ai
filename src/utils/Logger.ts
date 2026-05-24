import * as winston from 'winston';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Logger - Singleton wrapper around Winston for structured logging.
 * Outputs to both console and rotating log files.
 */
export class Logger {
  private static instance: Logger;
  private readonly logger: winston.Logger;

  private constructor() {
    const logDir = path.resolve('logs');
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

    const logFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.printf(({ timestamp, level, message }) => {
        return `[${timestamp}] [${level.toUpperCase().padEnd(5)}] ${message}`;
      }),
    );

    this.logger = winston.createLogger({
      level: 'debug',
      format: logFormat,
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            logFormat,
          ),
        }),
        new winston.transports.File({
          filename: path.join(logDir, 'automation.log'),
          maxsize: 5 * 1024 * 1024, // 5 MB
          maxFiles: 5,
          tailable: true,
        }),
        new winston.transports.File({
          filename: path.join(logDir, 'errors.log'),
          level: 'error',
        }),
      ],
    });
  }

  public static getInstance(): Logger {
    if (!Logger.instance) Logger.instance = new Logger();
    return Logger.instance;
  }

  public info(message: string):  void { this.logger.info(message);  }
  public warn(message: string):  void { this.logger.warn(message);  }
  public error(message: string): void { this.logger.error(message); }
  public debug(message: string): void { this.logger.debug(message); }

  public step(stepName: string): void {
    this.logger.info(`  >  STEP: ${stepName}`);
  }
}
