-- CreateEnum
CREATE TYPE "FormRole" AS ENUM ('EDITOR', 'VIEWER');

-- CreateTable
CREATE TABLE "form_collaborators" (
    "id" TEXT NOT NULL,
    "form_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "FormRole" NOT NULL DEFAULT 'VIEWER',
    "invited_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "form_collaborators_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "form_collaborators_user_id_idx" ON "form_collaborators"("user_id");

-- CreateIndex
CREATE INDEX "form_collaborators_form_id_idx" ON "form_collaborators"("form_id");

-- CreateIndex
CREATE UNIQUE INDEX "form_collaborators_form_id_user_id_key" ON "form_collaborators"("form_id", "user_id");

-- AddForeignKey
ALTER TABLE "form_collaborators" ADD CONSTRAINT "form_collaborators_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_collaborators" ADD CONSTRAINT "form_collaborators_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
