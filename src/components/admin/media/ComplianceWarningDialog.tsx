import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { ComplianceWarning } from "@/lib/complianceChecker";
import { Label } from "@/components/ui/label";

interface ComplianceWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warnings: ComplianceWarning[];
  onConfirm: () => void;
  isLoading?: boolean;
}

export function ComplianceWarningDialog({
  open,
  onOpenChange,
  warnings,
  onConfirm,
  isLoading,
}: ComplianceWarningDialogProps) {
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = () => {
    if (confirmed) {
      onConfirm();
      setConfirmed(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setConfirmed(false);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Compliance Warning
          </DialogTitle>
          <DialogDescription>
            This post contains language that may violate medical advertising guidelines.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-64 overflow-y-auto">
          {warnings.map((warning, index) => (
            <Alert key={index} variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="text-sm">
                Found: "{warning.matchedText}"
              </AlertTitle>
              <AlertDescription className="text-xs mt-1">
                {warning.suggestion}
              </AlertDescription>
            </Alert>
          ))}
        </div>

        <div className="flex items-start space-x-3 pt-4 border-t">
          <Checkbox
            id="compliance-confirm"
            checked={confirmed}
            onCheckedChange={(checked) => setConfirmed(checked === true)}
          />
          <Label
            htmlFor="compliance-confirm"
            className="text-sm leading-relaxed cursor-pointer"
          >
            I have reviewed these warnings and confirm that the content is compliant 
            with medical advertising regulations. I take responsibility for this post.
          </Label>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Cancel & Edit
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!confirmed || isLoading}
            variant="destructive"
          >
            {isLoading ? "Approving..." : "Approve Anyway"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
