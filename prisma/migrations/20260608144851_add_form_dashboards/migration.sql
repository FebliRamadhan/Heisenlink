-- CreateEnum
CREATE TYPE "WidgetType" AS ENUM ('KPI', 'BAR', 'PIE', 'DONUT', 'LINE', 'SCALE_HISTOGRAM', 'TABLE', 'WORDCLOUD');

-- CreateEnum
CREATE TYPE "WidgetAggregation" AS ENUM ('COUNT', 'DISTRIBUTION', 'AVERAGE', 'SUM', 'MIN', 'MAX', 'OVER_TIME');

-- CreateEnum
CREATE TYPE "DashboardVisibility" AS ENUM ('PRIVATE', 'LINK', 'PUBLIC');

-- CreateTable
CREATE TABLE "form_dashboards" (
    "id" TEXT NOT NULL,
    "form_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Untitled dashboard',
    "description" TEXT,
    "theme" TEXT NOT NULL DEFAULT 'default',
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "visibility" "DashboardVisibility" NOT NULL DEFAULT 'PRIVATE',
    "password_hash" TEXT,
    "layout" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_dashboards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dashboard_widgets" (
    "id" TEXT NOT NULL,
    "dashboard_id" TEXT NOT NULL,
    "question_id" TEXT,
    "type" "WidgetType" NOT NULL,
    "aggregation" "WidgetAggregation" NOT NULL,
    "title" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "config" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dashboard_widgets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "form_dashboards_slug_key" ON "form_dashboards"("slug");

-- CreateIndex
CREATE INDEX "form_dashboards_form_id_idx" ON "form_dashboards"("form_id");

-- CreateIndex
CREATE INDEX "form_dashboards_user_id_idx" ON "form_dashboards"("user_id");

-- CreateIndex
CREATE INDEX "form_dashboards_slug_idx" ON "form_dashboards"("slug");

-- CreateIndex
CREATE INDEX "dashboard_widgets_dashboard_id_idx" ON "dashboard_widgets"("dashboard_id");

-- AddForeignKey
ALTER TABLE "form_dashboards" ADD CONSTRAINT "form_dashboards_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dashboard_widgets" ADD CONSTRAINT "dashboard_widgets_dashboard_id_fkey" FOREIGN KEY ("dashboard_id") REFERENCES "form_dashboards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dashboard_widgets" ADD CONSTRAINT "dashboard_widgets_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "form_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
