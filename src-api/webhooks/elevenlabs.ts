import "dotenv/config";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ingestWebhookEvent } from "../../server/services/voiceAssistant";
import { ENV } from "../../server/_core/env";
import { readRawBody, verifyElevenLabsSignature } from "./_verify";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
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
    res.status(403).json({ error: "invalid signature" });
    return;
  }

  let payload: Record<string, unknown>;
  try {
    payload = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    res.status(400).json({ error: "invalid json" });
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
    res.status(200).json({ ok: true, ...result });
  } catch (error) {
    console.error("[webhook:elevenlabs] ingest failed", error);
    res.status(500).json({ error: "ingest failed" });
  }
}
