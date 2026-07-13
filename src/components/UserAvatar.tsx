import { cn } from "@/lib/utils";
import { getProfileEmoji, hasUserAvatar } from "@/utils/userAvatar";
import { useEffect, useState } from "react";

type UserAvatarProps = {
  src?: string | null;
  name?: string | null;
  email?: string | null;
  alt?: string;
  className?: string;
  emojiClassName?: string;
};

/**
 * Profile image or a deterministic emoji when the user has no avatar.
 */
export function UserAvatar({
  src,
  name,
  email,
  alt,
  className = "h-10 w-10",
  emojiClassName = "text-base",
}: UserAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [src]);

  const label = alt || name || "User";
  const emoji = getProfileEmoji(name || email);
  const showImage = hasUserAvatar(src) && !imageFailed;

  if (showImage) {
    return (
      <img
        key={src}
        src={src!}
        alt={label}
        className={cn("rounded-full object-cover shrink-0", className)}
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full bg-muted flex items-center justify-center shrink-0 select-none",
        className,
      )}
      role="img"
      aria-label={`${label} profile`}
    >
      <span className={cn("leading-none", emojiClassName)} aria-hidden>
        {emoji}
      </span>
    </div>
  );
}
