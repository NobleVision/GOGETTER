import "dotenv/config";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { runDueScheduledActions } from "../../server/services/voiceAssistant";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.authorization || "";
  if (secret && authHeader !== `Bearer ${secret}`) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  try {
    const result = await runDueScheduledActions(20);
    res.status(200).json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[cron:voice-scheduler] failed", error);
    res.status(500).json({ ok: false, error: message });
  }
}
