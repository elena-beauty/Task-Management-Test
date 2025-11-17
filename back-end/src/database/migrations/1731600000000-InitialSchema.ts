import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1731600000000 implements MigrationInterface {
  name = 'InitialSchema1731600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "email" character varying NOT NULL UNIQUE,
        "name" character varying NOT NULL,
        "passwordHash" character varying NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "teams" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" character varying NOT NULL,
        "description" text,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "ownerId" uuid,
        CONSTRAINT "FK_team_owner" FOREIGN KEY ("ownerId") REFERENCES "users" ("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "team_memberships_role_enum" AS ENUM ('owner', 'member');
    `);

    await queryRunner.query(`
      CREATE TABLE "team_memberships" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "role" "team_memberships_role_enum" NOT NULL DEFAULT 'member',
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "teamId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        CONSTRAINT "FK_membership_team" FOREIGN KEY ("teamId") REFERENCES "teams" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_membership_user" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE,
        CONSTRAINT "UQ_team_member" UNIQUE ("teamId", "userId")
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "todos_status_enum" AS ENUM ('backlog', 'in_progress', 'done', 'blocked');
    `);

    await queryRunner.query(`
      CREATE TABLE "todos" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "title" character varying NOT NULL,
        "description" text,
        "dueDate" TIMESTAMP,
        "status" "todos_status_enum" NOT NULL DEFAULT 'backlog',
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "teamId" uuid NOT NULL,
        "assigneeId" uuid,
        CONSTRAINT "FK_todo_team" FOREIGN KEY ("teamId") REFERENCES "teams" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_todo_assignee" FOREIGN KEY ("assigneeId") REFERENCES "users" ("id") ON DELETE SET NULL
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "todos"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "todos_status_enum"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "team_memberships"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "team_memberships_role_enum"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "teams"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }
}

