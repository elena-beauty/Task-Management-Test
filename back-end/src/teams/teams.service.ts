import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from './team.entity';
import { TeamMembership, TeamRole } from './team-membership.entity';
import { UsersService } from '../users/users.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { AddTeamMemberDto } from './dto/add-team-member.dto';
import { InviteTeamMemberDto } from './dto/invite-team-member.dto';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team)
    private readonly teamsRepository: Repository<Team>,
    @InjectRepository(TeamMembership)
    private readonly membershipsRepository: Repository<TeamMembership>,
    private readonly usersService: UsersService,
  ) {}

  async createTeam(ownerId: string, dto: CreateTeamDto) {
    const owner = await this.usersService.findById(ownerId);
    const team = this.teamsRepository.create({
      name: dto.name,
      description: dto.description,
      owner,
    });
    const created = await this.teamsRepository.save(team);
    const membership = this.membershipsRepository.create({
      team: created,
      user: owner,
      role: TeamRole.OWNER,
    });
    await this.membershipsRepository.save(membership);
    return this.findTeamById(created.id, ownerId);
  }

  async findTeamById(teamId: string, userId: string) {
    await this.ensureMembership(teamId, userId);
    return this.teamsRepository.findOne({
      where: { id: teamId },
      relations: ['owner'],
    });
  }

  async getTeamsForUser(userId: string) {
    const memberships = await this.membershipsRepository.find({
      where: { user: { id: userId } },
      relations: ['team', 'team.owner'],
      order: { createdAt: 'ASC' },
    });
    return memberships.map((membership) => ({
      ...membership.team,
      role: membership.role,
    }));
  }

  async addMember(teamId: string, actorId: string, dto: AddTeamMemberDto) {
    const team = await this.teamsRepository.findOne({
      where: { id: teamId },
      relations: ['owner'],
    });
    if (!team) {
      throw new NotFoundException('Team not found');
    }
    const actor = await this.membershipsRepository.findOne({
      where: { team: { id: teamId }, user: { id: actorId } },
    });
    if (!actor || actor.role !== TeamRole.OWNER) {
      throw new ForbiddenException('Only team owners can add members');
    }
    let user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      // Auto-create a new user with the default password so they can log in
      user = await this.usersService.createUser({
        name: dto.name ?? dto.email,
        email: dto.email,
        password: 'Passw0rd!',
      });
    }
    const existing = await this.membershipsRepository.findOne({
      where: { team: { id: teamId }, user: { id: user.id } },
    });
    if (existing) {
      return existing;
    }
    const membership = this.membershipsRepository.create({
      team,
      user,
      role: dto.role ?? TeamRole.MEMBER,
    });
    return this.membershipsRepository.save(membership);
  }

  async inviteMember(teamId: string, actorId: string, dto: InviteTeamMemberDto) {
    const team = await this.teamsRepository.findOne({
      where: { id: teamId },
      relations: ['owner'],
    });
    if (!team) {
      throw new NotFoundException('Team not found');
    }

    const actor = await this.membershipsRepository.findOne({
      where: { team: { id: teamId }, user: { id: actorId } },
    });
    if (!actor || actor.role !== TeamRole.OWNER) {
      throw new ForbiddenException('Only team owners can invite members');
    }

    let user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      // Create a new user with the default password so they can log in
      user = await this.usersService.createUser({
        name: dto.name,
        email: dto.email,
        password: 'Passw0rd!',
      });
    }

    const existing = await this.membershipsRepository.findOne({
      where: { team: { id: teamId }, user: { id: user.id } },
    });
    if (existing) {
      return existing;
    }

    const membership = this.membershipsRepository.create({
      team,
      user,
      role: dto.role ?? TeamRole.MEMBER,
    });
    return this.membershipsRepository.save(membership);
  }

  async getMembers(teamId: string, userId: string) {
    await this.ensureMembership(teamId, userId);
    return this.membershipsRepository.find({
      where: { team: { id: teamId } },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
  }

  private async ensureMembership(teamId: string, userId: string) {
    const membership = await this.membershipsRepository.findOne({
      where: { team: { id: teamId }, user: { id: userId } },
    });
    if (!membership) {
      throw new ForbiddenException('You are not a member of this team');
    }
    return membership;
  }
}

