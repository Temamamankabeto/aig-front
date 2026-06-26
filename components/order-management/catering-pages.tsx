'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CalendarClock, MoreHorizontal, PackagePlus, Plus, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import {
  useCreditAccountsQuery,
  usePackageOrderQuery,
  usePackageOrdersQuery,
  usePackagesQuery,
} from '@/hooks/queries/order-management';
import {
  useCreatePackageMutation,
  useCreatePackageOrderMutation,
  useDeletePackageMutation,
  usePackageOrderActionMutation,
  useSchedulePackageOrderMutation,
} from '@/hooks/mutations/order-management';
import type { PaymentType } from '@/types/order-management';

function money(value: unknown) {
  return Number(value ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function date(value?: string) {
  return value ? new Date(value).toLocaleDateString() : '—';
}

function StatusBadge({ status }: { status?: string | null }) {
  const currentStatus = status ?? 'draft';
  const danger = ['cancelled', 'blocked', 'overdue', 'inactive'].includes(currentStatus);
  const done = ['active', 'approved', 'ready', 'delivered', 'completed', 'fully_settled'].includes(currentStatus);

  return (
    <Badge variant={danger ? 'destructive' : done ? 'default' : 'secondary'} className="capitalize">
      {currentStatus.replace(/_/g, ' ')}
    </Badge>
  );
}

export function PackagesPage() {
  const [open, setOpen] = useState(false);
  const [payload, setPayload] = useState({
    name: '',
    description: '',
    price_per_person: 0,
    minimum_people: 1,
    is_active: true,
  });
  const [filters, setFilters] = useState({ search: '', page: 1, per_page: 10 });

  const packagesQuery = usePackagesQuery(filters);
  const createPackage = useCreatePackageMutation(() => {
    setOpen(false);
    setPayload({
      name: '',
      description: '',
      price_per_person: 0,
      minimum_people: 1,
      is_active: true,
    });
  });
  const deletePackage = useDeletePackageMutation();
  const packages = packagesQuery.data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Packages</h1>
          <p className="text-muted-foreground">
            Reusable meeting, event, catering and institutional dining templates.
          </p>
        </div>

        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New package
        </Button>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle>Package templates</CardTitle>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search"
                value={filters.search}
                onChange={(event) => setFilters({ ...filters, search: event.target.value, page: 1 })}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Price/person</TableHead>
                  <TableHead>Minimum</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packagesQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      Loading packages...
                    </TableCell>
                  </TableRow>
                ) : packages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No packages found.
                    </TableCell>
                  </TableRow>
                ) : (
                  packages.map((packageTemplate) => (
                    <TableRow key={packageTemplate.id}>
                      <TableCell>
                        <div className="font-medium">{packageTemplate.name}</div>
                        <div className="max-w-96 truncate text-xs text-muted-foreground">
                          {packageTemplate.description ?? '—'}
                        </div>
                      </TableCell>
                      <TableCell>{money(packageTemplate.price_per_person)}</TableCell>
                      <TableCell>{packageTemplate.minimum_people ?? 1}</TableCell>
                      <TableCell>
                        <StatusBadge status={packageTemplate.is_active ? 'active' : 'inactive'} />
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
                              onClick={() => deletePackage.mutate(packageTemplate.id)}
                              className="text-destructive"
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create package</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>Name</Label>
              <Input
                value={payload.name}
                onChange={(event) => setPayload({ ...payload, name: event.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea
                value={payload.description}
                onChange={(event) => setPayload({ ...payload, description: event.target.value })}
              />
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Price per person</Label>
                <Input
                  type="number"
                  value={payload.price_per_person}
                  onChange={(event) =>
                    setPayload({ ...payload, price_per_person: Number(event.target.value) })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Minimum people</Label>
                <Input
                  type="number"
                  value={payload.minimum_people}
                  onChange={(event) =>
                    setPayload({ ...payload, minimum_people: Number(event.target.value) })
                  }
                />
              </div>
            </div>
            <Button
              className="w-full"
              disabled={!payload.name || createPackage.isPending}
              onClick={() => createPackage.mutate(payload)}
            >
              {createPackage.isPending ? 'Saving...' : 'Save package'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function PackageOrdersPage() {
  const [filters, setFilters] = useState({ search: '', status: 'all', page: 1, per_page: 10 });
  const packageOrdersQuery = usePackageOrdersQuery(filters);
  const action = usePackageOrderActionMutation();
  const rows = packageOrdersQuery.data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Package Orders</h1>
          <p className="text-muted-foreground">
            Scheduled orders for events, meetings, catering and organization meals.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/catering/package-orders/create">
            <PackagePlus className="mr-2 h-4 w-4" />
            New package order
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          ['Total', rows.length],
          ['Approved', rows.filter((row) => row.status === 'approved').length],
          ['Preparing', rows.filter((row) => row.status === 'preparing').length],
          ['Completed', rows.filter((row) => row.status === 'completed').length],
        ].map(([label, value]) => (
          <Card key={String(label)} className="rounded-2xl">
            <CardHeader className="pb-2">
              <CardDescription>{label}</CardDescription>
              <CardTitle>{value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <CardTitle>Event orders</CardTitle>
            <div className="flex flex-col gap-2 md:flex-row">
              <Input
                placeholder="Search event"
                value={filters.search}
                onChange={(event) => setFilters({ ...filters, search: event.target.value, page: 1 })}
              />
              <Select
                value={filters.status}
                onValueChange={(status) => setFilters({ ...filters, status, page: 1 })}
              >
                <SelectTrigger className="w-full md:w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['all', 'draft', 'quoted', 'approved', 'scheduled', 'preparing', 'ready', 'delivered', 'completed', 'cancelled'].map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Guests</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packageOrdersQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      Loading package orders...
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No package orders found.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div className="font-medium">{order.event_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {order.event_type ?? 'Event'} • {order.delivery_location ?? 'No location'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {date(order.event_date)} {order.event_time ?? ''}
                      </TableCell>
                      <TableCell>{order.guest_count}</TableCell>
                      <TableCell>
                        <StatusBadge status={order.status} />
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{order.payment_type ?? 'cash'}</Badge>
                        {order.credit_status ? (
                          <div className="mt-1">
                            <StatusBadge status={order.credit_status} />
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell>{money(order.total)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/catering/package-orders/${order.id}`}>View</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => action.mutate({ id: order.id, action: 'approve' })}>
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => action.mutate({ id: order.id, action: 'start-preparation' })}>
                              Start preparation
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => action.mutate({ id: order.id, action: 'mark-ready' })}>
                              Mark ready
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => action.mutate({ id: order.id, action: 'deliver' })}>
                              Deliver
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => action.mutate({ id: order.id, action: 'complete' })}>
                              Complete
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => action.mutate({ id: order.id, action: 'cancel' })}
                            >
                              Cancel
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function CreatePackageOrderPage() {
  const packagesQuery = usePackagesQuery({ per_page: 100 });
  const creditAccountsQuery = useCreditAccountsQuery({ per_page: 100 });
  const createPackageOrder = useCreatePackageOrderMutation();
  const [payload, setPayload] = useState({
    package_id: '',
    event_name: '',
    event_type: 'meeting',
    guest_count: 1,
    event_date: '',
    event_time: '',
    delivery_location: '',
    payment_type: 'cash' as PaymentType,
    credit_account_id: '',
    notes: '',
  });

  const selectedPackage = (packagesQuery.data?.data ?? []).find(
    (packageTemplate) => String(packageTemplate.id) === payload.package_id,
  );
  const total = Number(selectedPackage?.price_per_person ?? 0) * Number(payload.guest_count ?? 0);

  function submit() {
    createPackageOrder.mutate({
      ...payload,
      package_id: payload.package_id || null,
      credit_account_id: payload.credit_account_id || null,
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create Package Order</h1>
        <p className="text-muted-foreground">
          Create scheduled orders for meetings, events and catering customers.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Event information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Package</Label>
              <Select
                value={payload.package_id}
                onValueChange={(package_id) => setPayload({ ...payload, package_id })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose package" />
                </SelectTrigger>
                <SelectContent>
                  {(packagesQuery.data?.data ?? []).map((packageTemplate) => (
                    <SelectItem key={packageTemplate.id} value={String(packageTemplate.id)}>
                      {packageTemplate.name} - {money(packageTemplate.price_per_person)}/person
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Event name</Label>
              <Input
                value={payload.event_name}
                onChange={(event) => setPayload({ ...payload, event_name: event.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Event type</Label>
              <Input
                value={payload.event_type}
                onChange={(event) => setPayload({ ...payload, event_type: event.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Guest count</Label>
              <Input
                type="number"
                min={1}
                value={payload.guest_count}
                onChange={(event) => setPayload({ ...payload, guest_count: Number(event.target.value) })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Event date</Label>
              <Input
                type="date"
                value={payload.event_date}
                onChange={(event) => setPayload({ ...payload, event_date: event.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Event time</Label>
              <Input
                type="time"
                value={payload.event_time}
                onChange={(event) => setPayload({ ...payload, event_time: event.target.value })}
              />
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label>Delivery / service location</Label>
              <Input
                value={payload.delivery_location}
                onChange={(event) => setPayload({ ...payload, delivery_location: event.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Payment type</Label>
              <Select
                value={payload.payment_type}
                onValueChange={(payment_type: PaymentType) => setPayload({ ...payload, payment_type })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['cash', 'card', 'mobile', 'transfer', 'credit'].map((paymentType) => (
                    <SelectItem key={paymentType} value={paymentType}>
                      {paymentType}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {payload.payment_type === 'credit' ? (
              <div className="grid gap-2">
                <Label>Credit account</Label>
                <Select
                  value={payload.credit_account_id}
                  onValueChange={(credit_account_id) => setPayload({ ...payload, credit_account_id })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {(creditAccountsQuery.data?.data ?? []).map((account) => (
                      <SelectItem key={account.id} value={String(account.id)}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            <div className="grid gap-2 md:col-span-2">
              <Label>Notes</Label>
              <Textarea
                value={payload.notes}
                onChange={(event) => setPayload({ ...payload, notes: event.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Quotation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 rounded-xl bg-muted p-4">
              <div className="flex justify-between">
                <span>Price/person</span>
                <strong>{money(selectedPackage?.price_per_person)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Guests</span>
                <strong>{payload.guest_count}</strong>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span>Total estimate</span>
                <strong>{money(total)}</strong>
              </div>
            </div>
            <Button
              className="w-full"
              disabled={!payload.event_name || !payload.event_date || createPackageOrder.isPending}
              onClick={submit}
            >
              {createPackageOrder.isPending ? 'Creating...' : 'Create package order'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function PackageOrderDetailPage({ id }: { id: string }) {
  const packageOrderQuery = usePackageOrderQuery(id);
  const schedulePackageOrder = useSchedulePackageOrderMutation();
  const action = usePackageOrderActionMutation();
  const order = packageOrderQuery.data?.data;
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [payload, setPayload] = useState({
    prep_start_time: '',
    ready_time: '',
    delivery_time: '',
    assigned_team: '',
    status: 'scheduled',
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{order?.event_name ?? 'Package order'}</h1>
          <p className="text-muted-foreground">
            Event order status, schedule, billing and delivery workflow.
          </p>
        </div>
        <Button onClick={() => setScheduleOpen(true)}>
          <CalendarClock className="mr-2 h-4 w-4" />
          Schedule
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardDescription>Status</CardDescription>
            <CardTitle>
              <StatusBadge status={order?.status} />
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader>
            <CardDescription>Guests</CardDescription>
            <CardTitle>{order?.guest_count ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader>
            <CardDescription>Total</CardDescription>
            <CardTitle>{money(order?.total)}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader>
            <CardDescription>Date</CardDescription>
            <CardTitle>{date(order?.event_date)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Workflow actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button onClick={() => action.mutate({ id, action: 'approve' })}>Approve</Button>
          <Button onClick={() => action.mutate({ id, action: 'start-preparation' })}>Start preparation</Button>
          <Button onClick={() => action.mutate({ id, action: 'mark-ready' })}>Ready</Button>
          <Button onClick={() => action.mutate({ id, action: 'deliver' })}>Delivered</Button>
          <Button onClick={() => action.mutate({ id, action: 'complete' })}>Complete</Button>
          <Button variant="destructive" onClick={() => action.mutate({ id, action: 'cancel' })}>
            Cancel
          </Button>
        </CardContent>
      </Card>

      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule package order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>Prep start</Label>
              <Input
                type="datetime-local"
                value={payload.prep_start_time}
                onChange={(event) => setPayload({ ...payload, prep_start_time: event.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Ready time</Label>
              <Input
                type="datetime-local"
                value={payload.ready_time}
                onChange={(event) => setPayload({ ...payload, ready_time: event.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Delivery time</Label>
              <Input
                type="datetime-local"
                value={payload.delivery_time}
                onChange={(event) => setPayload({ ...payload, delivery_time: event.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Assigned team</Label>
              <Input
                value={payload.assigned_team}
                onChange={(event) => setPayload({ ...payload, assigned_team: event.target.value })}
              />
            </div>
            <Button className="w-full" onClick={() => schedulePackageOrder.mutate({ id, payload })}>
              Save schedule
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
