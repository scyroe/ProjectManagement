import { useMemo } from 'react';
import ClientProgressCard from '@/components/Common/ClientProgressCard';
import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from '@/components/reui/frame';
import { VirtualGrid } from '@/components/ui/virtual-list';
import { useStrings } from '@/lib/i18n';
import ProjectActivityExplorer from './ProjectActivityExplorer';
import ProjectBoard from './ProjectBoard';
import ProjectOverview from './ProjectOverview';

const Projects = ({
  clientProgress = [],
  onEditProject,
  onNewProject,
  searchQuery = '',
  workspace,
  userId,
}) => {
  const t = useStrings().projectsPage;
  const activeClientProgress = useMemo(
    () => clientProgress.filter((client) => client.projectCount > 0),
    [clientProgress],
  );
  const projectOptions = useMemo(
    () =>
      Array.from(
        new Map(
          activeClientProgress
            .flatMap((client) => client.projects)
            .map((project) => [project.id, project]),
        ).values(),
      ).sort((a, b) => a.name.localeCompare(b.name)),
    [activeClientProgress],
  );
  const visibleProjects = useMemo(() => {
    const normalizedQuery = searchQuery.toLocaleLowerCase();
    return normalizedQuery
      ? projectOptions.filter((project) =>
          `${project.name} ${project.code ?? ''}`
            .toLocaleLowerCase()
            .includes(normalizedQuery),
        )
      : projectOptions;
  }, [projectOptions, searchQuery]);
  return (
    <div className="min-h-0 flex-1 space-y-4 overflow-auto pb-2">
      <ProjectOverview
        onEditProject={onEditProject}
        onNewProject={onNewProject}
        projects={visibleProjects}
        tasks={workspace.tasks}
        userId={userId}
      />
      {activeClientProgress.length > 0 && (
        <Frame stacked>
          <FrameHeader>
            <FrameTitle className="text-sm">
              {t.progressByClientTitle}
            </FrameTitle>
          </FrameHeader>
          <FramePanel className="p-3 shadow-none">
            <VirtualGrid
              className="max-h-136"
              estimateSize={180}
              items={activeClientProgress}
              renderItem={(client) => (
                <ClientProgressCard client={client} showContact={false} />
              )}
            />
          </FramePanel>
        </Frame>
      )}
      {projectOptions.length > 0 && (
        <ProjectActivityExplorer projects={projectOptions} />
      )}
      <ProjectBoard workspace={workspace} />
    </div>
  );
};

export default Projects;
