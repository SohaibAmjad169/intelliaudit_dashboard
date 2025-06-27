import { Controller, Get, Param, NotFoundException, Inject } from '@nestjs/common';
import { Queue } from 'bullmq';
import { PhotoAnalysisJobData, PhotoAnalysisResult } from './photo-analysis.queue';

@Controller('equipment/photo-analysis')
export class PhotoAnalysisQueueController {
  constructor(
    @Inject('PHOTO_ANALYSIS_QUEUE')
    private readonly photoAnalysisQueue: Queue<PhotoAnalysisJobData, PhotoAnalysisResult>
  ) {}

  @Get('jobs/:jobId')
  async getJobStatus(@Param('jobId') jobId: string) {
    const job = await this.photoAnalysisQueue.getJob(jobId);
    
    if (!job) {
      throw new NotFoundException(`Job ${jobId} not found`);
    }
    
    const state = await job.getState();
    
    return {
      id: job.id,
      state,
      progress: job.progress,
      attempts: job.attemptsMade,
      timestamp: job.timestamp,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
      returnvalue: job.returnvalue,
      failedReason: job.failedReason,
      data: {
        projectId: job.data.projectId,
        filename: job.data.originalFilename || job.data.file?.originalname || 'unknown',
        analysisId: job.data.analysisId,
        photoUrl: job.data.photoUrl,
        model: job.data.model,
      }
    };
  }

  @Get('jobs')
  async getJobs() {
    const [waiting, active, completed, failed] = await Promise.all([
      this.photoAnalysisQueue.getWaiting(),
      this.photoAnalysisQueue.getActive(),
      this.photoAnalysisQueue.getCompleted(),
      this.photoAnalysisQueue.getFailed()
    ]);

    return {
      counts: {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        total: waiting.length + active.length + completed.length + failed.length
      },
      jobs: {
        waiting: waiting.map(job => ({ 
          id: job.id,
          projectId: job.data.projectId,
          filename: job.data.originalFilename || job.data.file?.originalname || 'unknown',
          timestamp: job.timestamp
        })),
        active: active.map(job => ({ 
          id: job.id,
          projectId: job.data.projectId,
          filename: job.data.originalFilename || job.data.file?.originalname || 'unknown',
          timestamp: job.timestamp
        })),
        completed: completed.map(job => ({ 
          id: job.id,
          projectId: job.data.projectId,
          filename: job.data.originalFilename || job.data.file?.originalname || 'unknown',
          timestamp: job.timestamp,
          finishedOn: job.finishedOn,
          success: job.returnvalue?.success
        })),
        failed: failed.map(job => ({ 
          id: job.id,
          projectId: job.data.projectId,
          filename: job.data.originalFilename || job.data.file?.originalname || 'unknown',
          timestamp: job.timestamp,
          failedReason: job.failedReason
        }))
      }
    };
  }
  
  @Get('project/:projectId/jobs')
  async getProjectJobs(@Param('projectId') projectId: string) {
    const [waiting, active, completed, failed] = await Promise.all([
      this.photoAnalysisQueue.getWaiting(),
      this.photoAnalysisQueue.getActive(),
      this.photoAnalysisQueue.getCompleted(),
      this.photoAnalysisQueue.getFailed()
    ]);
    
    // Filter jobs by projectId
    const filterByProject = (job: { data: PhotoAnalysisJobData }) => job.data.projectId === projectId;
    
    const projectWaiting = waiting.filter(filterByProject);
    const projectActive = active.filter(filterByProject);
    const projectCompleted = completed.filter(filterByProject);
    const projectFailed = failed.filter(filterByProject);

    return {
      counts: {
        waiting: projectWaiting.length,
        active: projectActive.length,
        completed: projectCompleted.length,
        failed: projectFailed.length,
        total: projectWaiting.length + projectActive.length + projectCompleted.length + projectFailed.length
      },
      jobs: {
        waiting: projectWaiting.map(job => ({ 
          id: job.id,
          filename: job.data.originalFilename || job.data.file?.originalname || 'unknown',
          timestamp: job.timestamp
        })),
        active: projectActive.map(job => ({ 
          id: job.id,
          filename: job.data.originalFilename || job.data.file?.originalname || 'unknown',
          timestamp: job.timestamp
        })),
        completed: projectCompleted.map(job => ({ 
          id: job.id,
          filename: job.data.originalFilename || job.data.file?.originalname || 'unknown',
          timestamp: job.timestamp,
          finishedOn: job.finishedOn,
          success: job.returnvalue?.success
        })),
        failed: projectFailed.map(job => ({ 
          id: job.id,
          filename: job.data.originalFilename || job.data.file?.originalname || 'unknown',
          timestamp: job.timestamp,
          failedReason: job.failedReason
        }))
      }
    };
  }
}
