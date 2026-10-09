import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  FolderKanban,
} from 'lucide-react';
import { MetricStrip } from '@/components/Common/analytics-ui';
import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from '@/components/reui/frame';

export function ClientStatisticsPanel({ client, t }) {
  const completion = client.total
    ? Math.round((client.completed / client.total) * 100)
    : 0;
  const activeProjects = client.projects.filter(
    (project) => project.status === 'active',
  ).length;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold">{t.statisticsTitle}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t.statisticsDescription}
        </p>
      </div>
      <MetricStrip
        ariaLabel={t.statisticsTitle}
        metrics={[
          [t.projectCount, client.projectCount, Building2, 'text-primary'],
          [t.activeProjects, activeProjects, FolderKanban, 'text-info'],
          [t.completedTasks, client.completed, CheckCircle2, 'text-success'],
          [t.overdueTasks, client.overdue, AlertTriangle, 'text-warning'],
        ]}
      />
      <Frame stacked>
        <FrameHeader>
          <FrameTitle className="text-sm">{t.deliveryTitle}</FrameTitle>
        </FrameHeader>
        <FramePanel className="space-y-3 p-4 shadow-none">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span>{t.completion}</span>
            <span className="font-semibold">{completion}%</span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-label={t.completion}
            aria-valuenow={completion}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${completion}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {client.dueSoon} {t.dueSoonTasks} · {client.total} {t.tasks}
          </p>
        </FramePanel>
      </Frame>
    </div>
  );
}
