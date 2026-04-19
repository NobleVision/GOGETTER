import { and, desc, eq, gte, ilike, inArray, lte, or, sql } from "drizzle-orm";
import {
  aiVoiceAgents,
  callContent,
  callLogs,
  pipelineProjects,
  scheduledVoiceActions,
  users,
  zoomMeetings,
  type InsertAIVoiceAgent,
  type InsertCallContent,
  type InsertCallLog,
  type InsertScheduledVoiceAction,
  type InsertZoomMeeting,
  type VoiceAgentModeConfig,
  type VoiceEmotionTrigger,
  type VoiceLiveEvent,
} from "../../drizzle/schema";
import { getDb, getApiConfigs, getUserById } from "../db";
import { ENV } from "../_core/env";
import { modelRouter } from "./modelRouter";
import {
  createZoomMeetingRemote,
  deleteZoomMeetingRemote,
  endZoomMeetingRemote,
  updateZoomMeetingRemote,
  zoomConfigured,
} from "./zoom";
import {
  hangUpCall as twilioHangUpCall,
  placeOutboundCall as twilioPlaceOutboundCall,
  twilioConfigured,
} from "./twilio";
import {
  endConversation as elevenLabsEndConversation,
  initiateOutboundConversation as elevenLabsInitiateOutboundConversation,
  elevenLabsConfigured,
} from "./elevenlabs";
import {
  pikaConfigured,
  startPikaAvatarStream,
  stopPikaStream,
} from "./pika";
import { synthesizeSpeech } from "./elevenlabs";

const DEFAULT_AGENT_MODES: VoiceAgentModeConfig[] = [
  {
    key: "listen",
    label: "Listen Mode",
    enabled: true,
    prompt:
      "Introduce yourself, then stay quiet unless spoken to directly or asked to summarize at the end.",
    tools: ["transcript", "meeting-summary"],
  },
  {
    key: "interact",
    label: "Interact Mode",
    enabled: true,
    prompt:
      "Introduce yourself clearly, answer when addressed by name, and otherwise avoid interrupting the conversation.",
    tools: ["transcript", "contact-lookup"],
  },
  {
    key: "business",
    label: "Business Mode",
    enabled: true,
    prompt:
      "Ask which business or opportunity the caller wants to discuss, collect missing information, and propose next steps.",
    tools: ["pipeline-projects", "contact-lookup", "notes"],
  },
  {
    key: "project_management",
    label: "Project Management Mode",
    enabled: true,
    prompt:
      "Run the meeting, ask each attendee for status, confirm blockers, summarize outcomes, and close with action items.",
    tools: ["status-rollup", "task-summary"],
  },
  {
    key: "development",
    label: "Development Mode",
    enabled: true,
    prompt:
      "Capture the idea, turn it into an implementation brief, and prepare a development handoff using Manus when available.",
    tools: ["implementation-brief", "manus-api"],
  },
];

const DEFAULT_EMOTION_TRIGGERS: VoiceEmotionTrigger[] = [
  { trigger: "celebrating progress or wins", emotion: "joy", intensity: 0.65 },
  { trigger: "discussing blockers or urgency", emotion: "concern", intensity: 0.45 },
  { trigger: "welcoming a new caller", emotion: "warmth", intensity: 0.55 },
];

export type PersonalityPresetKey =
  | "friendly_closer"
  | "analytical_pm"
  | "stoic_observer";

export const PERSONALITY_PRESETS: Record<
  PersonalityPresetKey,
  {
    name: string;
    description: string;
    defaultMode: "listen" | "interact" | "business" | "project_management" | "development" | "custom";
    emotionsEnabled: boolean;
    emotionTriggers: VoiceEmotionTrigger[];
    tags: string[];
    samplePrompt: string;
  }
> = {
  friendly_closer: {
    name: "Friendly Closer",
    description:
      "Warm, upbeat sales agent that discovers needs fast and guides toward a close.",
    defaultMode: "business",
    emotionsEnabled: true,
    emotionTriggers: [
      { trigger: "hearing a pain point", emotion: "empathy", intensity: 0.6 },
      { trigger: "customer agrees to next steps", emotion: "excitement", intensity: 0.75 },
      { trigger: "pricing objection", emotion: "calm confidence", intensity: 0.55 },
    ],
    tags: ["sales", "discovery", "outbound"],
    samplePrompt:
      "Open warmly, confirm the caller's time, ask one discovery question, mirror their words, and propose a concrete next step within three minutes.",
  },
  analytical_pm: {
    name: "Analytical PM",
    description:
      "Methodical project manager that runs standups, surfaces blockers, and summarizes decisions.",
    defaultMode: "project_management",
    emotionsEnabled: true,
    emotionTriggers: [
      { trigger: "scope creep detected", emotion: "firm focus", intensity: 0.5 },
      { trigger: "attendee hits a blocker", emotion: "concern", intensity: 0.5 },
      { trigger: "milestone hit", emotion: "measured enthusiasm", intensity: 0.5 },
    ],
    tags: ["pm", "standup", "meetings"],
    samplePrompt:
      "Go around each attendee for (1) yesterday, (2) today, (3) blockers. Timebox each to 90s. End with explicit action items and owners.",
  },
  stoic_observer: {
    name: "Stoic Observer",
    description:
      "Silent listener that only speaks when summoned by name or asked for a summary.",
    defaultMode: "listen",
    emotionsEnabled: false,
    emotionTriggers: [],
    tags: ["listen", "compliance", "summary"],
    samplePrompt:
      "Introduce yourself once at the start. Stay silent unless addressed directly by name. When summoned, respond in no more than two sentences plus a one-line summary at meeting end.",
  },
};

function randomCode(length = 6): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let output = "";
  for (let i = 0; i < length; i += 1) {
    output += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return output;
}

export function buildDefaultModes(custom?: VoiceAgentModeConfig[]) {
  return custom?.length ? custom : DEFAULT_AGENT_MODES;
}

export function buildDefaultEmotionTriggers(custom?: VoiceEmotionTrigger[]) {
  return custom?.length ? custom : DEFAULT_EMOTION_TRIGGERS;
}

export function normalizeConfirmationCode(code: string | null | undefined) {
  return (code ?? "").trim().toUpperCase();
}

export function isSupportedAgentMode(mode: string, availableModes?: VoiceAgentModeConfig[]) {
  return buildDefaultModes(availableModes).some(
    (candidate) => candidate.key === mode && candidate.enabled
  );
}

export function resolveAgentMode(
  requestedMode: string | null | undefined,
  availableModes?: VoiceAgentModeConfig[]
) {
  const modes = buildDefaultModes(availableModes);
  const normalizedRequested = normalizeConfirmationCode(requestedMode).toLowerCase();
  const requested = modes.find(
    (candidate) => candidate.key === normalizedRequested && candidate.enabled
  );

  if (requested) {
    return requested.key;
  }

  const defaultMode = modes.find((candidate) => candidate.enabled);
  return defaultMode?.key ?? "listen";
}

export function getAvailableVoiceIds() {
  return ENV.elevenLabsVoiceIds.map((voiceId) => ({
    id: voiceId,
    label: voiceId,
  }));
}

export async function ensureUserConfirmationCode(userId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const existing = await db
    .select({ id: users.id, aiConfirmationCode: users.aiConfirmationCode })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!existing.length) {
    throw new Error("User not found");
  }

  if (existing[0].aiConfirmationCode) {
    return existing[0].aiConfirmationCode;
  }

  const code = randomCode(6);
  await db
    .update(users)
    .set({ aiConfirmationCode: code, updatedAt: new Date() })
    .where(eq(users.id, userId));

  return code;
}

export async function validateConfirmationCode(userId: number, code: string) {
  const user = await getUserById(userId);
  if (!user) {
    return false;
  }

  return normalizeConfirmationCode(user.aiConfirmationCode) === normalizeConfirmationCode(code);
}

export async function getVoiceAssistantOverview() {
  const db = await getDb();
  if (!db) {
    return {
      availableVoices: getAvailableVoiceIds(),
      totals: {
        agents: 0,
        scheduledActions: 0,
        activeMeetings: 0,
        liveCalls: 0,
        logsToday: 0,
      },
    };
  }

  const [agentRows, actionRows, activeMeetingsRows, liveCallRows, logsTodayRows] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(aiVoiceAgents),
    db.select({ count: sql<number>`count(*)::int` }).from(scheduledVoiceActions),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(zoomMeetings)
      .where(inArray(zoomMeetings.status, ["scheduled", "active"])),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(callLogs)
      .where(eq(callLogs.status, "in_progress")),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(callLogs)
      .where(gte(callLogs.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000))),
  ]);

  return {
    availableVoices: getAvailableVoiceIds(),
    totals: {
      agents: agentRows[0]?.count ?? 0,
      scheduledActions: actionRows[0]?.count ?? 0,
      activeMeetings: activeMeetingsRows[0]?.count ?? 0,
      liveCalls: liveCallRows[0]?.count ?? 0,
      logsToday: logsTodayRows[0]?.count ?? 0,
    },
  };
}

export async function listAgents() {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(aiVoiceAgents).orderBy(desc(aiVoiceAgents.updatedAt));
}

export async function createAgent(input: {
  name: string;
  elevenLabsVoiceId: string;
  elevenLabsAgentId?: string | null;
  avatarUrl?: string | null;
  description?: string | null;
  accessLevel?: "admin" | "operator" | "sales" | "support" | "observer";
  defaultMode?:
    | "listen"
    | "interact"
    | "business"
    | "project_management"
    | "development"
    | "custom";
  emotionsEnabled?: boolean;
  emotionTriggers?: VoiceEmotionTrigger[];
  modesConfig?: VoiceAgentModeConfig[];
  tags?: string[];
  createdByUserId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const values: InsertAIVoiceAgent = {
    name: input.name,
    elevenLabsVoiceId: input.elevenLabsVoiceId,
    elevenLabsAgentId: input.elevenLabsAgentId ?? undefined,
    avatarUrl: input.avatarUrl ?? undefined,
    description: input.description ?? undefined,
    accessLevel: input.accessLevel ?? "operator",
    defaultMode: input.defaultMode ?? "listen",
    emotionsEnabled:
      input.emotionsEnabled ?? ENV.elevenLabsDefaultEmotions ?? true,
    emotionTriggers: buildDefaultEmotionTriggers(input.emotionTriggers),
    modesConfig: buildDefaultModes(input.modesConfig),
    tags: input.tags ?? [],
    createdByUserId: input.createdByUserId,
  };

  const [created] = await db.insert(aiVoiceAgents).values(values).returning();
  return created;
}

export async function updateAgent(
  id: number,
  updates: Partial<Omit<InsertAIVoiceAgent, "createdAt" | "updatedAt">>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [updated] = await db
    .update(aiVoiceAgents)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(aiVoiceAgents.id, id))
    .returning();

  return updated;
}

export async function deleteAgent(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(aiVoiceAgents).where(eq(aiVoiceAgents.id, id));
}

export function listPersonalityPresets() {
  return Object.entries(PERSONALITY_PRESETS).map(([key, value]) => ({
    key: key as PersonalityPresetKey,
    ...value,
  }));
}

export async function createAgentFromPreset(input: {
  preset: PersonalityPresetKey;
  elevenLabsVoiceId: string;
  elevenLabsAgentId?: string;
  avatarUrl?: string;
  createdByUserId?: number;
}) {
  const preset = PERSONALITY_PRESETS[input.preset];
  if (!preset) throw new Error(`Unknown preset: ${input.preset}`);

  const modes = buildDefaultModes().map((m) =>
    m.key === preset.defaultMode ? { ...m, prompt: preset.samplePrompt } : m,
  );

  return createAgent({
    name: preset.name,
    elevenLabsVoiceId: input.elevenLabsVoiceId,
    elevenLabsAgentId: input.elevenLabsAgentId,
    avatarUrl: input.avatarUrl,
    description: preset.description,
    accessLevel: "operator",
    defaultMode: preset.defaultMode,
    emotionsEnabled: preset.emotionsEnabled,
    emotionTriggers: preset.emotionTriggers,
    modesConfig: modes,
    tags: preset.tags,
    createdByUserId: input.createdByUserId,
  });
}

export async function previewAgentVoice(input: {
  voiceId: string;
  text?: string;
}): Promise<{ audioBase64: string; mime: string }> {
  const text =
    input.text?.trim() ||
    "Hi, I'm your GoGetterOS assistant. I'll help keep your pipeline moving.";
  const audio = await synthesizeSpeech({ voiceId: input.voiceId, text });
  return { audioBase64: audio.toString("base64"), mime: "audio/mpeg" };
}

export async function listZoomMeetings(filter?: {
  status?: "scheduled" | "active" | "completed" | "cancelled";
  includeCompleted?: boolean;
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  if (filter?.status) {
    conditions.push(eq(zoomMeetings.status, filter.status));
  } else if (!filter?.includeCompleted) {
    conditions.push(inArray(zoomMeetings.status, ["scheduled", "active"]));
  }

  return db
    .select()
    .from(zoomMeetings)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(zoomMeetings.startTime));
}

export async function createZoomMeeting(input: {
  subject: string;
  description?: string | null;
  hostUserId?: number;
  startTime: Date;
  endTime?: Date | null;
  durationMinutes?: number;
  timezone?: string;
  invitees?: Array<{ name: string; email: string; userId?: number; status?: string }>;
  agenda?: string[];
  status?: "scheduled" | "active" | "completed" | "cancelled";
  experimentalVideoEnabled?: boolean;
  metadata?: Record<string, unknown>;
  createdByUserId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const values: InsertZoomMeeting = {
    subject: input.subject,
    description: input.description ?? undefined,
    hostUserId: input.hostUserId,
    startTime: input.startTime,
    endTime: input.endTime ?? undefined,
    durationMinutes: input.durationMinutes ?? 30,
    timezone: input.timezone ?? "America/New_York",
    invitees: input.invitees ?? [],
    agenda: input.agenda ?? [],
    status: input.status ?? "scheduled",
    experimentalVideoEnabled: input.experimentalVideoEnabled ?? false,
    metadata: input.metadata ?? {},
    createdByUserId: input.createdByUserId,
  };

  if (zoomConfigured()) {
    try {
      const remote = await createZoomMeetingRemote({
        topic: input.subject,
        agenda: input.agenda?.join("\n") ?? input.description ?? undefined,
        startTime: input.startTime,
        durationMinutes: input.durationMinutes ?? 30,
        timezone: input.timezone ?? "America/New_York",
        invitees: input.invitees?.map((i) => ({ email: i.email })),
      });
      values.zoomMeetingExternalId = String(remote.id);
      values.joinUrl = remote.join_url;
      values.startUrl = remote.start_url;
      values.passcode = remote.password ?? undefined;
    } catch (error) {
      console.warn(
        "[voiceAssistant] Zoom createMeeting failed; saving local-only row",
        error,
      );
    }
  }

  const [created] = await db.insert(zoomMeetings).values(values).returning();
  return created;
}

export async function updateZoomMeeting(
  id: number,
  updates: Partial<Omit<InsertZoomMeeting, "createdAt" | "updatedAt">>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [existing] = await db
    .select()
    .from(zoomMeetings)
    .where(eq(zoomMeetings.id, id))
    .limit(1);

  if (existing?.zoomMeetingExternalId && zoomConfigured()) {
    try {
      await updateZoomMeetingRemote(existing.zoomMeetingExternalId, {
        topic: updates.subject,
        agenda: updates.agenda
          ? (updates.agenda as string[]).join("\n")
          : undefined,
        startTime: updates.startTime as Date | undefined,
        durationMinutes: updates.durationMinutes as number | undefined,
        timezone: updates.timezone as string | undefined,
      });
    } catch (error) {
      console.warn("[voiceAssistant] Zoom updateMeeting failed", error);
    }
  }

  const [updated] = await db
    .update(zoomMeetings)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(zoomMeetings.id, id))
    .returning();

  return updated;
}

export async function deleteZoomMeeting(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [existing] = await db
    .select()
    .from(zoomMeetings)
    .where(eq(zoomMeetings.id, id))
    .limit(1);

  if (existing?.zoomMeetingExternalId && zoomConfigured()) {
    try {
      await deleteZoomMeetingRemote(existing.zoomMeetingExternalId);
    } catch (error) {
      console.warn("[voiceAssistant] Zoom deleteMeeting failed", error);
    }
  }

  await db.delete(zoomMeetings).where(eq(zoomMeetings.id, id));
}

export async function listScheduledActions(filter?: {
  status?:
    | "scheduled"
    | "queued"
    | "running"
    | "completed"
    | "cancelled"
    | "failed";
}) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select({
      action: scheduledVoiceActions,
      agentName: aiVoiceAgents.name,
      meetingSubject: zoomMeetings.subject,
      userName: users.name,
      userEmail: users.email,
    })
    .from(scheduledVoiceActions)
    .leftJoin(aiVoiceAgents, eq(scheduledVoiceActions.agentId, aiVoiceAgents.id))
    .leftJoin(zoomMeetings, eq(scheduledVoiceActions.zoomMeetingId, zoomMeetings.id))
    .leftJoin(users, eq(scheduledVoiceActions.userId, users.id))
    .where(filter?.status ? eq(scheduledVoiceActions.status, filter.status) : undefined)
    .orderBy(desc(scheduledVoiceActions.startTime));
}

export async function createScheduledAction(input: {
  agentId?: number;
  userId?: number;
  zoomMeetingId?: number;
  type: "zoom_join" | "direct_call" | "inbound_wait" | "zoom_host" | "custom";
  mode?:
    | "listen"
    | "interact"
    | "business"
    | "project_management"
    | "development"
    | "custom";
  status?: "scheduled" | "queued" | "running" | "completed" | "cancelled" | "failed";
  startTime: Date;
  endTime?: Date | null;
  executeNow?: boolean;
  metadata?: Record<string, unknown>;
  createdByUserId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (input.userId) {
    await ensureUserConfirmationCode(input.userId);
  }

  const values: InsertScheduledVoiceAction = {
    agentId: input.agentId,
    userId: input.userId,
    zoomMeetingId: input.zoomMeetingId,
    type: input.type,
    mode: input.mode ?? "listen",
    status: input.status ?? "scheduled",
    startTime: input.startTime,
    endTime: input.endTime ?? undefined,
    executeNow: input.executeNow ?? false,
    metadata: input.metadata ?? {},
    createdByUserId: input.createdByUserId,
  };

  const [created] = await db
    .insert(scheduledVoiceActions)
    .values(values)
    .returning();

  return created;
}

export async function updateScheduledAction(
  id: number,
  updates: Partial<Omit<InsertScheduledVoiceAction, "createdAt" | "updatedAt">>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [updated] = await db
    .update(scheduledVoiceActions)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(scheduledVoiceActions.id, id))
    .returning();

  return updated;
}

export async function deleteScheduledAction(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(scheduledVoiceActions).where(eq(scheduledVoiceActions.id, id));
}

export async function executeScheduledActionNow(id: number) {
  await updateScheduledAction(id, {
    executeNow: true,
    status: "queued",
    lastRunAt: new Date(),
  });
  return dispatchScheduledAction(id);
}

/**
 * Actually perform the side effect for a scheduled action.
 * Called from executeScheduledActionNow (manual) and the Vercel cron runner.
 *
 * Integration behavior per action type:
 * - direct_call  → ElevenLabs conversational AI outbound call (if agent configured)
 *                  or bare Twilio call as fallback.
 * - zoom_join    → ensures Zoom meeting exists; if experimental video flag is on
 *                  and Pika is configured, starts a Pika avatar stream.
 * - zoom_host    → same as above; marks meeting active.
 * - inbound_wait → just marks the action running; agent will answer when called.
 * - custom       → no external side effect.
 *
 * All failures are captured on the action row and a call_log entry, but never
 * thrown — the cron must keep processing the rest of the queue.
 */
export async function dispatchScheduledAction(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [row] = await db
    .select()
    .from(scheduledVoiceActions)
    .where(eq(scheduledVoiceActions.id, id))
    .limit(1);
  if (!row) throw new Error(`Scheduled action ${id} not found`);

  const [agent] = row.agentId
    ? await db
        .select()
        .from(aiVoiceAgents)
        .where(eq(aiVoiceAgents.id, row.agentId))
        .limit(1)
    : [undefined];
  const [user] = row.userId
    ? await db.select().from(users).where(eq(users.id, row.userId)).limit(1)
    : [undefined];
  const [meeting] = row.zoomMeetingId
    ? await db
        .select()
        .from(zoomMeetings)
        .where(eq(zoomMeetings.id, row.zoomMeetingId))
        .limit(1)
    : [undefined];

  await updateScheduledAction(id, { status: "running", lastRunAt: new Date() });

  const phoneFromMeta = (row.metadata as Record<string, unknown> | undefined)
    ?.phoneNumber as string | undefined;

  type CallLogType = "zoom_meeting" | "inbound_call" | "outbound_call" | "agent_session";
  const record = async (
    source: VoiceLiveEvent["source"],
    status: string,
    detail: string,
    type: CallLogType,
    externalCallId?: string,
  ) => {
    const callLog = await createCallLog({
      userId: row.userId ?? undefined,
      agentId: row.agentId ?? undefined,
      zoomMeetingId: row.zoomMeetingId ?? undefined,
      type,
      status: "in_progress",
      direction: row.type === "inbound_wait" ? "inbound" : "outbound",
      externalCallId,
      phoneNumber: phoneFromMeta,
      metadata: {
        scheduledActionId: row.id,
        mode: row.mode,
        agent: agent?.name,
        user: user?.name ?? user?.email,
      },
    });
    await logLiveEvent({ callLogId: callLog.id, source, status, detail });
    return callLog;
  };

  try {
    if (row.type === "direct_call") {
      const phone = (row.metadata as Record<string, unknown> | undefined)
        ?.phoneNumber as string | undefined;
      if (!phone) throw new Error("direct_call requires metadata.phoneNumber");

      let externalCallId: string | undefined;
      if (agent?.elevenLabsAgentId && elevenLabsConfigured()) {
        const conv = await elevenLabsInitiateOutboundConversation({
          agentId: agent.elevenLabsAgentId,
          toPhoneNumber: phone,
          metadata: { scheduledActionId: row.id, mode: row.mode },
        });
        externalCallId = conv.conversation_id;
        await record(
          "elevenlabs",
          "dispatched",
          `ElevenLabs conversation ${conv.conversation_id} started`,
          "agent_session",
          externalCallId,
        );
      } else if (twilioConfigured()) {
        const call = await twilioPlaceOutboundCall({ toNumber: phone });
        externalCallId = call.sid;
        await record(
          "twilio",
          "dispatched",
          `Twilio call ${call.sid} placed`,
          "outbound_call",
          externalCallId,
        );
      } else {
        throw new Error("No configured provider for direct_call");
      }
    } else if (row.type === "zoom_join" || row.type === "zoom_host") {
      if (!meeting) throw new Error("zoom action requires zoomMeetingId");

      let pikaStreamId: string | undefined;
      if (
        meeting.experimentalVideoEnabled &&
        pikaConfigured() &&
        agent?.avatarUrl
      ) {
        try {
          const stream = await startPikaAvatarStream({
            avatarUrl: agent.avatarUrl,
            agentName: agent.name,
            voiceId: agent.elevenLabsVoiceId ?? undefined,
            script: (agent.modesConfig ?? []).find(
              (m) => m.key === row.mode,
            )?.prompt,
          });
          pikaStreamId = stream.streamId;
          await updateZoomMeeting(meeting.id, {
            status: "active",
            metadata: {
              ...(meeting.metadata ?? {}),
              pikaStreamId,
              pikaRtmpUrl: stream.rtmpUrl,
            },
          });
        } catch (error) {
          console.warn(
            "[voiceAssistant] Pika stream start failed; continuing without video",
            error,
          );
        }
      }

      await record(
        "zoom",
        "dispatched",
        `Agent ${agent?.name ?? "unknown"} joining Zoom meeting ${meeting.subject}${pikaStreamId ? " with Pika video" : ""}`,
        "zoom_meeting",
        meeting.zoomMeetingExternalId ?? undefined,
      );
    } else if (row.type === "inbound_wait") {
      await record(
        "system",
        "waiting",
        `Agent ${agent?.name ?? ""} waiting for inbound call`,
        "inbound_call",
      );
    } else {
      await record(
        "system",
        "custom",
        `Custom action ${row.id} executed`,
        "agent_session",
      );
    }

    await updateScheduledAction(id, { status: "completed", executeNow: false });
    return { id, ok: true } as { id: number; ok: boolean; error?: string };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await updateScheduledAction(id, {
      status: "failed",
      executeNow: false,
      metadata: {
        ...((row.metadata as Record<string, unknown> | undefined) ?? {}),
        lastError: message,
      },
    });
    return { id, ok: false, error: message };
  }
}

/**
 * Process all scheduled actions whose start_time is due.
 * Called from the Vercel cron at /api/cron/voice-scheduler.
 */
export async function runDueScheduledActions(limit = 20) {
  const db = await getDb();
  if (!db) return { processed: 0, results: [] as Array<{ id: number; ok: boolean; error?: string }> };

  const due = await db
    .select()
    .from(scheduledVoiceActions)
    .where(
      and(
        inArray(scheduledVoiceActions.status, ["scheduled", "queued"]),
        lte(scheduledVoiceActions.startTime, new Date()),
      ),
    )
    .orderBy(scheduledVoiceActions.startTime)
    .limit(limit);

  const results: Array<{ id: number; ok: boolean; error?: string }> = [];
  for (const row of due) {
    try {
      const result = await dispatchScheduledAction(row.id);
      results.push(result);
    } catch (error) {
      results.push({
        id: row.id,
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return { processed: due.length, results };
}

export async function listContacts(filter?: { search?: string }) {
  const db = await getDb();
  if (!db) return [];

  const searchTerm = filter?.search?.trim();
  const conditions = searchTerm
    ? or(
        ilike(users.name, `%${searchTerm}%`),
        ilike(users.email, `%${searchTerm}%`),
        ilike(pipelineProjects.businessName, `%${searchTerm}%`),
        ilike(pipelineProjects.pocName, `%${searchTerm}%`)
      )
    : undefined;

  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      pictureUrl: users.pictureUrl,
      profileImageUrl: users.profileImageUrl,
      aiConfirmationCode: users.aiConfirmationCode,
      projectId: pipelineProjects.id,
      businessName: pipelineProjects.businessName,
      pocPhone: pipelineProjects.pocPhone,
      description: pipelineProjects.description,
      status: pipelineProjects.status,
      phase: pipelineProjects.phase,
      metadata: pipelineProjects.metadata,
    })
    .from(users)
    .leftJoin(pipelineProjects, eq(pipelineProjects.userId, users.id))
    .where(conditions)
    .orderBy(desc(users.updatedAt));
}

export async function updateContact(input: {
  userId: number;
  name?: string | null;
  email?: string | null;
  profileImageUrl?: string | null;
  aiConfirmationCode?: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [updated] = await db
    .update(users)
    .set({
      name: input.name,
      email: input.email,
      profileImageUrl: input.profileImageUrl ?? undefined,
      aiConfirmationCode: input.aiConfirmationCode?.trim().toUpperCase() || undefined,
      updatedAt: new Date(),
    })
    .where(eq(users.id, input.userId))
    .returning();

  return updated;
}

export async function listLiveActivity(hours = 1) {
  const db = await getDb();
  if (!db) return [];

  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

  return db
    .select({
      id: callLogs.id,
      type: callLogs.type,
      status: callLogs.status,
      summary: callLogs.summary,
      startedAt: callLogs.startedAt,
      endedAt: callLogs.endedAt,
      liveEvents: callLogs.liveEvents,
      userName: users.name,
      agentName: aiVoiceAgents.name,
      phoneNumber: callLogs.phoneNumber,
    })
    .from(callLogs)
    .leftJoin(users, eq(callLogs.userId, users.id))
    .leftJoin(aiVoiceAgents, eq(callLogs.agentId, aiVoiceAgents.id))
    .where(gte(callLogs.createdAt, cutoff))
    .orderBy(desc(callLogs.createdAt));
}

export async function logLiveEvent(input: {
  callLogId: number;
  source: "twilio" | "elevenlabs" | "zoom" | "system";
  status: string;
  detail?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [existing] = await db
    .select({ liveEvents: callLogs.liveEvents })
    .from(callLogs)
    .where(eq(callLogs.id, input.callLogId))
    .limit(1);

  const nextEvents: VoiceLiveEvent[] = [
    ...((existing?.liveEvents as VoiceLiveEvent[] | undefined) ?? []),
    {
      source: input.source,
      status: input.status,
      detail: input.detail,
      timestamp: new Date().toISOString(),
    },
  ];

  const [updated] = await db
    .update(callLogs)
    .set({ liveEvents: nextEvents, updatedAt: new Date() })
    .where(eq(callLogs.id, input.callLogId))
    .returning();

  return updated;
}

export async function listCallLogs(filter?: {
  search?: string;
  status?: "queued" | "in_progress" | "completed" | "missed" | "failed";
  type?: "zoom_meeting" | "inbound_call" | "outbound_call" | "agent_session";
  userId?: number;
  agentId?: number;
  startDate?: Date;
  endDate?: Date;
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [] as Array<ReturnType<typeof eq>>;

  if (filter?.status) {
    conditions.push(eq(callLogs.status, filter.status));
  }
  if (filter?.type) {
    conditions.push(eq(callLogs.type, filter.type));
  }
  if (filter?.userId) {
    conditions.push(eq(callLogs.userId, filter.userId));
  }
  if (filter?.agentId) {
    conditions.push(eq(callLogs.agentId, filter.agentId));
  }
  if (filter?.startDate) {
    conditions.push(gte(callLogs.createdAt, filter.startDate));
  }
  if (filter?.endDate) {
    conditions.push(lte(callLogs.createdAt, filter.endDate));
  }

  const searchTerm = filter?.search?.trim();
  const searchCondition = searchTerm
    ? or(
        ilike(users.name, `%${searchTerm}%`),
        ilike(users.email, `%${searchTerm}%`),
        ilike(aiVoiceAgents.name, `%${searchTerm}%`),
        ilike(callLogs.summary, `%${searchTerm}%`)
      )
    : undefined;

  return db
    .select({
      log: callLogs,
      userName: users.name,
      userEmail: users.email,
      agentName: aiVoiceAgents.name,
      meetingSubject: zoomMeetings.subject,
      businessName: pipelineProjects.businessName,
    })
    .from(callLogs)
    .leftJoin(users, eq(callLogs.userId, users.id))
    .leftJoin(aiVoiceAgents, eq(callLogs.agentId, aiVoiceAgents.id))
    .leftJoin(zoomMeetings, eq(callLogs.zoomMeetingId, zoomMeetings.id))
    .leftJoin(pipelineProjects, eq(callLogs.pipelineProjectId, pipelineProjects.id))
    .where(
      [
        conditions.length ? and(...conditions) : undefined,
        searchCondition,
      ].filter(Boolean) as any
    )
    .orderBy(desc(callLogs.createdAt));
}

export async function createCallLog(input: InsertCallLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [created] = await db.insert(callLogs).values(input).returning();
  return created;
}

export async function updateCallLog(
  id: number,
  updates: Partial<Omit<InsertCallLog, "createdAt" | "updatedAt">>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [updated] = await db
    .update(callLogs)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(callLogs.id, id))
    .returning();

  return updated;
}

export async function listCallContent(filter?: {
  userId?: number;
  pipelineProjectId?: number;
  callLogId?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [] as Array<ReturnType<typeof eq>>;
  if (filter?.userId) conditions.push(eq(callContent.userId, filter.userId));
  if (filter?.pipelineProjectId) {
    conditions.push(eq(callContent.pipelineProjectId, filter.pipelineProjectId));
  }
  if (filter?.callLogId) conditions.push(eq(callContent.callLogId, filter.callLogId));

  return db
    .select({
      content: callContent,
      userName: users.name,
      businessName: pipelineProjects.businessName,
    })
    .from(callContent)
    .leftJoin(users, eq(callContent.userId, users.id))
    .leftJoin(pipelineProjects, eq(callContent.pipelineProjectId, pipelineProjects.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(callContent.updatedAt));
}

export async function upsertCallContent(input: InsertCallContent & { id?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (input.id) {
    const [updated] = await db
      .update(callContent)
      .set({
        callLogId: input.callLogId,
        userId: input.userId,
        pipelineProjectId: input.pipelineProjectId,
        contentType: input.contentType,
        title: input.title,
        body: input.body,
        contentJson: input.contentJson,
        updatedAt: new Date(),
      })
      .where(eq(callContent.id, input.id))
      .returning();
    return updated;
  }

  const [created] = await db.insert(callContent).values(input).returning();
  return created;
}

export async function getLogAnalysis(range?: { startDate?: Date; endDate?: Date }) {
  const logs = await listCallLogs({
    startDate: range?.startDate,
    endDate: range?.endDate,
  });

  if (!logs.length) {
    return {
      summary: "No call activity is available for the selected period.",
      source: "empty",
    };
  }

  const transcriptBody = logs
    .slice(0, 25)
    .map((item) => {
      const log = item.log;
      return [
        `Call ${log.id}`,
        `Type: ${log.type}`,
        `Status: ${log.status}`,
        `Contact: ${item.userName ?? item.userEmail ?? "Unknown"}`,
        `Agent: ${item.agentName ?? "Unassigned"}`,
        `Summary: ${log.summary ?? "N/A"}`,
        `Transcript: ${log.transcript ?? "N/A"}`,
      ].join("\n");
    })
    .join("\n\n---\n\n");

  try {
    const userConfigs = await getApiConfigs(1);
    const activeConfigs = userConfigs.filter((config) => config.isActive && config.apiKey);

    if (!activeConfigs.length) {
      throw new Error("No active model configurations");
    }

    const summary = await modelRouter.executeWithFallback<string>(
      "analysis",
      `Summarize the following voice assistant activity for an admin dashboard. Highlight outcomes, trends, issues, and recommended next actions.\n\n${transcriptBody}`,
      activeConfigs,
      1
    );

    return {
      summary,
      source: "model-router",
    };
  } catch {
    const completedCount = logs.filter((item) => item.log.status === "completed").length;
    const liveCount = logs.filter((item) => item.log.status === "in_progress").length;

    return {
      summary: `Processed ${logs.length} calls in the selected period. ${completedCount} completed successfully and ${liveCount} remain live or in progress. Top follow-up recommendation: review incomplete calls, confirm transcript storage, and validate any missing contact data before the next outreach cycle.`,
      source: "fallback",
    };
  }
}

export async function createDevelopmentModeBrief(input: {
  callLogId?: number;
  userId?: number;
  prompt: string;
}) {
  const userConfigs = await getApiConfigs(input.userId ?? 1);
  const activeConfigs = userConfigs.filter((config) => config.isActive && config.apiKey);

  if (!activeConfigs.length) {
    return {
      brief:
        "Development Mode is configured, but no active model provider is available yet. Add at least one active API configuration to generate live implementation briefs.",
      source: "fallback",
    };
  }

  const brief = await modelRouter.executeWithFallback<string>(
    "generation",
    `Create a concise implementation brief for the following Voice Assistant development request. Include goals, architecture suggestions, data touchpoints, and likely next build steps.\n\n${input.prompt}`,
    activeConfigs,
    input.userId ?? 1
  );

  if (input.callLogId) {
    await upsertCallContent({
      callLogId: input.callLogId,
      userId: input.userId,
      contentType: "development_brief",
      title: "Development Mode Brief",
      body: brief,
      contentJson: { source: "model-router" },
    });
  }

  return {
    brief,
    source: "model-router",
  };
}

export async function hangUpLiveMeeting(zoomMeetingId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [existing] = await db
    .select()
    .from(zoomMeetings)
    .where(eq(zoomMeetings.id, zoomMeetingId))
    .limit(1);

  if (existing?.zoomMeetingExternalId && zoomConfigured()) {
    try {
      await endZoomMeetingRemote(existing.zoomMeetingExternalId);
    } catch (error) {
      console.warn("[voiceAssistant] Zoom endMeeting failed", error);
    }
  }

  const pikaStreamId = (existing?.metadata as Record<string, unknown> | undefined)
    ?.pikaStreamId;
  if (typeof pikaStreamId === "string" && pikaConfigured()) {
    try {
      await stopPikaStream(pikaStreamId);
    } catch (error) {
      console.warn("[voiceAssistant] Pika stopStream failed", error);
    }
  }

  return updateZoomMeeting(zoomMeetingId, {
    status: "completed",
    endTime: new Date(),
  });
}

export async function resetAgentSession(callLogId: number) {
  await logLiveEvent({
    callLogId,
    source: "system",
    status: "agent_reset",
    detail: "Agent reset requested from Live Admin.",
  });

  return updateCallLog(callLogId, { status: "queued" });
}

export async function dropAgentFromCall(callLogId: number) {
  const db = await getDb();
  if (db) {
    const [log] = await db
      .select()
      .from(callLogs)
      .where(eq(callLogs.id, callLogId))
      .limit(1);

    if (log?.externalCallId) {
      if (
        (log.type === "inbound_call" || log.type === "outbound_call") &&
        twilioConfigured()
      ) {
        try {
          await twilioHangUpCall(log.externalCallId);
        } catch (error) {
          console.warn("[voiceAssistant] Twilio hangUp failed", error);
        }
      }
      if (log.type === "agent_session" && elevenLabsConfigured()) {
        try {
          await elevenLabsEndConversation(log.externalCallId);
        } catch (error) {
          console.warn("[voiceAssistant] ElevenLabs end failed", error);
        }
      }
      if (log.type === "zoom_meeting" && zoomConfigured()) {
        try {
          await endZoomMeetingRemote(log.externalCallId);
        } catch (error) {
          console.warn("[voiceAssistant] Zoom end failed", error);
        }
      }
    }
  }

  await logLiveEvent({
    callLogId,
    source: "system",
    status: "agent_dropped",
    detail: "Agent removed from the active session.",
  });

  return updateCallLog(callLogId, { status: "completed", endedAt: new Date() });
}

export async function rejoinAgentToCall(callLogId: number) {
  await logLiveEvent({
    callLogId,
    source: "system",
    status: "agent_rejoined",
    detail: "Agent rejoined the active session.",
  });

  return updateCallLog(callLogId, { status: "in_progress" });
}

export async function ingestWebhookEvent(input: {
  source: "twilio" | "elevenlabs" | "zoom";
  payload: Record<string, unknown>;
}) {
  const callLogId = Number(input.payload.callLogId || input.payload.call_log_id || 0);

  if (!callLogId) {
    return {
      received: true,
      linked: false,
    };
  }

  await logLiveEvent({
    callLogId,
    source: input.source,
    status: String(input.payload.status ?? input.payload.event ?? "webhook"),
    detail: JSON.stringify(input.payload).slice(0, 1000),
  });

  return {
    received: true,
    linked: true,
  };
}

export async function seedVoiceAssistantDemoData(adminUserId: number) {
  const existingAgents = await listAgents();
  if (existingAgents.length > 0) {
    return false;
  }

  const [agent] = await Promise.all([
    createAgent({
      name: "GoGetter Guide",
      elevenLabsVoiceId: ENV.elevenLabsVoiceIds[0] ?? "default-voice",
      description: "Primary admin-configured agent for meetings, outreach, and business discovery.",
      accessLevel: "operator",
      createdByUserId: adminUserId,
    }),
  ]);

  const startTime = new Date(Date.now() + 60 * 60 * 1000);
  const meeting = await createZoomMeeting({
    subject: "Voice Assistant Launch Review",
    description: "Internal readiness review for GoGetterOS voice assistant workflows.",
    startTime,
    durationMinutes: 45,
    createdByUserId: adminUserId,
    experimentalVideoEnabled: Boolean(ENV.pikaApiKey),
  });

  await createScheduledAction({
    agentId: agent.id,
    zoomMeetingId: meeting.id,
    type: "zoom_join",
    mode: "project_management",
    startTime,
    createdByUserId: adminUserId,
    metadata: {
      confirmationRequired: false,
      notes: "Demo seed action created automatically.",
    },
  });

  return true;
}
