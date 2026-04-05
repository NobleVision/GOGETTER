import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { SUBSCRIPTION_TIERS } from "@shared/const";
import { Zap, Crown } from "lucide-react";

export default function SubscriptionBanner() {
  const { data: sub } = trpc.subscription.get.useQuery();

  if (!sub) return null;

  const tier =
    SUBSCRIPTION_TIERS[sub.tier as keyof typeof SUBSCRIPTION_TIERS];
  const remaining = sub.wizardUsesLimit - sub.wizardUsesThisMonth;
  const isLow = remaining <= 1 && sub.tier !== "unlimited";
  const isExhausted = remaining <= 0 && sub.tier !== "unlimited";

  return (
    <Card
      className={`border ${
        isExhausted
          ? "bg-red-500/10 border-red-500/30"
          : isLow
            ? "bg-amber-500/10 border-amber-500/30"
            : "bg-violet-500/10 border-violet-500/30"
      }`}
    >
      <CardContent className="pt-3 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                isExhausted
                  ? "bg-red-500/20"
                  : "bg-violet-500/20"
              }`}
            >
              {sub.tier === "unlimited" ? (
                <Crown className="h-4 w-4 text-amber-400" />
              ) : (
                <Zap className="h-4 w-4 text-violet-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="text-xs capitalize"
                >
                  {tier?.name ?? sub.tier}
                </Badge>
                {sub.tier !== "unlimited" && (
                  <span
                    className={`text-sm font-medium ${
                      isExhausted
                        ? "text-red-300"
                        : isLow
                          ? "text-amber-300"
                          : "text-slate-200"
                    }`}
                  >
                    {remaining} of {sub.wizardUsesLimit} wizard
                    {sub.wizardUsesLimit === 1 ? " use" : " uses"}{" "}
                    remaining
                  </span>
                )}
                {sub.tier === "unlimited" && (
                  <span className="text-sm text-amber-300">
                    Unlimited wizard usages
                  </span>
                )}
              </div>
              {isExhausted && (
                <p className="text-xs text-red-400 mt-0.5">
                  Upgrade your subscription for more wizard usages
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
