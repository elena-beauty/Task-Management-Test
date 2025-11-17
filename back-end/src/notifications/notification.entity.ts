import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Team } from '../teams/team.entity';

export enum NotificationType {
  TODO_CREATED = 'todo.created',
  TODO_UPDATED = 'todo.updated',
  TODO_DELETED = 'todo.deleted',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', eager: true })
  user: User;

  @ManyToOne(() => Team, { onDelete: 'CASCADE', nullable: true })
  team?: Team | null;

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column()
  message: string;

  @Column({ default: false })
  read: boolean;

  @CreateDateColumn()
  createdAt: Date;
}


