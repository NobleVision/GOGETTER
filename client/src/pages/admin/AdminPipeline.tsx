import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { motion, useReducedMotion } from "framer-motion";
import { interiorPageMotion } from "@/lib/interiorMotion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import PhaseBadge from "@/components/admin/PhaseBadge";
import NewProjectDialog from "@/components/admin/NewProjectDialog";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Search, Rocket } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  suspended: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  completed: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  cancelled: "bg-red-500/20 text-red-300 border-red-500/30",
};

export default function AdminPipeline() {
  const [, setLocation] = useLocation();
  const [filters, setFilters] = useState<{
    phase?: number;
    status?: string;
    search?: string;
  }>({});

  const { data: projects, isLoading, refetch } =
    trpc.admin.pipeline.list.useQuery(
      {
        phase: filters.phase,
        status: filters.status as any,
        search: filters.search || undefined,
      },
      { refetchOnWindowFocus: false }
    );

  const shouldReduceMotion = useReducedMotion();
  const pageMotion = interiorPageMotion(!!shouldReduceMotion);

  return (
    <AdminLayout>
      <motion.div className="space-y-6" {...pageMotion.container}>
        <motion.div className="flex items-center justify-between" {...pageMotion.header}>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Rocket className="h-6 w-6 text-violet-400" />
              Business Creation Pipeline
            </h1>
            <p className="text-slate-300 text-sm mt-1">
              ZERO to HERO &mdash; Guide customer businesses from raw
              lead to autonomous profitability
            </p>
          </div>
          <NewProjectDialog onCreated={() => refetch()} />
        </motion.div>

        {/* Filter Bar */}
        <Card className="bg-card border-border">
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by name, POC, or email..."
                  className="pl-9"
                  value={filters.search ?? ""}
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      search: e.target.value,
                    }))
                  }
                />
              </div>
              <Select
                value={
                  filters.phase !== undefined
                    ? String(filters.phase)
                    : "all"
                }
                onValueChange={(v) =>
                  setFilters((f) => ({
                    ...f,
                    phase: v === "all" ? undefined : parseInt(v),
                  }))
                }
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Phase" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Phases</SelectItem>
                  {[0, 1, 2, 3, 4, 5, 6].map((p) => (
                    <SelectItem key={p} value={String(p)}>
                      Phase {String(p).padStart(2, "0")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filters.status ?? "all"}
                onValueChange={(v) =>
                  setFilters((f) => ({
                    ...f,
                    status: v === "all" ? undefined : v,
                  }))
                }
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">
                    Suspended
                  </SelectItem>
                  <SelectItem value="completed">
                    Completed
                  </SelectItem>
                  <SelectItem value="cancelled">
                    Cancelled
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Projects Table */}
        <Card className="bg-card border-border">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : !projects?.length ? (
              <div className="text-center py-16">
                <Rocket className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">
                  No pipeline projects found
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  Create a new project to get started
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-slate-800">
                    <TableHead className="text-slate-400">
                      Business Name
                    </TableHead>
                    <TableHead className="text-slate-400">
                      POC
                    </TableHead>
                    <TableHead className="text-slate-400">
                      Phase
                    </TableHead>
                    <TableHead className="text-slate-400">
                      Started
                    </TableHead>
                    <TableHead className="text-slate-400">
                      Last Activity
                    </TableHead>
                    <TableHead className="text-slate-400">
                      Retainer
                    </TableHead>
                    <TableHead className="text-slate-400">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((project) => (
                    <TableRow
                      key={project.id}
                      className="cursor-pointer hover:bg-slate-800/50 border-slate-800"
                      onClick={() =>
                        setLocation(
                          `/admin/pipeline/${project.id}`
                        )
                      }
                    >
                      <TableCell className="font-medium text-white">
                        {project.businessName}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm text-slate-200">
                            {project.pocName}
                          </p>
                          {project.pocEmail && (
                            <p className="text-xs text-slate-500">
                              {project.pocEmail}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <PhaseBadge phase={project.phase} />
                      </TableCell>
                      <TableCell className="text-sm text-slate-400">
                        {formatDistanceToNow(
                          new Date(project.startedAt),
                          { addSuffix: true }
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-slate-400">
                        {formatDistanceToNow(
                          new Date(project.updatedAt),
                          { addSuffix: true }
                        )}
                      </TableCell>
                      <TableCell>
                        {project.retainerPaid ? (
                          <Badge
                            variant="outline"
                            className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs"
                          >
                            $
                            {parseFloat(
                              project.retainerAmount ?? "0"
                            ).toLocaleString()}
                          </Badge>
                        ) : (
                          <span className="text-xs text-slate-500">
                            None
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs ${STATUS_STYLES[project.status] ?? ""}`}
                        >
                          {project.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AdminLayout>
  );
}
