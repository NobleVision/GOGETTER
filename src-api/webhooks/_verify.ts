import crypto from "node:crypto";
import type { IncomingMessage } from "node:http";

export async function readRawBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : (chunk as Buffer));
  }
  return Buffer.concat(chunks).toString("utf8");
}

export function verifyTwilioSignature(args: {
  authToken: string;
  fullUrl: string;
  formParams: Record<string, string>;
  signature: string | undefined;
}): boolean {
  if (!args.signature || !args.authToken) return false;
  const sortedKeys = Object.keys(args.formParams).sort();
  const canonical =
    args.fullUrl +
    sortedKeys.map((k) => k + args.formParams[k]).join("");
  const expected = crypto
    .createHmac("sha1", args.authToken)
    .update(canonical)
    .digest("base64");
  return timingSafeEq(expected, args.signature);
}

export function verifyElevenLabsSignature(args: {
  secret: string;
  rawBody: string;
  signatureHeader: string | undefined;
  toleranceMs?: number;
}): boolean {
  if (!args.signatureHeader || !args.secret) return false;
  const parts = Object.fromEntries(
    args.signatureHeader.split(",").map((p) => {
      const [k, ...v] = p.trim().split("=");
      return [k, v.join("=")];
    })
  );
  const timestamp = parts.t;
  const v0 = parts.v0;
  if (!timestamp || !v0) return false;

  const tolerance = args.toleranceMs ?? 5 * 60 * 1000;
  const skew = Math.abs(Date.now() - Number(timestamp) * 1000);
  if (Number.isNaN(skew) || skew > tolerance) return false;

  const expected = crypto
    .createHmac("sha256", args.secret)
    .update(`${timestamp}.${args.rawBody}`)
    .digest("hex");

  return timingSafeEq(expected, v0);
}

export function verifyZoomSignature(args: {
  secret: string;
  rawBody: string;
  timestamp: string | undefined;
  signatureHeader: string | undefined;
  toleranceMs?: number;
}): boolean {
  if (!args.signatureHeader || !args.secret || !args.timestamp) return false;

  const tolerance = args.toleranceMs ?? 5 * 60 * 1000;
  const skew = Math.abs(Date.now() - Number(args.timestamp));
  if (Number.isNaN(skew) || skew > tolerance) return false;

  const message = `v0:${args.timestamp}:${args.rawBody}`;
  const expected =
    "v0=" +
    crypto.createHmac("sha256", args.secret).update(message).digest("hex");
  return timingSafeEq(expected, args.signatureHeader);
}

export function buildZoomUrlValidationResponse(
  plainToken: string,
  secret: string,
): { plainToken: string; encryptedToken: string } {
  const encryptedToken = crypto
    .createHmac("sha256", secret)
    .update(plainToken)
    .digest("hex");
  return { plainToken, encryptedToken };
}

function timingSafeEq(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}
