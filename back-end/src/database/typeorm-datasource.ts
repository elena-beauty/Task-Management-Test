import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { User } from '../users/user.entity';
import { Team } from '../teams/team.entity';
import { TeamMembership } from '../teams/team-membership.entity';
import { Todo } from '../todos/todo.entity';
import { Notification } from '../notifications/notification.entity';

config();

const isProduction = process.env.NODE_ENV === 'production';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST ?? 'localhost',
  port: Number(process.env.POSTGRES_PORT ?? 5432),
  username: process.env.POSTGRES_USER ?? 'postgres',
  password: process.env.POSTGRES_PASSWORD ?? 'postgres',
  database: process.env.POSTGRES_DB ?? 'team_tasks',
  synchronize: false,
  logging: !isProduction,
  entities: [User, Team, TeamMembership, Todo, Notification],
  migrations: ['src/database/migrations/*{.ts,.js}'],
});

