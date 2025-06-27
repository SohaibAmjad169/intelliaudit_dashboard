import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { ConfigService } from '@nestjs/config';

// Use existing Redis connection from ioredis
let redisConnection: Redis;

export const getRedisConnection = (configService: ConfigService): Redis => {
  if (!redisConnection) {
    const redisHost = configService.get<string>('REDIS_HOST') || 'localhost';
    const redisPort = configService.get<number>('REDIS_PORT') || 6379;
    const redisPassword = configService.get<string>('REDIS_PASSWORD');
    
    redisConnection = new Redis({
      host: redisHost,
      port: redisPort,
      password: redisPassword || undefined,
      maxRetriesPerRequest: null, // Required by BullMQ
      enableOfflineQueue: false,
    });
  }
  
  return redisConnection;
};

export const createPhotoAnalysisQueue = (configService: ConfigService): Queue => {
  const connection = getRedisConnection(configService);
  
  return new Queue('photo-analysis', {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000, // Initial delay of 5 seconds before retry
      },
      removeOnComplete: 1000, // Keep last 1000 completed jobs
      removeOnFail: 500, // Keep last 500 failed jobs
      // Alternatively, you can use { age: 60 * 60 * 24 * 7 } to remove after 7 days instead of by count
    },
  });
};

export interface PhotoAnalysisJobData {
  projectId: string;
  // Now we pass the analysis ID instead of the full file
  analysisId: string;
  photoUrl: string;
  originalFilename: string;
  model: string;
  // Keeping the file field as optional for backwards compatibility
  file?: {
    originalname: string;
    mimetype: string;
    buffer: Buffer;
    size: number;
    fieldname?: string;
    encoding?: string;
  };
}

export interface PhotoAnalysisResult {
  success: boolean;
  analysis?: any;
  error?: string;
  filename?: string;
}
