import { useQueryClient } from '@tanstack/react-query';
import { Download, Upload } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useStrings } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

const headers = [
  'title',
  'description',
  'project_code',
  'priority',
  'state',
  'due_date',
  'estimate_minutes',
  'tags',
  'recurrence_interval',
  'recurrence_unit',
  'recurrence_until',
];

const csvCell = (value) => {
  let text = String(value ?? '');
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
};

const parseCsv = (source) => {
  const text = source.replace(/^\uFEFF/, '');
  const rows = [];
  let row = [];
  let value = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        value += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        value += character;
      }
    } else if (character === '"' && value.length === 0) {
      quoted = true;
    } else if (character === ',') {
      row.push(value);
      value = '';
    } else if (character === '\n' || character === '\r') {
      if (character === '\r' && text[index + 1] === '\n') index += 1;
      row.push(value);
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
      value = '';
    } else {
      value += character;
    }
  }

  if (quoted) throw new Error('CSV contains an unterminated quoted field.');
  if (row.length || value.length) {
    row.push(value);
    if (row.some((cell) => cell.trim())) rows.push(row);
  }
  return rows;
};

const WorkspaceDataTools = ({ tasks, userId }) => {
  const strings = useStrings();
  const t = strings.settingsDialog.dataTools;
  const queryClient = useQueryClient();
  const [importing, setImporting] = useState(false);

  const handleExport = () => {
    const rows = tasks.map((task) => [
      task.title,
      task.description,
      task.project?.code,
      task.priority,
      task.state?.name,
      task.due_date,
      task.estimate_minutes,
      JSON.stringify(task.tags ?? []),
      task.recurrence_interval,
      task.recurrence_unit,
      task.recurrence_until,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map(csvCell).join(','))
      .join('\r\n');
    const url = URL.createObjectURL(
      new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }),
    );
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'workspace-tasks.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setImporting(true);

    try {
      const rows = parseCsv(await file.text());
      if (rows.length < 2) throw new Error(t.emptyFile);
      const columns = rows[0].map((column) => column.trim().toLowerCase());
      if (
        columns.length !== headers.length ||
        headers.some((header, index) => columns[index] !== header)
      ) {
        throw new Error(t.invalidHeaders);
      }

      const [projectsResponse, statesResponse] = await Promise.all([
        supabase.from('projects').select('id,code'),
        supabase
          .from('task_states')
          .select('id,name,is_completed')
          .order('sort_order'),
      ]);
      if (projectsResponse.error)
        throw new Error(projectsResponse.error.message);
      if (statesResponse.error) throw new Error(statesResponse.error.message);
      const projectsByCode = new Map(
        (projectsResponse.data ?? []).map((project) => [
          project.code.toLowerCase(),
          project,
        ]),
      );
      const statesByName = new Map(
        (statesResponse.data ?? []).map((state) => [
          state.name.toLowerCase(),
          state,
        ]),
      );
      const fallbackState = (statesResponse.data ?? []).find(
        (state) => !state.is_completed,
      );
      if (!fallbackState) throw new Error(t.noTaskState);

      const imported = rows.slice(1).map((cells, index) => {
        if (cells.length !== headers.length) {
          throw new Error(t.invalidRow.replace('{row}', String(index + 2)));
        }
        const row = Object.fromEntries(
          headers.map((header, columnIndex) => [
            header,
            cells[columnIndex].trim(),
          ]),
        );
        const project = projectsByCode.get(row.project_code.toLowerCase());
        if (!row.title || !project) {
          throw new Error(t.invalidRow.replace('{row}', String(index + 2)));
        }
        if (
          row.priority &&
          !['low', 'medium', 'high', 'urgent'].includes(row.priority)
        ) {
          throw new Error(t.invalidRow.replace('{row}', String(index + 2)));
        }
        const isIsoDate = (value) => {
          if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
          const parsed = new Date(`${value}T00:00:00.000Z`);
          return (
            Number.isFinite(parsed.getTime()) &&
            parsed.toISOString().slice(0, 10) === value
          );
        };
        if (
          (row.due_date && !isIsoDate(row.due_date)) ||
          (row.recurrence_until && !isIsoDate(row.recurrence_until)) ||
          (row.recurrence_until &&
            row.due_date &&
            row.recurrence_until < row.due_date)
        ) {
          throw new Error(t.invalidRow.replace('{row}', String(index + 2)));
        }
        const estimate = row.estimate_minutes
          ? Number(row.estimate_minutes)
          : null;
        const recurrenceInterval = row.recurrence_interval
          ? Number(row.recurrence_interval)
          : null;
        if (
          (estimate !== null &&
            (!Number.isInteger(estimate) || estimate < 1)) ||
          (recurrenceInterval !== null &&
            (!Number.isInteger(recurrenceInterval) || recurrenceInterval < 1))
        ) {
          throw new Error(t.invalidRow.replace('{row}', String(index + 2)));
        }
        if (
          (row.recurrence_interval &&
            !['day', 'week', 'month'].includes(row.recurrence_unit)) ||
          (row.recurrence_unit && !row.recurrence_interval) ||
          (row.recurrence_until && !row.recurrence_interval) ||
          (row.recurrence_interval && !row.due_date)
        ) {
          throw new Error(t.invalidRow.replace('{row}', String(index + 2)));
        }

        const state =
          statesByName.get(row.state.toLowerCase()) ?? fallbackState;
        if (row.state && !statesByName.has(row.state.toLowerCase())) {
          throw new Error(t.invalidRow.replace('{row}', String(index + 2)));
        }
        let tags = [];
        if (row.tags) {
          try {
            const parsedTags = JSON.parse(row.tags);
            if (
              !Array.isArray(parsedTags) ||
              parsedTags.some((tag) => typeof tag !== 'string')
            ) {
              throw new Error();
            }
            tags = parsedTags;
          } catch {
            throw new Error(t.invalidRow.replace('{row}', String(index + 2)));
          }
        }
        return {
          project_id: project.id,
          state_id: state.id,
          assigned_to: userId,
          title: row.title,
          description: row.description || null,
          priority: row.priority || 'medium',
          due_date: row.due_date || null,
          estimate_minutes: estimate,
          tags,
          recurrence_interval: recurrenceInterval,
          recurrence_unit: row.recurrence_unit || null,
          recurrence_until: row.recurrence_until || null,
        };
      });

      const { data, error } = await supabase
        .from('tasks')
        .insert(imported)
        .select('id,project_id');
      if (error) throw new Error(error.message);
      const { error: linkError } = await supabase.from('task_projects').insert(
        data.map((task) => ({
          task_id: task.id,
          project_id: task.project_id,
        })),
      );
      if (linkError) {
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        throw new Error(
          `${t.tasksImportedButLinksFailed} ${linkError.message}`,
        );
      }
      toast.success(
        t.importSuccess.replace('{count}', String(imported.length)),
      );
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    } catch (error) {
      toast.error(t.importError, { description: error.message });
    } finally {
      setImporting(false);
    }
  };

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold">{t.title}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{t.description}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={handleExport}>
          <Download />
          {t.exportTasks}
        </Button>
        <Label
          className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm font-medium hover:bg-muted"
          htmlFor="workspace-task-import"
        >
          <Upload className="size-4" />
          {importing ? t.importing : t.importTasks}
          <input
            id="workspace-task-import"
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            disabled={importing}
            onChange={handleImport}
          />
        </Label>
      </div>
    </section>
  );
};

export default WorkspaceDataTools;
