# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added — Form Dashboards (dynamic, shareable visualizations of responses)

A form creator can now build a **dashboard** of **widgets** over a form's
responses — choosing the data source, the visualization, and the statistic —
arrange them on a drag-resize grid, then **publish and share** it via its own
link (mirroring the form/shortlink sharing model).

- **Data model**: `FormDashboard` and `DashboardWidget` models, plus
  `WidgetType` / `WidgetAggregation` / `DashboardVisibility` enums and the
  `add_form_dashboards` migration.
- **8 widget types**: `KPI`, `BAR`, `PIE`, `DONUT`, `LINE`, `SCALE_HISTOGRAM`,
  `TABLE`, `WORDCLOUD`. Compatible types are offered per question type via a
  single source-of-truth matrix (`widget-compatibility.js`, exposed at
  `GET /api/dashboards/meta/widget-types`).
- **Compute engine** (`dashboard-data.service.js`): per-widget aggregation
  (count, distribution, average/sum/min/max, responses-over-time, word
  frequency) built on shared primitives extracted into
  `question-aggregation.js` (also reused by the existing response summary).
- **Sharing & privacy**: publish + `PRIVATE` / `LINK` / `PUBLIC` visibility,
  optional bcrypt password protection, ISR (`revalidate: 60`) + `dashboard:{slug}`
  cache tag invalidated on new submissions. Respondent email/IP are never
  exposed publicly; free-text is redacted unless a widget opts in via
  `showRawText` (with a PII warning in the builder).
- **API**: `/api/dashboards` CRUD + widgets (with reorder), owner data preview
  (`GET /:id/data`), and public read (`GET /api/dashboards/public/:slug` +
  `POST /.../verify-password`).
- **Frontend**: dashboard builder under
  `app/(dashboard)/dashboard/forms/[id]/dashboards/` (react-grid-layout canvas,
  compatibility-filtered widget picker, live recharts preview, share dialog with
  copy-link + QR), a public SSR page at `app/d/[slug]`, and a "Dashboards" entry
  on the form editor. A reusable `WidgetRenderer` powers both the builder preview
  and the public page.

### Changed

- `form-aggregation.service.js` `getSummary` now reuses the extracted
  `question-aggregation.js` primitives instead of duplicating grouping logic.
- New runtime dependency: `react-grid-layout` (pinned to `1.5.0`).

[Unreleased]: https://github.com/FebliRamadhan/linkhub/compare/main...HEAD
