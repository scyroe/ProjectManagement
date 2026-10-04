import FieldLabel from '@/components/ui/field-label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

function TaskMoreOptions({ form, onFieldChange, t }) {
  return (
    <details className="rounded-lg border p-3">
      <summary className="cursor-pointer text-sm font-medium">
        {t.moreOptions}
      </summary>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 sm:items-end">
        <div className="space-y-2">
          <FieldLabel htmlFor="new-task-estimate">{t.estimateLabel}</FieldLabel>
          <Input
            id="new-task-estimate"
            type="number"
            min="1"
            value={form.estimateMinutes}
            onChange={(event) =>
              onFieldChange('estimateMinutes', event.target.value)
            }
          />
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <FieldLabel htmlFor="new-task-repeat">{t.repeatLabel}</FieldLabel>
          <Select
            value={form.repeatUnit}
            onValueChange={(value) => onFieldChange('repeatUnit', value)}
          >
            <SelectTrigger id="new-task-repeat" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t.repeatNever}</SelectItem>
              <SelectItem value="day">{t.repeatDay}</SelectItem>
              <SelectItem value="week">{t.repeatWeek}</SelectItem>
              <SelectItem value="month">{t.repeatMonth}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {form.repeatUnit !== 'none' && (
          <>
            <div className="space-y-2">
              <FieldLabel
                htmlFor="new-task-repeat-interval"
                isRequired
                isComplete={
                  Number.isInteger(Number(form.repeatInterval)) &&
                  Number(form.repeatInterval) > 0
                }
              >
                {t.repeatEvery}
              </FieldLabel>
              <Input
                id="new-task-repeat-interval"
                type="number"
                min="1"
                value={form.repeatInterval}
                onChange={(event) =>
                  onFieldChange('repeatInterval', event.target.value)
                }
                required
              />
            </div>
            <div className="space-y-2">
              <FieldLabel htmlFor="new-task-repeat-until">
                {t.repeatUntil}
              </FieldLabel>
              <Input
                id="new-task-repeat-until"
                type="date"
                min={form.dueDate || undefined}
                value={form.repeatUntil}
                onChange={(event) =>
                  onFieldChange('repeatUntil', event.target.value)
                }
              />
            </div>
          </>
        )}
        <div className="space-y-2">
          <FieldLabel htmlFor="new-task-tags">{t.tagsLabel}</FieldLabel>
          <Input
            id="new-task-tags"
            value={form.tags}
            placeholder={t.tagsPlaceholder}
            onChange={(event) => onFieldChange('tags', event.target.value)}
          />
        </div>
      </div>
    </details>
  );
}

export default TaskMoreOptions;
