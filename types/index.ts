export interface User {
  id: string;
  username: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  role: "USER" | "ADMIN";
  createdAt: string;
}

export interface ShortLink {
  id: string;
  code: string;
  destinationUrl: string;
  title?: string;
  clickCount: number;
  expiresAt?: string;
  isActive: boolean;
  hasPassword?: boolean;
  createdAt: string;
  shortUrl: string;
}

export interface BioPage {
  id: string;
  slug: string;
  title: string;
  bio?: string;
  avatarUrl?: string;
  theme: string;
  isPublished: boolean;
  links: BioLink[];
  socialLinks?: Record<string, string>;
}

export interface BioLink {
  id: string;
  title: string;
  url: string;
  icon?: string;
  position: number;
  isVisible: boolean;
  clickCount: number;
}

// ===========================================
// Forms
// ===========================================

export type QuestionType =
  | "SHORT_TEXT"
  | "LONG_TEXT"
  | "MULTIPLE_CHOICE"
  | "CHECKBOXES"
  | "DROPDOWN"
  | "LINEAR_SCALE"
  | "DATE"
  | "TIME"
  | "FILE_UPLOAD"
  | "SECTION"
  | "STATEMENT"
  | "IMAGE";

export interface QuestionOption {
  id: string;
  label: string;
}

export interface QuestionConfig {
  maxLength?: number;
  min?: number;
  max?: number;
  minLabel?: string;
  maxLabel?: string;
  allowFuture?: boolean;
  accept?: string[];
  maxSizeMb?: number;
  maxFiles?: number;
  imageUrl?: string;
  alt?: string;
}

export interface FormQuestion {
  id: string;
  type: QuestionType;
  title: string;
  description?: string | null;
  position: number;
  isRequired: boolean;
  options?: QuestionOption[] | null;
  config?: QuestionConfig | null;
}

export interface Form {
  id: string;
  slug: string;
  url: string;
  title: string;
  description?: string | null;
  theme: string;
  isPublished: boolean;
  acceptingResponses: boolean;
  collectEmail: boolean;
  oneResponsePerSession: boolean;
  closesAt?: string | null;
  confirmationMessage?: string | null;
  closedMessage?: string | null;
  responseCount: number;
  questionCount?: number;
  questions?: FormQuestion[];
  createdAt: string;
  updatedAt: string;
}

export interface PublicForm {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  theme: string;
  collectEmail: boolean;
  acceptingResponses: boolean;
  closesAt?: string | null;
  confirmationMessage?: string | null;
  closedMessage?: string | null;
  questions: FormQuestion[];
}

export interface FormAnswerInput {
  questionId: string;
  value: unknown;
}

// ===========================================
// Form Dashboards (dynamic visualizations over responses)
// ===========================================

export type WidgetType =
  | "KPI"
  | "BAR"
  | "PIE"
  | "DONUT"
  | "LINE"
  | "SCALE_HISTOGRAM"
  | "TABLE"
  | "WORDCLOUD";

export type WidgetAggregation =
  | "COUNT"
  | "DISTRIBUTION"
  | "AVERAGE"
  | "SUM"
  | "MIN"
  | "MAX"
  | "OVER_TIME";

export type DashboardVisibility = "PRIVATE" | "LINK" | "PUBLIC";

export interface WidgetConfig {
  colors?: string[];
  topN?: number;
  granularity?: "day" | "week" | "month";
  showRawText?: boolean;
  bins?: number;
}

export interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface DashboardWidget {
  id: string;
  questionId: string | null;
  type: WidgetType;
  aggregation: WidgetAggregation;
  title?: string | null;
  position: number;
  config?: WidgetConfig | null;
}

/** Normalized, chart-ready data shapes produced by the backend compute engine. */
export interface WidgetData {
  value?: number | null;
  items?: { label: string; value: number }[];
  series?: { x: string; y: number }[];
  words?: { word: string; count: number }[];
  rows?: string[];
  totalAnswered?: number;
  average?: number | null;
  redacted?: boolean;
}

export interface ComputedWidget extends DashboardWidget {
  data: WidgetData;
}

export interface Dashboard {
  id: string;
  formId: string;
  slug: string;
  url: string;
  title: string;
  description?: string | null;
  theme: string;
  isPublished: boolean;
  visibility: DashboardVisibility;
  hasPassword: boolean;
  layout?: LayoutItem[] | null;
  widgets: DashboardWidget[];
  createdAt: string;
  updatedAt: string;
}

export interface DashboardListItem {
  id: string;
  slug: string;
  url: string;
  title: string;
  isPublished: boolean;
  visibility: DashboardVisibility;
  hasPassword: boolean;
  widgetCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PublicDashboard {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  theme: string;
  layout?: LayoutItem[] | null;
  hasPassword: boolean;
  requiresPassword: boolean;
  widgets?: ComputedWidget[];
}

/** One entry of the widget compatibility matrix (GET /dashboards/meta/widget-types). */
export interface WidgetCompatibilityEntry {
  questionType: QuestionType | "FORM_LEVEL";
  widgets: { type: WidgetType; aggregations: WidgetAggregation[] }[];
}

export interface UploadedFileRef {
  url: string;
  name: string;
  size: number;
  mime: string;
}
