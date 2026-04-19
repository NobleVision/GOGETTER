import { z } from "zod";
import { adminProcedure, protectedProcedure, router } from "./_core/trpc";
import { ENV } from "./_core/env";

const ENV_SAFE_PHONE = ENV.twilioPhoneNumber;
import {
  createAgent,
  createAgentFromPreset,
  createCallLog,
  createDevelopmentModeBrief,
  createScheduledAction,
  createZoomMeeting,
  deleteAgent,
  deleteScheduledAction,
  deleteZoomMeeting,
  dropAgentFromCall,
  ensureUserConfirmationCode,
  executeScheduledActionNow,
  getAvailableVoiceIds,
  getLogAnalysis,
  getVoiceAssistantOverview,
  hangUpLiveMeeting,
  ingestWebhookEvent,
  listAgents,
  listCallContent,
  listCallLogs,
  listContacts,
  listLiveActivity,
  listPersonalityPresets,
  listScheduledActions,
  listZoomMeetings,
  previewAgentVoice,
  rejoinAgentToCall,
  resetAgentSession,
  seedVoiceAssistantDemoData,
  updateAgent,
  updateCallLog,
  updateContact,
  updateScheduledAction,
  updateZoomMeeting,
  upsertCallContent,
  validateConfirmationCode,
} from "./services/voiceAssistant";

const modeEnum = z.enum([
  "listen",
  "interact",
  "business",
  "project_management",
  "development",
  "custom",
]);

const accessLevelEnum = z.enum([
  "admin",
  "operator",
  "sales",
  "support",
  "observer",
]);

const actionTypeEnum = z.enum([
  "zoom_join",
  "direct_call",
  "inbound_wait",
  "zoom_host",
  "custom",
]);

const scheduledStatusEnum = z.enum([
  "scheduled",
  "queued",
  "running",
  "completed",
  "cancelled",
  "failed",
]);

const meetingStatusEnum = z.enum([
  "scheduled",
  "active",
  "completed",
  "cancelled",
]);

const callTypeEnum = z.enum([
  "zoom_meeting",
  "inbound_call",
  "outbound_call",
  "agent_session",
]);

const callStatusEnum = z.enum([
  "queued",
  "in_progress",
  "completed",
  "missed",
  "failed",
]);

const emotionTriggerSchema = z.object({
  trigger: z.string().min(1),
  emotion: z.string().min(1),
  intensity: z.number().min(0).max(1).optional(),
  notes: z.string().optional(),
});

const modeConfigSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  enabled: z.boolean(),
  prompt: z.string().min(1),
  tools: z.array(z.string()).optional(),
  handoffTargets: z.array(z.string()).optional(),
});

const inviteeSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  userId: z.number().optional(),
  status: z.string().optional(),
});

const liveEventSchema = z.object({
  source: z.enum(["twilio", "elevenlabs", "zoom", "system"]),
  status: z.string().min(1),
  detail: z.string().optional(),
  timestamp: z.string().min(1),
});

export const voiceAssistantRouter = router({
  overview: adminProcedure.query(async () => {
    return getVoiceAssistantOverview();
  }),

  myConfirmationCode: protectedProcedure.query(async ({ ctx }) => {
    const code = await ensureUserConfirmationCode(ctx.user.id);
    const phone = ENV_SAFE_PHONE;
    return { code, dialNumber: phone };
  }),

  seedDemo: adminProcedure.mutation(async ({ ctx }) => {
    const seeded = await seedVoiceAssistantDemoData(ctx.user.id);
    return { seeded };
  }),

  config: adminProcedure.query(async () => {
    return {
      availableVoices: getAvailableVoiceIds(),
    };
  }),

  agents: router({
    list: adminProcedure.query(async () => listAgents()),

    create: adminProcedure
      .input(
        z.object({
          name: z.string().min(1).max(255),
          elevenLabsVoiceId: z.string().min(1).max(128),
          elevenLabsAgentId: z.string().max(128).optional().nullable(),
          avatarUrl: z.string().url().optional().nullable(),
          description: z.string().optional().nullable(),
          accessLevel: accessLevelEnum.optional(),
          defaultMode: modeEnum.optional(),
          emotionsEnabled: z.boolean().optional(),
          emotionTriggers: z.array(emotionTriggerSchema).optional(),
          modesConfig: z.array(modeConfigSchema).optional(),
          tags: z.array(z.string()).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return createAgent({ ...input, createdByUserId: ctx.user.id });
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1).max(255).optional(),
          elevenLabsVoiceId: z.string().min(1).max(128).optional(),
          elevenLabsAgentId: z.string().max(128).optional().nullable(),
          avatarUrl: z.string().url().optional().nullable(),
          description: z.string().optional().nullable(),
          accessLevel: accessLevelEnum.optional(),
          defaultMode: modeEnum.optional(),
          emotionsEnabled: z.boolean().optional(),
          emotionTriggers: z.array(emotionTriggerSchema).optional(),
          modesConfig: z.array(modeConfigSchema).optional(),
          tags: z.array(z.string()).optional(),
          isActive: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        return updateAgent(id, updates);
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteAgent(input.id);
        return { success: true };
      }),

    listPresets: adminProcedure.query(async () => listPersonalityPresets()),

    createFromPreset: adminProcedure
      .input(
        z.object({
          preset: z.enum([
            "friendly_closer",
            "analytical_pm",
            "stoic_observer",
          ]),
          elevenLabsVoiceId: z.string().min(1).max(128),
          elevenLabsAgentId: z.string().max(128).optional(),
          avatarUrl: z.string().url().optional(),
        }),
      )
      .mutation(async ({ ctx, input }) =>
        createAgentFromPreset({ ...input, createdByUserId: ctx.user.id }),
      ),

    preview: adminProcedure
      .input(
        z.object({
          voiceId: z.string().min(1).max(128),
          text: z.string().max(300).optional(),
        }),
      )
      .mutation(async ({ input }) => previewAgentVoice(input)),
  }),

  meetings: router({
    list: adminProcedure
      .input(
        z
          .object({
            status: meetingStatusEnum.optional(),
            includeCompleted: z.boolean().optional(),
          })
          .optional()
      )
      .query(async ({ input }) => listZoomMeetings(input)),

    create: adminProcedure
      .input(
        z.object({
          subject: z.string().min(1).max(255),
          description: z.string().optional().nullable(),
          hostUserId: z.number().optional(),
          startTime: z.coerce.date(),
          endTime: z.coerce.date().optional().nullable(),
          durationMinutes: z.number().min(5).max(720).optional(),
          timezone: z.string().optional(),
          invitees: z.array(inviteeSchema).optional(),
          agenda: z.array(z.string()).optional(),
          status: meetingStatusEnum.optional(),
          experimentalVideoEnabled: z.boolean().optional(),
          metadata: z.record(z.string(), z.unknown()).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return createZoomMeeting({ ...input, createdByUserId: ctx.user.id });
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          subject: z.string().min(1).max(255).optional(),
          description: z.string().optional().nullable(),
          hostUserId: z.number().optional(),
          startTime: z.coerce.date().optional(),
          endTime: z.coerce.date().optional().nullable(),
          durationMinutes: z.number().min(5).max(720).optional(),
          timezone: z.string().optional(),
          invitees: z.array(inviteeSchema).optional(),
          agenda: z.array(z.string()).optional(),
          status: meetingStatusEnum.optional(),
          experimentalVideoEnabled: z.boolean().optional(),
          metadata: z.record(z.string(), z.unknown()).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        return updateZoomMeeting(id, updates);
      }),

    hangUp: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => hangUpLiveMeeting(input.id)),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteZoomMeeting(input.id);
        return { success: true };
      }),
  }),

  scheduler: router({
    list: adminProcedure
      .input(z.object({ status: scheduledStatusEnum.optional() }).optional())
      .query(async ({ input }) => listScheduledActions(input)),

    create: adminProcedure
      .input(
        z.object({
          agentId: z.number().optional(),
          userId: z.number().optional(),
          zoomMeetingId: z.number().optional(),
          type: actionTypeEnum,
          mode: modeEnum.optional(),
          status: scheduledStatusEnum.optional(),
          startTime: z.coerce.date(),
          endTime: z.coerce.date().optional().nullable(),
          executeNow: z.boolean().optional(),
          metadata: z.record(z.string(), z.unknown()).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return createScheduledAction({ ...input, createdByUserId: ctx.user.id });
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          agentId: z.number().optional(),
          userId: z.number().optional(),
          zoomMeetingId: z.number().optional(),
          type: actionTypeEnum.optional(),
          mode: modeEnum.optional(),
          status: scheduledStatusEnum.optional(),
          startTime: z.coerce.date().optional(),
          endTime: z.coerce.date().optional().nullable(),
          executeNow: z.boolean().optional(),
          metadata: z.record(z.string(), z.unknown()).optional(),
          lastRunAt: z.coerce.date().optional().nullable(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        return updateScheduledAction(id, updates);
      }),

    executeNow: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => executeScheduledActionNow(input.id)),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteScheduledAction(input.id);
        return { success: true };
      }),
  }),

  contacts: router({
    list: adminProcedure
      .input(z.object({ search: z.string().optional() }).optional())
      .query(async ({ input }) => listContacts(input)),

    ensureCode: adminProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input }) => ({
        code: await ensureUserConfirmationCode(input.userId),
      })),

    validateCode: adminProcedure
      .input(z.object({ userId: z.number(), code: z.string().min(1).max(20) }))
      .query(async ({ input }) => ({
        valid: await validateConfirmationCode(input.userId, input.code),
      })),

    update: adminProcedure
      .input(
        z.object({
          userId: z.number(),
          name: z.string().optional().nullable(),
          email: z.string().email().optional().nullable(),
          profileImageUrl: z.string().url().optional().nullable(),
          aiConfirmationCode: z.string().min(4).max(20).optional().nullable(),
        })
      )
      .mutation(async ({ input }) => updateContact(input)),
  }),

  live: router({
    list: adminProcedure
      .input(z.object({ hours: z.number().min(1).max(24).optional() }).optional())
      .query(async ({ input }) => listLiveActivity(input?.hours ?? 1)),

    dropAgent: adminProcedure
      .input(z.object({ callLogId: z.number() }))
      .mutation(async ({ input }) => dropAgentFromCall(input.callLogId)),

    resetAgent: adminProcedure
      .input(z.object({ callLogId: z.number() }))
      .mutation(async ({ input }) => resetAgentSession(input.callLogId)),

    rejoinAgent: adminProcedure
      .input(z.object({ callLogId: z.number() }))
      .mutation(async ({ input }) => rejoinAgentToCall(input.callLogId)),
  }),

  logs: router({
    list: adminProcedure
      .input(
        z
          .object({
            search: z.string().optional(),
            status: callStatusEnum.optional(),
            type: callTypeEnum.optional(),
            userId: z.number().optional(),
            agentId: z.number().optional(),
            startDate: z.coerce.date().optional(),
            endDate: z.coerce.date().optional(),
          })
          .optional()
      )
      .query(async ({ input }) => listCallLogs(input)),

    create: adminProcedure
      .input(
        z.object({
          userId: z.number().optional(),
          agentId: z.number().optional(),
          zoomMeetingId: z.number().optional(),
          pipelineProjectId: z.number().optional(),
          type: callTypeEnum,
          status: callStatusEnum.optional(),
          direction: z.string().optional(),
          externalCallId: z.string().optional(),
          phoneNumber: z.string().optional(),
          startedAt: z.coerce.date().optional(),
          endedAt: z.coerce.date().optional().nullable(),
          durationSeconds: z.number().optional(),
          transcript: z.string().optional(),
          summary: z.string().optional(),
          transcriptUrl: z.string().url().optional(),
          recordingUrl: z.string().url().optional(),
          subtitlesUrl: z.string().url().optional(),
          sentimentAnalysis: z.record(z.string(), z.unknown()).optional(),
          liveEvents: z.array(liveEventSchema).optional(),
          metadata: z.record(z.string(), z.unknown()).optional(),
        })
      )
      .mutation(async ({ input }) =>
        createCallLog({
          ...input,
          endedAt: input.endedAt ?? undefined,
        })
      ),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          userId: z.number().optional(),
          agentId: z.number().optional(),
          zoomMeetingId: z.number().optional(),
          pipelineProjectId: z.number().optional(),
          type: callTypeEnum.optional(),
          status: callStatusEnum.optional(),
          direction: z.string().optional(),
          externalCallId: z.string().optional(),
          phoneNumber: z.string().optional(),
          startedAt: z.coerce.date().optional(),
          endedAt: z.coerce.date().optional().nullable(),
          durationSeconds: z.number().optional(),
          transcript: z.string().optional(),
          summary: z.string().optional(),
          transcriptUrl: z.string().url().optional(),
          recordingUrl: z.string().url().optional(),
          subtitlesUrl: z.string().url().optional(),
          sentimentAnalysis: z.record(z.string(), z.unknown()).optional(),
          liveEvents: z.array(liveEventSchema).optional(),
          metadata: z.record(z.string(), z.unknown()).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        return updateCallLog(id, {
          ...updates,
          endedAt: updates.endedAt ?? undefined,
        });
      }),

    analysis: adminProcedure
      .input(
        z
          .object({
            startDate: z.coerce.date().optional(),
            endDate: z.coerce.date().optional(),
          })
          .optional()
      )
      .query(async ({ input }) => getLogAnalysis(input)),

    developmentBrief: adminProcedure
      .input(
        z.object({
          callLogId: z.number().optional(),
          userId: z.number().optional(),
          prompt: z.string().min(1),
        })
      )
      .mutation(async ({ input }) => createDevelopmentModeBrief(input)),
  }),

  content: router({
    list: adminProcedure
      .input(
        z
          .object({
            userId: z.number().optional(),
            pipelineProjectId: z.number().optional(),
            callLogId: z.number().optional(),
          })
          .optional()
      )
      .query(async ({ input }) => listCallContent(input)),

    upsert: adminProcedure
      .input(
        z.object({
          id: z.number().optional(),
          callLogId: z.number(),
          userId: z.number().optional(),
          pipelineProjectId: z.number().optional(),
          contentType: z.string().min(1).max(64),
          title: z.string().min(1).max(255),
          body: z.string().optional(),
          contentJson: z.record(z.string(), z.unknown()).optional(),
        })
      )
      .mutation(async ({ input }) => upsertCallContent(input)),
  }),

  webhooks: router({
    ingestTwilio: adminProcedure
      .input(z.object({ payload: z.record(z.string(), z.unknown()) }))
      .mutation(async ({ input }) =>
        ingestWebhookEvent({ source: "twilio", payload: input.payload })
      ),

    ingestElevenLabs: adminProcedure
      .input(z.object({ payload: z.record(z.string(), z.unknown()) }))
      .mutation(async ({ input }) =>
        ingestWebhookEvent({ source: "elevenlabs", payload: input.payload })
      ),

    ingestZoom: adminProcedure
      .input(z.object({ payload: z.record(z.string(), z.unknown()) }))
      .mutation(async ({ input }) =>
        ingestWebhookEvent({ source: "zoom", payload: input.payload })
      ),
  }),
});
