import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Team } from './team.entity';
import { User } from '../users/user.entity';

export enum TeamRole {
  OWNER = 'owner',
  MEMBER = 'member',
}

@Entity('team_memberships')
@Unique('UQ_team_member', ['team', 'user'])
export class TeamMembership {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Team, (team) => team.memberships, {
    onDelete: 'CASCADE',
  })
  team: Team;

  @ManyToOne(() => User, (user) => user.memberships, {
    eager: true,
    onDelete: 'CASCADE',
  })
  user: User;

  @Column({
    type: 'enum',
    enum: TeamRole,
    default: TeamRole.MEMBER,
  })
  role: TeamRole;

  @CreateDateColumn()
  createdAt: Date;
}

