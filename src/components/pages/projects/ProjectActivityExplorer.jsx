import { Activity } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from '@/components/reui/frame';
import VirtualSelect from '@/components/ui/virtual-select';
import { useProjectActivity } from '@/hooks/projects/use-project-activity';
import { useStrings } from '@/lib/i18n';
import ProjectActivityPanel from './ProjectActivityPanel';

const ProjectActivityExplorer = ({ projects }) => {
  const t = useStrings().activity;
  const [projectId, setProjectId] = useState('');
  const projectOptions = useMemo(
    () =>
      projects.map((project) => ({
        value: project.id,
        label: project.name,
      })),
    [projects],
  );
  const { entries, loading, tasks } = useProjectActivity({
    enabled: Boolean(projectId),
    projectId,
  });

  return (
    <Frame stacked>
      <FrameHeader className="flex-row flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Activity className="size-4 text-primary" />
          <FrameTitle className="text-sm">{t.projectActivityTitle}</FrameTitle>
        </div>
        <VirtualSelect
          ariaLabel={t.selectProject}
          searchLabel={t.selectProject}
          triggerClassName="w-full sm:w-56"
          value={projectId}
          onChange={setProjectId}
          placeholder={t.selectProject}
          options={projectOptions}
        />
      </FrameHeader>
      <FramePanel className="p-3 shadow-none">
        {projectId ? (
          <ProjectActivityPanel
            entries={entries}
            loading={loading}
            tasks={tasks}
          />
        ) : (
          <p className="p-6 text-center text-sm text-muted-foreground">
            {t.selectProjectPrompt}
          </p>
        )}
      </FramePanel>
    </Frame>
  );
};

export default ProjectActivityExplorer;
