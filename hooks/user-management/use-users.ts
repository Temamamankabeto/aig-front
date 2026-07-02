"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { userService } from "@/services/user-management/user.service";

import type {
  AssignUserRolePayload,
  CreateUserPayload,
  UpdateUserPayload,
  UserListParams,
  ResetUserPasswordPayload,
} from "@/types/user-management/user.type";

export const userManagementKeys = {
  all: ["user-management"] as const,

  // =========================
  // Users
  // =========================
  users: () => [...userManagementKeys.all, "users"] as const,

  usersList: (params: UserListParams = {}) =>
    [...userManagementKeys.users(), "list", params] as const,

  userDetail: (id: number | string) =>
    [...userManagementKeys.users(), "detail", id] as const,

  rolesLite: () =>
    [...userManagementKeys.users(), "roles-lite"] as const,

  waitersLite: (search?: string) =>
    [...userManagementKeys.users(), "waiters-lite", search ?? ""] as const,

  // =========================
  // Roles
  // =========================
  roles: () =>
    [...userManagementKeys.all, "roles"] as const,

  rolesList: (params: Record<string, unknown> = {}) =>
    [...userManagementKeys.roles(), "list", params] as const,

  roleDetail: (id: number | string) =>
    [...userManagementKeys.roles(), "detail", id] as const,

  rolePermissions: (id: number | string) =>
    [...userManagementKeys.roles(), "permissions", id] as const,

  availableRolePermissions: (search?: string) =>
    [...userManagementKeys.roles(), "available-permissions", search ?? ""] as const,

  // =========================
  // Permissions
  // =========================
  permissions: () =>
    [...userManagementKeys.all, "permissions"] as const,

  permissionsList: (params: Record<string, unknown> = {}) =>
    [...userManagementKeys.permissions(), "list", params] as const,

  permissionDetail: (id: number | string) =>
    [...userManagementKeys.permissions(), "detail", id] as const,

  allPermissions: (search?: string) =>
    [...userManagementKeys.permissions(), "all", search ?? ""] as const,
};

export function useUsersQuery(params: UserListParams = {}) {
  return useQuery({
    queryKey: userManagementKeys.usersList(params),
    queryFn: () => userService.list(params),
  });
}

export function useUserQuery(id?: number | string) {
  return useQuery({
    queryKey: userManagementKeys.userDetail(id ?? ""),
    queryFn: () => userService.show(id as number | string),
    enabled: Boolean(id),
  });
}

export function useRolesLiteQuery() {
  return useQuery({
    queryKey: userManagementKeys.rolesLite(),
    queryFn: () => userService.rolesLite(),
  });
}

export function useWaitersLiteQuery(search?: string) {
  return useQuery({
    queryKey: userManagementKeys.waitersLite(search),
    queryFn: () => userService.waitersLite(search),
  });
}

export function useCreateUserMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateUserPayload) =>
      userService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userManagementKeys.users() });
    },
  });
}

export function useUpdateUserMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number | string;
      payload: UpdateUserPayload;
    }) => userService.update(id, payload),

    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: userManagementKeys.users() });
      qc.invalidateQueries({
        queryKey: userManagementKeys.userDetail(variables.id),
      });
    },
  });
}

export function useDeleteUserMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => userService.remove(id),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userManagementKeys.users() });
    },
  });
}

export function useToggleUserMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => userService.toggle(id),

    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: userManagementKeys.users() });
      qc.invalidateQueries({
        queryKey: userManagementKeys.userDetail(id),
      });
    },
  });
}

export function useResetUserPasswordMutation() {
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number | string;
      payload: ResetUserPasswordPayload;
    }) => userService.resetPassword(id, payload),
  });
}

export function useAssignUserRoleMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number | string;
      payload: AssignUserRolePayload;
    }) => userService.assignRole(id, payload),

    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: userManagementKeys.users() });
      qc.invalidateQueries({
        queryKey: userManagementKeys.userDetail(variables.id),
      });
    },
  });
}
