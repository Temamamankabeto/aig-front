import api, { unwrap } from "@/lib/api";
import type {
  ApiEnvelope,
  AssignRolePermissionsPayload,
  AssignUserRolePayload,
  CreateUserPayload,
  PaginatedResponse,
  PermissionItem,
  PermissionListParams,
  PermissionPayload,
  ResetUserPasswordPayload,
  RoleItem,
  RoleListParams,
  RolePayload,
  RolePermissionResult,
  UpdateUserPayload,
  UserItem,
  UserListParams,
} from "@/types/user-management/user.type";

function cleanParams<T extends Record<string, unknown>>(params: T = {} as T) {
  const output: Record<string, unknown> = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "" || value === "all") return;
    output[key] = value;
  });
  return output;
}

function extractRows<T>(body: unknown): T[] {
  const root = body as Record<string, unknown> | null;
  const data = root && typeof root === "object" ? root.data : undefined;

  if (Array.isArray(body)) return body as T[];
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object" && Array.isArray((data as { data?: unknown }).data)) {
    return (data as { data: T[] }).data;
  }

  return [];
}

function paginated<T>(body: unknown): PaginatedResponse<T> {
  const root = body as { success?: boolean; message?: string; meta?: Record<string, unknown> } | null;
  const rows = extractRows<T>(body);
  const data = root && typeof root === "object" ? root.data : undefined;
  const paginator = data && typeof data === "object" && !Array.isArray(data)
    ? data as Record<string, unknown>
    : root && typeof root === "object"
      ? root as Record<string, unknown>
      : {};
  const meta = root?.meta ?? paginator;

  return {
    success: root?.success,
    message: root?.message,
    data: rows,
    meta: {
      current_page: Number(meta.current_page ?? 1),
      per_page: Number(meta.per_page ?? rows.length ?? 10),
      total: Number(meta.total ?? rows.length ?? 0),
      last_page: Number(meta.last_page ?? 1),
    },
  };
}

export const userManagementService = {
  users: {
    async list(params: UserListParams = {}) {
      const response = await api.get("/admin/users", { params: cleanParams(params) });
      return paginated<UserItem>(response.data);
    },

    async show(id: number | string) {
      const response = await api.get(`/admin/users/${id}`);
      return unwrap<ApiEnvelope<UserItem>>(response).data;
    },

    async create(payload: CreateUserPayload) {
      const response = await api.post("/admin/users", payload);
      return unwrap<ApiEnvelope<UserItem>>(response);
    },

    async update(id: number | string, payload: UpdateUserPayload) {
      const response = await api.put(`/admin/users/${id}`, payload);
      return unwrap<ApiEnvelope<UserItem>>(response);
    },

    async remove(id: number | string) {
      const response = await api.delete(`/admin/users/${id}`);
      return unwrap<ApiEnvelope<null>>(response);
    },

    async toggle(id: number | string) {
      const response = await api.patch(`/admin/users/${id}/toggle`);
      return unwrap<ApiEnvelope<UserItem>>(response);
    },

    async resetPassword(id: number | string, payload: ResetUserPasswordPayload) {
      const response = await api.post(`/admin/users/${id}/reset-password`, payload);
      return unwrap<ApiEnvelope<{ id: number | string }>>(response);
    },

    async assignRole(id: number | string, payload: AssignUserRolePayload) {
      const response = await api.post(`/admin/users/${id}/roles`, payload);
      return unwrap<ApiEnvelope<UserItem>>(response);
    },

    async rolesLite() {
      const response = await api.get("/admin/users/roles-lite");
      return extractRows<RoleItem>(response.data);
    },

    async waitersLite(search?: string) {
      const response = await api.get("/admin/users/waiters-lite", { params: cleanParams({ search }) });
      return extractRows<UserItem>(response.data);
    },
  },

  roles: {
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

    async permissions(search?: string) {
      const response = await api.get("/admin/role-permissions", { params: cleanParams({ search }) });
      return extractRows<PermissionItem>(response.data);
    },

    async rolePermissions(id: number | string) {
      const response = await api.get(`/admin/roles/${id}/permissions`);
      return extractRows<PermissionItem>(response.data);
    },

    async assignPermissions(id: number | string, payload: AssignRolePermissionsPayload) {
      const response = await api.post(`/admin/roles/${id}/permissions`, payload);
      return unwrap<ApiEnvelope<RolePermissionResult>>(response);
    },
  },

  permissions: {
    async list(params: PermissionListParams = {}) {
      const response = await api.get("/admin/permissions", { params: cleanParams(params) });
      return paginated<PermissionItem>(response.data);
    },

    async all(search?: string) {
      const response = await api.get("/admin/permissions", { params: cleanParams({ all: true, search }) });
      return extractRows<PermissionItem>(response.data);
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
  },
};

export const userService = userManagementService.users;
export const roleService = userManagementService.roles;
export const permissionService = userManagementService.permissions;

export default userManagementService;
