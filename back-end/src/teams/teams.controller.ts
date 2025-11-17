import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { TeamsService } from './teams.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { CreateTeamDto } from './dto/create-team.dto';
import { AddTeamMemberDto } from './dto/add-team-member.dto';
import { InviteTeamMemberDto } from './dto/invite-team-member.dto';

@UseGuards(JwtAuthGuard)
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get()
  getMyTeams(@CurrentUser() user: JwtPayload) {
    return this.teamsService.getTeamsForUser(user.sub);
  }

  @Post()
  createTeam(@CurrentUser() user: JwtPayload, @Body() dto: CreateTeamDto) {
    return this.teamsService.createTeam(user.sub, dto);
  }

  @Get(':teamId/members')
  getMembers(@CurrentUser() user: JwtPayload, @Param('teamId') teamId: string) {
    return this.teamsService.getMembers(teamId, user.sub);
  }

  @Post(':teamId/members')
  addMember(
    @CurrentUser() user: JwtPayload,
    @Param('teamId') teamId: string,
    @Body() dto: AddTeamMemberDto,
  ) {
    return this.teamsService.addMember(teamId, user.sub, dto);
  }

  @Post(':teamId/invite')
  inviteMember(
    @CurrentUser() user: JwtPayload,
    @Param('teamId') teamId: string,
    @Body() dto: InviteTeamMemberDto,
  ) {
    return this.teamsService.inviteMember(teamId, user.sub, dto);
  }
}

