import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotifications1731800000000 implements MigrationInterface {
  name = 'AddNotifications1731800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "notifications_type_enum" AS ENUM (
        'todo.created',
        'todo.updated',
        'todo.deleted'
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "type" "notifications_type_enum" NOT NULL,
        "message" character varying NOT NULL,
        "read" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "userId" uuid NOT NULL,
        "teamId" uuid,
        CONSTRAINT "FK_notifications_user" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_notifications_team" FOREIGN KEY ("teamId") REFERENCES "teams" ("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "notifications"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "notifications_type_enum"`);
  }
}


