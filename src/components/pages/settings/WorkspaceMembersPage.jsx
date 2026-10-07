import {
  Activity,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  Clock3,
  ListTodo,
  Save,
  UserRound,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { MetricStrip } from '@/components/Common/analytics-ui';
import {
  AnimatedTabIndicator,
  AnimatedTabPanel,
} from '@/components/Common/animated-tabs';
import ListFilterToolbar from '@/components/Common/ListFilterToolbar';
import {
  filterTasksByView,
  searchTasksByText,
} from '@/components/Common/task-view-filters';
import TaskActionNoteDialog from '@/components/pages/tasks/TaskActionNoteDialog';
import TaskList from '@/components/pages/tasks/TaskList';
import { Badge } from '@/components/reui/badge';
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from '@/components/reui/frame';
import { ResizableResponsive } from '@/components/reui/resizable';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VirtualList } from '@/components/ui/virtual-list';
import VirtualSelect from '@/components/ui/virtual-select';

function WorkspaceMembersPage({ workspaces, workspace, onAddUser }) {
  const t = workspaces.strings;
  const pageT = t.membersPage;
  const [query, setQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [tab, setTab] = useState('overview');
  const members = workspaces.members;
  const visibleMembers = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) return members;
    return members.filter((member) => {
      const profile = member.profile;
      return `${profile?.display_name ?? ''} ${profile?.username ?? ''} ${member.role}`
        .toLocaleLowerCase()
        .includes(normalizedQuery);
    });
  }, [members, query]);
  const selectedMember =
    visibleMembers.find((member) => member.user_id === selectedUserId) ??
    visibleMembers[0];
  const tasks = workspace.tasks.filter(
    (task) => task.assigned_to === selectedMember?.user_id,
  );

  return (
    <section className="flex h-full min-h-0 w-full flex-1 flex-col gap-3">
      {workspaces.error && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 p-3 text-sm text-destructive"
        >
          {workspaces.error.message}
        </p>
      )}

      <ResizableResponsive
        first={
          <MemberList
            members={visibleMembers}
            hasMembers={members.length > 0}
            loading={workspaces.membersLoading}
            onAddUser={workspaces.canManageMembers ? onAddUser : undefined}
            query={query}
            selectedId={selectedMember?.user_id}
            setQuery={setQuery}
            setSelectedId={setSelectedUserId}
            t={t}
            canManageMembers={workspaces.canManageMembers}
            onUpdateRole={workspaces.handleUpdateMemberRole}
            onRemove={workspaces.handleRemoveMember}
          />
        }
        second={
          selectedMember ? (
            <MemberWorkspace
              key={selectedMember.user_id}
              member={selectedMember}
              tasks={tasks}
              workspace={workspace}
              tab={tab}
              setTab={setTab}
              t={t}
              pageT={pageT}
              canEditProfile={
                workspaces.canManageMembers &&
                (selectedMember.role !== 'owner' ||
                  workspaces.activeMembership?.role === 'owner')
              }
              onSaveProfile={workspaces.handleUpdateMemberProfile}
            />
          ) : (
            <div className="grid h-full place-items-center rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              {workspaces.membersLoading ? t.loadingMembers : t.noMembers}
            </div>
          )
        }
        defaultSize={34}
        minSize={24}
        maxSize={56}
        className="min-h-0 flex-1"
      />
    </section>
  );
}

function MemberList({
  members,
  hasMembers,
  loading,
  onAddUser,
  query,
  selectedId,
  setQuery,
  setSelectedId,
  t,
  canManageMembers,
  onUpdateRole,
  onRemove,
}) {
  const pageT = t.membersPage;
  return (
    <Frame className="h-full min-h-0" stacked dense>
      <FrameHeader className="gap-3 border-b p-3 sm:p-4">
        <div>
          <FrameTitle>{pageT.rosterTitle}</FrameTitle>
          <FrameDescription className="mt-1">
            {pageT.rosterDescription}
          </FrameDescription>
        </div>
        <ListFilterToolbar
          addLabel={t.addMember}
          closeSearchLabel={pageT.closeSearch}
          onAdd={canManageMembers ? onAddUser : undefined}
          query={query}
          queryPlaceholder={pageT.searchPlaceholder}
          searchLabel={pageT.searchMembers}
          onQueryChange={setQuery}
        />
      </FrameHeader>
      <FramePanel className="min-h-0 flex-1 overflow-auto p-2 shadow-none sm:p-3">
        {loading && !members.length && (
          <p
            className="p-6 text-center text-sm text-muted-foreground"
            role="status"
          >
            {t.loadingMembers}
          </p>
        )}
        {!loading && !hasMembers && (
          <p className="p-6 text-center text-sm text-muted-foreground">
            {t.noMembers}
          </p>
        )}
        {members.length > 0 && (
          <VirtualList
            ariaLabel={pageT.rosterTitle}
            className="h-full"
            estimateSize={canManageMembers ? 112 : 72}
            getItemKey={(member) => member.user_id}
            itemClassName="pb-1.5"
            items={members}
            renderItem={(member) => {
              const name = getMemberName(member);
              const isSelected = member.user_id === selectedId;
              return (
                <div
                  className={`rounded-lg border p-2.5 transition-colors ${
                    isSelected ? 'border-primary/40 bg-primary/5' : 'bg-card'
                  }`}
                >
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setSelectedId(member.user_id)}
                    className="flex w-full min-w-0 items-center gap-2.5 text-left"
                  >
                    <Avatar className="size-9 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                        {getInitials(name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {name}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {member.profile?.username
                          ? `@${member.profile.username}`
                          : pageT.usernameUnavailable}
                      </span>
                    </span>
                    <Badge variant="secondary" size="sm">
                      {t.roles[member.role]}
                    </Badge>
                  </button>
                  {canManageMembers && member.role !== 'owner' && (
                    <div className="mt-2 flex items-center gap-2 pl-11">
                      <VirtualSelect
                        ariaLabel={t.roleFor.replace('{name}', name)}
                        searchLabel={t.role}
                        value={member.role}
                        onChange={(role) => onUpdateRole(member.user_id, role)}
                        options={['admin', 'editor', 'viewer'].map((role) => ({
                          value: role,
                          label: t.roles[role],
                        }))}
                        triggerClassName="h-8 min-h-8 flex-1 text-xs"
                        size="sm"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onRemove(member.user_id)}
                      >
                        {t.remove}
                      </Button>
                    </div>
                  )}
                </div>
              );
            }}
          />
        )}
        {!loading && hasMembers && !members.length && (
          <p className="p-6 text-center text-sm text-muted-foreground">
            {pageT.noMatchingMembers}
          </p>
        )}
      </FramePanel>
    </Frame>
  );
}

function MemberWorkspace({
  member,
  tasks,
  workspace,
  tab,
  setTab,
  t,
  pageT,
  canEditProfile,
  onSaveProfile,
}) {
  const profile = member.profile;
  const name = getMemberName(member);
  const [taskQuery, setTaskQuery] = useState('');
  const [taskFilter, setTaskFilter] = useState('current');
  const [actionRequest, setActionRequest] = useState(null);
  const [displayName, setDisplayName] = useState(
    profile?.display_name ?? profile?.username ?? '',
  );
  const [capacityHours, setCapacityHours] = useState(
    String((profile?.weekly_capacity_minutes ?? 0) / 60),
  );
  const [savingProfile, setSavingProfile] = useState(false);
  const todayKey = new Date().setHours(0, 0, 0, 0);
  const today = new Date(todayKey);
  today.setHours(0, 0, 0, 0);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const filteredTasks = useMemo(
    () => filterTasksByView(tasks, taskFilter, todayKey),
    [tasks, taskFilter, todayKey],
  );
  const visibleTasks = useMemo(
    () => searchTasksByText(filteredTasks, taskQuery),
    [filteredTasks, taskQuery],
  );
  const openTasks = tasks.filter((task) => !task.state?.is_completed);
  const completedTasks = tasks.filter((task) => task.state?.is_completed);
  const overdueTasks = openTasks.filter(
    (task) => task.due_date && new Date(`${task.due_date}T00:00:00`) < today,
  );
  const weeklyTasks = openTasks.filter((task) => {
    if (!task.due_date) return false;
    const dueDate = new Date(`${task.due_date}T00:00:00`);
    return dueDate >= today && dueDate <= nextWeek;
  });
  const estimatedMinutes = weeklyTasks.reduce(
    (sum, task) => sum + (task.estimate_minutes ?? 0),
    0,
  );
  const capacityMinutes = profile?.weekly_capacity_minutes ?? 0;
  const capacityPercent = capacityMinutes
    ? Math.round((estimatedMinutes / capacityMinutes) * 100)
    : 0;
  const tabs = [
    ['overview', pageT.tabs.overview, UserRound],
    ['tasks', pageT.tabs.tasks, ListTodo],
    ['statistics', pageT.tabs.statistics, ChartNoAxesCombined],
  ];

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    if (savingProfile) return;
    const hours = Number(capacityHours);
    if (!displayName.trim() || !Number.isFinite(hours) || hours <= 0) return;

    setSavingProfile(true);
    try {
      const updated = await onSaveProfile({
        userId: member.user_id,
        displayName,
        weeklyCapacityMinutes: Math.round(hours * 60),
      });
      if (updated) {
        setDisplayName(displayName.trim());
        setCapacityHours(String(hours));
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const handleTimerToggle = (task) => {
    if (workspace.runningTaskId !== task.id) {
      workspace.toggleTimer(task);
      return;
    }
    setActionRequest({
      type: 'stop',
      onConfirm: (note) => workspace.toggleTimer(task, note),
    });
  };

  const memberRunningTaskId = tasks.some(
    (task) => task.id === workspace.runningTaskId,
  )
    ? workspace.runningTaskId
    : null;

  return (
    <>
      <Frame className="h-full min-h-0" stacked dense>
        <FrameHeader className="gap-3 border-b p-3 sm:p-4">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="size-11 shrink-0 bg-primary/10 text-primary">
              <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                {getInitials(name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <FrameTitle className="truncate">{name}</FrameTitle>
              <FrameDescription className="mt-1 flex flex-wrap items-center gap-2">
                {profile?.username && <span>@{profile.username}</span>}
                <Badge variant="secondary" size="sm">
                  {t.roles[member.role]}
                </Badge>
              </FrameDescription>
            </div>
          </div>
          <div
            className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 sm:grid-cols-3"
            role="tablist"
            aria-label={pageT.tabListLabel}
          >
            {tabs.map(([value, label, Icon]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={tab === value}
                onClick={() => setTab(value)}
                className={`relative flex min-h-10 items-center justify-start gap-1.5 rounded-md px-1 py-1.5 text-xs font-medium leading-tight transition-colors sm:min-h-0 sm:px-2 ${
                  tab === value
                    ? 'text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {tab === value && (
                  <AnimatedTabIndicator layoutId="workspace-members-tabs" />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <Icon className="size-3.5 shrink-0" />
                  <span>{label}</span>
                </span>
              </button>
            ))}
          </div>
        </FrameHeader>
        <FramePanel
          className={`min-h-0 flex-1 shadow-none ${
            tab === 'tasks' ? 'overflow-hidden p-0' : 'overflow-auto p-3 sm:p-4'
          }`}
        >
          <AnimatedTabPanel
            activeId={tab}
            className={tab === 'tasks' ? 'h-full min-h-0' : 'min-h-full'}
          >
            {tab === 'overview' ? (
              <div className="space-y-4">
                <div>
                  <h2 className="text-base font-semibold">
                    {pageT.profileTitle}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {pageT.profileDescription}
                  </p>
                </div>
                <form className="space-y-4" onSubmit={handleSaveProfile}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`member-display-name-${member.user_id}`}>
                        {pageT.displayName}
                      </Label>
                      <Input
                        id={`member-display-name-${member.user_id}`}
                        value={displayName}
                        onChange={(event) => setDisplayName(event.target.value)}
                        autoComplete="name"
                        maxLength={120}
                        disabled={!canEditProfile || savingProfile}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`member-username-${member.user_id}`}>
                        {t.username}
                      </Label>
                      <Input
                        id={`member-username-${member.user_id}`}
                        value={profile?.username ? `@${profile.username}` : ''}
                        disabled
                        placeholder="—"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`member-role-${member.user_id}`}>
                        {t.role}
                      </Label>
                      <Input
                        id={`member-role-${member.user_id}`}
                        value={t.roles[member.role]}
                        disabled
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor={`member-weekly-capacity-${member.user_id}`}
                      >
                        {pageT.weeklyCapacity} ({pageT.hoursPerWeek})
                      </Label>
                      <Input
                        id={`member-weekly-capacity-${member.user_id}`}
                        type="number"
                        min="0.5"
                        step="0.5"
                        value={capacityHours}
                        onChange={(event) =>
                          setCapacityHours(event.target.value)
                        }
                        disabled={!canEditProfile || savingProfile}
                        required
                      />
                    </div>
                  </div>
                  <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                    {pageT.profileOwnerNote}
                  </div>
                  {canEditProfile && (
                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={
                          savingProfile ||
                          !displayName.trim() ||
                          !Number.isFinite(Number(capacityHours)) ||
                          Number(capacityHours) <= 0
                        }
                      >
                        <Save aria-hidden="true" />
                        {savingProfile
                          ? pageT.savingProfile
                          : pageT.saveProfile}
                      </Button>
                    </div>
                  )}
                </form>
              </div>
            ) : tab === 'tasks' ? (
              <MemberTasks
                tasks={visibleTasks}
                assignedTasks={tasks}
                workspace={workspace}
                taskQuery={taskQuery}
                setTaskQuery={setTaskQuery}
                taskFilter={taskFilter}
                setTaskFilter={setTaskFilter}
                runningTaskId={memberRunningTaskId}
                onToggleTimer={handleTimerToggle}
                title={pageT.tabs.tasks}
              />
            ) : (
              <div className="space-y-4">
                <MetricStrip
                  metrics={[
                    [
                      pageT.openTasks,
                      openTasks.length,
                      ListTodo,
                      'text-primary',
                    ],
                    [
                      pageT.completedTasks,
                      completedTasks.length,
                      Activity,
                      'text-success',
                    ],
                    [
                      pageT.overdueTasks,
                      overdueTasks.length,
                      Clock3,
                      'text-destructive',
                    ],
                  ]}
                />
                <section className="rounded-xl border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-semibold">
                        {pageT.weeklyWorkload}
                      </h2>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {pageT.weeklyWorkloadDescription}
                      </p>
                    </div>
                    <BriefcaseBusiness className="size-4 text-muted-foreground" />
                  </div>
                  <div className="mt-4 flex items-baseline justify-between gap-2">
                    <p className="text-2xl font-semibold">
                      {(estimatedMinutes / 60).toFixed(1)}
                      <span className="ml-1 text-sm font-normal text-muted-foreground">
                        {pageT.hours}
                      </span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {capacityMinutes
                        ? `${pageT.of} ${(capacityMinutes / 60).toFixed(1)} ${pageT.hours}`
                        : pageT.capacityNotSet}
                    </p>
                  </div>
                  {capacityMinutes > 0 && (
                    <div
                      className="mt-3 h-2 overflow-hidden rounded-full bg-muted"
                      role="progressbar"
                      aria-label={pageT.weeklyWorkload}
                      aria-valuenow={capacityPercent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className={`h-full rounded-full ${
                          capacityPercent > 100
                            ? 'bg-destructive'
                            : 'bg-primary'
                        }`}
                        style={{ width: `${Math.min(capacityPercent, 100)}%` }}
                      />
                    </div>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {capacityPercent}% {pageT.capacityUsed}
                  </p>
                </section>
              </div>
            )}
          </AnimatedTabPanel>
        </FramePanel>
      </Frame>
      <TaskActionNoteDialog
        request={actionRequest}
        onOpenChange={(open) => {
          if (!open) setActionRequest(null);
        }}
      />
    </>
  );
}

function MemberTasks({
  tasks,
  assignedTasks,
  workspace,
  taskQuery,
  setTaskQuery,
  taskFilter,
  setTaskFilter,
  runningTaskId,
  onToggleTimer,
  title,
}) {
  return (
    <div className="h-full min-h-0">
      <TaskList
        tasks={tasks}
        loading={workspace.loading}
        error={workspace.error}
        selectedId={
          assignedTasks.some((task) => task.id === workspace.selected?.id)
            ? workspace.selected.id
            : undefined
        }
        onSelect={workspace.setSelectedId}
        query={taskQuery}
        onQueryChange={setTaskQuery}
        filter={taskFilter}
        onFilterChange={(value) =>
          setTaskFilter(value === 'active' ? 'current' : value)
        }
        runningTaskId={runningTaskId}
        onToggleTimer={onToggleTimer}
        showSummaryHeader={false}
        title={title}
        showProjectFilter={false}
      />
    </div>
  );
}

function getMemberName(member) {
  return (
    member.profile?.display_name?.trim() ||
    member.profile?.username ||
    member.user_id
  );
}

function getInitials(name) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toLocaleUpperCase();
}

export default WorkspaceMembersPage;
