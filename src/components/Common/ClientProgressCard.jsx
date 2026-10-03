import { AlertTriangle, Building2, Mail, Pencil, Phone } from 'lucide-react';
import { Badge } from '@/components/reui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { VirtualList } from '@/components/ui/virtual-list';
import { useStrings } from '@/lib/i18n';

const getInitials = (value) =>
  value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toLocaleUpperCase();

const ClientProgressCard = ({ client, onEdit, showContact = true }) => {
  const t = useStrings().clientsPage;
  const progress = client.total
    ? Math.round((client.completed / client.total) * 100)
    : 0;

  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          <Avatar className="mt-0.5 bg-primary/10 text-primary">
            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
              {getInitials(client.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{client.name}</p>
            {client.company && (
              <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground">
                <Building2 className="size-3.5 shrink-0" />
                {client.company}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" size="sm">
            {client.projectCount} {t.projectsSuffix}
          </Badge>
          {onEdit && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => onEdit(client)}
              aria-label={t.editClient}
              title={t.editClient}
            >
              <Pencil />
            </Button>
          )}
        </div>
      </div>
      {showContact && (client.email || client.phone) && (
        <div className="mt-3 space-y-1 text-xs text-muted-foreground">
          {client.email && (
            <p className="flex items-center gap-1.5 truncate">
              <Mail className="size-3.5 shrink-0" />
              {client.email}
            </p>
          )}
          {client.phone && (
            <p className="flex items-center gap-1.5 truncate">
              <Phone className="size-3.5 shrink-0" />
              {client.phone}
            </p>
          )}
        </div>
      )}
      {client.projectCount > 0 && (
        <div className="mt-3 flex items-center gap-2 border-t pt-3 text-xs">
          <AlertTriangle
            className={`size-3.5 shrink-0 ${client.overdue ? 'text-warning' : 'text-muted-foreground'}`}
            aria-hidden="true"
          />
          {client.overdue || client.dueSoon ? (
            <p className="text-warning-foreground">
              {client.overdue} {t.overdueTasks} · {client.dueSoon}{' '}
              {t.dueSoonTasks}
            </p>
          ) : (
            <p className="text-muted-foreground">{t.noImmediateRisk}</p>
          )}
        </div>
      )}
      {client.projectCount > 0 && (
        <div className="mt-3 border-t pt-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{t.progressLabel}</span>
            <span className="font-semibold">{progress}%</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <VirtualList
            className="mt-2 max-h-40"
            estimateSize={24}
            itemClassName="pb-1"
            items={client.projects}
            renderItem={(project) => (
              <div className="flex items-center justify-between gap-2 truncate text-[0.78125rem] text-muted-foreground">
                <span className="truncate">{project.name}</span>
                <span className="shrink-0">
                  {project.completed}/{project.total}
                </span>
              </div>
            )}
          />
        </div>
      )}
    </div>
  );
};

export default ClientProgressCard;
