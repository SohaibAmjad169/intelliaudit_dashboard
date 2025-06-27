import { Controller, Post, Body, Query, Logger, UsePipes, ValidationPipe, BadRequestException, Param, HttpCode, NotFoundException } from '@nestjs/common';
import { AiCommandPrismaService } from './ai-command-prisma.service';
import { CommandDto } from './dto/command.dto'; // Assuming a DTO exists for validation
import { ApiTags, ApiOperation, ApiQuery, ApiBody, ApiParam, ApiResponse } from '@nestjs/swagger';

@ApiTags('AI Command')
@Controller('ai-command') // Sets the base path to /ai-command
export class AiCommandController {
  private readonly logger = new Logger(AiCommandController.name);

  constructor(private readonly aiCommandService: AiCommandPrismaService) {}

  @Post()
  @ApiOperation({ summary: 'Process an AI command' })
  @ApiQuery({ name: 'projectId', required: false, description: 'Optional ID of the project for context' })
  @ApiBody({ type: CommandDto })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true })) // Enable validation
  async processCommand(
    @Body() commandDto: CommandDto, // Use DTO for body validation
    @Query('projectId') projectId?: string, 
  ) {
    this.logger.log(`Received command: "${commandDto.text}", Project ID: ${projectId || 'None'}`);
    
    try {
      const result = await this.aiCommandService.processCommand(commandDto.text, projectId);
      return result;
    } catch (error) {
      this.logger.error(`Error processing command: ${error.message}`, error.stack);
      // Return a generic error response, service likely throws specific errors handled there
      throw new BadRequestException('Failed to process AI command.');
    }
  }

  @Post('project/:projectId/generate-context') // Use a more specific path
  @HttpCode(200) // Return 200 OK on success instead of 201 Created
  @ApiOperation({ summary: 'Generate and store AI context for a specific project' })
  @ApiParam({ name: 'projectId', description: 'The ID of the project', type: String })
  @ApiResponse({ status: 200, description: 'Context generated and stored successfully.' })
  @ApiResponse({ status: 404, description: 'Project not found.' })
  @ApiResponse({ status: 500, description: 'Internal server error during context generation.' })
  // @UseGuards(AdminGuard) // IMPORTANT: Protect this endpoint appropriately!
  async generateContextForProject(
    @Param('projectId') projectId: string,
  ) {
    this.logger.log(`Received request to generate context for project: ${projectId}`);
    try {
      // Call the service method
      const result = await this.aiCommandService.generateAndStoreContext(projectId);
      
      // Handle potential errors returned from the service (e.g., failed formatting)
      if (!result.success) {
        throw new BadRequestException(result.message);
      }
      
      return { message: result.message }; // Return success message
      
    } catch (error) {
      // Log the specific error thrown by the service or controller
      this.logger.error(`Error in generateContextForProject for ${projectId}: ${error.message}`, error.stack);
      
      // Re-throw known exceptions or a generic internal server error
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
          throw error;
      }
      throw new BadRequestException(`Failed to trigger context generation: ${error.message}`);
    }
  }
} 