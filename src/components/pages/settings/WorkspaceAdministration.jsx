import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import VirtualSelect from '@/components/ui/virtual-select';
import { supabase } from '@/lib/supabase';

const priorities = ['low', 'medium', 'high', 'urgent'];

function WorkspaceAdministration({ userId, workspaces }) {
  const t = workspaces.strings;
  const queryClient = useQueryClient();
  const [username, setUsername] = useState('');
  const [memberRole, setMemberRole] = useState('editor');
  const [ruleName, setRuleName] = useState('');
  const [fromStateId, setFromStateId] = useState('any');
  const [toStateId, setToStateId] = useState('any');
  const [action, setAction] = useState('set_priority');
  const [actionValue, setActionValue] = useState('high');
  const activeWorkspaceId = workspaces.activeWorkspaceId;

  const statesQuery = useQuery({
    queryKey: ['workspace-task-states', activeWorkspaceId],
    enabled: Boolean(activeWorkspaceId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_states')
        .select('id,name')
        .order('sort_order');
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
  const automationQuery = useQuery({
    queryKey: ['workspace-automations', activeWorkspaceId],
    enabled: Boolean(activeWorkspaceId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspace_automations')
        .select('id,name,from_state_id,to_state_id,action,action_value,enabled')
        .order('created_at');
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

  const handleAddMember = async (event) => {
    event.preventDefault();
    const added = await workspaces.handleAddMember(username, memberRole);
    if (added) setUsername('');
  };

  const handlePreferenceChange = async (kind, checked) => {
    await workspaces.updateNotificationPreferences({
      notification_preferences: {
        ...workspaces.notificationPreferences,
        [kind]: checked,
      },
    });
  };

  const handleAddAutomation = async (event) => {
    event.preventDefault();
    const { error } = await supabase.from('workspace_automations').insert({
      workspace_id: activeWorkspaceId,
      name: ruleName.trim(),
      from_state_id: fromStateId === 'any' ? null : fromStateId,
      to_state_id: toStateId === 'any' ? null : toStateId,
      action,
      action_value: actionValue,
      created_by: userId,
    });
    if (error) {
      toast.error(t.automationError, { description: error.message });
      return;
    }
    setRuleName('');
    await queryClient.invalidateQueries({
      queryKey: ['workspace-automations', activeWorkspaceId],
    });
  };

  const handleRemoveAutomation = async (automationId) => {
    const { error } = await supabase
      .from('workspace_automations')
      .delete()
      .eq('id', automationId);
    if (error) {
      toast.error(t.automationError, { description: error.message });
      return;
    }
    await queryClient.invalidateQueries({
      queryKey: ['workspace-automations', activeWorkspaceId],
    });
  };

  return (
    <div className="space-y-6 border-t pt-5">
      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold">{t.membersTitle}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{t.membersDescription}</p>
        </div>
        {workspaces.canManageMembers && (
          <form className="grid gap-2 sm:grid-cols-[1fr_9rem_auto]" onSubmit={handleAddMember}>
            <div className="space-y-1">
              <Label htmlFor="workspace-member-username">{t.username}</Label>
              <Input
                id="workspace-member-username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder={t.usernamePlaceholder}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="workspace-member-role">{t.role}</Label>
              <select
                id="workspace-member-role"
                className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                value={memberRole}
                onChange={(event) => setMemberRole(event.target.value)}
              >
                {['admin', 'editor', 'viewer'].map((role) => (
                  <option key={role} value={role}>{t.roles[role]}</option>
                ))}
              </select>
            </div>
            <Button type="submit" className="self-end">{t.addMember}</Button>
          </form>
        )}
        <ul className="divide-y rounded-lg border">
          {workspaces.members.map((member) => (
            <li key={member.user_id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {member.profile?.display_name ?? member.profile?.username ?? member.user_id}
                </p>
                {member.profile?.username && (
                  <p className="text-xs text-muted-foreground">@{member.profile.username}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {workspaces.canManageMembers && member.role !== 'owner' ? (
                  <>
                    <select
                      aria-label={t.roleFor.replace('{name}', member.profile?.display_name ?? member.profile?.username ?? '')}
                      className="h-8 rounded-md border bg-background px-2 text-xs"
                      value={member.role}
                      onChange={(event) => workspaces.handleUpdateMemberRole(member.user_id, event.target.value)}
                    >
                      {['admin', 'editor', 'viewer'].map((role) => (
                        <option key={role} value={role}>{t.roles[role]}</option>
                      ))}
                    </select>
                    <Button type="button" variant="outline" size="sm" onClick={() => workspaces.handleRemoveMember(member.user_id)}>
                      {t.remove}
                    </Button>
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground">{t.roles[member.role]}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold">{t.notificationsTitle}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{t.notificationsDescription}</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {Object.entries(t.notificationKinds).map(([kind, label]) => (
            <label key={kind} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={workspaces.notificationPreferences[kind] !== false}
                onChange={(event) => handlePreferenceChange(kind, event.target.checked)}
              />
              {label}
            </label>
          ))}
        </div>
        <div className="max-w-xs space-y-1">
          <Label htmlFor="notification-digest">{t.digest}</Label>
          <select
            id="notification-digest"
            className="h-9 w-full rounded-md border bg-background px-2 text-sm"
            value={workspaces.digestFrequency}
            onChange={(event) => workspaces.updateNotificationPreferences({ digest_frequency: event.target.value })}
          >
            {['off', 'daily', 'weekly'].map((frequency) => (
              <option key={frequency} value={frequency}>{t.digestFrequencies[frequency]}</option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">{t.digestDeliveryNote}</p>
        </div>
      </section>

      {workspaces.canManageMembers && (
        <section className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold">{t.automationsTitle}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{t.automationsDescription}</p>
          </div>
          <form className="grid gap-2 sm:grid-cols-2" onSubmit={handleAddAutomation}>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="automation-name">{t.ruleName}</Label>
              <Input id="automation-name" value={ruleName} onChange={(event) => setRuleName(event.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="automation-from-state">{t.whenFrom}</Label>
              <VirtualSelect
                id="automation-from-state"
                ariaLabel={t.whenFrom}
                searchLabel={t.whenFrom}
                value={fromStateId}
                onChange={setFromStateId}
                options={[{ value: 'any', label: t.anyState }, ...(statesQuery.data ?? []).map((state) => ({ value: state.id, label: state.name }))]}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="automation-to-state">{t.whenTo}</Label>
              <VirtualSelect
                id="automation-to-state"
                ariaLabel={t.whenTo}
                searchLabel={t.whenTo}
                value={toStateId}
                onChange={setToStateId}
                options={[{ value: 'any', label: t.anyState }, ...(statesQuery.data ?? []).map((state) => ({ value: state.id, label: state.name }))]}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="automation-action">{t.action}</Label>
              <select id="automation-action" className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={action} onChange={(event) => {
                const nextAction = event.target.value;
                setAction(nextAction);
                setActionValue(nextAction === 'set_priority' ? 'high' : (workspaces.members[0]?.user_id ?? ''));
              }}>
                <option value="set_priority">{t.setPriority}</option>
                <option value="assign_to">{t.assignToMember}</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="automation-value">{t.actionValue}</Label>
              {action === 'set_priority' ? (
                <select id="automation-value" className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={actionValue} onChange={(event) => setActionValue(event.target.value)}>
                  {priorities.map((priority) => <option key={priority} value={priority}>{t.priorities[priority]}</option>)}
                </select>
              ) : (
                <select id="automation-value" className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={actionValue} onChange={(event) => setActionValue(event.target.value)}>
                  {workspaces.members.map((member) => <option key={member.user_id} value={member.user_id}>{member.profile?.display_name ?? member.profile?.username}</option>)}
                </select>
              )}
            </div>
            <Button type="submit" disabled={!ruleName.trim() || (action === 'assign_to' && !actionValue)} className="sm:col-span-2">
              {t.addAutomation}
            </Button>
          </form>
          {automationQuery.error && <p role="alert" className="text-sm text-destructive">{automationQuery.error.message}</p>}
          <ul className="divide-y rounded-lg border">
            {(automationQuery.data ?? []).map((rule) => (
              <li key={rule.id} className="flex items-center justify-between gap-2 px-3 py-2">
                <span className="min-w-0 truncate text-sm">{rule.name}</span>
                <Button type="button" variant="outline" size="sm" onClick={() => handleRemoveAutomation(rule.id)}>{t.remove}</Button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export default WorkspaceAdministration;
