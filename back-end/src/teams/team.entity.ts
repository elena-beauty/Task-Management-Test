import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { TeamMembership } from './team-membership.entity';
import { Todo } from '../todos/todo.entity';

@Entity('teams')
export class Team {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @ManyToOne(() => User, { eager: true })
  owner: User;

  @OneToMany(() => TeamMembership, (membership) => membership.team)
  memberships: TeamMembership[];

  @OneToMany(() => Todo, (todo) => todo.team)
  todos: Todo[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

