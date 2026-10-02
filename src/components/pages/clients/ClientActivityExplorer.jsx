import { Activity } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from '@/components/reui/frame';
import VirtualSelect from '@/components/ui/virtual-select';
import { useClientActivity } from '@/hooks/clients/use-client-activity';
import { useStrings } from '@/lib/i18n';
import ClientActivityPanel from './ClientActivityPanel';

const ClientActivityExplorer = ({ clients }) => {
  const t = useStrings().activity;
  const [clientId, setClientId] = useState('');
  const clientOptions = useMemo(
    () =>
      clients.map((client) => ({
        value: client.id,
        label: client.name,
      })),
    [clients],
  );
  const { entries, loading, projects, tasksByProject } = useClientActivity({
    clientId,
    enabled: Boolean(clientId),
  });

  return (
    <Frame stacked>
      <FrameHeader className="flex-row flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Activity className="size-4 text-primary" />
          <FrameTitle className="text-sm">{t.clientActivityTitle}</FrameTitle>
        </div>
        <VirtualSelect
          ariaLabel={t.selectClient}
          searchLabel={t.selectClient}
          triggerClassName="w-full sm:w-56"
          value={clientId}
          onChange={setClientId}
          placeholder={t.selectClient}
          options={clientOptions}
        />
      </FrameHeader>
      <FramePanel className="p-3 shadow-none">
        {clientId ? (
          <ClientActivityPanel
            entries={entries}
            loading={loading}
            projects={projects}
            tasksByProject={tasksByProject}
          />
        ) : (
          <p className="p-6 text-center text-sm text-muted-foreground">
            {t.selectClientPrompt}
          </p>
        )}
      </FramePanel>
    </Frame>
  );
};

export default ClientActivityExplorer;
