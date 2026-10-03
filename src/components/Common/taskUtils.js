export const priorityVariant = {
  urgent: 'destructive-outline',
  high: 'warning-outline',
  medium: 'info-outline',
  low: 'secondary',
};

export const dateLabel = (value) => {
  return value
    ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(
        new Date(`${value}T00:00:00`),
      )
    : 'No due date';
};

export const profileLabel = (profile, fallback) => {
  const displayName = profile?.display_name?.trim();
  return displayName || fallback;
};

export const durationLabel = (minutes) => {
  return minutes
    ? `${Math.floor(minutes / 60) ? `${Math.floor(minutes / 60)}h ` : ''}${minutes % 60 || ''}${minutes % 60 ? 'm' : ''}`.trim()
    : 'Not estimated';
};
