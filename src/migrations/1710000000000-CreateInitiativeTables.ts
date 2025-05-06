import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInitiativeTables1710000000000 implements MigrationInterface {
  name = 'CreateInitiativeTables1710000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`
      CREATE TYPE "public"."initiative_status_enum" AS ENUM ('Draft', 'Reviewing', 'Approved', 'Uploaded')
    `);
    await queryRunner.query(`
      CREATE TYPE "public"."revision_type_enum" AS ENUM ('suggestion', 'user_edit', 'final')
    `);

    // Create initiative_processes table
    await queryRunner.query(`
      CREATE TABLE "initiative_processes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying NOT NULL,
        "description" text NOT NULL,
        "status" "public"."initiative_status_enum" NOT NULL DEFAULT 'Draft',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "jira_project_key" character varying,
        "jira_epic_link" character varying,
        CONSTRAINT "PK_initiative_processes" PRIMARY KEY ("id")
      )
    `);

    // Create initiative_revisions table
    await queryRunner.query(`
      CREATE TABLE "initiative_revisions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "timestamp" TIMESTAMP NOT NULL DEFAULT now(),
        "type" "public"."revision_type_enum" NOT NULL,
        "tasks" jsonb NOT NULL,
        "metadata" jsonb NOT NULL,
        "process_id" uuid NOT NULL,
        CONSTRAINT "PK_initiative_revisions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_initiative_revisions_process" FOREIGN KEY ("process_id")
          REFERENCES "initiative_processes"("id") ON DELETE CASCADE
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_initiative_processes_status" ON "initiative_processes" ("status")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_initiative_revisions_process" ON "initiative_revisions" ("process_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_initiative_revisions_type" ON "initiative_revisions" ("type")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_initiative_revisions_type"`);
    await queryRunner.query(`DROP INDEX "IDX_initiative_revisions_process"`);
    await queryRunner.query(`DROP INDEX "IDX_initiative_processes_status"`);
    await queryRunner.query(`DROP TABLE "initiative_revisions"`);
    await queryRunner.query(`DROP TABLE "initiative_processes"`);
    await queryRunner.query(`DROP TYPE "public"."revision_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."initiative_status_enum"`);
  }
} 