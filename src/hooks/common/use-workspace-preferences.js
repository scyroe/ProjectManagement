import { useEffect, useState } from 'react';

const taskFilterOptions = [
  'current',
  'active',
  'completed',
  'due-soon',
  'overdue',
];
const styleOptions = [
  'nova',
  'vega',
  'maia',
  'lyra',
  'mira',
  'luma',
  'sera',
  'rhea',
];
const themeOptions = [
  'blue',
  'red',
  'rose',
  'orange',
  'green',
  'yellow',
  'violet',
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
  const [colorMode, setColorMode] = useState(() =>
    readPreference('projectly-color-mode', ['light', 'dark', 'auto'], 'auto'),
  );
  const [systemColorMode, setSystemColorMode] = useState(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light',
  );
  const [animationMode, setAnimationMode] = useState(() =>
    readPreference('projectly-animation-mode', ['auto', 'on', 'off'], 'auto'),
  );
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [style, setStyle] = useState(() =>
    readPreference('projectly-style', styleOptions, 'nova'),
  );
  const [theme, setTheme] = useState(() =>
    readPreference('projectly-theme', themeOptions, 'blue'),
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
  const animationsEnabled =
    animationMode === 'on' ||
    (animationMode === 'auto' && !prefersReducedMotion);

  useEffect(() => {
    const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleColorSchemeChange = (event) => {
      setSystemColorMode(event.matches ? 'dark' : 'light');
    };

    colorSchemeQuery.addEventListener('change', handleColorSchemeChange);
    return () =>
      colorSchemeQuery.removeEventListener('change', handleColorSchemeChange);
  }, []);

  useEffect(() => {
    const reducedMotionQuery = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    );
    const handleReducedMotionChange = (event) => {
      setPrefersReducedMotion(event.matches);
    };

    reducedMotionQuery.addEventListener('change', handleReducedMotionChange);
    return () =>
      reducedMotionQuery.removeEventListener(
        'change',
        handleReducedMotionChange,
      );
  }, []);

  useEffect(() => {
    const effectiveColorMode =
      colorMode === 'auto' ? systemColorMode : colorMode;
    document.documentElement.classList.toggle(
      'dark',
      effectiveColorMode === 'dark',
    );
    document.documentElement.dataset.animations = animationsEnabled
      ? 'on'
      : 'off';
    document.documentElement.dataset.style = style;
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('projectly-color-mode', colorMode);
    window.localStorage.setItem('projectly-animation-mode', animationMode);
    window.localStorage.setItem('projectly-style', style);
    window.localStorage.setItem('projectly-theme', theme);
    window.localStorage.setItem(
      'projectly-default-task-filter',
      defaultTaskFilter,
    );
    window.localStorage.setItem('projectly-week-start', String(weekStartsOn));
  }, [
    animationMode,
    animationsEnabled,
    colorMode,
    defaultTaskFilter,
    style,
    systemColorMode,
    theme,
    weekStartsOn,
  ]);

  return {
    animationMode,
    animationsEnabled,
    colorMode,
    defaultTaskFilter,
    setAnimationMode,
    setColorMode,
    setDefaultTaskFilter,
    setStyle,
    setTheme,
    setWeekStartsOn,
    style,
    theme,
    weekStartsOn,
  };
}
