import api from "@/lib/api";
import type {
  Dashboard,
  DashboardListItem,
  DashboardWidget,
  ComputedWidget,
  LayoutItem,
  WidgetCompatibilityEntry,
  WidgetConfig,
  WidgetType,
  WidgetAggregation,
  DashboardVisibility,
} from "@/types";

const unwrap = <T>(res: { data: { data: T } }): T => res.data.data;

export interface WidgetInput {
  questionId?: string | null;
  type: WidgetType;
  aggregation: WidgetAggregation;
  title?: string | null;
  config?: WidgetConfig | null;
  position?: number;
}

export const dashboardsApi = {
  listForForm: async (formId: string): Promise<DashboardListItem[]> =>
    unwrap(await api.get("/dashboards", { params: { formId } })),

  create: async (formId: string, title?: string): Promise<Dashboard> =>
    unwrap(await api.post("/dashboards", { formId, title })),

  get: async (id: string): Promise<Dashboard> =>
    unwrap(await api.get(`/dashboards/${id}`)),

  getData: async (
    id: string,
  ): Promise<{ dashboardId: string; widgets: ComputedWidget[] }> =>
    unwrap(await api.get(`/dashboards/${id}/data`)),

  update: async (
    id: string,
    patch: Partial<{
      title: string;
      description: string | null;
      slug: string;
      theme: string;
      isPublished: boolean;
      visibility: DashboardVisibility;
      layout: LayoutItem[] | null;
    }>,
  ): Promise<Dashboard> => unwrap(await api.patch(`/dashboards/${id}`, patch)),

  remove: async (id: string): Promise<void> => {
    await api.delete(`/dashboards/${id}`);
  },

  setPassword: async (
    id: string,
    password: string | null,
  ): Promise<{ hasPassword: boolean }> =>
    unwrap(await api.post(`/dashboards/${id}/password`, { password })),

  addWidget: async (
    id: string,
    widget: WidgetInput,
  ): Promise<DashboardWidget> =>
    unwrap(await api.post(`/dashboards/${id}/widgets`, widget)),

  updateWidget: async (
    id: string,
    widgetId: string,
    patch: Partial<WidgetInput>,
  ): Promise<DashboardWidget> =>
    unwrap(await api.patch(`/dashboards/${id}/widgets/${widgetId}`, patch)),

  deleteWidget: async (id: string, widgetId: string): Promise<void> => {
    await api.delete(`/dashboards/${id}/widgets/${widgetId}`);
  },

  widgetTypes: async (): Promise<WidgetCompatibilityEntry[]> => {
    const res = await api.get("/dashboards/meta/widget-types");
    return res.data.data.compatibility;
  },
};
