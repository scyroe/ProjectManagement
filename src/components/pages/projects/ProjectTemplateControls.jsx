import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { useStrings } from '@/lib/i18n';

const dayInMs = 24 * 60 * 60 * 1000;

function ProjectTemplateControls({ project, tasks, workspaceId }) {
  const t = useStrings().projectTemplates;
  const queryClient = useQueryClient();
  const [mode, setMode] = useState(null);
  const [name, setName] = useState('');
  const [templateId, setTemplateId] = useState('');
  const templatesQuery = useQuery({
    queryKey: ['project-templates', workspaceId],
    enabled: Boolean(workspaceId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_templates')
        .select('id,name,template')
        .order('name');
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
  const statesQuery = useQuery({
    queryKey: ['workspace-task-states', workspaceId],
    enabled: Boolean(workspaceId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_states')
        .select('id,is_completed')
        .eq('is_completed', false)
        .order('sort_order')
        .limit(1)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const handleSave = async (event) => {
    event.preventDefault();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      toast.error(t.saveError, { description: authError?.message });
      return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const template = {
      projectDescription: project.description ?? '',
      tasks: tasks.map((task) => ({
        title: task.title,
        description: task.description ?? '',
        priority: task.priority,
        estimate_minutes: task.estimate_minutes,
        tags: task.tags ?? [],
        due_offset_days: task.due_date
          ? Math.round(
              (new Date(`${task.due_date}T00:00:00`).getTime() - today.getTime()) /
                dayInMs,
            )
          : null,
      })),
    };
    const { error } = await supabase.from('project_templates').insert({
      workspace_id: workspaceId,
      name: name.trim(),
      created_by: authData.user.id,
      template,
    });
    if (error) {
      toast.error(t.saveError, { description: error.message });
      return;
    }
    toast.success(t.saved);
    setMode(null);
    setName('');
    await queryClient.invalidateQueries({
      queryKey: ['project-templates', workspaceId],
    });
  };

  const handleApply = async (event) => {
    event.preventDefault();
    const template = templatesQuery.data?.find((item) => item.id === templateId);
    if (!template || !Array.isArray(template.template?.tasks)) return;
    if (!statesQuery.data?.id) {
      toast.error(t.noTaskState);
      return;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const rows = template.template.tasks.map((task) => ({
      project_id: project.id,
      state_id: statesQuery.data.id,
      title: task.title,
      description: task.description || null,
      priority: task.priority,
      estimate_minutes: task.estimate_minutes,
      tags: Array.isArray(task.tags) ? task.tags : [],
      due_date:
        Number.isInteger(task.due_offset_days)
          ? new Date(
              today.getTime() + task.due_offset_days * dayInMs,
            )
              .toISOString()
              .slice(0, 10)
          : null,
    }));
    if (!rows.length) {
      toast.error(t.emptyTemplate);
      return;
    }
    const { error } = await supabase.from('tasks').insert(rows);
    if (error) {
      toast.error(t.applyError, { description: error.message });
      return;
    }
    toast.success(t.applied);
    setMode(null);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['tasks', workspaceId] }),
      queryClient.invalidateQueries({ queryKey: ['clients', workspaceId] }),
    ]);
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" onClick={() => setMode('save')}>
          {t.saveTemplate}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setMode('apply')}
          disabled={!templatesQuery.data?.length}
        >
          {t.applyTemplate}
        </Button>
      </div>
      <Dialog open={Boolean(mode)} onOpenChange={(open) => !open && setMode(null)}>
        <DialogContent className="max-w-md">
          <div className="space-y-1 pr-8">
            <DialogTitle className="text-xl font-semibold">
              {mode === 'save' ? t.saveTitle : t.applyTitle}
            </DialogTitle>
            <DialogDescription>
              {mode === 'save' ? t.saveDescription : t.applyDescription.replace('{project}', project.name)}
            </DialogDescription>
          </div>
          {mode === 'save' ? (
            <form className="mt-4 space-y-4" onSubmit={handleSave}>
              <div className="space-y-2">
                <Label htmlFor="project-template-name">{t.templateName}</Label>
                <Input
                  id="project-template-name"
                  value={name}
                  maxLength={100}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setMode(null)}>{t.cancel}</Button>
                <Button type="submit" disabled={!name.trim()}>{t.saveTemplate}</Button>
              </div>
            </form>
          ) : (
            <form className="mt-4 space-y-4" onSubmit={handleApply}>
              <div className="space-y-2">
                <Label htmlFor="project-template-select">{t.chooseTemplate}</Label>
                <select
                  id="project-template-select"
                  className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                  value={templateId}
                  onChange={(event) => setTemplateId(event.target.value)}
                  required
                >
                  <option value="" disabled>{t.chooseTemplate}</option>
                  {(templatesQuery.data ?? []).map((template) => (
                    <option key={template.id} value={template.id}>{template.name}</option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-muted-foreground">{t.applyNotice}</p>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setMode(null)}>{t.cancel}</Button>
                <Button type="submit" disabled={!templateId}>{t.applyTemplate}</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
      {(templatesQuery.error || statesQuery.error) && (
        <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive">
          {(templatesQuery.error ?? statesQuery.error).message}
        </p>
      )}
    </>
  );
}

export default ProjectTemplateControls;
