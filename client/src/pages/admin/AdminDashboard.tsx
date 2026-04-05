import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import PhaseBadge from "@/components/admin/PhaseBadge";
import { trpc } from "@/lib/trpc";
import { PHASE_NAMES } from "@shared/const";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Rocket,
  Users,
  DollarSign,
  Activity,
  Clock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const PHASE_BAR_COLORS = [
  "#64748b",
  "#3b82f6",
  "#a855f7",
  "#f59e0b",
  "#f97316",
  "#06b6d4",
  "#10b981",
];

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } =
    trpc.admin.stats.useQuery();
  const { data: recentEvents, isLoading: eventsLoading } =
    trpc.admin.recentEvents.useQuery({ limit: 10 });

  const chartData =
    stats?.byPhase?.map((p) => ({
      name: PHASE_NAMES[p.phase],
      count: p.count,
      phase: p.phase,
    })) ?? [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Admin Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            GoGetterOS ZERO to HERO Pipeline Overview
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <Rocket className="h-5 w-5 text-violet-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">
                    Total Projects
                  </p>
                  {statsLoading ? (
                    <Skeleton className="h-7 w-16 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-white">
                      {stats?.total ?? 0}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Active</p>
                  {statsLoading ? (
                    <Skeleton className="h-7 w-16 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-white">
                      {stats?.active ?? 0}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">
                    Retainers Collected
                  </p>
                  {statsLoading ? (
                    <Skeleton className="h-7 w-16 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-white">
                      $
                      {(stats?.totalRetainers ?? 0).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">
                    By Status
                  </p>
                  {statsLoading ? (
                    <Skeleton className="h-7 w-16 mt-1" />
                  ) : (
                    <div className="flex gap-2 mt-1">
                      {stats?.byStatus
                        ?.filter((s) => s.count > 0)
                        .map((s) => (
                          <span
                            key={s.status}
                            className="text-xs text-slate-300"
                          >
                            {s.status}: {s.count}
                          </span>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Phase Distribution Chart */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-300">
                Projects by Phase
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData}>
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "#94a3b8", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "#94a3b8", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#1e293b",
                        border: "1px solid #334155",
                        borderRadius: 8,
                        color: "#fff",
                      }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={PHASE_BAR_COLORS[entry.phase]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-slate-300">
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {eventsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : !recentEvents?.length ? (
                <p className="text-sm text-slate-500 text-center py-8">
                  No pipeline activity yet
                </p>
              ) : (
                <div className="space-y-3 max-h-[220px] overflow-y-auto">
                  {recentEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-800/50"
                    >
                      <Clock className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-slate-200 truncate">
                          <span className="font-medium">
                            {event.adminName ?? "System"}
                          </span>{" "}
                          {event.eventType.replace(/_/g, " ")}{" "}
                          {event.toPhase !== null && (
                            <PhaseBadge phase={event.toPhase} />
                          )}
                        </p>
                        <p className="text-xs text-slate-500">
                          {event.businessName} &middot;{" "}
                          {formatDistanceToNow(
                            new Date(event.createdAt),
                            { addSuffix: true }
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
