import { ENV } from "../_core/env";

const PIKA_BASE = "https://api.pika.art";

function assertKey(): string {
  if (!ENV.pikaApiKey) {
    throw new Error(
      "PIKA_API_KEY must be configured to use experimental video dial-in",
    );
  }
  return ENV.pikaApiKey;
}

async function pikaFetch<T>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const response = await fetch(`${PIKA_BASE}${path}`, {
    method: init.method ?? "POST",
    headers: {
      Authorization: `Bearer ${assertKey()}`,
      "Content-Type": "application/json",
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  const text = await response.text();
  let parsed: unknown = text;
  try {
    parsed = text ? JSON.parse(text) : {};
  } catch {
    // keep raw
  }
  if (!response.ok) {
    throw new Error(
      `Pika API ${init.method ?? "POST"} ${path} failed: ${response.status} — ${text.slice(0, 500)}`,
    );
  }
  return parsed as T;
}

export type PikaStream = {
  streamId: string;
  rtmpUrl: string;
  streamKey: string;
  status: string;
  createdAt: string;
};

/**
 * Start a Pika video stream for an agent avatar.
 *
 * Experimental: port of the Pika-Labs "Google Meet skill" pattern. Returns an
 * RTMP URL + stream key that the caller can pipe into Zoom via the Zoom RTMS
 * streaming API. When Pika's public API shape is not yet available in this
 * environment, the call will throw and the feature flag on the meeting row
 * should be cleared by the caller.
 */
export async function startPikaAvatarStream(input: {
  avatarUrl: string;
  agentName: string;
  voiceId?: string;
  script?: string;
}): Promise<PikaStream> {
  return pikaFetch<PikaStream>(`/v1/streams`, {
    method: "POST",
    body: {
      avatar_url: input.avatarUrl,
      persona_name: input.agentName,
      voice_id: input.voiceId,
      prompt: input.script,
      output: "rtmp",
    },
  });
}

export async function stopPikaStream(streamId: string): Promise<void> {
  await pikaFetch(`/v1/streams/${encodeURIComponent(streamId)}/stop`, {
    method: "POST",
  });
}

export function pikaConfigured(): boolean {
  return Boolean(ENV.pikaApiKey);
}
