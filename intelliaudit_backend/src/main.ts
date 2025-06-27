import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import 'dotenv/config';
import * as bodyParser from 'body-parser';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { CustomLogger } from './logger/custom.logger';

async function bootstrap() {
  // Create custom logger instance
  const logger = new CustomLogger();

  // Validate required environment variables
  if (!process.env.OPENAI_API_KEY) {
    logger.error('OPENAI_API_KEY is not set in environment variables');
    process.exit(1);
  }

  // Create app with custom logger
  const app = await NestFactory.create(AppModule, {
    logger: logger,
    bufferLogs: true,
  });

  // Configure body parser with increased limits
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

  // Enable CORS with credentials - proper NestJS way
  app.enableCors({
    origin: [
      'https://intelliaudit.ai',
      'https://www.intelliaudit.ai',
      'https://api.intelliaudit.ai',
      // Allow localhost for development
      'http://localhost:5173',
      'http://localhost:3000'
    ],
    credentials: true,
    allowedHeaders: 'Origin,X-Requested-With,Content-Type,Accept,Authorization',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    preflightContinue: false,
    optionsSuccessStatus: 204,
    exposedHeaders: 'Content-Disposition'
  });

  // Set global API prefix without versioning
  app.setGlobalPrefix('api');

  // Register global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('IntelliAudit API')
    .setDescription('API documentation for IntelliAudit application')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  // Hardcode port 3000 and host 0.0.0.0 for testing
  
  await app.listen(3000, '0.0.0.0');
}

bootstrap();
