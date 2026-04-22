import { useMemo, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { motion, useReducedMotion } from "framer-motion";
import { interiorPageMotion } from "@/lib/interiorMotion";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart3,
  BookOpen,
  CircleDollarSign,
  Flame,
  Layers3,
  Save,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";

export default function AdminContent() {
  const utils = trpc.useUtils();
  const overviewQuery = trpc.admin.content.overview.useQuery();
  const subscriptionsQuery = trpc.admin.subscriptions.list.useQuery();

  const [blogForm, setBlogForm] = useState({
    title: "",
    slug: "",
    summary: "",
    content: "",
    category: "Launch Strategy",
    tags: "ai, monetization",
    sourceUrls: "",
    imageUrl: "",
    infographicUrl: "",
  });

  const [whyWhoForm, setWhyWhoForm] = useState({
    title: "Today’s Why / Who",
    slug: "daily-why-who",
    whyContent: "",
    whoContent: "",
    marketContext: "",
    sourceUrls: "",
  });

  const [hotForm, setHotForm] = useState({
    title: "Hot 100 Opportunities",
    slug: "hot-100-opportunities",
    summary: "",
    entries: "AI appointment-setting for local services\nMicro-SaaS audit products\nVoice-based lead follow-up systems",
    sourceUrls: "",
  });

  const invalidateOverview = async () => {
    await utils.admin.content.overview.invalidate();
    await utils.admin.subscriptions.list.invalidate();
  };

  const saveBlogMutation = trpc.admin.content.saveBlogPost.useMutation({
    onSuccess: async () => {
      toast.success("Blog content saved.");
      await invalidateOverview();
    },
    onError: (error) => toast.error(error.message),
  });

  const saveWhyWhoMutation = trpc.admin.content.saveDailyWhyWho.useMutation({
    onSuccess: async () => {
      toast.success("Daily Why / Who content saved.");
      await invalidateOverview();
    },
    onError: (error) => toast.error(error.message),
  });

  const saveHotMutation = trpc.admin.content.saveHot100.useMutation({
    onSuccess: async () => {
      toast.success("Hot list saved.");
      await invalidateOverview();
    },
    onError: (error) => toast.error(error.message),
  });

  const data = overviewQuery.data;
  const subscriptions = subscriptionsQuery.data ?? data?.subscriptions ?? [];

  const monetizationSummary = useMemo(() => {
    const rows = subscriptions ?? [];
    const active = rows.filter((row: any) => row.status === "active").length;
    const paid = rows.filter((row: any) => row.tier && row.tier !== "free").length;
    const credits = rows.reduce((sum: number, row: any) => sum + (row.creditsRemaining ?? 0), 0);
    return { active, paid, credits };
  }, [subscriptions]);

  const parseLines = (value: string) =>
    value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

  const shouldReduceMotion = useReducedMotion();
  const pageMotion = interiorPageMotion(!!shouldReduceMotion);

  return (
    <AdminLayout>
      <motion.div className="space-y-6" {...pageMotion.container}>
        <motion.div className="space-y-2" {...pageMotion.header}>
          <Badge className="bg-violet-500/15 text-violet-200 hover:bg-violet-500/20">
            Monetization and narrative controls
          </Badge>
          <h1 className="text-3xl font-bold text-white">Content Tools</h1>
          <p className="max-w-4xl text-sm leading-7 text-slate-300">
            Manage the landing-page story, daily Why/Who guidance, Hot 100 opportunity lists, and subscription visibility from one operational admin screen.
          </p>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={BookOpen}
            label="Blog entries"
            value={String(data?.blogs?.length ?? 0)}
            detail="Latest landing-page articles and AI-generated insight pieces"
          />
          <MetricCard
            icon={Sparkles}
            label="Daily Why / Who"
            value={String(data?.whyWho?.length ?? 0)}
            detail="Narrative blocks ready for the home and landing experience"
          />
          <MetricCard
            icon={Flame}
            label="Hot lists"
            value={String(data?.hotLists?.length ?? 0)}
            detail="Curated opportunity collections for Top 10 and Hot 100 panels"
          />
          <MetricCard
            icon={CircleDollarSign}
            label="Paid subscriptions"
            value={String(monetizationSummary.paid)}
            detail={`${monetizationSummary.active} active • ${monetizationSummary.credits.toLocaleString()} credits remaining platform-wide`}
          />
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 bg-slate-900 md:grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="whywho">Why / Who</TabsTrigger>
            <TabsTrigger value="blog">Blog</TabsTrigger>
            <TabsTrigger value="hot100">Hot 100</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
              <Card className="border-white/10 bg-slate-950/70">
                <CardHeader>
                  <CardTitle className="text-white">Latest narrative content</CardTitle>
                  <CardDescription className="text-slate-400">
                    Snapshot of the content that will power your landing page, dynamic daily guidance, and editorial areas.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {overviewQuery.isLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-20 w-full" />
                    </div>
                  ) : (
                    <>
                      <ContentList title="Recent blog posts" items={data?.blogs ?? []} primaryKey="title" secondaryKey="summary" />
                      <ContentList title="Recent Why / Who blocks" items={data?.whyWho ?? []} primaryKey="title" secondaryKey="whyContent" />
                      <ContentList title="Recent hot lists" items={data?.hotLists ?? []} primaryKey="title" secondaryKey="summary" />
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-slate-950/70">
                <CardHeader>
                  <CardTitle className="text-white">Monetization visibility</CardTitle>
                  <CardDescription className="text-slate-400">
                    Quick admin view of subscription mix and monetization posture while the Stripe-powered flow rolls out.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {subscriptionsQuery.isLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  ) : (
                    subscriptions.slice(0, 8).map((subscription: any) => (
                      <div key={subscription.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                        <div>
                          <div className="text-sm font-medium text-white">User #{subscription.userId}</div>
                          <div className="text-xs text-slate-400 capitalize">
                            {subscription.tier} • {subscription.status}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-emerald-300">
                            {subscription.creditsRemaining ?? 0} credits
                          </div>
                          <div className="text-xs text-slate-400">
                            {subscription.wizardUsesThisMonth ?? 0}/{subscription.wizardUsesLimit ?? 0} discovery
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="whywho">
            <Card className="border-white/10 bg-slate-950/70">
              <CardHeader>
                <CardTitle className="text-white">Daily Why / Who editor</CardTitle>
                <CardDescription className="text-slate-400">
                  Publish the daily narrative that explains why the moment matters and who GoGetterOS is ideal for right now.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <Field label="Title">
                  <Input value={whyWhoForm.title} onChange={(e) => setWhyWhoForm((prev) => ({ ...prev, title: e.target.value }))} />
                </Field>
                <Field label="Slug">
                  <Input value={whyWhoForm.slug} onChange={(e) => setWhyWhoForm((prev) => ({ ...prev, slug: e.target.value }))} />
                </Field>
                <Field label="Why now" className="md:col-span-2">
                  <Textarea className="min-h-32" value={whyWhoForm.whyContent} onChange={(e) => setWhyWhoForm((prev) => ({ ...prev, whyContent: e.target.value }))} />
                </Field>
                <Field label="Who it serves" className="md:col-span-2">
                  <Textarea className="min-h-32" value={whyWhoForm.whoContent} onChange={(e) => setWhyWhoForm((prev) => ({ ...prev, whoContent: e.target.value }))} />
                </Field>
                <Field label="Market context" className="md:col-span-2">
                  <Textarea className="min-h-24" value={whyWhoForm.marketContext} onChange={(e) => setWhyWhoForm((prev) => ({ ...prev, marketContext: e.target.value }))} />
                </Field>
                <Field label="Source URLs (one per line)" className="md:col-span-2">
                  <Textarea className="min-h-24" value={whyWhoForm.sourceUrls} onChange={(e) => setWhyWhoForm((prev) => ({ ...prev, sourceUrls: e.target.value }))} />
                </Field>
                <div className="md:col-span-2">
                  <Button
                    onClick={() =>
                      saveWhyWhoMutation.mutate({
                        ...whyWhoForm,
                        sourceUrls: parseLines(whyWhoForm.sourceUrls),
                        linkedBlogPostIds: [],
                      })
                    }
                    disabled={saveWhyWhoMutation.isPending}
                    className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:from-violet-400 hover:to-fuchsia-400"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save daily narrative
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="blog">
            <Card className="border-white/10 bg-slate-950/70">
              <CardHeader>
                <CardTitle className="text-white">Blog and insight publisher</CardTitle>
                <CardDescription className="text-slate-400">
                  Prepare long-form landing-page support content, AI-authored explainers, and monetization-focused posts.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <Field label="Title">
                  <Input value={blogForm.title} onChange={(e) => setBlogForm((prev) => ({ ...prev, title: e.target.value }))} />
                </Field>
                <Field label="Slug">
                  <Input value={blogForm.slug} onChange={(e) => setBlogForm((prev) => ({ ...prev, slug: e.target.value }))} />
                </Field>
                <Field label="Category">
                  <Input value={blogForm.category} onChange={(e) => setBlogForm((prev) => ({ ...prev, category: e.target.value }))} />
                </Field>
                <Field label="Tags (comma separated)">
                  <Input value={blogForm.tags} onChange={(e) => setBlogForm((prev) => ({ ...prev, tags: e.target.value }))} />
                </Field>
                <Field label="Summary" className="md:col-span-2">
                  <Textarea className="min-h-24" value={blogForm.summary} onChange={(e) => setBlogForm((prev) => ({ ...prev, summary: e.target.value }))} />
                </Field>
                <Field label="Body content" className="md:col-span-2">
                  <Textarea className="min-h-40" value={blogForm.content} onChange={(e) => setBlogForm((prev) => ({ ...prev, content: e.target.value }))} />
                </Field>
                <Field label="Hero image URL">
                  <Input value={blogForm.imageUrl} onChange={(e) => setBlogForm((prev) => ({ ...prev, imageUrl: e.target.value }))} />
                </Field>
                <Field label="Infographic URL">
                  <Input value={blogForm.infographicUrl} onChange={(e) => setBlogForm((prev) => ({ ...prev, infographicUrl: e.target.value }))} />
                </Field>
                <Field label="Source URLs (one per line)" className="md:col-span-2">
                  <Textarea className="min-h-24" value={blogForm.sourceUrls} onChange={(e) => setBlogForm((prev) => ({ ...prev, sourceUrls: e.target.value }))} />
                </Field>
                <div className="md:col-span-2">
                  <Button
                    onClick={() =>
                      saveBlogMutation.mutate({
                        ...blogForm,
                        tags: parseLines(blogForm.tags.replace(/,/g, "\n")),
                        sourceUrls: parseLines(blogForm.sourceUrls),
                        status: "published",
                        aiGenerated: true,
                        promptOutline: "Landing page support content",
                      })
                    }
                    disabled={saveBlogMutation.isPending}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-400 hover:to-teal-400"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save blog content
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hot100">
            <Card className="border-white/10 bg-slate-950/70">
              <CardHeader>
                <CardTitle className="text-white">Hot 100 / Top 10 opportunity editor</CardTitle>
                <CardDescription className="text-slate-400">
                  Curate the lists that support landing-page urgency, trend visibility, and premium opportunity discovery.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <Field label="Title">
                  <Input value={hotForm.title} onChange={(e) => setHotForm((prev) => ({ ...prev, title: e.target.value }))} />
                </Field>
                <Field label="Slug">
                  <Input value={hotForm.slug} onChange={(e) => setHotForm((prev) => ({ ...prev, slug: e.target.value }))} />
                </Field>
                <Field label="Summary" className="md:col-span-2">
                  <Textarea className="min-h-24" value={hotForm.summary} onChange={(e) => setHotForm((prev) => ({ ...prev, summary: e.target.value }))} />
                </Field>
                <Field label="Entries (one per line)" className="md:col-span-2">
                  <Textarea className="min-h-40" value={hotForm.entries} onChange={(e) => setHotForm((prev) => ({ ...prev, entries: e.target.value }))} />
                </Field>
                <Field label="Source URLs (one per line)" className="md:col-span-2">
                  <Textarea className="min-h-24" value={hotForm.sourceUrls} onChange={(e) => setHotForm((prev) => ({ ...prev, sourceUrls: e.target.value }))} />
                </Field>
                <div className="md:col-span-2">
                  <Button
                    onClick={() =>
                      saveHotMutation.mutate({
                        title: hotForm.title,
                        slug: hotForm.slug,
                        summary: hotForm.summary,
                        entries: parseLines(hotForm.entries).map((entry, index) => ({ rank: index + 1, title: entry })),
                        sourceUrls: parseLines(hotForm.sourceUrls),
                      })
                    }
                    disabled={saveHotMutation.isPending}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-400 hover:to-orange-400"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save hot list
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing">
            <Card className="border-white/10 bg-slate-950/70">
              <CardHeader>
                <CardTitle className="text-white">Subscription oversight</CardTitle>
                <CardDescription className="text-slate-400">
                  Admin-facing snapshot of plans, credit posture, and discovery usage while monetization scales.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {subscriptionsQuery.isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  subscriptions.map((subscription: any) => (
                    <div key={subscription.id} className="grid gap-3 rounded-2xl border border-white/10 bg-slate-900/70 p-4 md:grid-cols-[1fr_auto_auto_auto] md:items-center">
                      <div>
                        <div className="font-medium text-white">User #{subscription.userId}</div>
                        <div className="text-sm capitalize text-slate-400">
                          {subscription.tier} • {subscription.status}
                        </div>
                      </div>
                      <div className="text-sm text-slate-300">
                        {subscription.creditsRemaining ?? 0} credits
                      </div>
                      <div className="text-sm text-slate-300">
                        {subscription.wizardUsesThisMonth ?? 0}/{subscription.wizardUsesLimit ?? 0} discovery
                      </div>
                      <Badge variant="outline" className="w-fit border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
                        {subscription.activeBusinessesLimit ?? 0} business cap
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </AdminLayout>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: any;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <Card className="border-white/10 bg-slate-950/70">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-300">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm text-slate-400">{label}</div>
            <div className="mt-1 text-2xl font-semibold text-white">{value}</div>
            <p className="mt-1 text-xs leading-6 text-slate-500">{detail}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label className="mb-2 block text-slate-300">{label}</Label>
      {children}
    </div>
  );
}

function ContentList({
  title,
  items,
  primaryKey,
  secondaryKey,
}: {
  title: string;
  items: any[];
  primaryKey: string;
  secondaryKey: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-white">
        <Layers3 className="h-4 w-4 text-violet-300" />
        {title}
      </div>
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/60 p-4 text-sm text-slate-400">
          No content saved yet.
        </div>
      ) : (
        items.slice(0, 3).map((item: any) => (
          <div key={item.id} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-medium text-white">{item[primaryKey] || "Untitled"}</div>
              <Badge variant="outline" className="border-white/10 text-slate-300">
                {item.slug || "draft"}
              </Badge>
            </div>
            <p className="mt-2 text-sm leading-7 text-slate-400">
              {item[secondaryKey] || "No preview available."}
            </p>
          </div>
        ))
      )}
    </div>
  );
}
