import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PhaseBadge from "@/components/admin/PhaseBadge";
import PhaseStepper from "@/components/admin/PhaseStepper";
import { trpc } from "@/lib/trpc";
import { useRoute, useLocation } from "wouter";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";
import {
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  Clock,
  User,
  Mail,
  Phone,
  DollarSign,
  FileText,
  Plus,
  AlertTriangle,
} from "lucide-react";
import {
  PHASE_NAMES,
  RETAINER_MINIMUM,
  ADD_ON_PRICE,
} from "@shared/const";

export default function AdminPipelineDetail() {
  const [, params] = useRoute("/admin/pipeline/:id");
  const [, setLocation] = useLocation();
  const projectId = params?.id ? parseInt(params.id) : 0;

  const {
    data: project,
    isLoading,
    refetch,
  } = trpc.admin.pipeline.get.useQuery(
    { id: projectId },
    { enabled: projectId > 0 }
  );

  const { data: events } = trpc.admin.pipeline.events.useQuery(
    { projectId, limit: 50 },
    { enabled: projectId > 0 }
  );

  const advanceMutation =
    trpc.admin.pipeline.advancePhase.useMutation({
      onSuccess: () => {
        toast.success("Phase advanced");
        refetch();
      },
      onError: (err) => toast.error(err.message),
    });

  const regressMutation =
    trpc.admin.pipeline.regressPhase.useMutation({
      onSuccess: () => {
        toast.success("Phase regressed");
        refetch();
      },
      onError: (err) => toast.error(err.message),
    });

  const updateMutation =
    trpc.admin.pipeline.update.useMutation({
      onSuccess: () => {
        toast.success("Project updated");
        refetch();
      },
      onError: (err) => toast.error(err.message),
    });

  const [advanceNotes, setAdvanceNotes] = useState("");
  const [newNote, setNewNote] = useState("");

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AdminLayout>
    );
  }

  if (!project) {
    return (
      <AdminLayout>
        <div className="text-center py-16">
          <p className="text-slate-400">Project not found</p>
          <Button
            variant="ghost"
            className="mt-4"
            onClick={() => setLocation("/admin/pipeline")}
          >
            Back to Pipeline
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const metadata = (project.metadata ?? {}) as any;
  const notes: Array<{
    text: string;
    adminName: string;
    adminId: number;
    createdAt: string;
  }> = metadata.notes ?? [];
  const transcripts: Array<{
    title: string;
    content: string;
    source: string;
    createdAt: string;
  }> = metadata.transcripts ?? [];
  const aiOutputs: Array<{
    model: string;
    prompt: string;
    output: string;
    createdAt: string;
  }> = metadata.aiOutputs ?? [];

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    const updatedNotes = [
      ...notes,
      {
        text: newNote.trim(),
        adminName: "Admin",
        adminId: project.adminId,
        createdAt: new Date().toISOString(),
      },
    ];
    updateMutation.mutate({
      id: project.id,
      metadata: { ...metadata, notes: updatedNotes } as any,
    });
    setNewNote("");
  };

  const addOns = (project.addOns ?? {}) as any;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/admin/pipeline")}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Pipeline
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white truncate">
                {project.businessName}
              </h1>
              <PhaseBadge phase={project.phase} />
              <Badge
                variant="outline"
                className={`text-xs ${
                  project.status === "active"
                    ? "bg-emerald-500/20 text-emerald-300"
                    : project.status === "suspended"
                      ? "bg-amber-500/20 text-amber-300"
                      : "bg-slate-500/20 text-slate-300"
                }`}
              >
                {project.status}
              </Badge>
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-slate-400">
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                {project.pocName}
              </span>
              {project.pocEmail && (
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />
                  {project.pocEmail}
                </span>
              )}
              {project.pocPhone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" />
                  {project.pocPhone}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Started{" "}
                {formatDistanceToNow(new Date(project.startedAt), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Phase Stepper */}
        <Card className="bg-card border-border">
          <CardContent className="pt-4 pb-4">
            <PhaseStepper currentPhase={project.phase} />
            <div className="flex items-center gap-3 mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={
                  project.phase <= 0 || regressMutation.isPending
                }
                onClick={() =>
                  regressMutation.mutate({
                    id: project.id,
                    notes: advanceNotes || undefined,
                  })
                }
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Regress
              </Button>
              <Input
                placeholder="Notes for phase change..."
                value={advanceNotes}
                onChange={(e) => setAdvanceNotes(e.target.value)}
                className="flex-1 max-w-md"
              />
              <Button
                className="bg-violet-600 hover:bg-violet-700"
                size="sm"
                disabled={
                  project.phase >= 6 || advanceMutation.isPending
                }
                onClick={() =>
                  advanceMutation.mutate({
                    id: project.id,
                    notes: advanceNotes || undefined,
                  })
                }
              >
                Advance
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
              {project.phase === 3 && !project.retainerPaid && (
                <span className="text-xs text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Retainer required for Phase 04
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabbed Content */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-slate-800/50">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="notes">
              Notes ({notes.length})
            </TabsTrigger>
            <TabsTrigger value="transcripts">
              Voice Transcripts
            </TabsTrigger>
            <TabsTrigger value="ai-outputs">AI Outputs</TabsTrigger>
            <TabsTrigger value="retainer">
              Retainer & Agreements
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-sm text-slate-300">
                    Project Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs text-slate-400">
                      Description
                    </Label>
                    <p className="text-sm text-slate-200 mt-1">
                      {project.description || "No description yet"}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-slate-400">
                        Referral Source
                      </Label>
                      <p className="text-sm text-slate-200 mt-1">
                        {project.referralSource || "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-slate-400">
                        Assigned Admin
                      </Label>
                      <p className="text-sm text-slate-200 mt-1">
                        {project.adminName ?? "Unknown"}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-slate-400">
                        Subscription Tier
                      </Label>
                      <p className="text-sm text-slate-200 mt-1 capitalize">
                        {project.subscriptionTier ?? "free"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-slate-400">
                        Grandfathered
                      </Label>
                      <p className="text-sm text-slate-200 mt-1">
                        {project.isGrandfathered ? "Yes" : "No"}
                      </p>
                    </div>
                  </div>
                  {project.mvpUrl && (
                    <div>
                      <Label className="text-xs text-slate-400">
                        MVP URL
                      </Label>
                      <a
                        href={project.mvpUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-violet-400 hover:text-violet-300 mt-1 block"
                      >
                        {project.mvpUrl}
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-sm text-slate-300">
                    Key Dates
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-400">
                      Created
                    </span>
                    <span className="text-sm text-slate-200">
                      {format(
                        new Date(project.createdAt),
                        "MMM d, yyyy"
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-400">
                      Last Updated
                    </span>
                    <span className="text-sm text-slate-200">
                      {formatDistanceToNow(
                        new Date(project.updatedAt),
                        { addSuffix: true }
                      )}
                    </span>
                  </div>
                  {project.mvpExpiresAt && (
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-400">
                        MVP Expires
                      </span>
                      <span className="text-sm text-amber-300">
                        {format(
                          new Date(project.mvpExpiresAt),
                          "MMM d, yyyy"
                        )}
                      </span>
                    </div>
                  )}
                  {project.stagingExpiresAt && (
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-400">
                        Staging Expires
                      </span>
                      <span className="text-sm text-amber-300">
                        {format(
                          new Date(project.stagingExpiresAt),
                          "MMM d, yyyy"
                        )}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-sm text-slate-300">
                  Project Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Add a note..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={2}
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    className="bg-violet-600 hover:bg-violet-700 self-end"
                    onClick={handleAddNote}
                    disabled={updateMutation.isPending}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
                <Separator />
                {notes.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-6">
                    No notes yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {[...notes].reverse().map((note, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-lg bg-slate-800/50 border border-slate-700"
                      >
                        <p className="text-sm text-slate-200 whitespace-pre-wrap">
                          {note.text}
                        </p>
                        <p className="text-xs text-slate-500 mt-2">
                          {note.adminName} &middot;{" "}
                          {formatDistanceToNow(
                            new Date(note.createdAt),
                            { addSuffix: true }
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transcripts Tab */}
          <TabsContent value="transcripts">
            <Card className="bg-card border-border">
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">
                  Voice Assistant integration coming soon
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  ElevenLabs + Twilio voice interviews will appear
                  here
                </p>
                {transcripts.length > 0 && (
                  <div className="mt-6 space-y-3 text-left">
                    {transcripts.map((t, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-lg bg-slate-800/50"
                      >
                        <p className="text-sm font-medium text-slate-200">
                          {t.title}
                        </p>
                        <p className="text-sm text-slate-400 mt-1">
                          {t.content}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {t.source} &middot; {t.createdAt}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Outputs Tab */}
          <TabsContent value="ai-outputs">
            <Card className="bg-card border-border">
              <CardContent className="py-6">
                {aiOutputs.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-slate-400">
                      No AI outputs yet
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Phase 02 (PLAN) will generate multi-LLM
                      enhanced prompts here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {aiOutputs.map((output, i) => (
                      <div
                        key={i}
                        className="p-4 rounded-lg bg-slate-800/50 border border-slate-700"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {output.model}
                          </Badge>
                          <span className="text-xs text-slate-500">
                            {output.createdAt}
                          </span>
                        </div>
                        <p className="text-sm text-slate-300 whitespace-pre-wrap">
                          {output.output}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Retainer & Agreements Tab */}
          <TabsContent value="retainer">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-sm text-slate-300">
                    Retainer Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Retainer Paid</Label>
                    <Switch
                      checked={project.retainerPaid}
                      onCheckedChange={(checked) =>
                        updateMutation.mutate({
                          id: project.id,
                          retainerPaid: checked,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-400">
                      Retainer Amount
                    </Label>
                    <div className="flex items-center gap-2 mt-1">
                      <DollarSign className="h-4 w-4 text-slate-400" />
                      <Input
                        type="number"
                        defaultValue={
                          project.retainerAmount ?? "0"
                        }
                        onBlur={(e) =>
                          updateMutation.mutate({
                            id: project.id,
                            retainerAmount: e.target.value,
                          })
                        }
                        className="w-40"
                      />
                      <span className="text-xs text-slate-500">
                        Min: $
                        {RETAINER_MINIMUM.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-slate-400">
                      Profit Share %
                    </Label>
                    <Input
                      type="number"
                      defaultValue={
                        project.profitSharePercentage ?? "40"
                      }
                      onBlur={(e) =>
                        updateMutation.mutate({
                          id: project.id,
                          profitSharePercentage: e.target.value,
                        })
                      }
                      className="w-40 mt-1"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Grandfathered Account</Label>
                    <Switch
                      checked={project.isGrandfathered}
                      onCheckedChange={(checked) =>
                        updateMutation.mutate({
                          id: project.id,
                          isGrandfathered: checked,
                        })
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-sm text-slate-300">
                    Add-On Packages ($
                    {ADD_ON_PRICE.toLocaleString()} each)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    {
                      key: "customerAcquisition",
                      label: "Customer Acquisition",
                    },
                    {
                      key: "openClawAdmin",
                      label: "Open Claw Administrator",
                    },
                    {
                      key: "infrastructure",
                      label: "Infrastructure Setup",
                    },
                    {
                      key: "businessArtifacts",
                      label: "Business Artifacts",
                    },
                  ].map((addon) => (
                    <div
                      key={addon.key}
                      className="flex items-center justify-between"
                    >
                      <Label>{addon.label}</Label>
                      <Switch
                        checked={!!addOns[addon.key]}
                        onCheckedChange={(checked) =>
                          updateMutation.mutate({
                            id: project.id,
                            addOns: {
                              ...addOns,
                              [addon.key]: checked,
                            },
                          })
                        }
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Activity Timeline */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm text-slate-300">
              Activity Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!events?.length ? (
              <p className="text-sm text-slate-500 text-center py-4">
                No activity logged
              </p>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 p-2"
                  >
                    <div className="h-2 w-2 rounded-full bg-violet-400 mt-2 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-200">
                        {event.eventType.replace(/_/g, " ")}
                        {event.fromPhase !== null &&
                          event.toPhase !== null && (
                            <span className="text-slate-400">
                              {" "}
                              &mdash; Phase{" "}
                              {PHASE_NAMES[event.fromPhase]} to{" "}
                              {PHASE_NAMES[event.toPhase!]}
                            </span>
                          )}
                      </p>
                      {event.notes && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          {event.notes}
                        </p>
                      )}
                      <p className="text-xs text-slate-500 mt-0.5">
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
    </AdminLayout>
  );
}
