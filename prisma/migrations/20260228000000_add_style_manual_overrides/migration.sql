-- AlterTable
ALTER TABLE "StyleProfile" ADD COLUMN "manualOverrides" JSONB NOT NULL DEFAULT '{}';
