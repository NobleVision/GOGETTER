import "dotenv/config";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ingestWebhookEvent } from "../../server/services/voiceAssistant";
import { ENV } from "../../server/_core/env";
import {
  readRawBody,
  buildZoomUrlValidationResponse,
  verifyZoomSignature,
} from "./_verify";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const rawBody = await readRawBody(req);
  let parsed: Record<string, unknown>;
  try {
    parsed = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    res.status(400).json({ error: "invalid json" });
    return;
  }

  if (parsed.event === "endpoint.url_validation") {
    const payload = parsed.payload as { plainToken?: string } | undefined;
    if (!payload?.plainToken) {
      res.status(400).json({ error: "missing plainToken" });
      return;
    }
    const response = buildZoomUrlValidationResponse(
      payload.plainToken,
      ENV.zoomSecretToken,
    );
    res.status(200).json(response);
    return;
  }

  const timestamp = req.headers["x-zm-request-timestamp"] as string | undefined;
  const signature = req.headers["x-zm-signature"] as string | undefined;

  const valid = verifyZoomSignature({
    secret: ENV.zoomSecretToken,
    rawBody,
    timestamp,
    signatureHeader: signature,
  });

  if (!valid) {
    console.warn("[webhook:zoom] invalid signature", {
      hasToken: Boolean(ENV.zoomSecretToken),
      hasSignature: Boolean(signature),
      hasTimestamp: Boolean(timestamp),
    });
    res.status(403).json({ error: "invalid signature" });
    return;
  }

  try {
    const zoomPayload = parsed.payload as Record<string, unknown> | undefined;
    const object = zoomPayload?.object as Record<string, unknown> | undefined;
    const meetingExternalId =
      (object?.id as string | number | undefined) ??
      (object?.uuid as string | undefined);

    const flat: Record<string, unknown> = { ...parsed };
    if (meetingExternalId !== undefined) {
      flat.externalMeetingId = String(meetingExternalId);
    }
    if (parsed.event) flat.status = parsed.event;

    const result = await ingestWebhookEvent({ source: "zoom", payload: flat });
    res.status(200).json({ ok: true, ...result });
  } catch (error) {
    console.error("[webhook:zoom] ingest failed", error);
    res.status(500).json({ error: "ingest failed" });
  }
}
