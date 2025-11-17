import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TodosService } from './todos.service';
import { TodosController } from './todos.controller';
import { Todo } from './todo.entity';
import { Team } from '../teams/team.entity';
import { TeamMembership } from '../teams/team-membership.entity';
import { User } from '../users/user.entity';
import { RealtimeModule } from '../realtime/realtime.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Todo, Team, TeamMembership, User]),
    RealtimeModule,
    NotificationsModule,
  ],
  controllers: [TodosController],
  providers: [TodosService],
  exports: [TodosService],
})
export class TodosModule {}

