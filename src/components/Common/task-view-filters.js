export function filterTasksByView(tasks, filter, todayKey) {
  if (filter === 'all') return tasks;
  if (filter === 'completed') {
    return tasks.filter((task) => task.state?.is_completed);
  }
  if (filter === 'due-weekend' || filter === 'overdue') {
    const today = new Date(todayKey);
    const weekendStart = new Date(today);
    const daysUntilSaturday =
      today.getDay() === 0 ? -1 : (6 - today.getDay() + 7) % 7;
    weekendStart.setDate(weekendStart.getDate() + daysUntilSaturday);
    const nextMonday = new Date(weekendStart);
    nextMonday.setDate(nextMonday.getDate() + 2);
    return tasks.filter((task) => {
      if (!task.due_date || task.state?.is_completed) return false;
      const dueDate = new Date(`${task.due_date}T00:00:00`);
      if (filter === 'overdue') return dueDate < today;
      return dueDate >= weekendStart && dueDate < nextMonday;
    });
  }
  return tasks.filter((task) => !task.state?.is_completed);
}

export function searchTasksByText(tasks, query) {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return tasks;
  return tasks.filter((task) =>
    `${task.title} ${task.description ?? ''}`
      .toLocaleLowerCase()
      .includes(normalizedQuery),
  );
}
