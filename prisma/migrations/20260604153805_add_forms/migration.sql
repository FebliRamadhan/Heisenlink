-- CreateEnum
CREATE TYPE "FormQuestionType" AS ENUM ('SHORT_TEXT', 'LONG_TEXT', 'MULTIPLE_CHOICE', 'CHECKBOXES', 'DROPDOWN', 'LINEAR_SCALE', 'DATE', 'TIME', 'FILE_UPLOAD', 'SECTION', 'STATEMENT');

-- CreateTable
CREATE TABLE "forms" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Untitled form',
    "description" TEXT,
    "theme" TEXT NOT NULL DEFAULT 'default',
    "settings" JSONB,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "accepting_responses" BOOLEAN NOT NULL DEFAULT true,
    "collect_email" BOOLEAN NOT NULL DEFAULT false,
    "one_response_per_session" BOOLEAN NOT NULL DEFAULT true,
    "closes_at" TIMESTAMP(3),
    "confirmation_message" TEXT,
    "closed_message" TEXT,
    "response_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_questions" (
    "id" TEXT NOT NULL,
    "form_id" TEXT NOT NULL,
    "type" "FormQuestionType" NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "description" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "options" JSONB,
    "config" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_responses" (
    "id" TEXT NOT NULL,
    "form_id" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "respondent_email" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "form_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_answers" (
    "id" TEXT NOT NULL,
    "response_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "text_value" TEXT,
    "number_value" DOUBLE PRECISION,
    "date_value" TIMESTAMP(3),
    "option_id" TEXT,
    "file_url" TEXT,
    "file_name" TEXT,
    "file_size" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "form_answers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "forms_slug_key" ON "forms"("slug");

-- CreateIndex
CREATE INDEX "forms_user_id_idx" ON "forms"("user_id");

-- CreateIndex
CREATE INDEX "forms_slug_idx" ON "forms"("slug");

-- CreateIndex
CREATE INDEX "form_questions_form_id_idx" ON "form_questions"("form_id");

-- CreateIndex
CREATE INDEX "form_responses_form_id_idx" ON "form_responses"("form_id");

-- CreateIndex
CREATE INDEX "form_responses_submitted_at_idx" ON "form_responses"("submitted_at");

-- CreateIndex
CREATE UNIQUE INDEX "form_responses_form_id_idempotency_key_key" ON "form_responses"("form_id", "idempotency_key");

-- CreateIndex
CREATE INDEX "form_answers_response_id_idx" ON "form_answers"("response_id");

-- CreateIndex
CREATE INDEX "form_answers_question_id_idx" ON "form_answers"("question_id");

-- AddForeignKey
ALTER TABLE "forms" ADD CONSTRAINT "forms_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_questions" ADD CONSTRAINT "form_questions_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_responses" ADD CONSTRAINT "form_responses_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_answers" ADD CONSTRAINT "form_answers_response_id_fkey" FOREIGN KEY ("response_id") REFERENCES "form_responses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_answers" ADD CONSTRAINT "form_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "form_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
