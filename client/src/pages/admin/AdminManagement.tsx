import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ShieldCheck, Plus, Search, UserMinus } from "lucide-react";

export default function AdminManagement() {
  const { user } = useAuth();
  const isMasterAdmin = (user as any)?.isMasterAdmin === true;

  const {
    data: admins,
    isLoading,
    refetch,
  } = trpc.admin.admins.list.useQuery();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: searchResults } =
    trpc.admin.admins.searchUsers.useQuery(
      { search: searchQuery, limit: 10 },
      { enabled: searchQuery.length >= 2 }
    );

  const promoteMutation = trpc.admin.admins.promote.useMutation({
    onSuccess: () => {
      toast.success("User promoted to admin");
      refetch();
      setSearchOpen(false);
      setSearchQuery("");
    },
    onError: (err) => toast.error(err.message),
  });

  const demoteMutation = trpc.admin.admins.demote.useMutation({
    onSuccess: () => {
      toast.success("Admin access removed");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-violet-400" />
              Admin Management
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Manage administrator access to the GoGetterOS admin
              dashboard
            </p>
          </div>
          {isMasterAdmin && (
            <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
              <DialogTrigger asChild>
                <Button className="bg-violet-600 hover:bg-violet-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Admin
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Administrator</DialogTitle>
                  <DialogDescription>
                    Search for a user to promote to admin.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search by name or email..."
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) =>
                        setSearchQuery(e.target.value)
                      }
                    />
                  </div>
                  <div className="max-h-[300px] overflow-y-auto space-y-2">
                    {searchResults?.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            {u.pictureUrl && (
                              <AvatarImage src={u.pictureUrl} />
                            )}
                            <AvatarFallback className="text-xs">
                              {u.name?.charAt(0) ?? "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm text-white">
                              {u.name}
                            </p>
                            <p className="text-xs text-slate-400">
                              {u.email}
                            </p>
                          </div>
                        </div>
                        {u.role === "admin" ? (
                          <Badge
                            variant="outline"
                            className="text-xs"
                          >
                            Already Admin
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              promoteMutation.mutate({
                                userId: u.id,
                              })
                            }
                            disabled={promoteMutation.isPending}
                          >
                            Promote
                          </Button>
                        )}
                      </div>
                    ))}
                    {searchQuery.length >= 2 &&
                      !searchResults?.length && (
                        <p className="text-sm text-slate-500 text-center py-4">
                          No users found
                        </p>
                      )}
                    {searchQuery.length < 2 && (
                      <p className="text-sm text-slate-500 text-center py-4">
                        Type at least 2 characters to search
                      </p>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {!isMasterAdmin && (
          <Card className="bg-amber-500/10 border-amber-500/30">
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-amber-300">
                Only the master admin (nobviz@gmail.com) can add or
                remove administrators.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Admins Table */}
        <Card className="bg-card border-border">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-slate-800">
                    <TableHead className="text-slate-400">
                      Admin
                    </TableHead>
                    <TableHead className="text-slate-400">
                      Email
                    </TableHead>
                    <TableHead className="text-slate-400">
                      Role
                    </TableHead>
                    <TableHead className="text-slate-400">
                      Last Active
                    </TableHead>
                    {isMasterAdmin && (
                      <TableHead className="text-slate-400">
                        Actions
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins?.map((admin) => (
                    <TableRow
                      key={admin.id}
                      className="border-slate-800"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            {admin.pictureUrl && (
                              <AvatarImage
                                src={admin.pictureUrl}
                              />
                            )}
                            <AvatarFallback className="text-xs bg-violet-500/20 text-violet-300">
                              {admin.name?.charAt(0) ?? "?"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-white font-medium">
                            {admin.name ?? "Unknown"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-400">
                        {admin.email}
                      </TableCell>
                      <TableCell>
                        {admin.isMasterAdmin ? (
                          <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30">
                            Master Admin
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-xs"
                          >
                            Admin
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-slate-400">
                        {admin.lastSignedIn
                          ? formatDistanceToNow(
                              new Date(admin.lastSignedIn),
                              { addSuffix: true }
                            )
                          : "Never"}
                      </TableCell>
                      {isMasterAdmin && (
                        <TableCell>
                          {!admin.isMasterAdmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              onClick={() =>
                                demoteMutation.mutate({
                                  userId: admin.id,
                                })
                              }
                              disabled={demoteMutation.isPending}
                            >
                              <UserMinus className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
