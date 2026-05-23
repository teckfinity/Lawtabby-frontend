import { cn } from "@/lib/utils";

/**
 * Neutral “standard” OAuth row — white fill, dark readable label.
 * Uses !text-* so label stays dark inside `.dark` + `text-card-foreground` ancestors
 * (Tailwind preflight sets `button { color: inherit }`, which would otherwise pull near-white).
 */
export const oauthStandardButtonClass = cn(
  /* Left-aligned icon + label reads cleaner than a centered “floating” pair */
  "inline-flex h-11 w-full items-center justify-start gap-2.5 rounded-md border border-neutral-200 bg-white pl-4 pr-4",
  "font-body text-sm font-semibold !text-neutral-900",
  "!bg-white shadow-none transition-colors",
  "hover:!bg-neutral-50 hover:border-neutral-300",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#161d2b]",
  "disabled:pointer-events-none disabled:opacity-50",
);

/** Fixed-width column so labels line up across Google / Apple / Microsoft */
export const oauthIconColumnClass =
  "flex h-[22px] w-7 shrink-0 items-center justify-center";

/** Inner label span — extra guarantee vs inherited card foreground */
export const oauthStandardLabelClass = "!text-neutral-900";
