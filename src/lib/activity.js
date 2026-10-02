const startOfDay = (date) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
};

export const rangePresets = ['today', 'last7', 'last30', 'last90', 'custom'];

export const getRangeBounds = (preset, custom) => {
  const todayStart = startOfDay(new Date());
  if (preset === 'today') {
    const end = new Date(todayStart);
    end.setDate(end.getDate() + 1);
    end.setMilliseconds(end.getMilliseconds() - 1);
    return { start: todayStart, end };
  }
  if (preset === 'last7' || preset === 'last30' || preset === 'last90') {
    const days = preset === 'last7' ? 7 : preset === 'last30' ? 30 : 90;
    const start = new Date(todayStart);
    start.setDate(start.getDate() - (days - 1));
    const end = new Date(todayStart);
    end.setDate(end.getDate() + 1);
    end.setMilliseconds(end.getMilliseconds() - 1);
    return {
      start,
      end,
    };
  }
  const end = custom?.to ? new Date(`${custom.to}T23:59:59.999`) : null;
  return {
    start: custom?.from ? new Date(`${custom.from}T00:00:00`) : null,
    end,
  };
};

export const filterEntriesByRange = (entries, bounds) =>
  entries.filter((entry) => {
    const at = new Date(entry.started_at ?? entry.created_at);
    if (bounds.start && at < bounds.start) return false;
    if (bounds.end && at > bounds.end) return false;
    return true;
  });

export const groupEntriesByUser = (entries) => {
  const map = new Map();
  for (const entry of entries) {
    const key = entry.user_email || entry.user_id || 'unknown';
    if (!map.has(key)) {
      map.set(key, { user: key, totalMinutes: 0, entries: [] });
    }
    const group = map.get(key);
    group.entries.push(entry);
    if (entry.duration_minutes) group.totalMinutes += entry.duration_minutes;
  }
  return Array.from(map.values())
    .map((group) => ({
      ...group,
      entries: group.entries.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at),
      ),
    }))
    .sort((a, b) => b.totalMinutes - a.totalMinutes);
};
