import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './notification.entity';
import { User } from '../users/user.entity';
import { Team } from '../teams/team.entity';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepository: Repository<Notification>,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async listForUser(userId: string) {
    return this.notificationsRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async createForUsers(params: {
    userIds: string[];
    team?: Team;
    type: NotificationType;
    message: string;
  }) {
    const { userIds, team, type, message } = params;
    const notifications: Notification[] = [];

    for (const userId of userIds) {
      const notification = this.notificationsRepository.create({
        user: { id: userId } as User,
        team,
        type,
        message,
      });
      notifications.push(notification);
    }

    const saved = await this.notificationsRepository.save(notifications);

    // Emit websocket event per user
    for (const notification of saved) {
      this.realtimeGateway.notifyUser(notification.user.id, 'notification.created', notification);
    }

    return saved;
  }
}


