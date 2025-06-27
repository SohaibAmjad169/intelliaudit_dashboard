import { Controller, Post, Body, Logger, HttpCode, HttpStatus, InternalServerErrorException } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { CognitoFormsWebhookDto } from './dto/cognito-forms-webhook.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(private readonly webhookService: WebhookService) {}

  @Post('cognito-forms')
  @HttpCode(HttpStatus.ACCEPTED) 
  @ApiOperation({ summary: 'Handles incoming webhooks from Cognito Forms' })
  @ApiResponse({ status: 202, description: 'Webhook received and processing initiated.' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid payload format.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error during processing setup.' })
  async handleCognitoFormsWebhook(
   
    @Body() payload: CognitoFormsWebhookDto, 
  ): Promise<{ message: string; projectId?: string }> {
    this.logger.log(`Received webhook from Cognito Forms: Entry #${payload?.Entry?.Number}`);
    try {
        const result = await this.webhookService.handleCognitoWebhook(payload);
        return { message: result.message, projectId: result.projectId };

    } catch (error) {
        this.logger.error(`Error processing Cognito Forms webhook: ${error.message}`, error.stack);
         throw new InternalServerErrorException('Failed to initiate webhook processing.');
    }
  }
}