import { Activity, CalendarDays, ClipboardList, ListTodo } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  AnimatedTabIndicator,
  AnimatedTabPanel,
} from '@/components/Common/animated-tabs';
import {
  filterTasksByView,
  searchTasksByText,
} from '@/components/Common/task-view-filters';
import ProjectBoard from '@/components/pages/projects/ProjectBoard';
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
import { useProjectActivity } from '@/hooks/projects/use-project-activity';
import { useStrings } from '@/lib/i18n';
import ProjectActivityPanel from './ProjectActivityPanel';
import ProjectFormEditor from './ProjectFormEditor';
import ProjectTemplateControls from './ProjectTemplateControls';

const ProjectWorkspace = ({
  onNewTask,
  onProjectSaved,
  project,
  workspaceId,
  workspace,
}) => {
  const strings = useStrings();
  const t = strings.projectWorkspace;
  const [tab, setTab] = useState('details');
  const [taskQuery, setTaskQuery] = useState('');
  const [taskFilter, setTaskFilter] = useState('current');
  const [actionRequest, setActionRequest] = useState(null);
  const projectTasks = useMemo(() => {
    const projectTaskIds = new Set(
      workspace.tasks
        .filter(
          (task) =>
            task.project?.id === project.id ||
            task.linked_projects?.some(
              (link) => link.project?.id === project.id,
            ),
        )
        .map((task) => task.id),
    );
    return workspace.tasks.filter((task) => projectTaskIds.has(task.id));
  }, [project.id, workspace.tasks]);
  const todayKey = new Date().setHours(0, 0, 0, 0);
  const filteredTasks = useMemo(
    () => filterTasksByView(projectTasks, taskFilter, todayKey),
    [projectTasks, taskFilter, todayKey],
  );
  const visibleTasks = useMemo(
    () => searchTasksByText(filteredTasks, taskQuery),
    [filteredTasks, taskQuery],
  );
  const { entries, loading, tasks, error } = useProjectActivity({
    enabled: tab === 'activity',
    projectId: project.id,
  });

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

  const tabs = [
    ['details', t.tabs.details, ClipboardList],
    ['tasks', t.tabs.tasks, ListTodo],
    ['activity', t.tabs.activity, Activity],
    ['board', t.tabs.board, CalendarDays],
  ];

  return (
    <>
      <Frame className="h-full min-h-0" stacked dense>
        <FrameHeader className="gap-3 border-b p-3 sm:p-4">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <FrameTitle className="truncate">{project.name}</FrameTitle>
              <FrameDescription className="mt-1 flex flex-wrap items-center gap-2">
                <span>{project.code}</span>
                <Badge size="sm" variant="secondary">
                  {project.status}
                </Badge>
              </FrameDescription>
            </div>
            <ProjectTemplateControls
              project={project}
              tasks={projectTasks}
              workspaceId={workspaceId}
            />
          </div>
          <div
            className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 sm:grid-cols-4"
            role="tablist"
            aria-label={t.tabListLabel}
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
                  <AnimatedTabIndicator layoutId="project-workspace-tabs" />
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
            tab === 'details' ? 'overflow-auto p-0' : 'overflow-hidden p-0'
          }`}
        >
          <AnimatedTabPanel
            activeId={tab}
            className={tab === 'details' ? 'min-h-full' : 'h-full min-h-0'}
          >
            {tab === 'details' ? (
              <div className="p-3 sm:p-4">
                <ProjectFormEditor
                  inline
                  onSaved={onProjectSaved}
                  open
                  project={project}
                />
              </div>
            ) : tab === 'tasks' ? (
              <div className="h-full min-h-0">
                <TaskList
                  tasks={visibleTasks}
                  loading={workspace.loading}
                  error={workspace.error}
                  selectedId={
                    projectTasks.some(
                      (task) => task.id === workspace.selected?.id,
                    )
                      ? workspace.selected?.id
                      : undefined
                  }
                  onSelect={workspace.setSelectedId}
                  query={taskQuery}
                  onQueryChange={setTaskQuery}
                  filter={taskFilter}
                  onFilterChange={(value) =>
                    setTaskFilter(value === 'active' ? 'current' : value)
                  }
                  runningTaskId={workspace.runningTaskId}
                  onToggleTimer={handleTimerToggle}
                  onNewTask={() => onNewTask(null, project.id)}
                  showSummaryHeader={false}
                  title={t.tasksTitle}
                  showProjectFilter={false}
                />
              </div>
            ) : tab === 'activity' ? (
              <ActivityContent
                entries={entries}
                error={error}
                loading={loading}
                tasks={tasks}
                t={strings.activity}
              />
            ) : (
              <div className="h-full min-h-0">
                <ProjectBoard
                  workspace={{
                    ...workspace,
                    tasks: projectTasks,
                  }}
                />
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
};

function ActivityContent({ entries, error, loading, tasks, t }) {
  if (error) {
    return (
      <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        {error}
      </p>
    );
  }
  return (
    <Frame className="h-full min-h-0" stacked>
      <FrameHeader>
        <FrameTitle className="text-sm">{t.projectActivityTitle}</FrameTitle>
      </FrameHeader>
      <FramePanel className="min-h-0 flex-1 overflow-auto p-3 shadow-none">
        <ProjectActivityPanel
          entries={entries}
          loading={loading}
          tasks={tasks}
        />
      </FramePanel>
    </Frame>
  );
}

export default ProjectWorkspace;
