import { IsOptional, IsString } from 'class-validator';

export class AiSuggestionDto {
  @IsString()
  prompt: string;

  @IsOptional()
  @IsString()
  teamContext?: string;
}

