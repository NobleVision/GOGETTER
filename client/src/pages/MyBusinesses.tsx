import AccessRestricted from "@/components/AccessRestricted";
import DashboardLayout from "@/components/DashboardLayout";
import { motion, useReducedMotion } from "framer-motion";
import { interiorPageMotion } from "@/lib/interiorMotion";
import { usePermissions } from "@/_core/hooks/usePermissions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { 
  Rocket, 
  Play, 
  Pause, 
  Square, 
  Activity,
  DollarSign,
  Cpu,
  Clock,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  Plus
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const STATUS_STYLES = {
  setup: { bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/30", icon: Clock },
  running: { bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/30", icon: Activity },
  paused: { bg: "bg-amber-500/20", text: "text-amber-400", border: "border-amber-500/30", icon: Pause },
  stopped: { bg: "bg-slate-500/20", text: "text-slate-400", border: "border-slate-500/30", icon: Square },
  failed: { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/30", icon: AlertTriangle },
};

export default function MyBusinesses() {
  const { can } = usePermissions();
  if (!can("myBusinesses")) {
    return (
      <DashboardLayout>
        <AccessRestricted featureName="My Businesses" />
      </DashboardLayout>
    );
  }
  return <MyBusinessesContent />;
}

function MyBusinessesContent() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  
  const { data: userBusinesses, isLoading } = trpc.userBusinesses.list.useQuery();
  
  const updateStatus = trpc.userBusinesses.updateStatus.useMutation({
    onSuccess: () => {
      utils.userBusinesses.list.invalidate();
      toast.success("Status updated successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update status");
    }
  });

  const formatCurrency = (value: string | number | null) => {
    if (!value) return '$0.00';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const shouldReduceMotion = useReducedMotion();
  const pageMotion = interiorPageMotion(!!shouldReduceMotion);

  return (
    <DashboardLayout>
      <motion.div className="space-y-6" {...pageMotion.container}>
        {/* Header */}
        <motion.div
          className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
          {...pageMotion.header}
        >
          <div>
            <h1 className="text-2xl font-bold text-white">My Businesses</h1>
            <p className="text-slate-300">Manage your deployed autonomous businesses</p>
          </div>
          <Button 
            onClick={() => setLocation('/catalog')}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0"
          >
            <Plus className="mr-2 h-4 w-4" />
            Deploy New Business
          </Button>
        </motion.div>

        {/* Business List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="bg-card border-border">
                <CardContent className="p-6">
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : userBusinesses && userBusinesses.length > 0 ? (
          <div className="space-y-4">
            {userBusinesses.map((ub) => {
              const status = STATUS_STYLES[ub.status as keyof typeof STATUS_STYLES] || STATUS_STYLES.setup;
              const StatusIcon = status.icon;
              const profit = parseFloat(ub.totalRevenue || '0') - parseFloat(ub.totalTokenCost || '0') - parseFloat(ub.totalInfraCost || '0');
              
              return (
                <Card key={ub.id} className="bg-card border-border hover:border-emerald-500/30 transition-all">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                      {/* Business Info */}
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${status.bg}`}>
                          <StatusIcon className={`h-6 w-6 ${status.text}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-white truncate">{ub.business.name}</h3>
                            <Badge variant="outline" className={`${status.bg} ${status.text} ${status.border} text-xs capitalize`}>
                              {ub.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-1">{ub.business.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>Deployed: {formatDate(ub.createdAt)}</span>
                            {ub.startedAt && <span>Started: {formatDate(ub.startedAt)}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-emerald-400 mb-1">
                            <DollarSign className="h-4 w-4" />
                            <span className="font-semibold">{formatCurrency(ub.totalRevenue)}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">Revenue</div>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-amber-400 mb-1">
                            <Cpu className="h-4 w-4" />
                            <span className="font-semibold">{formatCurrency(ub.totalTokenCost)}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">Token Cost</div>
                        </div>
                        <div className="text-center">
                          <div className={`flex items-center justify-center gap-1 mb-1 ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            <TrendingUp className="h-4 w-4" />
                            <span className="font-semibold">{formatCurrency(profit)}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">Net Profit</div>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-blue-400 mb-1">
                            <Activity className="h-4 w-4" />
                            <span className="font-semibold">{ub.activeAgents || 0}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">Agents</div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="border-border">
                              Actions
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {ub.status !== 'running' && (
                              <DropdownMenuItem 
                                onClick={() => updateStatus.mutate({ id: ub.id, status: 'running' })}
                                className="text-emerald-400"
                              >
                                <Play className="mr-2 h-4 w-4" />
                                Start
                              </DropdownMenuItem>
                            )}
                            {ub.status === 'running' && (
                              <DropdownMenuItem 
                                onClick={() => updateStatus.mutate({ id: ub.id, status: 'paused' })}
                                className="text-amber-400"
                              >
                                <Pause className="mr-2 h-4 w-4" />
                                Pause
                              </DropdownMenuItem>
                            )}
                            {ub.status !== 'stopped' && (
                              <DropdownMenuItem 
                                onClick={() => updateStatus.mutate({ id: ub.id, status: 'stopped' })}
                                className="text-slate-400"
                              >
                                <Square className="mr-2 h-4 w-4" />
                                Stop
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setLocation(`/monitoring?id=${ub.id}`)}
                          className="text-emerald-400 hover:text-emerald-300"
                        >
                          Monitor
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="bg-card border-border">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Rocket className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Businesses Deployed</h3>
              <p className="text-muted-foreground mb-6 text-center max-w-md">
                Start your autonomous business empire by deploying your first business from the catalog.
              </p>
              <Button 
                onClick={() => setLocation('/catalog')}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0"
              >
        motion.        <Rocket className="mr-2 h-4 w-4" />
                Browse Business Catalog
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
