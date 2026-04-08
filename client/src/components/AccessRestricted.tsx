import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AccessRestricted({
  featureName,
}: {
  featureName?: string;
}) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-4 max-w-md">
        <ShieldAlert className="h-16 w-16 text-amber-400 mx-auto" />
        <h1 className="text-2xl font-bold text-white">Access Restricted</h1>
        <p className="text-slate-400">
          {featureName
            ? `You don't have permission to access ${featureName}. Contact an administrator to request access.`
            : "You don't have permission to access this feature. Contact an administrator to request access."}
        </p>
        <Button
          variant="outline"
          onClick={() => (window.location.href = "/")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
