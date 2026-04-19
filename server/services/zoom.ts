import { ENV } from "../_core/env";

const ZOOM_API_BASE = "https://api.zoom.us/v2";
const ZOOM_OAUTH_URL = "https://zoom.us/oauth/token";

type CachedToken = { token: string; expiresAt: number };
let cachedToken: CachedToken | null = null;

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt - 30_000 > now) {
    return cachedToken.token;
  }

  if (!ENV.zoomAccountId || !ENV.zoomClientId || !ENV.zoomClientSecret) {
    throw new Error(
      "ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET must be configured",
    );
  }

  const basic = Buffer.from(
    `${ENV.zoomClientId}:${ENV.zoomClientSecret}`,
  ).toString("base64");

  const form = new URLSearchParams();
  form.set("grant_type", "account_credentials");
  form.set("account_id", ENV.zoomAccountId);

  const response = await fetch(ZOOM_OAUTH_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Zoom OAuth failed: ${response.status} — ${text.slice(0, 500)}`,
    );
  }

  const json = (await response.json()) as {
    access_token: string;
    expires_in: number;
  };

  cachedToken = {
    token: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  };
  return cachedToken.token;
}

async function zoomFetch<T>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const token = await getAccessToken();
  const response = await fetch(`${ZOOM_API_BASE}${path}`, {
    method: init.method ?? "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });

  if (response.status === 204) return undefined as unknown as T;

  const text = await response.text();
  let parsed: unknown = text;
  try {
    parsed = text ? JSON.parse(text) : {};
  } catch {
    // keep raw
  }

  if (!response.ok) {
    throw new Error(
      `Zoom API ${init.method ?? "GET"} ${path} failed: ${response.status} — ${text.slice(0, 500)}`,
    );
  }

  return parsed as T;
}

export type ZoomMeetingResource = {
  id: number;
  uuid?: string;
  topic: string;
  agenda?: string;
  start_time?: string;
  duration?: number;
  timezone?: string;
  join_url: string;
  start_url: string;
  password?: string;
  status?: string;
};

export async function createZoomMeetingRemote(input: {
  topic: string;
  agenda?: string;
  startTime?: Date;
  durationMinutes?: number;
  timezone?: string;
  hostUserId?: string;
  invitees?: Array<{ email: string }>;
}): Promise<ZoomMeetingResource> {
  const userPath = input.hostUserId ? encodeURIComponent(input.hostUserId) : "me";
  return zoomFetch<ZoomMeetingResource>(`/users/${userPath}/meetings`, {
    method: "POST",
    body: {
      topic: input.topic,
      agenda: input.agenda,
      type: input.startTime ? 2 : 1,
      start_time: input.startTime?.toISOString(),
      duration: input.durationMinutes ?? 30,
      timezone: input.timezone,
      settings: {
        join_before_host: true,
        approval_type: 2,
        waiting_room: false,
        meeting_invitees: input.invitees,
      },
    },
  });
}

export async function updateZoomMeetingRemote(
  meetingId: string | number,
  updates: {
    topic?: string;
    agenda?: string;
    startTime?: Date;
    durationMinutes?: number;
    timezone?: string;
  },
): Promise<void> {
  await zoomFetch(`/meetings/${meetingId}`, {
    method: "PATCH",
    body: {
      topic: updates.topic,
      agenda: updates.agenda,
      start_time: updates.startTime?.toISOString(),
      duration: updates.durationMinutes,
      timezone: updates.timezone,
    },
  });
}

export async function deleteZoomMeetingRemote(
  meetingId: string | number,
): Promise<void> {
  await zoomFetch(`/meetings/${meetingId}`, { method: "DELETE" });
}

export async function endZoomMeetingRemote(
  meetingId: string | number,
): Promise<void> {
  await zoomFetch(`/meetings/${meetingId}/status`, {
    method: "PUT",
    body: { action: "end" },
  });
}

export async function getZoomMeetingRemote(
  meetingId: string | number,
): Promise<ZoomMeetingResource> {
  return zoomFetch<ZoomMeetingResource>(`/meetings/${meetingId}`);
}

export function zoomConfigured(): boolean {
  return Boolean(
    ENV.zoomAccountId && ENV.zoomClientId && ENV.zoomClientSecret,
  );
}
