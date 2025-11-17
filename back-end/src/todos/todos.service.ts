import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Todo, TodoStatus } from './todo.entity';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { Team } from '../teams/team.entity';
import { TeamMembership } from '../teams/team-membership.entity';
import { User } from '../users/user.entity';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/notification.entity';

@Injectable()
export class TodosService {
  constructor(
    @InjectRepository(Todo)
    private readonly todosRepository: Repository<Todo>,
    @InjectRepository(Team)
    private readonly teamsRepository: Repository<Team>,
    @InjectRepository(TeamMembership)
    private readonly membershipsRepository: Repository<TeamMembership>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly realtimeGateway: RealtimeGateway,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(userId: string, dto: CreateTodoDto) {
    const team = await this.ensureTeamAccess(dto.teamId, userId);
    let assignee: User | null = null;
    if (dto.assigneeId) {
      await this.ensureTeamAccess(dto.teamId, dto.assigneeId);
      assignee = await this.usersRepository.findOne({
        where: { id: dto.assigneeId },
      });
    }
    const todo = this.todosRepository.create({
      title: dto.title,
      description: dto.description,
      status: dto.status ?? TodoStatus.BACKLOG,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      team,
      assignee: assignee ?? undefined,
    });
    const saved = await this.todosRepository.save<Todo>(todo);
    await this.realtimeGateway.broadcastTodoChange(
      team.id,
      'todo.created',
      saved,
    );

    // Notify the assignee (if any and not the actor) that they were assigned
    if (saved.assignee && saved.assignee.id !== userId) {
      await this.notificationsService.createForUsers({
        userIds: [saved.assignee.id],
        team,
        type: NotificationType.TODO_CREATED,
        message: `You were assigned task "${saved.title}"`,
      });
    }

    return this.findOne(saved.id, userId);
  }

  async findAllForTeam(teamId: string, userId: string) {
    await this.ensureTeamAccess(teamId, userId);
    return this.todosRepository.find({
      where: { team: { id: teamId } },
      relations: ['assignee', 'team'],
      order: { dueDate: 'ASC', createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string) {
    const todo = await this.todosRepository.findOne({
      where: { id },
      relations: ['assignee', 'team'],
    });
    if (!todo) {
      throw new NotFoundException('Todo not found');
    }
    await this.ensureTeamAccess(todo.team.id, userId);
    return todo;
  }

  async update(id: string, userId: string, dto: UpdateTodoDto) {
    const todo = await this.findOne(id, userId);
    const previousAssigneeId = todo.assignee?.id ?? null;
    if (dto.assigneeId) {
      await this.ensureTeamAccess(todo.team.id, dto.assigneeId);
      todo.assignee =
        (await this.usersRepository.findOne({
          where: { id: dto.assigneeId },
        })) ?? null;
    }
    if (dto.assigneeId === null) {
      todo.assignee = null;
    }
    Object.assign(todo, {
      title: dto.title ?? todo.title,
      description: dto.description ?? todo.description,
      status: dto.status ?? todo.status,
      dueDate:
        dto.dueDate === undefined
          ? todo.dueDate
          : dto.dueDate
          ? new Date(dto.dueDate)
          : null,
    });
    const updated = await this.todosRepository.save(todo);
    await this.realtimeGateway.broadcastTodoChange(
      todo.team.id,
      'todo.updated',
      updated,
    );

    const currentAssigneeId = updated.assignee?.id ?? null;

    // If there is a current assignee different from the actor, notify them
    if (currentAssigneeId && currentAssigneeId !== userId) {
      await this.notificationsService.createForUsers({
        userIds: [currentAssigneeId],
        team: todo.team,
        type: NotificationType.TODO_UPDATED,
        message: `Task "${updated.title}" was updated`,
      });
    }

    // If assignee changed from someone else to someone new, notify the new assignee they were assigned
    if (
      currentAssigneeId &&
      previousAssigneeId !== currentAssigneeId &&
      currentAssigneeId !== userId
    ) {
      await this.notificationsService.createForUsers({
        userIds: [currentAssigneeId],
        team: todo.team,
        type: NotificationType.TODO_UPDATED,
        message: `You were assigned task "${updated.title}"`,
      });
    }

    return updated;
  }

  async remove(id: string, userId: string) {
    const todo = await this.findOne(id, userId);
    const assigneeId = todo.assignee?.id ?? null;

    await this.todosRepository.delete(id);
    await this.realtimeGateway.broadcastTodoChange(
      todo.team.id,
      'todo.deleted',
      {
        id,
        teamId: todo.team.id,
      },
    );

    if (assigneeId && assigneeId !== userId) {
      await this.notificationsService.createForUsers({
        userIds: [assigneeId],
        team: todo.team,
        type: NotificationType.TODO_DELETED,
        message: `Task "${todo.title}" was deleted`,
      });
    }

    return { deleted: true };
  }

  private async ensureTeamAccess(teamId: string, userId: string) {
    const membership = await this.membershipsRepository.findOne({
      where: { team: { id: teamId }, user: { id: userId } },
      relations: ['team'],
    });
    if (!membership) {
      throw new ForbiddenException('You are not part of this team');
    }
    return membership.team;
  }
}

