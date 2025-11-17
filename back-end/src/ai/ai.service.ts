import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { AiSuggestionDto } from './dto/ai-suggestion.dto';

@Injectable()
export class AiService {
  private readonly openai?: OpenAI;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
    this.model = this.configService.get<string>('OPENAI_MODEL') ?? 'gpt-4o-mini';
  }

  async suggestTask(dto: AiSuggestionDto) {
    const { prompt, teamContext } = dto;

    // If OpenAI is not configured, fall back to a simple local suggestion
    if (!this.openai) {
      return this.buildRulesBasedSuggestion(dto);
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You are an assistant that helps teams manage tasks. ' +
              'Given a natural language task description and optional team context, ' +
              'you respond ONLY with a single JSON object matching this TypeScript type:\n' +
              '{\n' +
              '  "titleSuggestion": string; // concise task title (max ~80 chars)\n' +
              '  "descriptionSuggestion": string; // multi-line markdown with concrete steps\n' +
              '  "recommendedStatus": "backlog" | "in_progress" | "done" | "blocked";\n' +
              '  "confidence": number; // between 0 and 1\n' +
              '  "reasoning": string; // short explanation of why you chose this status\n' +
              '}\n' +
              'Do not include any extra keys or text outside the JSON object.',
          },
          {
            role: 'user',
            content: [
              `Task description: "${prompt}"`,
              teamContext ? `Team context: "${teamContext}"` : 'Team context: (none provided)',
            ].join('\n'),
          },
        ],
      });

      const content = completion.choices[0]?.message?.content;

      if (!content) {
        throw new InternalServerErrorException('Empty response from AI provider');
      }

      const parsed = JSON.parse(content) as {
        titleSuggestion?: string;
        descriptionSuggestion?: string;
        recommendedStatus?: 'backlog' | 'in_progress' | 'done' | 'blocked';
        confidence?: number;
        reasoning?: string;
      };

      if (
        !parsed.titleSuggestion ||
        !parsed.descriptionSuggestion ||
        !parsed.recommendedStatus ||
        typeof parsed.confidence !== 'number' ||
        !parsed.reasoning
      ) {
        throw new InternalServerErrorException('Invalid AI response shape');
      }

      const confidence = Math.min(Math.max(parsed.confidence, 0), 1);

      return {
        titleSuggestion: parsed.titleSuggestion.slice(0, 80),
        descriptionSuggestion: parsed.descriptionSuggestion,
        recommendedStatus: parsed.recommendedStatus,
        confidence,
        reasoning: parsed.reasoning,
      };
    } catch (error) {
      // Log the real error for debugging and fall back to a local suggestion
      // eslint-disable-next-line no-console
      console.error('Error while generating AI suggestion:', error);
      return this.buildRulesBasedSuggestion(dto);
    }
  }

  private buildRulesBasedSuggestion(dto: AiSuggestionDto) {
    const prompt = dto.prompt.toLowerCase();
    const hasDeadline =
      prompt.includes('today') ||
      prompt.includes('tomorrow') ||
      prompt.includes('week') ||
      prompt.includes('deadline');
    const isBlocked =
      prompt.includes('blocked') ||
      prompt.includes('stuck') ||
      prompt.includes('cannot') ||
      prompt.includes("can't");

    let recommendedStatus: 'backlog' | 'in_progress' | 'done' | 'blocked' =
      'backlog';
    if (isBlocked) {
      recommendedStatus = 'blocked';
    } else if (prompt.includes('research') || prompt.includes('start')) {
      recommendedStatus = 'in_progress';
    }

    const descriptionLines = [
      'Key steps:',
      dto.teamContext ? `• Coordinate with ${dto.teamContext}` : null,
      '• Break the work into 2–5 concrete subtasks',
      hasDeadline ? '• Prioritize unblockers before the due date' : null,
      isBlocked ? '• Identify blockers and who can help resolve them' : null,
    ].filter(Boolean) as string[];

    const confidence = isBlocked || hasDeadline ? 0.8 : 0.5;

    return {
      titleSuggestion: dto.prompt.slice(0, 80),
      descriptionSuggestion: descriptionLines.join('\n'),
      recommendedStatus,
      confidence,
      reasoning:
        this.openai && this.configService.get<string>('OPENAI_API_KEY')
          ? 'Fell back to a local heuristic because the AI provider response was invalid.'
          : 'Generated via local heuristic because OpenAI is not configured.',
    };
  }
}

