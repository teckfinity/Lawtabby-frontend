/** Friendly emojis used when a user has no profile picture uploaded. */
const PROFILE_EMOJIS = [
  "😊",
  "🙂",
  "😎",
  "⚖️",
  "📚",
  "✨",
  "🌟",
  "🦊",
  "🐻",
  "🦉",
  "💼",
  "🎯",
] as const;

/** True when the user has a real uploaded avatar URL (not empty / placeholder). */
export function hasUserAvatar(avatar?: string | null): boolean {
  if (!avatar?.trim()) return false;
  const lower = avatar.toLowerCase();
  if (lower.includes("placeholder.com") || lower.includes("via.placeholder")) {
    return false;
  }
  return true;
}

/** Stable emoji for a user based on name or email. */
export function getProfileEmoji(seed?: string | null): string {
  const s = (seed || "user").trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash + s.charCodeAt(i) * (i + 1)) % PROFILE_EMOJIS.length;
  }
  return PROFILE_EMOJIS[Math.abs(hash) % PROFILE_EMOJIS.length];
}

/** Append a cache-busting query param so browsers reload a replaced avatar. */
export function withAvatarCacheBust(url: string, version: number = Date.now()): string {
  if (!url?.trim() || url.startsWith("blob:")) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}v=${version}`;
}

export type UserProfileUpdateDetail = {
  name?: string;
  email?: string;
  avatar?: string | null;
};

export const USER_PROFILE_UPDATED_EVENT = "user-profile-updated";

export function dispatchUserProfileUpdated(detail: UserProfileUpdateDetail): void {
  window.dispatchEvent(new CustomEvent(USER_PROFILE_UPDATED_EVENT, { detail }));
}
