import { useEffect, useState } from 'react';

const taskFilterOptions = [
  'current',
  'active',
  'completed',
  'due-soon',
  'overdue',
];

const readPreference = (key, allowedValues, fallback) => {
  try {
    const value = window.localStorage.getItem(key);
    return allowedValues.includes(value) ? value : fallback;
  } catch {
    return fallback;
  }
};

export function useWorkspacePreferences() {
  const [colorMode, setColorMode] = useState(
    () => window.localStorage.getItem('projectly-color-mode') ?? 'light',
  );
  const [style, setStyle] = useState(
    () => window.localStorage.getItem('projectly-style') ?? 'nova',
  );
  const [defaultTaskFilter, setDefaultTaskFilter] = useState(() =>
    readPreference(
      'projectly-default-task-filter',
      taskFilterOptions,
      'current',
    ),
  );
  const [weekStartsOn, setWeekStartsOn] = useState(() => {
    const language = window.localStorage.getItem('projectly-language');
    const fallback = language === 'ro' ? '1' : '0';
    return Number(readPreference('projectly-week-start', ['0', '1'], fallback));
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', colorMode === 'dark');
    document.documentElement.dataset.style = style;
    window.localStorage.setItem('projectly-color-mode', colorMode);
    window.localStorage.setItem('projectly-style', style);
    window.localStorage.setItem(
      'projectly-default-task-filter',
      defaultTaskFilter,
    );
    window.localStorage.setItem('projectly-week-start', String(weekStartsOn));
  }, [colorMode, defaultTaskFilter, style, weekStartsOn]);

  return {
    colorMode,
    defaultTaskFilter,
    setColorMode,
    setDefaultTaskFilter,
    setStyle,
    setWeekStartsOn,
    style,
    weekStartsOn,
  };
}
