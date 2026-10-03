import { Clock3, FolderKanban, ListTodo, Search, Users } from 'lucide-react';
import { dateLabel, priorityVariant } from '@/components/Common/taskUtils';
import { Badge } from '@/components/reui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { VirtualList } from '@/components/ui/virtual-list';
import { useStrings } from '@/lib/i18n';

const SearchDialog = ({
  onOpenChange,
  onQueryChange,
  onSelectEntity,
  onSelectRecentSearch,
  open,
  clients,
  projects,
  query,
  recentSearches,
  tasks,
}) => {
  const strings = useStrings();
  const t = strings.layout.searchDialog;
  const groups = [
    { id: 'tasks', label: t.groups.tasks, items: tasks, Icon: ListTodo },
    {
      id: 'projects',
      label: t.groups.projects,
      items: projects,
      Icon: FolderKanban,
    },
    { id: 'clients', label: t.groups.clients, items: clients, Icon: Users },
  ].filter((group) => group.items.length);
  const searchRows = [];

  if (!query.trim() && recentSearches.length) {
    searchRows.push({ type: 'recent-heading', key: 'recent-heading' });
    for (const search of recentSearches) {
      searchRows.push({ type: 'recent', key: `recent:${search}`, search });
    }
  }

  for (const group of groups) {
    searchRows.push({
      type: 'group-heading',
      key: `heading:${group.id}`,
      group,
    });
    for (const item of group.items) {
      searchRows.push({
        type: 'entity',
        key: `${group.id}:${item.id}`,
        group,
        item,
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <div className="space-y-1 pr-8">
          <DialogTitle className="text-xl font-semibold">{t.title}</DialogTitle>
          <DialogDescription>{t.description}</DialogDescription>
        </div>
        <InputGroup className="mt-5 bg-background">
          <InputGroupAddon align="inline-start">
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            autoFocus
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={t.placeholder}
            aria-label={t.title}
          />
        </InputGroup>
        <p className="mt-2 text-xs text-muted-foreground">{t.queryHelp}</p>
        {searchRows.length > 0 ? (
          <VirtualList
            ariaLabel={t.title}
            className="mt-4 max-h-[min(60vh,28rem)]"
            estimateSize={(row) => (row.type === 'entity' ? 82 : 36)}
            getItemKey={(row) => row.key}
            itemClassName="pb-2"
            items={searchRows}
            renderItem={(row) => {
              if (row.type === 'recent-heading') {
                return (
                  <h3 className="flex items-center gap-2 px-1 text-xs font-semibold text-muted-foreground">
                    <Clock3 className="size-3.5" />
                    {t.recentSearches}
                  </h3>
                );
              }

              if (row.type === 'recent') {
                return (
                  <button
                    type="button"
                    className="w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                    onClick={() => onSelectRecentSearch(row.search)}
                  >
                    {row.search}
                  </button>
                );
              }

              if (row.type === 'group-heading') {
                return (
                  <h3 className="px-1 text-xs font-semibold text-muted-foreground">
                    {row.group.label}
                  </h3>
                );
              }

              const { group, item } = row;
              const isTask = group.id === 'tasks';
              const title = isTask ? item.title : item.name;
              const description =
                group.id === 'tasks'
                  ? (item.project?.name ?? strings.common.noProject)
                  : group.id === 'projects'
                    ? `${item.code ?? ''} ${item.status ?? ''}`.trim()
                    : [item.company, item.email].filter(Boolean).join(' · ');
              return (
                <button
                  type="button"
                  className="w-full rounded-lg border border-border/70 p-3 text-left transition-colors hover:border-border hover:bg-muted/50"
                  onClick={() =>
                    onSelectEntity(group.id.slice(0, -1), item.id, title)
                  }
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="block truncate text-sm font-semibold">
                        {title}
                      </span>
                      <span className="mt-1 block truncate text-xs text-muted-foreground">
                        {description || strings.common.noProject}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {isTask && (
                        <Badge
                          size="sm"
                          variant={
                            priorityVariant[item.priority] ?? 'secondary'
                          }
                        >
                          {item.priority}
                        </Badge>
                      )}
                      <group.Icon className="size-4 text-muted-foreground" />
                    </div>
                  </div>
                  {isTask && (
                    <div className="mt-3 flex justify-between text-xs text-muted-foreground">
                      <span>{item.state?.name ?? strings.common.noState}</span>
                      <span>{dateLabel(item.due_date)}</span>
                    </div>
                  )}
                </button>
              );
            }}
          />
        ) : query.trim() ? (
          <p className="rounded-lg border border-border/70 p-6 text-center text-sm text-muted-foreground">
            {t.noResults}
          </p>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default SearchDialog;
