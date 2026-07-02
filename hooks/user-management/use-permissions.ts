"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { permissionService } from "@/services/user-management/permission.service";
import { userManagementKeys } from "./use-users";

import type {
  PermissionListParams,
  PermissionPayload,
} from "@/types/user-management/user.type";

export function usePermissionsQuery(
  params: PermissionListParams = {}
) {
  return useQuery({
    queryKey: userManagementKeys.permissionsList(params),
    queryFn: () => permissionService.list(params),
  });
}

export function useAllPermissionsQuery(search?: string) {
  return useQuery({
    queryKey: userManagementKeys.allPermissions(search),
    queryFn: () => permissionService.all(search),
  });
}

export function useCreatePermissionMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: PermissionPayload) =>
      permissionService.create(payload),

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: userManagementKeys.permissions(),
      });
    },
  });
}

export function useUpdatePermissionMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number | string;
      payload: PermissionPayload;
    }) => permissionService.update(id, payload),

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: userManagementKeys.permissions(),
      });
    },
  });
}

export function useDeletePermissionMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) =>
      permissionService.remove(id),

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: userManagementKeys.permissions(),
      });
    },
  });
}