import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { hasPermission } from '@shared/permissions';
import type { UserPermissions } from '../../drizzle/schema';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);

export const masterAdminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || !ctx.user.isMasterAdmin) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Master admin access required (10003)",
      });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);

/**
 * Creates a procedure that requires the user to have a specific permission.
 * Admins bypass all permission checks (handled by hasPermission).
 */
export function createPermissionProcedure(key: keyof UserPermissions) {
  return t.procedure.use(
    t.middleware(async (opts) => {
      const { ctx, next } = opts;

      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: UNAUTHED_ERR_MSG,
        });
      }

      if (!hasPermission(ctx.user, key)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `You do not have access to this feature. Missing permission: ${key}`,
        });
      }

      return next({
        ctx: {
          ...ctx,
          user: ctx.user,
        },
      });
    }),
  );
}
