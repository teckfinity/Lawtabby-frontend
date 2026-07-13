/** LexOrbit AI Chat research modes — maps to Conversation.research_mode on the backend. */
export type ResearchMode = "standard" | "deep_research";

export const RESEARCH_MODES = {
  standard: {
    id: "standard" as const,
    label: "Database research",
    shortLabel: "Database",
    description: "Search your indexed opinions and cite records from your LexOrbit library only.",
    placeholder: "Ask about cases or judges in your library...",
  },
  deep_research: {
    id: "deep_research" as const,
    label: "Deep research",
    shortLabel: "Deep research",
    description:
      "Same library search, plus curated links to CourtListener, Cornell LII, Google Scholar, and other archives.",
    placeholder: "What do you want to research?",
  },
} as const;

export function isDeepResearch(mode: ResearchMode): boolean {
  return mode === "deep_research";
}

export function researchModeFromApi(value?: string | null): ResearchMode {
  return value === "deep_research" ? "deep_research" : "standard";
}
