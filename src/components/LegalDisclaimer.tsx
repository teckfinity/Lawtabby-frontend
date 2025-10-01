import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function LegalDisclaimer() {
  return (
    <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
      <AlertDescription className="text-sm text-amber-900 dark:text-amber-200">
        <strong>Important Legal Disclaimer:</strong> This tool provides legal information from U.S. sources (case law, statutes, regulations). It is not legal advice and does not create an attorney-client relationship. Always consult a qualified attorney for specific legal matters.
      </AlertDescription>
    </Alert>
  );
}
