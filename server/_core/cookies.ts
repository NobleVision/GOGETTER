import type { IncomingHttpHeaders } from "http";

/**
 * Minimal request type for cookie operations.
 * Works with both Express Request and Vercel Request types.
 */
export type CookieRequest = {
  protocol?: string;
  headers: IncomingHttpHeaders;
};

export type SessionCookieOptions = {
  domain?: string;
  httpOnly: boolean;
  path: string;
  sameSite: "strict" | "lax" | "none" | boolean;
  secure: boolean;
};

function isSecureRequest(req: CookieRequest): boolean {
  if (req.protocol === "https") return true;

  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;

  const protoList = Array.isArray(forwardedProto)
    ? forwardedProto
    : forwardedProto.split(",");

  return protoList.some((proto: string) => proto.trim().toLowerCase() === "https");
}

export function getSessionCookieOptions(req: CookieRequest): SessionCookieOptions {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req),
  };
}
