"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { roleService } from "@/services/user-management/role.service";
import { userManagementKeys } from "./use-users";

import type {
  AssignRolePermissionsPayload,
  RoleListParams,
  RolePayload,
} from "@/types/user-management/user.type";

export function useRolesQuery(params: RoleListParams = {}) {
  return useQuery({
    queryKey: userManagementKeys.rolesList(params),
    queryFn: () => roleService.list(params),
  });
}
export function useAvailableRolePermissionsQuery(search?: string) {
  return useQuery({
    queryKey: userManagementKeys.availableRolePermissions(search),
    queryFn: () => roleService.permissionCatalog(),
  });
}

export function useRolePermissionsQuery(id?: number | string) {
  return useQuery({
    queryKey: userManagementKeys.rolePermissions(id ?? "none"),
    queryFn: () => roleService.rolePermissions(id as number | string),
    enabled: !!id,
  });
}

export function useCreateRoleMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: RolePayload) =>
      roleService.create(payload),

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: userManagementKeys.roles(),
      });
    },
  });
}

export function useUpdateRoleMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number | string;
      payload: RolePayload;
    }) => roleService.update(id, payload),

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: userManagementKeys.roles(),
      });
    },
  });
}

export function useAssignRolePermissionsMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number | string;
      payload: AssignRolePermissionsPayload;
    }) => roleService.assignPermissions(id, payload),

    onSuccess: (_data, variables) => {
      qc.invalidateQueries({
        queryKey: userManagementKeys.rolePermissions(
          variables.id
        ),
      });
    },
  });
}