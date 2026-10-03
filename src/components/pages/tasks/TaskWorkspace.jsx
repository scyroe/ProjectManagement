import { useState } from 'react';
import { ResizableResponsive } from '@/components/reui/resizable';
import TaskActionNoteDialog from './TaskActionNoteDialog';
import TaskInspector from './TaskInspector';
import TaskList from './TaskList';

const TaskWorkspace = ({ onAddSubtask, onNewTask, workspace }) => {
  const [actionRequest, setActionRequest] = useState(null);
  const {
    error,
    filter,
    clearRecentlyCreatedTask,
    handleTaskUpdated,
    historyVersion,
    loading,
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
              tasks={visibleTasks}
              loading={loading}
              error={error}
              selectedId={selected?.id}
              onSelect={setSelectedId}
              query={query}
              onQueryChange={setQuery}
              filter={filter}
              onFilterChange={setFilter}
              runningTaskId={runningTaskId}
              onToggleTimer={handleTimerToggle}
              onNewTask={onNewTask}
              recentlyCreatedTaskId={recentlyCreatedTaskId}
              onTaskAnimationComplete={clearRecentlyCreatedTask}
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
