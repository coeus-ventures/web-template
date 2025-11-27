"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { useStopImpersonating } from "../users/behaviors/stop-impersonating/use-stop-impersonating";
import { toast } from "sonner";

interface ImpersonationBannerProps {
  impersonatedUserName: string | null;
}

export function ImpersonationBanner({ impersonatedUserName }: ImpersonationBannerProps) {
  const { handleStopImpersonating, isLoading } = useStopImpersonating();

  const handleStop = async () => {
    try {
      await handleStopImpersonating();
      // Will redirect on success
    } catch (error) {
      toast.error("Failed to stop impersonating", {
        description: error instanceof Error ? error.message : "An error occurred",
      });
    }
  };

  return (
    <Alert className="mb-4 border-warning bg-warning/10">
      <AlertDescription className="flex items-center justify-between">
        <span className="text-sm flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Impersonating <strong>{impersonatedUserName || "a user"}</strong>
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleStop}
          disabled={isLoading}
        >
          {isLoading ? "Stopping..." : "Stop Impersonating"}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
