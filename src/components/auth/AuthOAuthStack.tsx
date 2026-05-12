import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import {
  oauthStandardButtonClass,
  oauthStandardLabelClass,
  oauthIconColumnClass,
} from "@/components/auth/oauthStandardStyles";
import { AppleLogoSolid, MicrosoftLogoIcon } from "@/components/auth/OAuthBrandIcons";

type AuthOAuthStackProps = {
  googleSlot: ReactNode;
  isLoading: boolean;
  onApple: () => void;
  onMicrosoft: () => void;
};

/**
 * OAuth rows live in a light color-scheme island so native controls / UA styles
 * don’t inherit illegible contrast from the dark auth shell.
 */
export function AuthOAuthStack({ googleSlot, isLoading, onApple, onMicrosoft }: AuthOAuthStackProps) {
  return (
    <div className="flex flex-col gap-3.5 [color-scheme:light]">
      {googleSlot}

      <button type="button" disabled={isLoading} onClick={onApple} className={cn(oauthStandardButtonClass)}>
        <span className={oauthIconColumnClass} aria-hidden>
          <AppleLogoSolid />
        </span>
        <span className={oauthStandardLabelClass}>Continue with Apple</span>
      </button>

      <button type="button" disabled={isLoading} onClick={onMicrosoft} className={cn(oauthStandardButtonClass)}>
        <span className={oauthIconColumnClass} aria-hidden>
          <MicrosoftLogoIcon />
        </span>
        <span className={oauthStandardLabelClass}>Continue with Microsoft</span>
      </button>
    </div>
  );
}
