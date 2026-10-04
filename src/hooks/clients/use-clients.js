import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useStrings } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

const clientsQueryKey = ['clients'];
const dayInMs = 24 * 60 * 60 * 1000;

const clientSelect =
  'id,name,email,company,phone,notes,created_at,project_clients(project:projects(id,name,code,description,budget,status,start_date,due_date,task_projects(task:tasks(id,due_date,state:task_states(is_completed)))))';

const getTaskProgress = (task, today, dueSoonEnd) => {
  const completed = Boolean(task.state?.is_completed);
  const dueDate =
    task.due_date && !completed ? new Date(`${task.due_date}T00:00:00`) : null;
  const overdue = Boolean(dueDate && dueDate < today);

  return {
    completed,
    overdue,
    dueSoon: Boolean(dueDate && !overdue && dueDate <= dueSoonEnd),
  };
};

const buildClientProgress = (client, today, dueSoonEnd) => {
  const projects = (client.project_clients ?? [])
    .map((link) => link.project)
    .filter(Boolean);

  const taskMap = new Map();
  const projectSummaries = projects.map((project) => {
    const tasks = (project.task_projects ?? [])
      .map((link) => link.task)
      .filter(Boolean);
    const projectProgress = { completed: 0, overdue: 0, dueSoon: 0 };
    for (const task of tasks) {
      let progress = taskMap.get(task.id);
      if (!progress) {
        progress = getTaskProgress(task, today, dueSoonEnd);
        taskMap.set(task.id, progress);
      }
      if (progress.completed) projectProgress.completed += 1;
      if (progress.overdue) projectProgress.overdue += 1;
      if (progress.dueSoon) projectProgress.dueSoon += 1;
    }

    return {
      id: project.id,
      name: project.name,
      code: project.code,
      description: project.description,
      budget: project.budget,
      status: project.status,
      start_date: project.start_date,
      due_date: project.due_date,
      total: tasks.length,
      ...projectProgress,
    };
  });

  const clientProgress = { completed: 0, overdue: 0, dueSoon: 0 };
  for (const progress of taskMap.values()) {
    if (progress.completed) clientProgress.completed += 1;
    if (progress.overdue) clientProgress.overdue += 1;
    if (progress.dueSoon) clientProgress.dueSoon += 1;
  }

  return {
    id: client.id,
    name: client.name,
    email: client.email,
    company: client.company,
    phone: client.phone,
    notes: client.notes,
    created_at: client.created_at,
    projectCount: projectSummaries.length,
    projects: projectSummaries,
    total: taskMap.size,
    ...clientProgress,
  };
};

export function useClients({ enabled = true }) {
  const t = useStrings().toasts.clients;
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');

  const {
    data: clients = [],
    isLoading: loading,
    error: queryError,
  } = useQuery({
    queryKey: clientsQueryKey,
    queryFn: async () => {
      const { data, error: loadError } = await supabase
        .from('clients')
        .select(clientSelect)
        .order('name');

      if (loadError) throw new Error(loadError.message ?? t.loadError);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dueSoonEnd = new Date(today.getTime() + 7 * dayInMs);
      return (data ?? []).map((client) =>
        buildClientProgress(client, today, dueSoonEnd),
      );
    },
    enabled,
  });

  const error = queryError ? (queryError.message ?? t.loadError) : '';

  const visibleClients = useMemo(() => {
    const value = query.toLowerCase().trim();
    if (!value) return clients;
    return clients.filter((client) =>
      `${client.name} ${client.company ?? ''} ${client.email ?? ''}`
        .toLowerCase()
        .includes(value),
    );
  }, [clients, query]);

  const handleClientCreated = (createdClient) => {
    queryClient.setQueryData(clientsQueryKey, (current = []) =>
      [
        ...current,
        {
          ...createdClient,
          projectCount: 0,
          projects: [],
          total: 0,
          completed: 0,
        },
      ].sort((a, b) => a.name.localeCompare(b.name)),
    );
  };

  const handleClientUpdated = (updatedClient) => {
    queryClient.setQueryData(clientsQueryKey, (current = []) =>
      current
        .map((client) =>
          client.id === updatedClient.id
            ? { ...client, ...updatedClient }
            : client,
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    );
  };

  const handleProjectCreated = (createdProject) => {
    const linkedClients = createdProject.linked_clients?.length
      ? createdProject.linked_clients
      : createdProject.client
        ? [createdProject.client]
        : [];
    if (!linkedClients.length) return;

    const linkedClientIds = linkedClients.map((client) => client.id);
    const summary = {
      id: createdProject.id,
      name: createdProject.name,
      code: createdProject.code,
      description: createdProject.description,
      budget: createdProject.budget,
      status: createdProject.status,
      start_date: createdProject.start_date,
      due_date: createdProject.due_date,
      total: 0,
      completed: 0,
      overdue: 0,
      dueSoon: 0,
    };

    queryClient.setQueryData(clientsQueryKey, (current = []) =>
      current.map((client) =>
        linkedClientIds.includes(client.id)
          ? {
              ...client,
              projectCount: client.projectCount + 1,
              projects: [...client.projects, summary],
            }
          : client,
      ),
    );
  };

  const handleProjectUpdated = (updatedProject) => {
    const linkedClientIds = (updatedProject.linked_clients ?? []).map(
      (client) => client.id,
    );
    const summary = {
      id: updatedProject.id,
      name: updatedProject.name,
      code: updatedProject.code,
      description: updatedProject.description,
      budget: updatedProject.budget,
      status: updatedProject.status,
      start_date: updatedProject.start_date,
      due_date: updatedProject.due_date,
      total: 0,
      completed: 0,
      overdue: 0,
      dueSoon: 0,
    };

    queryClient.setQueryData(clientsQueryKey, (current = []) =>
      current.map((client) => {
        const projects = client.projects.filter(
          (project) => project.id !== updatedProject.id,
        );
        if (linkedClientIds.includes(client.id)) projects.push(summary);
        return {
          ...client,
          projects,
          projectCount: projects.length,
        };
      }),
    );
  };

  return {
    allClients: clients,
    clients: visibleClients,
    error,
    handleClientCreated,
    handleClientUpdated,
    handleProjectCreated,
    handleProjectUpdated,
    loading,
    query,
    setQuery,
    totalCount: clients.length,
  };
}
