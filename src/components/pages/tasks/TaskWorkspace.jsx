import { useMemo, useState } from 'react';
import { ResizableResponsive } from '@/components/reui/resizable';
import TaskActionNoteDialog from './TaskActionNoteDialog';
import TaskInspector from './TaskInspector';
import TaskList from './TaskList';

const TaskWorkspace = ({ onAddSubtask, onNewTask, workspace }) => {
  const [actionRequest, setActionRequest] = useState(null);
  const [projectFilter, setProjectFilter] = useState('all');
  const {
    error,
    filter,
    clearRecentlyCreatedTask,
    handleTaskUpdated,
    historyVersion,
    loading,
    hasMoreTasks,
    loadingMoreTasks,
    loadMoreTasks,
    query,
    runningTaskId,
    recentlyCreatedTaskId,
    selected,
    setFilter,
    setQuery,
    setSelectedId,
    toggleTimer,
    visibleTasks,
  } = workspace;
  const projectOptions = useMemo(() => {
    const projects = new Map();
    for (const task of workspace.tasks) {
      for (const project of [
        task.project,
        ...(task.linked_projects ?? []).map((link) => link.project),
      ]) {
        if (project) projects.set(project.id, project);
      }
    }
    return Array.from(projects.values()).sort((first, second) =>
      first.name.localeCompare(second.name),
    );
  }, [workspace.tasks]);
  const projectFilteredTasks = useMemo(
    () =>
      projectFilter === 'all'
        ? visibleTasks
        : visibleTasks.filter((task) =>
            [
              task.project,
              ...(task.linked_projects ?? []).map((link) => link.project),
            ].some((project) => project?.id === projectFilter),
          ),
    [projectFilter, visibleTasks],
  );

  const handleTimerToggle = (task) => {
    if (runningTaskId !== task.id) {
      toggleTimer(task);
      return;
    }
    setActionRequest({
      type: 'stop',
      onConfirm: (note) => toggleTimer(task, note),
    });
  };

  const requestCompletion = (task, onConfirm) => {
    setActionRequest({ type: 'complete', task, onConfirm });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 sm:gap-5">
      <div className="min-h-0 flex-1">
        <ResizableResponsive
          first={
            <TaskList
              tasks={projectFilteredTasks}
              loading={loading}
              error={error}
              selectedId={selected?.id}
              onSelect={setSelectedId}
              query={query}
              onQueryChange={setQuery}
              filter={filter}
              onFilterChange={setFilter}
              projectOptions={projectOptions}
              projectFilter={projectFilter}
              onProjectFilterChange={setProjectFilter}
              runningTaskId={runningTaskId}
              onToggleTimer={handleTimerToggle}
              onNewTask={onNewTask}
              recentlyCreatedTaskId={recentlyCreatedTaskId}
              onTaskAnimationComplete={clearRecentlyCreatedTask}
              hasMoreTasks={hasMoreTasks}
              loadingMoreTasks={loadingMoreTasks}
              onLoadMoreTasks={loadMoreTasks}
            />
          }
          second={
            <TaskInspector
              key={`${selected?.id ?? 'empty'}-${historyVersion}`}
              task={selected}
              tasks={workspace.tasks}
              onTaskUpdated={handleTaskUpdated}
              onUpdateState={workspace.updateTaskState}
              onRequestCompletion={requestCompletion}
              onAddSubtask={onAddSubtask}
            />
          }
          defaultSize={46}
          minSize={28}
          maxSize={72}
          className="h-full"
        />
      </div>
      <TaskActionNoteDialog
        request={actionRequest}
        onOpenChange={(open) => {
          if (!open) setActionRequest(null);
        }}
      />
    </div>
  );
};

export default TaskWorkspace;
