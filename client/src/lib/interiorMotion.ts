import type { Variants } from "framer-motion";

/**
 * Shared motion primitives + glass-tile class constants for interior
 * (authenticated) screens. Keeps the internal workspace visually aligned
 * with the landing page without duplicating the heavier landing-only
 * animations (typewriter, mask-reveal, shimmer).
 *
 * Usage pattern inside a page:
 *
 *   const shouldReduceMotion = useReducedMotion();
 *   const m = interiorPageMotion(!!shouldReduceMotion);
 *   return (
 *     <motion.div {...m.container}>
 *       <motion.div {...m.header}>{header}</motion.div>
 *       <motion.section variants={m.section.variants}>...</motion.section>
 *     </motion.div>
 *   );
 */

export type InteriorMotion = {
  /** Page-level stagger orchestrator. Spread onto the outer wrapper. */
  container: {
    initial: string | false;
    animate: string | undefined;
    variants: Variants;
  };
  /** Page header (title + subtitle). Spread onto the header block. */
  header: {
    initial: { opacity: number; y?: number } | false;
    animate: { opacity: number; y: number } | undefined;
    transition: { duration: number; ease: readonly [number, number, number, number] } | { duration: 0 };
  };
  /** Primary section block. Spread `.variants` + rely on container cascade. */
  section: { variants: Variants };
  /** Subtle card hover lift (scale 1.01). Spread onto motion.div. */
  hoverLift:
    | Record<string, never>
    | { whileHover: { scale: number }; transition: { duration: number } };
};

const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as const;

export function interiorPageMotion(reduceMotion: boolean): InteriorMotion {
  if (reduceMotion) {
    return {
      container: {
        initial: false,
        animate: undefined,
        variants: { hidden: {}, visible: {} },
      },
      header: {
        initial: false,
        animate: undefined,
        transition: { duration: 0 },
      },
      section: {
        variants: {
          hidden: { opacity: 1 },
          visible: { opacity: 1 },
        },
      },
      hoverLift: {},
    };
  }

  return {
    container: {
      initial: "hidden",
      animate: "visible",
      variants: {
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.08,
            delayChildren: 0.1,
          },
        },
      },
    },
    header: {
      initial: { opacity: 0, y: 10 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.45, ease: EASE_OUT_EXPO },
    },
    section: {
      variants: {
        hidden: { opacity: 0, y: 14 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.45, ease: EASE_OUT_EXPO },
        },
      },
    },
    hoverLift: {
      whileHover: { scale: 1.01 },
      transition: { duration: 0.2 },
    },
  };
}

/* -------------------------------------------------------------------------
 * Glass-tile class constants. Use via `className={GLASS_HERO}` or
 * `className={cn(GLASS_PANEL, "other classes")}`. Performance-conscious:
 *   - GLASS_HERO   — full backdrop-blur for primary/feature panels
 *   - GLASS_PANEL  — tinted only, NO blur (safe for charts + dense grids)
 *   - GLASS_PANEL_SUBTLE — lightest tile, for tables/nested lists
 * ----------------------------------------------------------------------- */

export const GLASS_HERO =
  "rounded-[28px] border border-white/10 bg-slate-950/72 shadow-[0_24px_80px_rgba(2,6,23,0.45)] backdrop-blur-xl";

export const GLASS_PANEL =
  "rounded-2xl border border-white/10 bg-slate-950/70";

export const GLASS_PANEL_SUBTLE =
  "rounded-xl border border-white/10 bg-slate-950/60";
