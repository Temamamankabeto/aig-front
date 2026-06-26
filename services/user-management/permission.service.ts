import api, { unwrap } from "@/lib/api";
import type { ApiEnvelope, PaginatedResponse, PermissionItem, PermissionListParams, PermissionPayload } from "@/types/user-management/user.type";

function cleanParams<T extends Record<string, unknown>>(params: T = {} as T) {
  const output: Record<string, unknown> = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    output[key] = value;
  });
  return output;
}

function paginated<T>(body: any): PaginatedResponse<T> {
  const data = Array.isArray(body?.data) ? body.data : [];
  const meta = body?.meta ?? {};
  return {
    success: body?.success,
    message: body?.message,
    data,
    meta: {
      current_page: Number(meta.current_page ?? 1),
      per_page: Number(meta.per_page ?? data.length ?? 10),
      total: Number(meta.total ?? data.length ?? 0),
      last_page: Number(meta.last_page ?? 1),
    },
  };
}

export const permissionService = {
  async list(params: PermissionListParams = {}) {
    const response = await api.get("/admin/permissions", { params: cleanParams(params) });
    return paginated<PermissionItem>(response.data);
  },

  async all(search?: string) {
    const response = await api.get("/admin/permissions", { params: cleanParams({ all: true, search }) });
    const body = response.data;
    return Array.isArray(body?.data) ? (body.data as PermissionItem[]) : [];
  },

  async create(payload: PermissionPayload) {
    const response = await api.post("/admin/permissions", payload);
    return unwrap<ApiEnvelope<PermissionItem>>(response);
  },

  async update(id: number | string, payload: PermissionPayload) {
    const response = await api.put(`/admin/permissions/${id}`, payload);
    return unwrap<ApiEnvelope<PermissionItem>>(response);
  },

  async remove(id: number | string) {
    const response = await api.delete(`/admin/permissions/${id}`);
    return unwrap<ApiEnvelope<null>>(response);
  },
};

export default permissionService;
