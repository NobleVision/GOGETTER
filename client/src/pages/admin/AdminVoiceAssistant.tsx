import { useMemo, useState } from "react";
import {
  Activity,
  Bot,
  BrainCircuit,
  CalendarClock,
  FileAudio,
  FileText,
  Mic,
  Phone,
  RefreshCcw,
  Sparkles,
  Video,
  Wand2,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import AdminLayout from "@/components/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";

const SECTION_TABS = [
  { value: "call-admin", label: "Call Admin", icon: CalendarClock },
  { value: "ai-admin", label: "AI Admin", icon: Bot },
  { value: "contact-admin", label: "Contact Admin", icon: Phone },
  { value: "live-admin", label: "Live Admin", icon: Activity },
  { value: "log-admin", label: "Log Admin", icon: FileAudio },
  { value: "content-admin", label: "Content Admin", icon: FileText },
] as const;

function formatDateTime(value?: string | Date | null) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return format(date, "MMM d, yyyy h:mm a");
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  accent,
}: {
  title: string;
  value: number | string;
  description: string;
  icon: typeof Activity;
  accent: string;
}) {
  return (
    <Card className="border-border bg-card/80 backdrop-blur">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              {title}
            </p>
            <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
            <p className="mt-2 text-sm text-slate-400">{description}</p>
          </div>
          <div className={`rounded-2xl border p-3 ${accent}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminVoiceAssistant() {
  const utils = trpc.useUtils();
  const [contactSearch, setContactSearch] = useState("");
  const [callLogSearch, setCallLogSearch] = useState("");
  const [contentFilter, setContentFilter] = useState("");

  const [agentForm, setAgentForm] = useState({
    name: "",
    elevenLabsVoiceId: "",
    description: "",
    avatarUrl: "",
    tags: "sales, support",
  });

  const [meetingForm, setMeetingForm] = useState({
    subject: "",
    description: "",
    startTime: "",
    durationMinutes: "30",
    invitees: "",
    experimentalVideoEnabled: false,
  });

  const [schedulerForm, setSchedulerForm] = useState({
    agentId: "",
    userId: "",
    zoomMeetingId: "",
    type: "zoom_join",
    mode: "project_management",
    startTime: "",
    notes: "",
  });

  const [developmentPrompt, setDevelopmentPrompt] = useState(
    "Help convert the user’s business idea into a concise implementation brief with next actions."
  );

  const [contentEditor, setContentEditor] = useState({
    callLogId: "",
    userId: "",
    title: "",
    contentType: "summary",
    body: "",
  });

  const overview = trpc.admin.voiceAssistant.overview.useQuery();
  const config = trpc.admin.voiceAssistant.config.useQuery();
  const agents = trpc.admin.voiceAssistant.agents.list.useQuery();
  const presets = trpc.admin.voiceAssistant.agents.listPresets.useQuery();
  const meetings = trpc.admin.voiceAssistant.meetings.list.useQuery({
    includeCompleted: false,
  });
  const completedMeetings = trpc.admin.voiceAssistant.meetings.list.useQuery({
    includeCompleted: true,
    status: "completed",
  });
  const scheduledActions = trpc.admin.voiceAssistant.scheduler.list.useQuery();
  const contacts = trpc.admin.voiceAssistant.contacts.list.useQuery(
    contactSearch ? { search: contactSearch } : undefined
  );
  const liveActivity = trpc.admin.voiceAssistant.live.list.useQuery({ hours: 1 });
  const callLogs = trpc.admin.voiceAssistant.logs.list.useQuery(
    callLogSearch ? { search: callLogSearch } : undefined
  );
  const logAnalysis = trpc.admin.voiceAssistant.logs.analysis.useQuery();
  const contentItems = trpc.admin.voiceAssistant.content.list.useQuery();

  const refreshAll = async () => {
    await Promise.all([
      overview.refetch(),
      config.refetch(),
      agents.refetch(),
      meetings.refetch(),
      completedMeetings.refetch(),
      scheduledActions.refetch(),
      contacts.refetch(),
      liveActivity.refetch(),
      callLogs.refetch(),
      logAnalysis.refetch(),
      contentItems.refetch(),
    ]);
  };

  const invalidateVoiceAssistant = async () => {
    await utils.admin.voiceAssistant.invalidate();
  };

  const seedDemo = trpc.admin.voiceAssistant.seedDemo.useMutation({
    onSuccess: async (result) => {
      toast.success(result.seeded ? "Voice Assistant demo data created." : "Voice Assistant demo data already exists.");
      await refreshAll();
    },
    onError: (error) => toast.error(error.message),
  });

  const createAgent = trpc.admin.voiceAssistant.agents.create.useMutation({
    onSuccess: async () => {
      toast.success("Voice agent created.");
      setAgentForm({ name: "", elevenLabsVoiceId: "", description: "", avatarUrl: "", tags: "sales, support" });
      await refreshAll();
    },
    onError: (error) => toast.error(error.message),
  });

  const createFromPreset = trpc.admin.voiceAssistant.agents.createFromPreset.useMutation({
    onSuccess: async (agent) => {
      toast.success(`Preset agent "${agent.name}" created.`);
      await refreshAll();
    },
    onError: (error) => toast.error(error.message),
  });

  const previewVoice = trpc.admin.voiceAssistant.agents.preview.useMutation({
    onSuccess: (result) => {
      const audio = new Audio(`data:${result.mime};base64,${result.audioBase64}`);
      audio.play().catch((err) => toast.error(`Playback blocked: ${err.message}`));
    },
    onError: (error) => toast.error(error.message),
  });

  const createMeeting = trpc.admin.voiceAssistant.meetings.create.useMutation({
    onSuccess: async () => {
      toast.success("Zoom meeting scheduled.");
      setMeetingForm({
        subject: "",
        description: "",
        startTime: "",
        durationMinutes: "30",
        invitees: "",
        experimentalVideoEnabled: false,
      });
      await refreshAll();
    },
    onError: (error) => toast.error(error.message),
  });

  const createScheduledAction = trpc.admin.voiceAssistant.scheduler.create.useMutation({
    onSuccess: async () => {
      toast.success("Voice action scheduled.");
      setSchedulerForm({
        agentId: "",
        userId: "",
        zoomMeetingId: "",
        type: "zoom_join",
        mode: "project_management",
        startTime: "",
        notes: "",
      });
      await refreshAll();
    },
    onError: (error) => toast.error(error.message),
  });

  const ensureCode = trpc.admin.voiceAssistant.contacts.ensureCode.useMutation({
    onSuccess: async ({ code }) => {
      toast.success(`AI confirmation code ready: ${code}`);
      await contacts.refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const hangUpMeeting = trpc.admin.voiceAssistant.meetings.hangUp.useMutation({
    onSuccess: async () => {
      toast.success("Meeting marked as completed.");
      await refreshAll();
    },
    onError: (error) => toast.error(error.message),
  });

  const dropAgent = trpc.admin.voiceAssistant.live.dropAgent.useMutation({
    onSuccess: async () => {
      toast.success("Agent dropped from call.");
      await liveActivity.refetch();
      await callLogs.refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const resetAgent = trpc.admin.voiceAssistant.live.resetAgent.useMutation({
    onSuccess: async () => {
      toast.success("Agent session reset queued.");
      await liveActivity.refetch();
      await callLogs.refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const rejoinAgent = trpc.admin.voiceAssistant.live.rejoinAgent.useMutation({
    onSuccess: async () => {
      toast.success("Agent rejoined the session.");
      await liveActivity.refetch();
      await callLogs.refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const executeNow = trpc.admin.voiceAssistant.scheduler.executeNow.useMutation({
    onSuccess: async () => {
      toast.success("Scheduled action queued for immediate execution.");
      await scheduledActions.refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const createDevelopmentBrief = trpc.admin.voiceAssistant.logs.developmentBrief.useMutation({
    onSuccess: async (result) => {
      toast.success(`Development brief generated via ${result.source}.`);
      await refreshAll();
    },
    onError: (error) => toast.error(error.message),
  });

  const upsertContent = trpc.admin.voiceAssistant.content.upsert.useMutation({
    onSuccess: async () => {
      toast.success("Content record saved.");
      setContentEditor({ callLogId: "", userId: "", title: "", contentType: "summary", body: "" });
      await contentItems.refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const loading =
    overview.isLoading ||
    config.isLoading ||
    agents.isLoading ||
    meetings.isLoading ||
    scheduledActions.isLoading ||
    contacts.isLoading ||
    liveActivity.isLoading ||
    callLogs.isLoading ||
    contentItems.isLoading;

  const activityChart = useMemo(
    () => [
      { name: "Agents", count: overview.data?.totals.agents ?? 0 },
      { name: "Scheduled", count: overview.data?.totals.scheduledActions ?? 0 },
      { name: "Meetings", count: overview.data?.totals.activeMeetings ?? 0 },
      { name: "Live", count: overview.data?.totals.liveCalls ?? 0 },
      { name: "Logs", count: overview.data?.totals.logsToday ?? 0 },
    ],
    [overview.data]
  );

  const filteredContent = useMemo(() => {
    const items = contentItems.data ?? [];
    if (!contentFilter.trim()) return items;
    const needle = contentFilter.toLowerCase();
    return items.filter((item) =>
      [
        item.content.title,
        item.content.body,
        item.userName,
        item.businessName,
        item.content.contentType,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle))
    );
  }, [contentFilter, contentItems.data]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-violet-300">
              <Sparkles className="h-3.5 w-3.5" />
              Voice Assistant Operations Center
            </div>
            <h1 className="mt-3 text-3xl font-bold text-white">
              GoGetterOS Voice Assistant Administration
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-400">
              Schedule AI-led Zoom sessions, manage ElevenLabs agents, keep caller profiles current, monitor live activity, and review transcripts tied back to the Zero to Hero pipeline.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              className="border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
              onClick={() => refreshAll().then(() => toast.success("Voice Assistant data refreshed."))}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button
              className="bg-violet-600 text-white hover:bg-violet-500"
              onClick={() => seedDemo.mutate()}
              disabled={seedDemo.isPending}
            >
              <Wand2 className="mr-2 h-4 w-4" />
              Seed Demo Data
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          {loading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-32 rounded-2xl" />
            ))
          ) : (
            <>
              <StatCard
                title="Voice Agents"
                value={overview.data?.totals.agents ?? 0}
                description="Configured ElevenLabs personas and rules of engagement."
                icon={Bot}
                accent="border-violet-500/20 bg-violet-500/10 text-violet-300"
              />
              <StatCard
                title="Scheduled Actions"
                value={overview.data?.totals.scheduledActions ?? 0}
                description="Queued AI joins, outbound calls, and inbound windows."
                icon={CalendarClock}
                accent="border-cyan-500/20 bg-cyan-500/10 text-cyan-300"
              />
              <StatCard
                title="Active Meetings"
                value={overview.data?.totals.activeMeetings ?? 0}
                description="Current and future Zoom sessions under management."
                icon={Video}
                accent="border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
              />
              <StatCard
                title="Live Sessions"
                value={overview.data?.totals.liveCalls ?? 0}
                description="Calls currently in progress or awaiting intervention."
                icon={Activity}
                accent="border-amber-500/20 bg-amber-500/10 text-amber-300"
              />
              <StatCard
                title="Logs in 24h"
                value={overview.data?.totals.logsToday ?? 0}
                description="Recent interaction history available for search and review."
                icon={FileAudio}
                accent="border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-300"
              />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_1fr]">
          <Card className="border-border bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <BrainCircuit className="h-5 w-5 text-violet-400" />
                Operations Snapshot
              </CardTitle>
              <CardDescription>
                Current admin-side volume across agents, schedules, meetings, live sessions, and logs.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[260px]">
              {loading ? (
                <Skeleton className="h-full w-full rounded-xl" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activityChart}>
                    <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        background: "#0f172a",
                        border: "1px solid #334155",
                        borderRadius: 12,
                        color: "#fff",
                      }}
                    />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]} fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="border-border bg-card/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Deployment Readiness</CardTitle>
              <CardDescription>
                Quick-read status for the integrations behind the Voice Assistant screen.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">ElevenLabs Voices</p>
                      <p className="text-xs text-slate-400">Available for friendly selection in AI Admin.</p>
                    </div>
                    <Badge variant="secondary" className="bg-violet-500/10 text-violet-200">
                      {config.data?.availableVoices.length ?? 0}
                    </Badge>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">Experimental Video Dial-In</p>
                      <p className="text-xs text-slate-400">Toggleable from meeting setup and scheduler metadata.</p>
                    </div>
                    <Badge className="bg-cyan-500/10 text-cyan-200">Pika Ready</Badge>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">AI Log Analysis</p>
                      <p className="text-xs text-slate-400">Summaries and Development Mode briefs are now wired.</p>
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-200">Enabled</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="call-admin" className="space-y-6">
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-2 rounded-2xl border border-slate-800 bg-slate-900/80 p-2">
            {SECTION_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="rounded-xl px-4 py-2 data-[state=active]:bg-violet-600 data-[state=active]:text-white"
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="call-admin" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_1fr]">
              <Card className="border-border bg-card/80">
                <CardHeader>
                  <CardTitle className="text-white">Zoom Meeting Scheduler</CardTitle>
                  <CardDescription>
                    Launch meetings now or schedule future sessions with invitees, agenda context, and experimental video support.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Input
                      value={meetingForm.subject}
                      onChange={(event) => setMeetingForm((state) => ({ ...state, subject: event.target.value }))}
                      placeholder="Meeting subject"
                    />
                    <Input
                      type="datetime-local"
                      value={meetingForm.startTime}
                      onChange={(event) => setMeetingForm((state) => ({ ...state, startTime: event.target.value }))}
                    />
                    <Input
                      value={meetingForm.durationMinutes}
                      onChange={(event) => setMeetingForm((state) => ({ ...state, durationMinutes: event.target.value }))}
                      placeholder="Duration in minutes"
                    />
                    <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-white">Experimental video dial-in</p>
                        <p className="text-xs text-slate-400">Use Pika-based avatar streaming when available.</p>
                      </div>
                      <Switch
                        checked={meetingForm.experimentalVideoEnabled}
                        onCheckedChange={(checked) => setMeetingForm((state) => ({ ...state, experimentalVideoEnabled: checked }))}
                      />
                    </div>
                  </div>
                  <Textarea
                    value={meetingForm.description}
                    onChange={(event) => setMeetingForm((state) => ({ ...state, description: event.target.value }))}
                    placeholder="Meeting description or agenda"
                    rows={3}
                  />
                  <Textarea
                    value={meetingForm.invitees}
                    onChange={(event) => setMeetingForm((state) => ({ ...state, invitees: event.target.value }))}
                    placeholder="Invitees, one per line as Name <email@company.com>"
                    rows={4}
                  />
                  <div className="flex justify-end">
                    <Button
                      className="bg-violet-600 text-white hover:bg-violet-500"
                      disabled={createMeeting.isPending || !meetingForm.subject || !meetingForm.startTime}
                      onClick={() => {
                        const invitees = meetingForm.invitees
                          .split("\n")
                          .map((line) => line.trim())
                          .filter(Boolean)
                          .map((line) => {
                            const match = line.match(/^(.*)<(.*)>$/);
                            if (match) {
                              return { name: match[1].trim(), email: match[2].trim() };
                            }
                            return { name: line, email: `${line.replace(/\s+/g, ".").toLowerCase()}@example.com` };
                          });

                        createMeeting.mutate({
                          subject: meetingForm.subject,
                          description: meetingForm.description || undefined,
                          startTime: new Date(meetingForm.startTime),
                          durationMinutes: Number(meetingForm.durationMinutes || 30),
                          invitees,
                          experimentalVideoEnabled: meetingForm.experimentalVideoEnabled,
                        });
                      }}
                    >
                      <Video className="mr-2 h-4 w-4" />
                      Schedule Meeting
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card/80">
                <CardHeader>
                  <CardTitle className="text-white">AI Voice Agent Scheduler</CardTitle>
                  <CardDescription>
                    Assign an agent to join a Zoom meeting, place an outbound call, or wait for an inbound caller during a defined time window.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <select
                      className="h-10 rounded-md border border-slate-800 bg-slate-950 px-3 text-sm text-slate-100"
                      value={schedulerForm.agentId}
                      onChange={(event) => setSchedulerForm((state) => ({ ...state, agentId: event.target.value }))}
                    >
                      <option value="">Select AI agent</option>
                      {(agents.data ?? []).map((agent) => (
                        <option key={agent.id} value={agent.id}>
                          {agent.name}
                        </option>
                      ))}
                    </select>
                    <select
                      className="h-10 rounded-md border border-slate-800 bg-slate-950 px-3 text-sm text-slate-100"
                      value={schedulerForm.zoomMeetingId}
                      onChange={(event) => setSchedulerForm((state) => ({ ...state, zoomMeetingId: event.target.value }))}
                    >
                      <option value="">Linked Zoom meeting (optional)</option>
                      {(meetings.data ?? []).map((meeting) => (
                        <option key={meeting.id} value={meeting.id}>
                          {meeting.subject}
                        </option>
                      ))}
                    </select>
                    <select
                      className="h-10 rounded-md border border-slate-800 bg-slate-950 px-3 text-sm text-slate-100"
                      value={schedulerForm.type}
                      onChange={(event) => setSchedulerForm((state) => ({ ...state, type: event.target.value }))}
                    >
                      <option value="zoom_join">Join Zoom Meeting</option>
                      <option value="direct_call">Direct Outbound Call</option>
                      <option value="inbound_wait">Inbound Wait Window</option>
                      <option value="zoom_host">Host / Run Meeting</option>
                      <option value="custom">Custom Voice Action</option>
                    </select>
                    <select
                      className="h-10 rounded-md border border-slate-800 bg-slate-950 px-3 text-sm text-slate-100"
                      value={schedulerForm.mode}
                      onChange={(event) => setSchedulerForm((state) => ({ ...state, mode: event.target.value }))}
                    >
                      <option value="listen">Listen Mode</option>
                      <option value="interact">Interact Mode</option>
                      <option value="business">Business Mode</option>
                      <option value="project_management">PM Mode</option>
                      <option value="development">Development Mode</option>
                      <option value="custom">Custom Mode</option>
                    </select>
                    <Input
                      placeholder="User ID for contact verification"
                      value={schedulerForm.userId}
                      onChange={(event) => setSchedulerForm((state) => ({ ...state, userId: event.target.value }))}
                    />
                    <Input
                      type="datetime-local"
                      value={schedulerForm.startTime}
                      onChange={(event) => setSchedulerForm((state) => ({ ...state, startTime: event.target.value }))}
                    />
                  </div>
                  <Textarea
                    value={schedulerForm.notes}
                    onChange={(event) => setSchedulerForm((state) => ({ ...state, notes: event.target.value }))}
                    placeholder="Rules of engagement, special instructions, or inbound verification notes"
                    rows={4}
                  />
                  <div className="flex justify-end">
                    <Button
                      className="bg-cyan-600 text-white hover:bg-cyan-500"
                      disabled={createScheduledAction.isPending || !schedulerForm.startTime || !schedulerForm.type}
                      onClick={() => {
                        createScheduledAction.mutate({
                          agentId: schedulerForm.agentId ? Number(schedulerForm.agentId) : undefined,
                          userId: schedulerForm.userId ? Number(schedulerForm.userId) : undefined,
                          zoomMeetingId: schedulerForm.zoomMeetingId ? Number(schedulerForm.zoomMeetingId) : undefined,
                          type: schedulerForm.type as any,
                          mode: schedulerForm.mode as any,
                          startTime: new Date(schedulerForm.startTime),
                          metadata: {
                            notes: schedulerForm.notes,
                            confirmationRequired: Boolean(schedulerForm.userId),
                          },
                        });
                      }}
                    >
                      <Mic className="mr-2 h-4 w-4" />
                      Schedule Voice Action
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <Card className="border-border bg-card/80">
                <CardHeader>
                  <CardTitle className="text-white">Current and Upcoming Meetings</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[320px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Subject</TableHead>
                          <TableHead>Start</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(meetings.data ?? []).map((meeting) => (
                          <TableRow key={meeting.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium text-white">{meeting.subject}</p>
                                <p className="text-xs text-slate-400">{meeting.description || "No description"}</p>
                              </div>
                            </TableCell>
                            <TableCell>{formatDateTime(meeting.startTime)}</TableCell>
                            <TableCell>
                              <Badge className="bg-violet-500/10 text-violet-200">{meeting.status}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-slate-200 hover:bg-slate-800"
                                onClick={() => hangUpMeeting.mutate({ id: meeting.id })}
                              >
                                Hang Up
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {!meetings.data?.length && (
                          <TableRow>
                            <TableCell colSpan={4} className="py-8 text-center text-slate-500">
                              No active or scheduled meetings yet.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card className="border-border bg-card/80">
                <CardHeader>
                  <CardTitle className="text-white">Completed Meetings & Scheduled Queue</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ScrollArea className="h-[150px] rounded-xl border border-slate-800 bg-slate-950/60 p-2">
                    <div className="space-y-3 pr-3">
                      {(completedMeetings.data ?? []).map((meeting) => (
                        <div key={meeting.id} className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-medium text-white">{meeting.subject}</p>
                              <p className="text-xs text-slate-400">Completed {formatDistanceToNow(new Date(meeting.updatedAt), { addSuffix: true })}</p>
                            </div>
                            <Badge className="bg-emerald-500/10 text-emerald-200">{meeting.status}</Badge>
                          </div>
                        </div>
                      ))}
                      {!completedMeetings.data?.length && (
                        <p className="py-6 text-center text-sm text-slate-500">No completed meetings yet.</p>
                      )}
                    </div>
                  </ScrollArea>

                  <ScrollArea className="h-[150px] rounded-xl border border-slate-800 bg-slate-950/60 p-2">
                    <div className="space-y-3 pr-3">
                      {(scheduledActions.data ?? []).map((item) => (
                        <div key={item.action.id} className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium text-white">{item.agentName ?? "Unassigned Agent"} · {item.action.type}</p>
                              <p className="text-xs text-slate-400">{formatDateTime(item.action.startTime)} · {item.meetingSubject ?? item.userName ?? "General task"}</p>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => executeNow.mutate({ id: item.action.id })}>
                              Execute Now
                            </Button>
                          </div>
                        </div>
                      ))}
                      {!scheduledActions.data?.length && (
                        <p className="py-6 text-center text-sm text-slate-500">No scheduled voice actions yet.</p>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="ai-admin" className="space-y-6">
            <Card className="border-border bg-card/80">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Sparkles className="h-5 w-5 text-violet-300" />
                  Personality Presets
                </CardTitle>
                <CardDescription>
                  One-click agents with voice, mode, emotion triggers, and sample prompt pre-tuned. Pick a preset, then edit as needed.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {(presets.data ?? []).map((preset) => (
                    <div key={preset.key} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-white">{preset.name}</p>
                          <p className="mt-1 text-xs text-slate-400">{preset.description}</p>
                        </div>
                        <Badge className="bg-violet-500/10 text-violet-200">{preset.defaultMode}</Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1">
                        {preset.tags.map((tag) => (
                          <Badge key={tag} className="bg-slate-800 text-slate-300">{tag}</Badge>
                        ))}
                      </div>
                      <Button
                        className="mt-4 w-full bg-violet-600 text-white hover:bg-violet-500"
                        disabled={createFromPreset.isPending || !agentForm.elevenLabsVoiceId}
                        onClick={() =>
                          createFromPreset.mutate({
                            preset: preset.key,
                            elevenLabsVoiceId: agentForm.elevenLabsVoiceId,
                            avatarUrl: agentForm.avatarUrl || undefined,
                          })
                        }
                      >
                        <Wand2 className="mr-2 h-4 w-4" />
                        Create {preset.name}
                      </Button>
                    </div>
                  ))}
                </div>
                {!agentForm.elevenLabsVoiceId && (
                  <p className="mt-4 text-xs text-amber-300">
                    Pick an ElevenLabs voice in the form below to enable preset creation.
                  </p>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1.2fr]">
              <Card className="border-border bg-card/80">
                <CardHeader>
                  <CardTitle className="text-white">Create / Configure Agent</CardTitle>
                  <CardDescription>
                    Define the name, ElevenLabs voice, avatar, and operating rules that shape how the AI behaves in meetings and calls.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input value={agentForm.name} onChange={(event) => setAgentForm((state) => ({ ...state, name: event.target.value }))} placeholder="Agent display name" />
                  <div className="flex gap-2">
                    <select
                      className="flex-1 h-10 rounded-md border border-slate-800 bg-slate-950 px-3 text-sm text-slate-100"
                      value={agentForm.elevenLabsVoiceId}
                      onChange={(event) => setAgentForm((state) => ({ ...state, elevenLabsVoiceId: event.target.value }))}
                    >
                      <option value="">Select ElevenLabs voice</option>
                      {(config.data?.availableVoices ?? []).map((voice) => (
                        <option key={voice.id} value={voice.id}>
                          {voice.label}
                        </option>
                      ))}
                    </select>
                    <Button
                      variant="outline"
                      className="border-slate-700 text-slate-100 hover:bg-slate-800"
                      disabled={!agentForm.elevenLabsVoiceId || previewVoice.isPending}
                      onClick={() =>
                        previewVoice.mutate({
                          voiceId: agentForm.elevenLabsVoiceId,
                          text: agentForm.name
                            ? `Hi, I'm ${agentForm.name}, your GoGetterOS assistant.`
                            : undefined,
                        })
                      }
                      title="Preview voice"
                    >
                      <Mic className="h-4 w-4" />
                      <span className="ml-1">{previewVoice.isPending ? "..." : "Preview"}</span>
                    </Button>
                  </div>
                  <Input value={agentForm.avatarUrl} onChange={(event) => setAgentForm((state) => ({ ...state, avatarUrl: event.target.value }))} placeholder="Cloudinary avatar URL" />
                  <Textarea value={agentForm.description} onChange={(event) => setAgentForm((state) => ({ ...state, description: event.target.value }))} placeholder="Describe the persona, access level, and ideal use cases" rows={4} />
                  <Input value={agentForm.tags} onChange={(event) => setAgentForm((state) => ({ ...state, tags: event.target.value }))} placeholder="Tags, comma separated" />
                  <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                    <p className="text-sm font-medium text-white">Default modes included</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Listen, Interact, Business, Project Management, and Development modes are seeded automatically, and V3 emotions default to enabled.
                    </p>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      className="bg-violet-600 text-white hover:bg-violet-500"
                      disabled={createAgent.isPending || !agentForm.name || !agentForm.elevenLabsVoiceId}
                      onClick={() =>
                        createAgent.mutate({
                          name: agentForm.name,
                          elevenLabsVoiceId: agentForm.elevenLabsVoiceId,
                          description: agentForm.description || undefined,
                          avatarUrl: agentForm.avatarUrl || undefined,
                          tags: agentForm.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
                        })
                      }
                    >
                      <Bot className="mr-2 h-4 w-4" />
                      Save Agent
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card/80">
                <CardHeader>
                  <CardTitle className="text-white">Configured AI Agents</CardTitle>
                  <CardDescription>
                    Review voice assignments, emotional behavior, and persona metadata for every agent available to Call Admin and Live Admin.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[520px]">
                    <div className="space-y-4 pr-3">
                      {(agents.data ?? []).map((agent) => (
                        <div key={agent.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                            <div>
                              <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-200">
                                  <Bot className="h-5 w-5" />
                                </div>
                                <div>
                                  <p className="font-semibold text-white">{agent.name}</p>
                                  <p className="text-xs text-slate-400">Voice: {agent.elevenLabsVoiceId}</p>
                                </div>
                              </div>
                              <p className="mt-4 text-sm text-slate-300">{agent.description || "No description provided yet."}</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Badge className="bg-violet-500/10 text-violet-200">{agent.accessLevel}</Badge>
                              <Badge className="bg-cyan-500/10 text-cyan-200">{agent.defaultMode}</Badge>
                              <Badge className={agent.emotionsEnabled ? "bg-emerald-500/10 text-emerald-200" : "bg-slate-800 text-slate-300"}>
                                {agent.emotionsEnabled ? "V3 emotions on" : "Emotions off"}
                              </Badge>
                            </div>
                          </div>
                          <div className="mt-4 grid gap-4 md:grid-cols-2">
                            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Emotion Triggers</p>
                              <div className="mt-2 space-y-2 text-sm text-slate-300">
                                {(agent.emotionTriggers ?? []).map((trigger: any, index: number) => (
                                  <div key={index} className="rounded-lg bg-slate-950/60 px-3 py-2">
                                    <span className="font-medium text-white">{trigger.emotion}</span> · {trigger.trigger}
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Modes / Rules of Engagement</p>
                              <div className="mt-2 space-y-2 text-sm text-slate-300">
                                {(agent.modesConfig ?? []).map((mode: any, index: number) => (
                                  <div key={index} className="rounded-lg bg-slate-950/60 px-3 py-2">
                                    <p className="font-medium text-white">{mode.label}</p>
                                    <p className="mt-1 text-xs text-slate-400">{mode.prompt}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {!agents.data?.length && (
                        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/60 p-8 text-center text-sm text-slate-500">
                          Create your first agent to unlock scheduling, inbound handling, and live call controls.
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="contact-admin" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1.4fr]">
              <Card className="border-border bg-card/80">
                <CardHeader>
                  <CardTitle className="text-white">Caller Profile Notes</CardTitle>
                  <CardDescription>
                    Each contact can have an AI confirmation code, profile image, linked pipeline projects, and customer context available to the agent during calls.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    value={contactSearch}
                    onChange={(event) => setContactSearch(event.target.value)}
                    placeholder="Search by name, email, business, or POC"
                  />
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300">
                    <p className="font-medium text-white">How incoming verification works</p>
                    <p className="mt-2 text-slate-400">
                      When a user calls the assistant directly, the AI can request the secret confirmation code stored on the user profile. Admins can regenerate or reveal the code here, and the same value can be shown in the customer profile later.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card/80">
                <CardHeader>
                  <CardTitle className="text-white">Linked Contacts and Businesses</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[520px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Contact</TableHead>
                          <TableHead>Business Context</TableHead>
                          <TableHead>Secret Code</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(contacts.data ?? []).map((contact) => (
                          <TableRow key={`${contact.id}-${contact.projectId ?? "none"}`}>
                            <TableCell>
                              <div>
                                <p className="font-medium text-white">{contact.name || "Unnamed user"}</p>
                                <p className="text-xs text-slate-400">{contact.email || "No email"}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium text-slate-200">{contact.businessName || "No linked business yet"}</p>
                                <p className="text-xs text-slate-400">Phase {contact.phase ?? "—"} · {contact.status ?? "No pipeline status"}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-amber-500/10 text-amber-200">{contact.aiConfirmationCode || "Not issued"}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="outline" size="sm" onClick={() => ensureCode.mutate({ userId: contact.id })}>
                                Generate / Reveal Code
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {!contacts.data?.length && (
                          <TableRow>
                            <TableCell colSpan={4} className="py-10 text-center text-slate-500">
                              No contacts matched the current filter.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="live-admin" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_1fr]">
              <Card className="border-border bg-card/80">
                <CardHeader>
                  <CardTitle className="text-white">Live Status Feed · Last 60 Minutes</CardTitle>
                  <CardDescription>
                    Twilio, ElevenLabs, Zoom, and system events are rolled into the same live session timeline for rapid intervention.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[520px]">
                    <div className="space-y-4 pr-3">
                      {(liveActivity.data ?? []).map((item) => (
                        <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-semibold text-white">{item.agentName ?? "Unassigned agent"} · {item.userName ?? item.phoneNumber ?? "Unknown participant"}</p>
                              <p className="mt-1 text-xs text-slate-400">{item.type} · started {formatDistanceToNow(new Date(item.startedAt), { addSuffix: true })}</p>
                            </div>
                            <Badge className={item.status === "in_progress" ? "bg-emerald-500/10 text-emerald-200" : "bg-slate-800 text-slate-300"}>
                              {item.status}
                            </Badge>
                          </div>
                          <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto]">
                            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-sm text-slate-300">
                              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Thinking / live event trail</p>
                              <div className="mt-2 space-y-2">
                                {(item.liveEvents ?? []).slice(-4).map((event: any, index: number) => (
                                  <div key={index} className="rounded-lg bg-slate-950/60 px-3 py-2">
                                    <p className="font-medium text-white">{event.source} · {event.status}</p>
                                    <p className="mt-1 text-xs text-slate-400">{event.detail || event.timestamp}</p>
                                  </div>
                                ))}
                                {!(item.liveEvents ?? []).length && (
                                  <p className="text-xs text-slate-500">No live events captured yet.</p>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <Button variant="outline" onClick={() => dropAgent.mutate({ callLogId: item.id })}>Drop Agent</Button>
                              <Button variant="outline" onClick={() => resetAgent.mutate({ callLogId: item.id })}>Reset Agent</Button>
                              <Button variant="outline" onClick={() => rejoinAgent.mutate({ callLogId: item.id })}>Rejoin Agent</Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {!liveActivity.data?.length && (
                        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/60 p-8 text-center text-sm text-slate-500">
                          Nothing is live right now. As webhook events arrive, this panel becomes the command center for hang up, drop, reset, and rejoin controls.
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card className="border-border bg-card/80">
                <CardHeader>
                  <CardTitle className="text-white">Development Mode / Research Window</CardTitle>
                  <CardDescription>
                    Generate a live implementation brief while a caller is discussing a new idea, then store the result into Content Admin for follow-up.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea value={developmentPrompt} onChange={(event) => setDevelopmentPrompt(event.target.value)} rows={10} />
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300">
                    <p className="font-medium text-white">Internet search / reasoning status</p>
                    <p className="mt-2 text-slate-400">
                      This panel is ready for real-time reasoning traces. The current build surfaces the workflow entry point and stores the resulting implementation brief for the admin team.
                    </p>
                  </div>
                  <Button className="w-full bg-violet-600 text-white hover:bg-violet-500" onClick={() => createDevelopmentBrief.mutate({ prompt: developmentPrompt })}>
                    <BrainCircuit className="mr-2 h-4 w-4" />
                    Generate Development Brief
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="log-admin" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1.3fr]">
              <Card className="border-border bg-card/80">
                <CardHeader>
                  <CardTitle className="text-white">AI Summary and Search</CardTitle>
                  <CardDescription>
                    Search call history by agent, contact, or transcript content, then use the automated analysis to identify trends and follow-up actions.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input value={callLogSearch} onChange={(event) => setCallLogSearch(event.target.value)} placeholder="Search transcripts, summaries, contacts, or agents" />
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">24-hour / selected range analysis</p>
                    <p className="mt-3 whitespace-pre-wrap text-sm text-slate-300">{logAnalysis.data?.summary ?? "No analysis available yet."}</p>
                    <p className="mt-3 text-xs text-slate-500">Source: {logAnalysis.data?.source ?? "—"}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card/80">
                <CardHeader>
                  <CardTitle className="text-white">Call Logs and Transcript Access</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[520px]">
                    <div className="space-y-4 pr-3">
                      {(callLogs.data ?? []).map((item) => (
                        <div key={item.log.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                            <div>
                              <p className="font-semibold text-white">{item.agentName ?? "Unassigned agent"} · {item.userName ?? item.userEmail ?? "Unknown contact"}</p>
                              <p className="mt-1 text-xs text-slate-400">{item.log.type} · {formatDateTime(item.log.startedAt)} · {item.meetingSubject ?? item.businessName ?? "No linked meeting"}</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Badge className="bg-violet-500/10 text-violet-200">{item.log.status}</Badge>
                              <Badge className="bg-slate-800 text-slate-300">{item.log.direction}</Badge>
                            </div>
                          </div>
                          <div className="mt-4 grid gap-4 md:grid-cols-2">
                            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Summary</p>
                              <p className="mt-2 text-sm text-slate-300">{item.log.summary || "No summary stored yet."}</p>
                            </div>
                            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Transcript / assets</p>
                              <p className="mt-2 text-sm text-slate-300 line-clamp-4">{item.log.transcript || "No transcript stored yet."}</p>
                              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                                {item.log.transcriptUrl && <Badge className="bg-cyan-500/10 text-cyan-200">Transcript URL ready</Badge>}
                                {item.log.recordingUrl && <Badge className="bg-emerald-500/10 text-emerald-200">Recording ready</Badge>}
                                {item.log.subtitlesUrl && <Badge className="bg-amber-500/10 text-amber-200">Subtitles ready</Badge>}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {!callLogs.data?.length && (
                        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/60 p-8 text-center text-sm text-slate-500">
                          No call logs are available yet.
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="content-admin" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1.3fr]">
              <Card className="border-border bg-card/80">
                <CardHeader>
                  <CardTitle className="text-white">Content Editor</CardTitle>
                  <CardDescription>
                    Store polished summaries, development briefs, and transcript derivatives against a user or a specific call log.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input value={contentEditor.callLogId} onChange={(event) => setContentEditor((state) => ({ ...state, callLogId: event.target.value }))} placeholder="Call Log ID" />
                  <Input value={contentEditor.userId} onChange={(event) => setContentEditor((state) => ({ ...state, userId: event.target.value }))} placeholder="User ID (optional)" />
                  <Input value={contentEditor.title} onChange={(event) => setContentEditor((state) => ({ ...state, title: event.target.value }))} placeholder="Content title" />
                  <Input value={contentEditor.contentType} onChange={(event) => setContentEditor((state) => ({ ...state, contentType: event.target.value }))} placeholder="Content type (summary, brief, transcript_excerpt)" />
                  <Textarea value={contentEditor.body} onChange={(event) => setContentEditor((state) => ({ ...state, body: event.target.value }))} placeholder="Paste the transcript, summary, or AI-generated content here" rows={10} />
                  <Button
                    className="w-full bg-violet-600 text-white hover:bg-violet-500"
                    disabled={upsertContent.isPending || !contentEditor.callLogId || !contentEditor.title}
                    onClick={() =>
                      upsertContent.mutate({
                        callLogId: Number(contentEditor.callLogId),
                        userId: contentEditor.userId ? Number(contentEditor.userId) : undefined,
                        title: contentEditor.title,
                        contentType: contentEditor.contentType,
                        body: contentEditor.body,
                      })
                    }
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Save Content Record
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-border bg-card/80">
                <CardHeader>
                  <CardTitle className="text-white">Stored Voice Assistant Content</CardTitle>
                  <CardDescription>
                    Review AI summaries and transcript derivatives already linked back to customers and pipeline projects.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input value={contentFilter} onChange={(event) => setContentFilter(event.target.value)} placeholder="Filter stored content by title, body, user, or business" />
                  <ScrollArea className="h-[460px]">
                    <div className="space-y-4 pr-3">
                      {filteredContent.map((item) => (
                        <div key={item.content.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div>
                              <p className="font-semibold text-white">{item.content.title}</p>
                              <p className="mt-1 text-xs text-slate-400">{item.content.contentType} · {item.userName ?? "No user linked"} · {item.businessName ?? "No business linked"}</p>
                            </div>
                            <Badge className="bg-violet-500/10 text-violet-200">Call #{item.content.callLogId}</Badge>
                          </div>
                          <p className="mt-4 whitespace-pre-wrap text-sm text-slate-300">{item.content.body || "No body saved yet."}</p>
                        </div>
                      ))}
                      {!filteredContent.length && (
                        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/60 p-8 text-center text-sm text-slate-500">
                          No content records match the current filter.
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
