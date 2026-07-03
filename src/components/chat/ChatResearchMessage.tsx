import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { ChatStructuredResponse } from "@/types/chatResearch";
import { cn } from "@/lib/utils";

type Props = {
  structured?: ChatStructuredResponse | null;
  /** Legacy flat sources when structured is missing */
  fallbackSources?: Array<{ title?: string; court?: string; date?: string; url?: string; influence_score?: number }>;
  externalReferences?: Array<{ title?: string; url?: string; description?: string }>;
  showExternalLinks?: boolean;
};

export function ChatResearchMessage({
  structured,
  fallbackSources = [],
  externalReferences = [],
  showExternalLinks = false,
}: Props) {
  const data = structured || {};
  const cases = (data.cases?.length ? data.cases : fallbackSources) || [];
  const judgeInsights = data.judge_insights || [];
  const prediction = data.prediction_data;
  const [sourcesOpen, setSourcesOpen] = useState(false);

  return (
    <div className="space-y-3">
      {data.answer && (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{data.answer}</p>
      )}

      {judgeInsights.length > 0 && (
        <section className="rounded-md border border-border/60 bg-muted/30 p-3 space-y-2">
          <p className="text-xs font-semibold text-foreground">Judge insights</p>
          {judgeInsights.map((j, idx) => (
            <div key={idx} className="text-xs space-y-1">
              <p className="font-medium">{j.name}</p>
              <p className="text-muted-foreground">
                {[
                  j.grant_rate != null ? `Grant rate: ${j.grant_rate}%` : null,
                  j.avg_decision_days != null ? `Avg. decision: ${j.avg_decision_days} days` : null,
                  j.court ? `Court: ${j.court}` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {j.practice_areas && j.practice_areas.length > 0 && (
                <p className="text-muted-foreground">
                  Practice areas: {j.practice_areas.join(", ")}
                </p>
              )}
            </div>
          ))}
        </section>
      )}

      {prediction?.win_probability != null && (
        <section className="rounded-md border border-border/60 bg-muted/30 p-3 space-y-2">
          <p className="text-xs font-semibold">Outcome estimate</p>
          <p className="text-sm font-medium">Win probability: {prediction.win_probability}%</p>
          {prediction.factors_increasing && prediction.factors_increasing.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Factors increasing success</p>
              <ul className="list-disc list-inside text-xs space-y-0.5">
                {prediction.factors_increasing.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
          )}
          {prediction.risk_factors && prediction.risk_factors.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Risk factors</p>
              <ul className="list-disc list-inside text-xs space-y-0.5">
                {prediction.risk_factors.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {cases.length > 0 && (
        <Collapsible open={sourcesOpen} onOpenChange={setSourcesOpen}>
          <CollapsibleTrigger className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
            <ChevronDown
              className={cn("h-3.5 w-3.5 transition-transform", sourcesOpen && "rotate-180")}
            />
            Sources ({cases.length})
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <ol className="space-y-2 list-none">
              {cases.map((c, idx) => (
                <li key={idx} className="text-xs rounded-md border border-border/50 p-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium">
                      [{idx + 1}] {c.title || "Unknown case"}
                    </span>
                    {c.influence_score != null && c.influence_score > 0 && (
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        Influence {c.influence_score}
                      </Badge>
                    )}
                  </div>
                  {(c.court || c.date) && (
                    <p className="text-muted-foreground mt-1">
                      {[c.court, c.date?.slice?.(0, 10) || c.date].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  {c.excerpt && (
                    <p className="text-muted-foreground mt-1 line-clamp-3">{c.excerpt}</p>
                  )}
                </li>
              ))}
            </ol>
          </CollapsibleContent>
        </Collapsible>
      )}

      {data.authorities && data.authorities.length > 0 && !cases.length && (
        <section>
          <p className="text-xs font-semibold text-muted-foreground mb-1">Sources</p>
          <ul className="list-decimal list-inside text-xs space-y-1">
            {data.authorities.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </section>
      )}

      {showExternalLinks && externalReferences.length > 0 && (
        <section className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground">External research</p>
          <ul className="text-xs space-y-1">
            {externalReferences.map((ref, idx) => (
              <li key={idx}>
                <a
                  href={ref.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-legal-primary hover:underline"
                >
                  {ref.title}
                </a>
                {ref.description && (
                  <span className="text-muted-foreground"> · {ref.description}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
