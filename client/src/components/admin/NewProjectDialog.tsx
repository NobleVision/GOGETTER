import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function NewProjectDialog({
  onCreated,
}: {
  onCreated?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    businessName: "",
    pocName: "",
    pocEmail: "",
    pocPhone: "",
    referralSource: "",
    description: "",
  });

  const createMutation = trpc.admin.pipeline.create.useMutation({
    onSuccess: () => {
      toast.success("Pipeline project created");
      setOpen(false);
      setForm({
        businessName: "",
        pocName: "",
        pocEmail: "",
        pocPhone: "",
        referralSource: "",
        description: "",
      });
      onCreated?.();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.businessName.trim() || !form.pocName.trim()) {
      toast.error("Business name and POC name are required");
      return;
    }
    createMutation.mutate({
      businessName: form.businessName.trim(),
      pocName: form.pocName.trim(),
      pocEmail: form.pocEmail.trim() || undefined,
      pocPhone: form.pocPhone.trim() || undefined,
      referralSource: form.referralSource || undefined,
      description: form.description.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-violet-600 hover:bg-violet-700">
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Pipeline Project</DialogTitle>
            <DialogDescription>
              Start a new ZERO to HERO business in Phase 00.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="businessName">Business Name *</Label>
              <Input
                id="businessName"
                value={form.businessName}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    businessName: e.target.value,
                  }))
                }
                placeholder="e.g. AI Content Engine"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pocName">POC Name *</Label>
              <Input
                id="pocName"
                value={form.pocName}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    pocName: e.target.value,
                  }))
                }
                placeholder="Point of contact name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="pocEmail">Email</Label>
                <Input
                  id="pocEmail"
                  type="email"
                  value={form.pocEmail}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      pocEmail: e.target.value,
                    }))
                  }
                  placeholder="email@example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pocPhone">Phone</Label>
                <Input
                  id="pocPhone"
                  value={form.pocPhone}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      pocPhone: e.target.value,
                    }))
                  }
                  placeholder="+1 555-0123"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="referralSource">Referral Source</Label>
              <Select
                value={form.referralSource}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, referralSource: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="How did they find us?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="social_media">
                    Social Media
                  </SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="promo_code">
                    Promo Code
                  </SelectItem>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    description: e.target.value,
                  }))
                }
                placeholder="Brief description of the business idea..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-violet-600 hover:bg-violet-700"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending
                ? "Creating..."
                : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
