import { Controller, Post, Get, Param, UseGuards, Body } from '@nestjs/common';
import { AuthGuard } from '../../auth/auth.guard';
import { ECOService, ECNOAnalysis } from './eco.service';

// Removed unused interfaces

@Controller('eco')
export class ECOController {
  constructor(private readonly ecoService: ECOService) {}

  @Get('public/:projectId')
  async getPublicECOData(
    @Param('projectId') projectId: string
  ): Promise<{ analysis: ECNOAnalysis }> {
    const analysis = await this.ecoService.getECOData(projectId);
    return { analysis };
  }

  @Get(':projectId')
  @UseGuards(AuthGuard)
  async getECOData(
    @Param('projectId') projectId: string
  ): Promise<{ analysis: ECNOAnalysis }> {
    
    const analysis = await this.ecoService.getECOData(projectId);
    
    return { analysis };
  }

  @Post('regenerate/:projectId')
  @UseGuards(AuthGuard)
  async regenerateECNOAnalysis(
    @Param('projectId') projectId: string
  ): Promise<{ analysis: ECNOAnalysis }> {
    
    const analysis = await this.ecoService.generateECNOAnalysis(projectId);
    
    return { analysis };
  }

  @Get('ecno/:projectId')
  @UseGuards(AuthGuard)
  async generateECNOAnalysis(
    @Param('projectId') projectId: string
  ): Promise<{ analysis: ECNOAnalysis }> {
    
    const analysis = await this.ecoService.generateECNOAnalysis(projectId);
    
    return { analysis };
  }

  @Post('direct-enrich/:projectId')
  @UseGuards(AuthGuard)
  async directEnrichECNOAnalysis(
    @Param('projectId') projectId: string,
    @Body() body: { prompt?: string }
  ): Promise<{ enhancedAnalysis: ECNOAnalysis }> {
    
    // Check if a specific prompt was provided for enhancement
    if (body?.prompt) {
      const enhancedAnalysis = await this.ecoService.enhanceDirectECNOAnalysis(projectId, body.prompt);
      return { enhancedAnalysis };
    }
    
    // Use the enhanceComprehensiveECNOAnalysis method which handles everything internally
    const enhancedAnalysis = await this.ecoService.enhanceComprehensiveECNOAnalysis(projectId);
    
    return { enhancedAnalysis };
  }

  @Post('enhance-comprehensive/:projectId')
  @UseGuards(AuthGuard)
  async enhanceComprehensiveAnalysis(
    @Param('projectId') projectId: string,
    @Body() body: { 
      fieldNotesAnalysis?: any;
      photoAnalysis?: { photos: any[] };
      currentRecommendations?: any[];
    }
  ): Promise<{ enhancedAnalysis: ECNOAnalysis }> {
    // Log the received data
    console.log('Received data for comprehensive enhancement:', 
      body?.fieldNotesAnalysis ? 'Field notes data present' : 'No field notes data',
      body?.photoAnalysis?.photos ? `${body.photoAnalysis.photos.length} photos` : 'No photos',
      body?.currentRecommendations ? `${body.currentRecommendations.length} recommendations` : 'No recommendations'
    );
    
    // Use the enhanceComprehensiveECNOAnalysis method which handles everything internally
    const enhancedAnalysis = await this.ecoService.enhanceComprehensiveECNOAnalysis(projectId);
    return { enhancedAnalysis };
  }
}
