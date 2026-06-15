/** Copy for chat empty state and footers. */
export const CHAT_WELCOME = {
  title: "What would you like to research?",
  subtitle:
    "Ask about cases, judges, or legal issues. LexOrbit searches your indexed opinions and cites what it finds.",
  suggestions: [
    "Tell me about Judge Lynn S. Adelman",
    "Civil rights employment cases in federal district courts",
    "Contract action precedents in my library",
    "Supreme Court contract or civil rights opinions",
  ],
  disclaimer:
    "LexOrbit provides legal research assistance only. It is not legal advice and is not a substitute for counsel from a licensed attorney.",
} as const;

export function chatInputFooter(): string {
  return CHAT_WELCOME.disclaimer;
}
