import "dotenv/config";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  constructStripeEvent,
  handleStripeEvent,
  stripeConfigured,
} from "../../server/services/stripe";
import { readRawBody } from "./_verify";

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

  if (!stripeConfigured()) {
    sendJson(res, 503, { error: "Stripe billing is not configured" });
    return;
  }

  const signature = req.headers["stripe-signature"];
  if (typeof signature !== "string" || !signature) {
    sendJson(res, 400, { error: "Missing Stripe signature" });
    return;
  }

  try {
    const rawBody = await readRawBody(req);
    const event = constructStripeEvent(rawBody, signature);
    const result = await handleStripeEvent(event);
    sendJson(res, 200, { ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[webhook:stripe] failed", error);
    sendJson(res, 400, { ok: false, error: message });
  }
}
