/**
 * Vercel Serverless Function - Google OAuth Status
 * Returns whether Google OAuth is configured at /api/oauth/google/status
 */

import "dotenv/config";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { isGoogleOAuthConfigured } from "../../../server/_core/googleOAuth";

export default function handler(_req: VercelRequest, res: VercelResponse) {
  return res.json({ configured: isGoogleOAuthConfigured() });
}
