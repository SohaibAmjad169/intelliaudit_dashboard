import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import 'dotenv/config';

async function bootstrap() {
  // Validate required environment variables
  if (!process.env.OPENAI_API_KEY) {
    console.error('ERROR: OPENAI_API_KEY is not set in environment variables');
    process.exit(1);
  }

  // Log Supabase connection for debugging
  console.log(`Connecting to Supabase at: ${process.env.SUPABASE_URL}`);

  const app = await NestFactory.create(AppModule);

  // Enable CORS with detailed configuration
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

  // Enable validation
  app.useGlobalPipes(new ValidationPipe());

  // Start server
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Server is running on port ${port}`);
}

bootstrap();
