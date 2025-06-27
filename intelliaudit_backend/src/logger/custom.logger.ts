import { LoggerService, LogLevel } from '@nestjs/common';
import * as winston from 'winston';
import chalk from 'chalk';
import { Chalk } from 'chalk';

export class CustomLogger implements LoggerService {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.align(),
        winston.format.printf(info => {
          const timestamp = new Date().toISOString();
          const level = info.level.toUpperCase();
          const context = info.context ? `[${info.context}]` : '';
          const message = this.formatMessage(info.message as string, context);
          
          return chalk.white(`[${timestamp}]`) + ' ' + 
                 chalk.white(`${level}:`) + ' ' + 
                 chalk.magenta(context) + ' ' + 
                 message;
        })
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ 
          filename: 'logs/error.log', 
          level: 'error',
          format: winston.format.uncolorize()
        }),
        new winston.transports.File({ 
          filename: 'logs/combined.log',
          format: winston.format.uncolorize()
        })
      ]
    });
  }

  private formatMessage(message: string, context: string): string {
    // Handle controller declarations
    if (message.includes('Controller') && context.includes('[RoutesResolver]')) {
      return '\n' + chalk.cyan('┌─────────────────────────────────────────') +
             '\n' + chalk.cyan('│ ') + chalk.yellowBright.bold(message) +
             '\n' + chalk.cyan('├─────────────────────────────────────────');
    }

    // Handle route mappings
    if (message.includes('Mapped') && context.includes('[RouterExplorer]')) {
      const parts = message.match(/Mapped {(.+?), ([A-Z]+)} route/);
      if (parts) {
        const [_, route, method] = parts;
        const methodColor = this.getMethodColor(method);
        
        return chalk.cyan('│ ') +
               methodColor(method.padEnd(6)) + ' ' +
               chalk.white(route);
      }
    }

    // Handle end of controller routes
    if (message.includes('Controller') && !context.includes('[RoutesResolver]')) {
      return chalk.cyan('└─────────────────────────────────────────');
    }

    // Default formatting for other messages
    return chalk.green(message);
  }

  private getMethodColor(method: string): Chalk {
    const methodColors: Record<string, Chalk> = {
      'GET': chalk.green,
      'POST': chalk.yellow,
      'PUT': chalk.blue,
      'DELETE': chalk.red,
      'PATCH': chalk.magenta,
      'OPTIONS': chalk.white,
      'HEAD': chalk.gray
    };
    return methodColors[method] || chalk.white;
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }

  setLogLevels(levels: LogLevel[]) {
    const levelMap: Record<string, string> = {
      log: 'info',
      error: 'error',
      warn: 'warn',
      debug: 'debug',
      verbose: 'verbose'
    };

    const winstonLevels = levels
      .map(level => levelMap[level as string])
      .filter(Boolean);
    this.logger.level = winstonLevels[0] || 'info';
  }
}