import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { TeamRole } from '../team-membership.entity';

export class InviteTeamMemberDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsEnum(TeamRole)
  role?: TeamRole;
}


