import type { UserPermissions } from "../drizzle/schema";

export const PERMISSION_KEYS: (keyof UserPermissions)[] = [
  "businessCatalog",
  "myBusinesses",
  "monitoring",
  "tokenUsage",
  "apiConfig",
  "webhooks",
  "settings",
];

export const DEFAULT_PERMISSIONS: UserPermissions = {
  businessCatalog: false,
  myBusinesses: false,
  monitoring: false,
  tokenUsage: false,
  apiConfig: false,
  webhooks: false,
  settings: false,
};

export const FULL_PERMISSIONS: UserPermissions = {
  businessCatalog: true,
  myBusinesses: true,
  monitoring: true,
  tokenUsage: true,
  apiConfig: true,
  webhooks: true,
  settings: true,
};

export const PERMISSION_LABELS: Record<keyof UserPermissions, string> = {
  businessCatalog: "Business Catalog",
  myBusinesses: "My Businesses",
  monitoring: "Monitoring",
  tokenUsage: "Token Usage",
  apiConfig: "API Config",
  webhooks: "Webhooks",
  settings: "Settings",
};

export const ROUTE_PERMISSION_MAP: Record<string, keyof UserPermissions> = {
  "/catalog": "businessCatalog",
  "/my-businesses": "myBusinesses",
  "/monitoring": "monitoring",
  "/tokens": "tokenUsage",
  "/token-usage": "tokenUsage",
  "/api-config": "apiConfig",
  "/webhooks": "webhooks",
  "/settings": "settings",
};

/**
 * Check if a user has a specific permission.
 * Admins always have all permissions.
 */
export function hasPermission(
  user: { role: string; permissions?: UserPermissions | null } | null,
  key: keyof UserPermissions
): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;
  return user.permissions?.[key] === true;
}
