/**
 * api/hooks/useDocSummary.ts
 * ────────────────────────────
 * React Query mutation hook for Document Summarizer.
 */
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { sendLegalDocSummary, type SummarizeOptions } from "@/api/ai-features/doc-summary";

export function useDocSummary() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      document,
      text,
      options,
    }: {
      document?: File;
      text?: string;
      options?: SummarizeOptions;
    }) => sendLegalDocSummary(document, text, options).then((r) => r.data),

    onError: () => {
      toast({
        title: "Summarization failed",
        description: "Unable to process the document. Please try again.",
        variant: "destructive",
      });
    },
  });
}
