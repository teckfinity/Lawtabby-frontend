export type UpgradeRequiredDetail = {
  feature_key?: string;
  used?: number;
  limit?: number | null;
  message?: string;
  error?: string;
};

type UpgradeHandler = (detail: UpgradeRequiredDetail) => void;

let handler: UpgradeHandler | null = null;

export function setUpgradeRequiredHandler(next: UpgradeHandler | null) {
  handler = next;
}

export function emitUpgradeRequired(detail: UpgradeRequiredDetail) {
  handler?.(detail);
}
