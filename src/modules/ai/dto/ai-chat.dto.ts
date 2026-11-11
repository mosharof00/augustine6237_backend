import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ChatMessageDto {
  @ApiProperty({ example: 'user' })
  @IsString()
  role: string;

  @ApiProperty({ example: 'Analyze Arsenal vs Chelsea' })
  @IsString()
  content: string;
}

export class AiChatDto {
  @ApiProperty({
    description: 'User inquiry or conversational prompt for the AI assistant',
    example: 'What are the key risks if I back Arsenal today?',
  })
  @IsNotEmpty()
  @IsString()
  query: string;

  @ApiPropertyOptional({
    description: 'Optional bet ID to provide context for the conversation',
    example: 'bet_cuid123',
  })
  @IsOptional()
  @IsString()
  bet_id?: string;

  @ApiPropertyOptional({
    description: 'Previous chat history turns',
    type: [ChatMessageDto],
  })
  @IsOptional()
  @IsArray()
  history?: ChatMessageDto[];
}
