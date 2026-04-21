import "dotenv/config";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ingestWebhookEvent } from "../../server/services/voiceAssistant";
import { ENV } from "../../server/_core/env";
import { readRawBody, verifyElevenLabsSignature } from "./_verify";

function sendJson(
  res: VercelResponse,
  statusCode: number,
  payload: Record<string, unknown>
) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  const rawBody = await readRawBody(req);
  const signatureHeader =
    (req.headers["elevenlabs-signature"] as string | undefined) ??
    (req.headers["x-elevenlabs-signature"] as string | undefined);

  const valid = verifyElevenLabsSignature({
    secret: ENV.elevenLabsAgentWebhookSecret,
    rawBody,
    signatureHeader,
  });

  if (!valid) {
    console.warn("[webhook:elevenlabs] invalid signature", {
      hasSecret: Boolean(ENV.elevenLabsAgentWebhookSecret),
      hasSignature: Boolean(signatureHeader),
    });
    sendJson(res, 403, { error: "invalid signature" });
    return;
  }

  let payload: Record<string, unknown>;
  try {
    payload = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    sendJson(res, 400, { error: "invalid json" });
    return;
  }

  try {
    const data = payload.data as Record<string, unknown> | undefined;
    const conversationId =
      (payload.conversation_id as string | undefined) ??
      (data?.conversation_id as string | undefined);
    const eventType =
      (payload.type as string | undefined) ??
      (payload.event_type as string | undefined);

    const flat: Record<string, unknown> = { ...payload };
    if (conversationId) flat.externalCallId = conversationId;
    if (eventType) flat.status = eventType;

    const result = await ingestWebhookEvent({
      source: "elevenlabs",
      payload: flat,
    });
    sendJson(res, 200, { ok: true, ...result });
  } catch (error) {
    console.error("[webhook:elevenlabs] ingest failed", error);
    sendJson(res, 500, { error: "ingest failed" });
  }
}
