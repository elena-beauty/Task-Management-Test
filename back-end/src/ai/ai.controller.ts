import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiSuggestionDto } from './dto/ai-suggestion.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('suggestions')
  suggest(@Body() dto: AiSuggestionDto) {
    return this.aiService.suggestTask(dto);
  }
}

