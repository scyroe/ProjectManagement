import { cn } from 'cn';
import { useStrings } from '@/lib/i18n';
import { Label } from './label';

function FieldLabel({
  children,
  className,
  isComplete = false,
  isRequired = false,
  ...props
}) {
  const t = useStrings().common.fieldIndicators;

  return (
    <Label className={cn('w-full gap-1.5', className)} {...props}>
      <span className="min-w-0">
        {children}
        {isRequired && (
          <span
            aria-hidden="true"
            className={cn(
              'ml-1 font-semibold',
              isComplete ? 'text-success' : 'text-destructive',
            )}
          >
            *
          </span>
        )}
      </span>
      {isRequired && (
        <span className="sr-only">
          {t.required} {isComplete ? t.complete : t.incomplete}
        </span>
      )}
    </Label>
  );
}

export default FieldLabel;
