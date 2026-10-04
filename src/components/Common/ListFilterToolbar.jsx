import { Plus, Search, X } from 'lucide-react';
import { useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

function ListFilterToolbar({
  addLabel,
  closeSearchLabel,
  onAdd,
  onQueryChange,
  onPrimaryChange,
  onSecondaryChange,
  primaryLabel,
  primaryOptions,
  primaryValue,
  query,
  queryPlaceholder,
  searchLabel,
  secondaryLabel,
  secondaryOptions,
  secondaryValue,
}) {
  const [searchOpen, setSearchOpen] = useState(Boolean(query));
  const id = useId();
  const primaryId = `${id}-primary-filter`;
  const secondaryId = `${id}-secondary-filter`;
  const searchInputId = `${id}-search-filter`;
  const primaryLabelValue =
    primaryOptions.find((option) => option.value === primaryValue)?.label ??
    primaryValue;
  const secondaryLabelValue =
    secondaryOptions?.find((option) => option.value === secondaryValue)
      ?.label ?? secondaryValue;

  const handleSearchToggle = () => {
    if (searchOpen) {
      setSearchOpen(false);
      onQueryChange('');
      return;
    }
    setSearchOpen(true);
  };

  return (
    <div className="flex min-w-0 items-end gap-2">
      <div className="relative flex min-w-0 flex-1 items-end gap-2">
        <div
          aria-hidden={searchOpen}
          className={`flex min-w-0 flex-1 items-end gap-2 ${
            searchOpen ? 'invisible' : ''
          }`}
          inert={searchOpen}
        >
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <label
              htmlFor={primaryId}
              className="truncate text-xs font-medium text-muted-foreground"
            >
              {primaryLabel}
            </label>
            <Select value={primaryValue} onValueChange={onPrimaryChange}>
              <SelectTrigger
                aria-label={primaryLabel}
                className="min-w-0 w-full"
                id={primaryId}
              >
                <SelectValue>{primaryLabelValue}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {primaryOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {secondaryOptions?.length > 0 && (
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <label
                htmlFor={secondaryId}
                className="truncate text-xs font-medium text-muted-foreground"
              >
                {secondaryLabel}
              </label>
              <Select value={secondaryValue} onValueChange={onSecondaryChange}>
                <SelectTrigger
                  aria-label={secondaryLabel}
                  className="min-w-0 w-full"
                  id={secondaryId}
                >
                  <SelectValue>{secondaryLabelValue}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {secondaryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        {searchOpen && (
          <>
            <label
              htmlFor={searchInputId}
              className="absolute inset-x-0 top-0 truncate text-xs font-medium text-muted-foreground"
            >
              {searchLabel}
            </label>
            <InputGroup className="absolute inset-x-0 bottom-0 min-w-0 bg-background">
              <InputGroupAddon align="inline-start">
                <Search />
              </InputGroupAddon>
              <InputGroupInput
                id={searchInputId}
                autoFocus
                placeholder={queryPlaceholder}
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
              />
            </InputGroup>
          </>
        )}
      </div>
      <Button
        type="button"
        size="icon"
        variant="outline"
        className={`size-8 shrink-0 ${
          searchOpen
            ? 'border-destructive/60 text-destructive hover:bg-destructive/10 hover:text-destructive'
            : ''
        }`}
        aria-label={searchOpen ? closeSearchLabel : searchLabel}
        aria-expanded={searchOpen}
        title={searchOpen ? closeSearchLabel : searchLabel}
        onClick={handleSearchToggle}
      >
        {searchOpen ? <X /> : <Search />}
      </Button>
      <Button
        type="button"
        size="icon"
        className="size-8 shrink-0"
        aria-label={addLabel}
        title={addLabel}
        onClick={onAdd}
      >
        <Plus />
      </Button>
    </div>
  );
}

export default ListFilterToolbar;
