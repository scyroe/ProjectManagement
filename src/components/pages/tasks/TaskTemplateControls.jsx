import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FieldLabel from '@/components/ui/field-label';
import { Input } from '@/components/ui/input';
import VirtualSelect from '@/components/ui/virtual-select';

function TaskTemplateControls({
  applyTemplate,
  onSaveTemplate,
  savingTemplate,
  setTemplateName,
  t,
  templateName,
  templates,
}) {
  return (
    <div className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
      <div className="flex min-w-0 flex-col gap-2">
        <FieldLabel htmlFor="task-template">{t.templateLabel}</FieldLabel>
        <VirtualSelect
          id="task-template"
          ariaLabel={t.templateLabel}
          searchLabel={t.templateLabel}
          value=""
          onChange={applyTemplate}
          disabled={!templates.length}
          placeholder={t.selectTemplate}
          options={templates.map((template) => ({
            value: template.id,
            label: template.name,
          }))}
          triggerClassName="w-full"
        />
      </div>
      <div className="space-y-2">
        <FieldLabel htmlFor="task-template-name">{t.templateName}</FieldLabel>
        <Input
          id="task-template-name"
          value={templateName}
          onChange={(event) => setTemplateName(event.target.value)}
        />
      </div>
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label={savingTemplate ? t.savingTemplate : t.saveTemplate}
        title={savingTemplate ? t.savingTemplate : t.saveTemplate}
        disabled={savingTemplate}
        onClick={onSaveTemplate}
      >
        <Save aria-hidden="true" />
      </Button>
    </div>
  );
}

export default TaskTemplateControls;
