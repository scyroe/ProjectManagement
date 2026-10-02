import { Search } from 'lucide-react';
import ClientProgressCard from '@/components/Common/ClientProgressCard';
import { Frame, FrameHeader, FramePanel } from '@/components/reui/frame';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { VirtualGrid } from '@/components/ui/virtual-list';
import { useStrings } from '@/lib/i18n';
import ClientActivityExplorer from './ClientActivityExplorer';

const Clients = ({
  clients,
  error,
  loading,
  onEditClient,
  query,
  setQuery,
}) => {
  const t = useStrings().clientsPage;

  return (
    <div className="min-h-0 flex-1 space-y-4 overflow-auto pb-1">
      <Frame stacked>
        <FrameHeader className="gap-3">
          <InputGroup className="bg-background">
            <InputGroupAddon align="inline-start">
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              placeholder={t.searchPlaceholder}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </InputGroup>
        </FrameHeader>
        <FramePanel className="space-y-2 p-3 shadow-none">
          {loading && (
            <p className="p-6 text-center text-sm text-muted-foreground">
              {t.loading}
            </p>
          )}
          {!loading && error && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {error}
            </p>
          )}
          {!loading && !error && (
            <VirtualGrid
              className="max-h-136"
              estimateSize={240}
              items={clients}
              renderItem={(client) => (
                <ClientProgressCard client={client} onEdit={onEditClient} />
              )}
            />
          )}
          {!loading && !error && !clients.length && (
            <p className="p-6 text-center text-sm text-muted-foreground">
              {t.empty}
            </p>
          )}
        </FramePanel>
      </Frame>
      {clients.length > 0 && <ClientActivityExplorer clients={clients} />}
    </div>
  );
};

export default Clients;
