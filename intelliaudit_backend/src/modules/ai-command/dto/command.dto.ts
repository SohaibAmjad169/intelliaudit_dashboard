import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CommandDto {
  @ApiProperty({
    description: 'The command text to process',
    example: 'Analyze these field notes: HVAC unit in lobby, 5000W, needs maintenance',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  text: string;
}
