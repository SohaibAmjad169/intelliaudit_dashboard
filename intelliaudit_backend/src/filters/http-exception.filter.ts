import { ExceptionFilter, Catch, ArgumentsHost, HttpException, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Global HTTP exception filter
 * 
 * This filter catches all HttpExceptions thrown by route handlers and controllers
 * and formats the response in a standardized way.
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // Extract the message from the exception
    let message = 'Internal server error';
    let error = 'Internal Server Error';

    if (typeof exceptionResponse === 'object') {
      const exceptionObj = exceptionResponse as any;
      message = exceptionObj.message || message;
      error = exceptionObj.error || error;
    } else if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    }

    // Log the error
    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${message}`,
      exception.stack,
    );

    // Format the response
    response.status(status).json({
      statusCode: status,
      error: error,
      message: message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
