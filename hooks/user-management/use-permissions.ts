import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { permissionService } from "@/services/user-management/permission.service";
import { queryKeys } from "@/hooks/queryKeys";
import type { PermissionListParams, PermissionPayload } from "@/types/user-management/user.type";

export function usePermissionsQuery(params: PermissionListParams = {}) {
  return useQuery({
    queryKey: queryKeys.permissions.list(params),
    queryFn: () => permissionService.list(params),
  });
}

export function useAllPermissionsQuery(search?: string) {
  return useQuery({
    queryKey: queryKeys.permissions.all(search),
    queryFn: () => permissionService.all(search),
  });
}

export function useCreatePermissionMutation(onSuccess?: () => void) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: PermissionPayload) => permissionService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.permissions.root() });
      toast.success("Permission created");
      onSuccess?.();
    },
  });
}

export function useUpdatePermissionMutation(onSuccess?: () => void) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: PermissionPayload }) => permissionService.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.permissions.root() });
      toast.success("Permission updated");
      onSuccess?.();
    },
  });
}

export function useDeletePermissionMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => permissionService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.permissions.root() });
      toast.success("Permission deleted");
    },
  });
}
