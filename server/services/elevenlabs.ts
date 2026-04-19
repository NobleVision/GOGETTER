import { ENV } from "../_core/env";

const EL_BASE = "https://api.elevenlabs.io";

function assertKey(): string {
  if (!ENV.elevenLabsApiKey) {
    throw new Error("ELEVENLABS_API_KEY must be configured");
  }
  return ENV.elevenLabsApiKey;
}

async function elFetch<T>(
  path: string,
  init: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
  } = {},
): Promise<T> {
  const url = `${EL_BASE}${path}`;
  const response = await fetch(url, {
    method: init.method ?? "GET",
    headers: {
      "xi-api-key": assertKey(),
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `ElevenLabs API ${init.method ?? "GET"} ${path} failed: ${response.status} — ${text.slice(0, 500)}`,
    );
  }
  const ct = response.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    return (await response.json()) as T;
  }
  return (await response.arrayBuffer()) as unknown as T;
}

export type ElevenLabsVoice = {
  voice_id: string;
  name: string;
  category?: string;
  labels?: Record<string, string>;
  preview_url?: string;
};

export async function listVoices(): Promise<ElevenLabsVoice[]> {
  const result = await elFetch<{ voices: ElevenLabsVoice[] }>(`/v1/voices`);
  return result.voices ?? [];
}

export async function synthesizeSpeech(input: {
  voiceId: string;
  text: string;
  modelId?: string;
  stability?: number;
  similarityBoost?: number;
}): Promise<Buffer> {
  const buf = await elFetch<ArrayBuffer>(
    `/v1/text-to-speech/${encodeURIComponent(input.voiceId)}`,
    {
      method: "POST",
      headers: { Accept: "audio/mpeg" },
      body: {
        text: input.text,
        model_id: input.modelId ?? "eleven_multilingual_v2",
        voice_settings: {
          stability: input.stability ?? 0.5,
          similarity_boost: input.similarityBoost ?? 0.75,
        },
      },
    },
  );
  return Buffer.from(buf);
}

export async function initiateOutboundConversation(input: {
  agentId: string;
  toPhoneNumber: string;
  metadata?: Record<string, unknown>;
}): Promise<{ conversation_id: string; call_sid?: string }> {
  return elFetch(`/v1/convai/twilio/outbound-call`, {
    method: "POST",
    body: {
      agent_id: input.agentId,
      agent_phone_number_id: ENV.elevenLabsAgentId || undefined,
      to_number: input.toPhoneNumber,
      conversation_initiation_client_data: input.metadata
        ? { dynamic_variables: input.metadata }
        : undefined,
    },
  });
}

export async function endConversation(conversationId: string): Promise<void> {
  await elFetch(`/v1/convai/conversations/${encodeURIComponent(conversationId)}`, {
    method: "DELETE",
  });
}

export async function getConversation(conversationId: string) {
  return elFetch<{
    conversation_id: string;
    status: string;
    transcript?: Array<{ role: string; message: string; time_in_call_secs?: number }>;
    metadata?: Record<string, unknown>;
  }>(`/v1/convai/conversations/${encodeURIComponent(conversationId)}`);
}

export function elevenLabsConfigured(): boolean {
  return Boolean(ENV.elevenLabsApiKey);
}

export function friendlyVoiceOptions(
  voices: ElevenLabsVoice[],
): Array<{ id: string; label: string; previewUrl?: string }> {
  const configured = new Set(ENV.elevenLabsVoiceIds);
  const filtered = configured.size > 0
    ? voices.filter((v) => configured.has(v.voice_id))
    : voices;
  return filtered.map((v) => ({
    id: v.voice_id,
    label: v.name,
    previewUrl: v.preview_url,
  }));
}
