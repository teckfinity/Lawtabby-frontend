import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tag, X, ChevronDown, Check } from 'lucide-react';
import { validateCoupon } from '@/api/billing';
import { cn } from '@/lib/utils';

interface PromoCodeFieldProps {
  /** Optional plan slug when validating before checkout */
  planSlug?: string;
  value: string;
  onChange: (code: string) => void;
  onApplied?: (code: string, message: string) => void;
  onClear?: () => void;
  className?: string;
  compact?: boolean;
}

/**
 * Collapsible promo code — hidden until user clicks "Have a promo code?"
 */
export function PromoCodeField({
  planSlug,
  value,
  onChange,
  onApplied,
  onClear,
  className,
  compact = false,
}: PromoCodeFieldProps) {
  const [expanded, setExpanded] = useState(false);
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState('');
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [appliedCode, setAppliedCode] = useState('');

  const handleApply = async () => {
    const code = value.trim();
    if (!code) return;

    setApplying(true);
    setMessage('');
    try {
      const result = await validateCoupon(code, planSlug);
      setIsValid(true);
      setAppliedCode(result.code || code.toUpperCase());
      setMessage(result.message || 'Promo code applied.');
      onApplied?.(result.code || code.toUpperCase(), result.message || '');
    } catch (err: unknown) {
      setIsValid(false);
      setAppliedCode('');
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Invalid promo code';
      setMessage(msg);
    } finally {
      setApplying(false);
    }
  };

  const handleClear = () => {
    onChange('');
    setAppliedCode('');
    setMessage('');
    setIsValid(null);
    setExpanded(false);
    onClear?.();
  };

  if (appliedCode && isValid) {
    return (
      <div className={cn('flex flex-col items-center gap-1', className)}>
        <div className="inline-flex items-center gap-2 rounded-full border border-green-600/30 bg-green-50 dark:bg-green-950/30 px-3 py-1.5 text-sm text-green-700 dark:text-green-400">
          <Check className="h-3.5 w-3.5" />
          <span className="font-medium">{appliedCode}</span>
          <span className="text-green-600/80 dark:text-green-400/80">— {message}</span>
          <button
            type="button"
            onClick={handleClear}
            className="ml-1 rounded-full p-0.5 hover:bg-green-200/50 dark:hover:bg-green-900/50"
            aria-label="Remove promo code"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  if (!expanded) {
    return (
      <div className={cn('flex justify-center', className)}>
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
        >
          Have a promo code?
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className={cn('max-w-md mx-auto space-y-2', className)}>
      <div className="flex gap-2">
        <Input
          placeholder="Enter promo code"
          value={value}
          autoFocus
          onChange={(e) => {
            onChange(e.target.value.toUpperCase());
            setIsValid(null);
            setMessage('');
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleApply()}
          className={compact ? 'h-9 text-sm' : undefined}
        />
        <Button
          variant="outline"
          onClick={handleApply}
          disabled={applying || !value.trim()}
          className={cn('shrink-0 gap-1', compact && 'h-9 px-3 text-sm')}
        >
          <Tag className="h-3.5 w-3.5" />
          {applying ? '…' : 'Apply'}
        </Button>
      </div>
      {message && (
        <p className={cn('text-center text-sm', isValid ? 'text-green-600' : 'text-destructive')}>
          {message}
        </p>
      )}
      <button
        type="button"
        onClick={() => {
          setExpanded(false);
          onChange('');
          setMessage('');
        }}
        className="block w-full text-center text-xs text-muted-foreground hover:text-foreground"
      >
        Cancel
      </button>
    </div>
  );
}

export default PromoCodeField;
