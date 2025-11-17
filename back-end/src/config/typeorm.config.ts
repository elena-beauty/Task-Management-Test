import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { Team } from '../teams/team.entity';
import { TeamMembership } from '../teams/team-membership.entity';
import { Todo } from '../todos/todo.entity';
import { Notification } from '../notifications/notification.entity';

export const typeOrmAsyncConfig: TypeOrmModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    type: 'postgres',
    host: configService.get('POSTGRES_HOST', 'localhost'),
    port: Number(configService.get('POSTGRES_PORT', 5432)),
    username: configService.get('POSTGRES_USER', 'postgres'),
    password: configService.get('POSTGRES_PASSWORD', 'postgres'),
    database: configService.get('POSTGRES_DB', 'team_tasks'),
    entities: [User, Team, TeamMembership, Todo, Notification],
    synchronize: configService.get('NODE_ENV') !== 'production',
    logging: configService.get('NODE_ENV') !== 'test',
  }),
};

