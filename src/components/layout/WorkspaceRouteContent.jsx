import { AnimatePresence, domMax, LazyMotion, m as motion } from 'motion/react';
import Calendar from '@/components/pages/calendar/Calendar';
import Clients from '@/components/pages/clients/Clients';
import Dashboard from '@/components/pages/dashboard/Dashboard';
import Projects from '@/components/pages/projects/Projects';
import Reports from '@/components/pages/reports/Reports';
import TaskWorkspace from '@/components/pages/tasks/TaskWorkspace';
import WorkLog from '@/components/pages/work-log/WorkLog';
import EmptyPage from './EmptyPage';

function WorkspaceRouteContent({
  activeRoute,
  calendarState,
  clientsState,
  onClientUpdated,
  onEditProject,
  onNewClient,
  onNewProject,
  onNewTask,
  onProjectSaved,
  projectSearchQuery,
  setProjectSearchQuery,
  userId,
  workspace,
  currentPage,
  navigate,
  onAddSubtask,
  animationsEnabled,
  weekStartsOn,
}) {
  return (
    <LazyMotion features={domMax}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeRoute}
          initial={animationsEnabled ? { opacity: 0, y: 8 } : false}
          animate={{ opacity: 1, y: 0 }}
          exit={animationsEnabled ? { opacity: 0, y: -4 } : undefined}
          transition={
            animationsEnabled
              ? { duration: 0.18, ease: 'easeOut' }
              : { duration: 0 }
          }
          className="flex h-full min-h-0 flex-col"
        >
          {activeRoute === 'dashboard' ? (
            <Dashboard
              workspace={workspace}
              navigate={navigate}
              clients={clientsState.allClients}
              clientsError={clientsState.error}
              clientsLoading={clientsState.loading}
              onNewClient={onNewClient}
              onNewProject={onNewProject}
              onNewTask={onNewTask}
              userId={userId}
            />
          ) : activeRoute === 'tasks' ? (
            <TaskWorkspace
              workspace={workspace}
              onNewTask={onNewTask}
              onAddSubtask={onAddSubtask}
            />
          ) : activeRoute === 'projects' ? (
            <Projects
              workspace={workspace}
              onNewProject={onNewProject}
              onNewTask={onNewTask}
              onProjectSaved={onProjectSaved}
              clientProgress={clientsState.allClients}
              clientError={clientsState.error}
              clientLoading={clientsState.loading}
              searchQuery={projectSearchQuery}
              setSearchQuery={setProjectSearchQuery}
            />
          ) : activeRoute === 'clients' ? (
            <Clients
              clients={clientsState.clients}
              error={clientsState.error}
              loading={clientsState.loading}
              onClientUpdated={onClientUpdated}
              onEditProject={onEditProject}
              onNewClient={onNewClient}
              query={clientsState.query}
              setQuery={clientsState.setQuery}
            />
          ) : activeRoute === 'calendar' ? (
            <Calendar
              calendar={calendarState}
              workspace={workspace}
              navigate={navigate}
              weekStartsOn={weekStartsOn}
            />
          ) : activeRoute === 'reports' ? (
            <Reports
              workspace={workspace}
              navigate={navigate}
              userId={userId}
            />
          ) : activeRoute === 'work-log' ? (
            <WorkLog weekStartsOn={weekStartsOn} />
          ) : (
            <EmptyPage route={currentPage} />
          )}
        </motion.div>
      </AnimatePresence>
    </LazyMotion>
  );
}

export default WorkspaceRouteContent;
