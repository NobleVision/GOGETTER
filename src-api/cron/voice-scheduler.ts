import "dotenv/config";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { runDueScheduledActions } from "../../server/services/voiceAssistant";

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
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.authorization || "";

  if (secret && authHeader !== `Bearer ${secret}`) {
    sendJson(res, 401, { error: "unauthorized" });
    return;
  }

  try {
    const result = await runDueScheduledActions(20);
    sendJson(res, 200, { ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[cron:voice-scheduler] failed", error);
    sendJson(res, 500, { ok: false, error: message });
  }
}
