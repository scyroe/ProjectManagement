import { Input } from '@/components/ui/input';
import { rangePresets } from '@/lib/activity';
import { useStrings } from '@/lib/i18n';

const ActivityRangeFilter = ({
  custom,
  onCustomChange,
  onPresetChange,
  preset,
}) => {
  const t = useStrings().activity;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {rangePresets.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onPresetChange(value)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              preset === value
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.presets[value]}
          </button>
        ))}
      </div>
      {preset === 'custom' && (
        <div className="flex items-center gap-1.5">
          <Input
            type="date"
            className="h-8 w-auto"
            value={custom.from}
            onChange={(event) =>
              onCustomChange({ ...custom, from: event.target.value })
            }
          />
          <span className="text-xs text-muted-foreground">{t.rangeTo}</span>
          <Input
            type="date"
            className="h-8 w-auto"
            value={custom.to}
            onChange={(event) =>
              onCustomChange({ ...custom, to: event.target.value })
            }
          />
        </div>
      )}
    </div>
  );
};

export default ActivityRangeFilter;
