import api, { unwrap } from "@/lib/api";
import type {
  ApiEnvelope,
  AssignRolePermissionsPayload,
  PaginatedResponse,
  PermissionItem,
  RoleItem,
  RoleListParams,
  RolePayload,
  RolePermissionResult,
} from "@/types/user-management/user.type";

function cleanParams<T extends Record<string, unknown>>(params: T = {} as T) {
  const output: Record<string, unknown> = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "" || value === "all") return;
    output[key] = value;
  });
  return output;
}

function paginated<T>(body: any): PaginatedResponse<T> {
  const data = Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : [];
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

export const roleService = {
  async list(params: RoleListParams = {}) {
    const response = await api.get("/admin/roles", { params: cleanParams(params) });
    return paginated<RoleItem>(response.data);
  },

  async create(payload: RolePayload) {
    const response = await api.post("/admin/roles", payload);
    return unwrap<ApiEnvelope<RoleItem>>(response);
  },

  async update(id: number | string, payload: RolePayload) {
    const response = await api.put(`/admin/roles/${id}`, payload);
    return unwrap<ApiEnvelope<RoleItem>>(response);
  },

  async permissionCatalog() {
    const response = await api.get("/admin/role-permissions");
    const body = response.data;
    return Array.isArray(body?.data) ? (body.data as PermissionItem[]) : [];
  },

  async rolePermissions(id: number | string) {
    const response = await api.get(`/admin/roles/${id}/permissions`);
    const body = response.data;
    return Array.isArray(body?.data) ? (body.data as PermissionItem[]) : [];
  },

  async assignPermissions(id: number | string, payload: AssignRolePermissionsPayload) {
    const response = await api.post(`/admin/roles/${id}/permissions`, payload);
    return unwrap<ApiEnvelope<RolePermissionResult>>(response);
  },
};

export default roleService;
