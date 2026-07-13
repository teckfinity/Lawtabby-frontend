/**
 * Lightweight legal document preview (no markdown dependency).
 */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function inlineFormat(text: string): string {
  return escapeHtml(text).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

export function formatLegalDocumentHtml(content: string): string {
  const lines = content.split("\n");
  const parts: string[] = [];
  let inList = false;

  const closeList = () => {
    if (inList) {
      parts.push("</ul>");
      inList = false;
    }
  };

  const isLegalTitleLine = (line: string): boolean => {
    const t = line.trim();
    if (t.length < 10 || t.length > 120) return false;
    if (t.endsWith(",") || t.includes("[") || t.includes("]")) return false;
    if (/^(plaintiff|defendant)\b/i.test(t)) return false;
    const letters = t.replace(/[^A-Za-z]/g, "");
    if (letters.length < 6) return false;
    if (letters !== letters.toUpperCase()) return false;
    return /^(COMPLAINT|MOTION|MEMORANDUM|PETITION|NOTICE|DEMAND|ANSWER|BRIEF|ORDER|AGREEMENT|CONTRACT|STIPULATION|SUBPOENA|DECLARATION|AFFIDAVIT|SUMMONS|INDICTMENT|APPEAL|LEASE|DEED|LICENSE|SETTLEMENT|RELEASE|WILL|TRUST)\b/.test(
      t
    );
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      closeList();
      continue;
    }

    const headingMatch = trimmed.match(/^\*\*(.+?)\*\*:?\s*$/);
    if (headingMatch) {
      closeList();
      parts.push(
        `<h3 class="legal-doc-heading">${inlineFormat(headingMatch[1])}</h3>`
      );
      continue;
    }

    const subHeading = trimmed.match(/^#{1,3}\s+(.+)$/);
    if (subHeading) {
      closeList();
      parts.push(`<h3 class="legal-doc-heading">${inlineFormat(subHeading[1])}</h3>`);
      continue;
    }

    const romanSection = trimmed.match(/^([IVXLC]+)\.\s+(.+)$/);
    if (romanSection) {
      closeList();
      parts.push(
        `<h3 class="legal-doc-heading legal-doc-section">${inlineFormat(`${romanSection[1]}. ${romanSection[2]}`)}</h3>`
      );
      continue;
    }

    if (isLegalTitleLine(trimmed)) {
      closeList();
      parts.push(`<h2 class="legal-doc-heading legal-doc-title">${inlineFormat(trimmed)}</h2>`);
      continue;
    }

    const listMatch = trimmed.match(/^(\d+\.|[-*])\s+(.+)$/);
    if (listMatch) {
      if (!inList) {
        parts.push('<ul class="legal-doc-list">');
        inList = true;
      }
      parts.push(`<li>${inlineFormat(listMatch[2])}</li>`);
      continue;
    }

    closeList();
    parts.push(`<p class="legal-doc-paragraph">${inlineFormat(trimmed)}</p>`);
  }

  closeList();
  return parts.join("");
}

export function humanizeFieldName(field: string): string {
  return field
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export interface RagSourceDisplay {
  title: string;
  court?: string;
  date?: string;
  year?: string;
  url?: string;
  /** @deprecated internal IDs — prefer title + court */
  citation?: string;
}

export function formatRagSourceMeta(source: RagSourceDisplay): string {
  const parts = [source.court, source.year || source.date?.slice(0, 4)].filter(Boolean);
  return parts.join(" · ");
}
