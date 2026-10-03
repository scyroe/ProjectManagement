import { Check, ChevronsUpDown } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
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
  id,
  onChange,
  options,
  placeholder,
  searchLabel,
  triggerClassName = 'w-full',
  value,
}) => {
  const Icon = getFieldIcon({ id });
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const strings = useStrings();
  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
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
    onChange(optionValue);
    handleOpenChange(false);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            aria-label={ariaLabel}
            aria-expanded={open}
            className={`group/virtual-select w-full justify-between font-normal ${triggerClassName}`}
          >
            <span className="-my-2 -ml-2.5 flex w-9 shrink-0 items-center justify-center self-stretch rounded-l-lg border-r bg-muted/70 text-muted-foreground group-focus-visible/virtual-select:border-ring">
              <Icon aria-hidden="true" className="size-4" />
            </span>
            <span className="truncate">
              {selectedOption?.label ?? placeholder}
            </span>
            <span className="-my-2 -mr-2.5 flex w-8 shrink-0 items-center justify-center self-stretch rounded-r-lg border-l bg-muted/70 text-muted-foreground group-focus-visible/virtual-select:border-ring">
              <ChevronsUpDown className="size-4" aria-hidden="true" />
            </span>
          </Button>
        }
      />
      <PopoverContent align="start" className="w-(--anchor-width) p-2">
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
                aria-pressed={option.value === value}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                onClick={() => handleSelect(option.value)}
              >
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
                {option.value === value && (
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
            {strings.layout.searchDialog.noResults}
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default VirtualSelect;
