import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Team } from '../teams/team.entity';
import { User } from '../users/user.entity';

export enum TodoStatus {
  BACKLOG = 'backlog',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
  BLOCKED = 'blocked',
}

@Entity('todos')
export class Todo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'timestamp', nullable: true })
  dueDate?: Date | null;

  @Column({
    type: 'enum',
    enum: TodoStatus,
    default: TodoStatus.BACKLOG,
  })
  status: TodoStatus;

  @ManyToOne(() => Team, (team) => team.todos, { onDelete: 'CASCADE' })
  team: Team;

  @ManyToOne(() => User, (user) => user.assignedTodos, {
    nullable: true,
    eager: true,
  })
  assignee?: User | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

