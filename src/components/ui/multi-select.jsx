import { Check, ChevronsUpDown } from 'lucide-react';
import { useMemo } from 'react';
import { Badge } from '@/components/reui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { VirtualList } from '@/components/ui/virtual-list';

const MultiSelect = ({
  disabled,
  emptyLabel,
  id,
  onChange,
  options,
  placeholder,
  required = false,
  values,
}) => {
  const selectedOptions = useMemo(
    () => options.filter((option) => values.includes(option.value)),
    [options, values],
  );

  const toggleValue = (value) => {
    onChange(
      values.includes(value)
        ? values.filter((current) => current !== value)
        : [...values, value],
    );
  };

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            aria-required={required || undefined}
            disabled={disabled}
            className="h-auto min-h-9 w-full justify-between font-normal"
          >
            <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
              {selectedOptions.length ? (
                selectedOptions.map((option) => (
                  <Badge key={option.value} variant="secondary" size="sm">
                    {option.label}
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
            </span>
            <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
          </Button>
        }
      />
      <PopoverContent align="start" className="w-(--anchor-width) p-1">
        {options.length ? (
          <VirtualList
            className="max-h-64"
            estimateSize={36}
            getItemKey={(option) => option.value}
            items={options}
            renderItem={(option) => {
              const checked = values.includes(option.value);
              return (
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                  onClick={() => toggleValue(option.value)}
                >
                  <Checkbox checked={checked} />
                  <span className="min-w-0 flex-1 truncate">
                    {option.label}
                  </span>
                  {checked && <Check className="size-3.5 shrink-0" />}
                </button>
              );
            }}
          />
        ) : (
          <p className="px-2 py-1.5 text-sm text-muted-foreground">
            {emptyLabel}
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default MultiSelect;
