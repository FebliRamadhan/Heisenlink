/*
  Warnings:

  - A unique constraint covering the columns `[sso_provider,sso_provider_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "short_links" ADD COLUMN     "show_confirmation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "starts_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "sso_provider" TEXT,
ADD COLUMN     "sso_provider_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_sso_provider_sso_provider_id_key" ON "users"("sso_provider", "sso_provider_id");
