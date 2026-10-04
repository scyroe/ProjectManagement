import { FolderPen, FolderPlus } from 'lucide-react';
import { Badge } from '@/components/reui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { useStrings } from '@/lib/i18n';
import ProjectFormEditor from './ProjectFormEditor';

const ProjectFormDialog = ({
  onCreateTask,
  onOpenChange,
  onSaved,
  open,
  project,
}) => {
  const t = useStrings().projectForm;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <div className="space-y-1 pr-8">
          <div className="flex items-center gap-2 text-primary">
            {project ? (
              <FolderPen className="size-4" />
            ) : (
              <FolderPlus className="size-4" />
            )}
            <Badge variant="secondary" size="sm">
              {project ? t.editBadge : t.badge}
            </Badge>
          </div>
          <DialogTitle className="text-xl font-semibold">
            {project ? t.editTitle : t.title}
          </DialogTitle>
          <DialogDescription>
            {project ? t.editDescription : t.description}
          </DialogDescription>
        </div>
        <ProjectFormEditor
          autoFocus
          onCancel={() => onOpenChange(false)}
          onCreateTask={onCreateTask}
          onSaved={(savedProject) => {
            onSaved(savedProject);
            onOpenChange(false);
          }}
          open={open}
          project={project}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ProjectFormDialog;
