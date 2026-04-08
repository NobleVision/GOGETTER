import { useAuth } from "./useAuth";
import {
  hasPermission,
  ROUTE_PERMISSION_MAP,
} from "@shared/permissions";
import type { UserPermissions } from "@shared/types";

export function usePermissions() {
  const { user } = useAuth();

  const can = (key: keyof UserPermissions): boolean => {
    return hasPermission(user as any, key);
  };

  const canAccessRoute = (path: string): boolean => {
    const permKey =
      ROUTE_PERMISSION_MAP[path as keyof typeof ROUTE_PERMISSION_MAP];
    if (!permKey) return true; // routes not in map are always accessible
    return hasPermission(user as any, permKey);
  };

  return {
    can,
    canAccessRoute,
    permissions: (user as any)?.permissions as UserPermissions | null,
  };
}
