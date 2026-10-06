import { Check, ChevronsUpDown } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/reui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { getFieldIcon } from '@/components/ui/field-icon';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { VirtualList } from '@/components/ui/virtual-list';
import { useStrings } from '@/lib/i18n';

const VirtualSelect = ({
  ariaLabel,
  disabled = false,
  emptyLabel,
  id,
  multiple = false,
  onChange,
  options,
  placeholder,
  required = false,
  searchLabel,
  size = 'default',
  triggerClassName = 'w-full',
  value,
  values = [],
}) => {
  const Icon = getFieldIcon({ id });
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const strings = useStrings();
  const selectedOption = useMemo(
    () => (multiple ? null : options.find((option) => option.value === value)),
    [multiple, options, value],
  );
  const selectedOptions = useMemo(
    () =>
      multiple ? options.filter((option) => values.includes(option.value)) : [],
    [multiple, options, values],
  );
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredOptions = useMemo(
    () =>
      normalizedQuery
        ? options.filter((option) =>
            option.label.toLocaleLowerCase().includes(normalizedQuery),
          )
        : options,
    [normalizedQuery, options],
  );

  const handleOpenChange = (nextOpen) => {
    setOpen(nextOpen);
    if (!nextOpen) setQuery('');
  };

  const handleSelect = (optionValue) => {
    if (multiple) {
      onChange(
        values.includes(optionValue)
          ? values.filter((value) => value !== optionValue)
          : [...values, optionValue],
      );
      return;
    }

    onChange(optionValue);
    handleOpenChange(false);
  };

  return (
    <div className={triggerClassName}>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger
          render={
            <Button
              id={id}
              type="button"
              variant="outline"
              size={size}
              aria-label={ariaLabel}
              aria-expanded={open}
              aria-required={required || undefined}
              disabled={disabled}
              className={`group/virtual-select w-full justify-between font-normal ${multiple ? 'h-auto min-h-9' : ''} ${triggerClassName}`}
            >
              <span className="-ml-2.5 flex w-9 shrink-0 items-center justify-center self-stretch rounded-l-lg border-r bg-muted/70 text-muted-foreground group-focus-visible/virtual-select:border-ring">
                <Icon aria-hidden="true" className="size-4" />
              </span>
              <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
                {multiple ? (
                  selectedOptions.length ? (
                    selectedOptions.map((option) => (
                      <Badge key={option.value} variant="secondary" size="sm">
                        {option.label}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground">{placeholder}</span>
                  )
                ) : (
                  (selectedOption?.label ?? placeholder)
                )}
              </span>
              <span className="-mr-2.5 flex w-8 shrink-0 items-center justify-center self-stretch rounded-r-lg border-l bg-muted/70 text-muted-foreground group-focus-visible/virtual-select:border-ring">
                <ChevronsUpDown className="size-4" aria-hidden="true" />
              </span>
            </Button>
          }
        />
        <PopoverContent
          align="start"
          className="w-(--anchor-width) min-w-48 p-2"
        >
          <Input
            type="search"
            aria-label={searchLabel}
            placeholder={searchLabel}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {filteredOptions.length ? (
            <VirtualList
              className="max-h-64"
              estimateSize={36}
              getItemKey={(option) => option.value}
              items={filteredOptions}
              renderItem={(option) => (
                <button
                  type="button"
                  aria-pressed={
                    multiple
                      ? values.includes(option.value)
                      : option.value === value
                  }
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                  onClick={() => handleSelect(option.value)}
                >
                  {multiple && (
                    <Checkbox checked={values.includes(option.value)} />
                  )}
                  <span className="min-w-0 flex-1 truncate">
                    {option.label}
                  </span>
                  {!multiple && option.value === value && (
                    <Check className="size-3.5 shrink-0" />
                  )}
                </button>
              )}
            />
          ) : (
            <p
              className="px-2 py-1.5 text-sm text-muted-foreground"
              role="status"
            >
              {emptyLabel ?? strings.layout.searchDialog.noResults}
            </p>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default VirtualSelect;
