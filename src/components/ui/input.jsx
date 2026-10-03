import { Input as InputPrimitive } from '@base-ui/react/input';
import { cn } from 'cn';
import { useRef } from 'react';
import { getFieldIcon } from '@/components/ui/field-icon';
import { useStrings } from '@/lib/i18n';

function Input({ className, type, ...props }) {
  const wrapperRef = useRef(null);
  const strings = useStrings();
  const hasDatePicker = ['date', 'datetime-local', 'time'].includes(type);
  const Icon = getFieldIcon({
    id: props.id,
    name: props.name,
    placeholder: props.placeholder,
    type,
  });
  const handleOpenDatePicker = () => {
    const field = wrapperRef.current?.querySelector('input');
    if (!field) return;

    if (typeof field.showPicker === 'function') {
      field.showPicker();
      return;
    }

    field.focus();
    field.click();
  };
  const input = (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        'h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40',
        className,
        props['data-slot'] === 'input-group-control' ? undefined : 'pl-11',
      )}
      {...props}
    />
  );

  if (props['data-slot'] === 'input-group-control') return input;

  return (
    <span
      ref={wrapperRef}
      className={cn(
        'group/input-field relative inline-flex min-w-0',
        className?.includes('w-auto') ? 'w-fit' : 'w-full',
        className?.includes('flex-1') && 'flex-1',
      )}
    >
      <span className="pointer-events-none absolute inset-y-0 left-0 z-10 flex w-9 items-center justify-center rounded-l-lg border-r bg-muted/70 text-muted-foreground group-focus-within/input-field:border-ring">
        {hasDatePicker ? (
          <button
            type="button"
            aria-label={strings.common.openDatePicker}
            className="pointer-events-auto flex size-full cursor-pointer items-center justify-center rounded-l-lg outline-none transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
            onClick={handleOpenDatePicker}
          >
            <Icon aria-hidden="true" className="size-4" />
          </button>
        ) : (
          <Icon aria-hidden="true" className="size-4" />
        )}
      </span>
      {input}
    </span>
  );
}

export { Input };
