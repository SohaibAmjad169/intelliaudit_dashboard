import { ApiProperty } from '@nestjs/swagger';

export class AuditSection {
  @ApiProperty({ description: 'Unique identifier for the audit section' })
  id: string;

  @ApiProperty({ description: 'Project ID this section belongs to' })
  project_id: string;

  @ApiProperty({ description: 'Type of the section' })
  section_type: string;

  @ApiProperty({ description: 'Whether this section is complete' })
  is_complete: boolean;

  @ApiProperty({ description: 'When this section was completed' })
  completed_at: Date | null;

  @ApiProperty({ description: 'When this section was last updated' })
  updated_at: Date;

  @ApiProperty({ description: 'When this section was created' })
  created_at: Date;
}
