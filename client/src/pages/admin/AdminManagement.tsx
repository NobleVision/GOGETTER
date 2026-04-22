import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { motion, useReducedMotion } from "framer-motion";
import { interiorPageMotion } from "@/lib/interiorMotion";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import {
  PERMISSION_KEYS,
  PERMISSION_LABELS,
} from "@shared/permissions";
import type { UserPermissions } from "@shared/types";
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Mail,
  ShieldCheck,
} from "lucide-react";

const PAGE_SIZE = 20;

export default function AdminManagement() {
  const { user: currentUser } = useAuth();
  const isMasterAdmin = (currentUser as any)?.isMasterAdmin === true;
  const utils = trpc.useUtils();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [offset, setOffset] = useState(0);
  const [managingUser, setManagingUser] = useState<any | null>(null);

  const { data, isLoading } = trpc.admin.users.list.useQuery({
    search: search.length >= 2 ? search : undefined,
    role:
      roleFilter !== "all"
        ? (roleFilter as "user" | "admin")
        : undefined,
    limit: PAGE_SIZE,
    offset,
  });

  const updatePermissions = trpc.admin.users.updatePermissions.useMutation({
    onSuccess: () => {
      toast.success("Permissions updated");
      utils.admin.users.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateRole = trpc.admin.users.updateRole.useMutation({
    onSuccess: () => {
      toast.success("Role updated");
      utils.admin.users.list.invalidate();
      setManagingUser(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const users = data?.users ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  const handlePermissionToggle = (
    userId: number,
    key: keyof UserPermissions,
    currentValue: boolean
  ) => {
    updatePermissions.mutate({
      userId,
      permissions: { [key]: !currentValue },
    });
  };

  const shouldReduceMotion = useReducedMotion();
  const pageMotion = interiorPageMotion(!!shouldReduceMotion);

  return (
    <AdminLayout>
      <motion.div className="space-y-6" {...pageMotion.container}>
        {/* Header */}
        <motion.div {...pageMotion.header}>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-violet-400" />
            User Administration
          </h1>
          <p className="text-slate-300 text-sm mt-1">
            Manage users, roles, and feature permissions
          </p>
        </motion.div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by name or email..."
              className="pl-9"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setOffset(0);
              }}
            />
          </div>
          <Select
            value={roleFilter}
            onValueChange={(v) => {
              setRoleFilter(v);
              setOffset(0);
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
              <SelectItem value="user">Users</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-slate-500">
            {total} user{total !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Users Table */}
        <Card className="bg-card border-border">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-slate-800">
                    <TableHead className="text-slate-400">
                      User
                    </TableHead>
                    <TableHead className="text-slate-400">
                      Role
                    </TableHead>
                    <TableHead className="text-slate-400">
                      Verified
                    </TableHead>
                    <TableHead className="text-slate-400">
                      Login
                    </TableHead>
                    <TableHead className="text-slate-400">
                      Last Active
                    </TableHead>
                    <TableHead className="text-slate-400 text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u: any) => (
                    <TableRow
                      key={u.id}
                      className="border-slate-800"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            {u.pictureUrl && (
                              <AvatarImage src={u.pictureUrl} />
                            )}
                            <AvatarFallback className="text-xs bg-violet-500/20 text-violet-300">
                              {u.name?.charAt(0)?.toUpperCase() ??
                                "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm text-white font-medium truncate">
                              {u.name ?? "Unknown"}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                              {u.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {u.isMasterAdmin ? (
                          <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30">
                            Master
                          </Badge>
                        ) : u.role === "admin" ? (
                          <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                            Admin
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-slate-400"
                          >
                            User
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {u.emailVerified ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <XCircle className="h-4 w-4 text-slate-600" />
                        )}
                      </TableCell>
                      <TableCell>
                        {u.loginMethod === "google" ? (
                          <Badge
                            variant="outline"
                            className="text-xs"
                          >
                            Google
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-xs"
                          >
                            <Mail className="h-3 w-3 mr-1" />
                            Email
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-slate-400">
                        {u.lastSignedIn
                          ? formatDistanceToNow(
                              new Date(u.lastSignedIn),
                              { addSuffix: true }
                            )
                          : "Never"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-violet-400 hover:text-violet-300"
                          onClick={() => setManagingUser(u)}
                        >
                          Manage
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {users.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-slate-500 py-8"
                      >
                        No users found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={offset === 0}
                onClick={() =>
                  setOffset(Math.max(0, offset - PAGE_SIZE))
                }
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={offset + PAGE_SIZE >= total}
                onClick={() => setOffset(offset + PAGE_SIZE)}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Manage User Dialog */}
        <Dialog
          open={!!managingUser}
          onOpenChange={(open) => !open && setManagingUser(null)}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  {managingUser?.pictureUrl && (
                    <AvatarImage src={managingUser.pictureUrl} />
                  )}
                  <AvatarFallback className="bg-violet-500/20 text-violet-300">
                    {managingUser?.name?.charAt(0)?.toUpperCase() ??
                      "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p>{managingUser?.name ?? "Unknown"}</p>
                  <p className="text-sm font-normal text-slate-400">
                    {managingUser?.email}
                  </p>
                </div>
              </DialogTitle>
              <DialogDescription>
                Manage role and feature permissions
              </DialogDescription>
            </DialogHeader>

            {managingUser && (
              <div className="space-y-6 pt-2">
                {/* Admin Toggle */}
                {isMasterAdmin &&
                  !managingUser.isMasterAdmin && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-violet-400" />
                        <Label className="text-sm font-medium">
                          Admin Role
                        </Label>
                      </div>
                      <Switch
                        checked={managingUser.role === "admin"}
                        onCheckedChange={(checked) =>
                          updateRole.mutate({
                            userId: managingUser.id,
                            role: checked ? "admin" : "user",
                          })
                        }
                        disabled={updateRole.isPending}
                      />
                    </div>
                  )}

                {/* Permission Toggles */}
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-white mb-3">
                    Feature Permissions
                  </h3>
                  {managingUser.role === "admin" && (
                    <p className="text-xs text-amber-400 mb-3">
                      Admins have full access to all features
                    </p>
                  )}
                  {PERMISSION_KEYS.map((key) => {
                    const perms = managingUser.permissions as
                      | UserPermissions
                      | null;
                    const value =
                      managingUser.role === "admin"
                        ? true
                        : perms?.[key] === true;
                    return (
                      <div
                        key={key}
                        className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-800/30"
                      >
                        <Label className="text-sm text-slate-300">
                          {PERMISSION_LABELS[key]}
                        </Label>
                        <Switch
                          checked={value}
                          onCheckedChange={() =>
                            handlePermissionToggle(
                              managingUser.id,
                              key,
                              value
                            )
                          }
                          disabled={
                            managingUser.role === "admin" ||
                            updatePermissions.isPending
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </motion.div>
    </AdminLayout>
  );
}
