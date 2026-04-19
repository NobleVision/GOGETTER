import "dotenv/config";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ingestWebhookEvent } from "../../server/services/voiceAssistant";
import { ENV } from "../../server/_core/env";
import { readRawBody, verifyTwilioSignature } from "./_verify";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const rawBody = await readRawBody(req);
  const formParams = Object.fromEntries(new URLSearchParams(rawBody).entries());

  const proto = (req.headers["x-forwarded-proto"] as string) || "https";
  const host = (req.headers["x-forwarded-host"] || req.headers.host) as string;
  const fullUrl = `${proto}://${host}${req.url || "/api/webhooks/twilio"}`;

  const signature = req.headers["x-twilio-signature"] as string | undefined;

  const valid = verifyTwilioSignature({
    authToken: ENV.twilioAuthToken,
    fullUrl,
    formParams,
    signature,
  });

  if (!valid) {
    console.warn("[webhook:twilio] invalid signature", {
      hasToken: Boolean(ENV.twilioAuthToken),
      hasSignature: Boolean(signature),
      url: fullUrl,
    });
    res.status(403).json({ error: "invalid signature" });
    return;
  }

  try {
    const payload: Record<string, unknown> = { ...formParams };
    if (payload.CallSid && !payload.externalCallId) {
      payload.externalCallId = payload.CallSid;
    }
    if (payload.CallStatus && !payload.status) {
      payload.status = payload.CallStatus;
    }
    const result = await ingestWebhookEvent({ source: "twilio", payload });
    res.status(200).json({ ok: true, ...result });
  } catch (error) {
    console.error("[webhook:twilio] ingest failed", error);
    res.status(500).json({ error: "ingest failed" });
  }
}
