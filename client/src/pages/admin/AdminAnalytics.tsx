import AdminLayout from "@/components/AdminLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
  PieChart,
  Pie,
  Legend,
} from "recharts";
import { BarChart3, TrendingUp } from "lucide-react";

const PHASE_COLORS = [
  "#64748b",
  "#3b82f6",
  "#a855f7",
  "#f59e0b",
  "#f97316",
  "#06b6d4",
  "#10b981",
];

const STATUS_COLORS: Record<string, string> = {
  active: "#10b981",
  suspended: "#f59e0b",
  completed: "#3b82f6",
  cancelled: "#ef4444",
};

export default function AdminAnalytics() {
  const { data: stats, isLoading } =
    trpc.admin.stats.useQuery();

  const phaseData =
    stats?.byPhase?.map((p) => ({
      name: `${String(p.phase).padStart(2, "0")} ${PHASE_NAMES[p.phase]}`,
      count: p.count,
      phase: p.phase,
    })) ?? [];

  const statusData =
    stats?.byStatus
      ?.filter((s) => s.count > 0)
      .map((s) => ({
        name: s.status.charAt(0).toUpperCase() + s.status.slice(1),
        value: s.count,
        fill: STATUS_COLORS[s.status] ?? "#64748b",
      })) ?? [];

  // Funnel conversion (ratio of projects that advanced past each phase)
  const funnelData =
    stats?.byPhase?.map((p, i) => {
      const totalAtOrPast =
        stats.byPhase
          ?.filter((pp) => pp.phase >= p.phase)
          .reduce((sum, pp) => sum + pp.count, 0) ?? 0;
      return {
        name: PHASE_NAMES[p.phase],
        projects: totalAtOrPast,
        phase: p.phase,
      };
    }) ?? [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-violet-400" />
            Pipeline Analytics
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Insights into the ZERO to HERO business pipeline
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="pt-6 text-center">
              {isLoading ? (
                <Skeleton className="h-12 w-20 mx-auto" />
              ) : (
                <>
                  <p className="text-3xl font-bold text-white">
                    {stats?.total ?? 0}
                  </p>
                  <p className="text-sm text-slate-400 mt-1">
                    Total Projects
                  </p>
                </>
              )}
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-6 text-center">
              {isLoading ? (
                <Skeleton className="h-12 w-20 mx-auto" />
              ) : (
                <>
                  <p className="text-3xl font-bold text-emerald-400">
                    {stats?.active ?? 0}
                  </p>
                  <p className="text-sm text-slate-400 mt-1">
                    Active Projects
                  </p>
                </>
              )}
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-6 text-center">
              {isLoading ? (
                <Skeleton className="h-12 w-20 mx-auto" />
              ) : (
                <>
                  <p className="text-3xl font-bold text-amber-400">
                    ${(stats?.totalRetainers ?? 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-slate-400 mt-1">
                    Retainers Collected
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Phase Distribution */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm text-slate-300">
                Projects by Phase
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={phaseData}>
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "#94a3b8", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      angle={-20}
                      textAnchor="end"
                      height={60}
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
                      {phaseData.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={PHASE_COLORS[entry.phase]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Status Breakdown */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm text-slate-300">
                Status Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : statusData.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-16">
                  No data yet
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, value }) =>
                        `${name}: ${value}`
                      }
                    >
                      {statusData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "#1e293b",
                        border: "1px solid #334155",
                        borderRadius: 8,
                        color: "#fff",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Pipeline Funnel */}
          <Card className="bg-card border-border lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Pipeline Funnel (Cumulative)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={funnelData}>
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
                    <Bar
                      dataKey="projects"
                      radius={[4, 4, 0, 0]}
                    >
                      {funnelData.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={PHASE_COLORS[entry.phase]}
                          opacity={0.8}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
