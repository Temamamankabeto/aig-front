"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Edit,
  KeyRound,
  Loader2,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  useAllPermissionsQuery,
  useAssignRolePermissionsMutation,
  useCreateRoleMutation,
  useRolePermissionsQuery,
  useRolesQuery,
  useUpdateRoleMutation,
} from "@/hooks";

import { roleSchema } from "@/lib/schemas/role.schema";
import type { RoleItem, RolePayload } from "@/types/user-management/user.type";

/* ---------------- helpers ---------------- */

function moduleName(permission: string) {
  return permission.split(/[._:-]/)[0] || "general";
}

/* ---------------- page ---------------- */

export default function RolesPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [permissionsOpen, setPermissionsOpen] = useState(false);

  const [selectedRole, setSelectedRole] = useState<RoleItem | null>(null);
  const [roleName, setRoleName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const params = useMemo(
    () => ({ search, page, per_page: 10 }),
    [search, page]
  );

  const rolesQuery = useRolesQuery(params);
  const permissionsCatalogQuery = useAllPermissionsQuery();
  const rolePermissionsQuery = useRolePermissionsQuery(selectedRole?.id);

  /* hooks (NO arguments) */
  const createRole = useCreateRoleMutation();
  const updateRole = useUpdateRoleMutation();
  const assignPermissions = useAssignRolePermissionsMutation();

  const rows = rolesQuery.data?.data ?? [];
  const meta = rolesQuery.data?.meta;
  const allPermissions = permissionsCatalogQuery.data ?? [];

  const groupedPermissions = useMemo(() => {
    return allPermissions.reduce<Record<string, string[]>>(
      (groups, permission) => {
        const group = moduleName(permission.name);
        groups[group] = groups[group] ?? [];
        groups[group].push(permission.name);
        return groups;
      },
      {}
    );
  }, [allPermissions]);

  useEffect(() => {
    if (!permissionsOpen) return;

    setSelectedPermissions(
      (rolePermissionsQuery.data ?? []).map((p) => p.name)
    );
  }, [permissionsOpen, rolePermissionsQuery.data]);

  function runAfterMenuClose(action: () => void) {
    window.setTimeout(action, 0);
  }

  function openCreate() {
    setSelectedRole(null);
    setRoleName("");
    setFormOpen(true);
  }

  function openEdit(role: RoleItem) {
    setSelectedRole(role);
    setRoleName(role.name);
    setFormOpen(true);
  }

  function openPermissions(role: RoleItem) {
    setSelectedRole(role);
    setSelectedPermissions([]);
    setPermissionsOpen(true);
  }

  /* ---------------- FIXED ROLE SUBMIT ---------------- */
  function submitRole(event: FormEvent) {
    event.preventDefault();

    const parsed = roleSchema.safeParse({ name: roleName });

    if (!parsed.success) {
      console.error(parsed.error);
      return;
    }

    const payload: RolePayload = {
      name: parsed.data.name,
    };

    if (selectedRole) {
      updateRole.mutate(
        {
          id: selectedRole.id,
          payload,
        },
        {
          onSuccess: () => {
            setFormOpen(false);
            setSelectedRole(null);
            setRoleName("");
            rolesQuery.refetch();
          },
        }
      );
    } else {
      createRole.mutate(payload, {
        onSuccess: () => {
          setFormOpen(false);
          setRoleName("");
          rolesQuery.refetch();
        },
      });
    }
  }

  /* ---------------- permissions submit ---------------- */
  function submitPermissions() {
    if (!selectedRole) return;

    assignPermissions.mutate(
      {
        id: selectedRole.id,
        payload: {
          permissions: selectedPermissions,
        },
      },
      {
        onSuccess: () => {
          setPermissionsOpen(false);
          rolesQuery.refetch();
        },
      }
    );
  }

  function togglePermission(permission: string) {
    setSelectedPermissions((current) =>
      current.includes(permission)
        ? current.filter((p) => p !== permission)
        : [...current, permission]
    );
  }

  function toggleGroup(permissions: string[]) {
    const allSelected = permissions.every((p) =>
      selectedPermissions.includes(p)
    );

    setSelectedPermissions((current) =>
      allSelected
        ? current.filter((p) => !permissions.includes(p))
        : Array.from(new Set([...current, ...permissions]))
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold">Roles</h1>
          <p className="text-muted-foreground">
            Create roles and assign backend permissions.
          </p>
        </div>

        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> New Role
        </Button>
      </div>

      {/* TABLE */}
      <Card>
        <CardHeader>
          <div className="flex justify-between">
            <CardTitle>Role List</CardTitle>

            <div className="flex gap-2">
              <Input
                placeholder="Search roles..."
                value={search}
                onChange={(e) => {
                  setPage(1);
                  setSearch(e.target.value);
                }}
              />
              <Button
                variant="outline"
                onClick={() => rolesQuery.refetch()}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {rolesQuery.isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading roles...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Guard</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {rows.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell>{role.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {role.guard_name ?? "sanctum"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {role.created_at
                        ? new Date(role.created_at).toLocaleDateString()
                        : "—"}
                    </TableCell>

                    <TableCell className="text-right">
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onSelect={() =>
                              runAfterMenuClose(() => openEdit(role))
                            }
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onSelect={() =>
                              runAfterMenuClose(() =>
                                openPermissions(role)
                              )
                            }
                          >
                            <KeyRound className="mr-2 h-4 w-4" />
                            Permissions
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ROLE DIALOG */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedRole ? "Edit Role" : "Create Role"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={submitRole} className="space-y-4">
            <div>
              <Label>Role Name</Label>
              <Input
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                required
              />
            </div>

            <Button className="w-full">
              Save Role
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* PERMISSIONS DIALOG */}
      <Dialog open={permissionsOpen} onOpenChange={setPermissionsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Permissions</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {Object.entries(groupedPermissions).map(
              ([group, permissions]) => (
                <div key={group}>
                  <h3 className="font-semibold capitalize">
                    {group}
                  </h3>

                  {permissions.map((p) => (
                    <label key={p} className="flex gap-2">
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(p)}
                        onChange={() => togglePermission(p)}
                      />
                      {p}
                    </label>
                  ))}
                </div>
              )
            )}

            <Button onClick={submitPermissions} className="w-full">
              Save Permissions
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}