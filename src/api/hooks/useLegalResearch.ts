/**
 * api/hooks/useLegalResearch.ts
 * ──────────────────────────────
 * React Query hooks for Legal Research AI.
 *
 * Legal research is a POST/mutation (user triggers it on demand).
 * Results are not cached server-side per-query, so we keep them
 * in local component state after the mutation resolves — exactly
 * how the existing page works, but now with toast + error handling
 * centralised here.
 */
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  sendLegalResearch,
  type LegalResearchFilters,
  type LegalResearchResponse,
} from "@/api/ai-features/legal-research";

export function useLegalResearch() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      question,
      filters,
    }: {
      question: string;
      filters?: LegalResearchFilters;
    }): Promise<LegalResearchResponse> =>
      sendLegalResearch(question, filters).then((r) => r.data),

    onError: () => {
      toast({
        title: "Research failed",
        description: "Unable to process your query. Please try again.",
        variant: "destructive",
      });
    },
  });
}
