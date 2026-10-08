import {
  Check,
  Globe,
  Monitor,
  Moon,
  Palette,
  Pause,
  Play,
  Sun,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import WorkspaceSwitcher from '@/components/layout/WorkspaceSwitcher';
import VirtualSelect from '@/components/ui/virtual-select';
import { supportedLanguages, useLanguage } from '@/lib/i18n';
import { supabaseTransferDiagnosticsStorageKey } from '@/lib/supabase-transfer-diagnostics';
import WorkspaceAdministration from './WorkspaceAdministration';
import WorkspaceDataTools from './WorkspaceDataTools';

const shapeByStyleId = {
  nova: 'rounded-full',
  vega: 'rounded-md',
  maia: 'rounded-lg',
  lyra: 'rounded-none',
  mira: 'rounded-sm',
  luma: 'rounded-2xl',
  sera: 'rounded-none',
  rhea: 'rounded',
};

const swatchByThemeId = {
  blue: 'bg-blue-500',
  red: 'bg-red-500',
  rose: 'bg-rose-500',
  orange: 'bg-orange-500',
  green: 'bg-green-500',
  yellow: 'bg-yellow-400',
  violet: 'bg-violet-500',
};

function SettingsPage({
  colorMode,
  onColorModeChange,
  animationMode,
  onAnimationModeChange,
  style,
  onStyleChange,
  theme,
  onThemeChange,
  defaultTaskFilter,
  onDefaultTaskFilterChange,
  weekStartsOn,
  onWeekStartsOnChange,
  userId,
  workspaces,
}) {
  const { language, setLanguage, strings } = useLanguage();
  const t = strings.settingsDialog;
  const [transferDiagnosticsEnabled, setTransferDiagnosticsEnabled] = useState(
    () =>
      import.meta.env.DEV &&
      typeof window !== 'undefined' &&
      window.localStorage.getItem(supabaseTransferDiagnosticsStorageKey) ===
        'true',
  );
  const styleOptions = useMemo(
    () =>
      t.styles.map((option) => ({
        ...option,
        shape: shapeByStyleId[option.id],
      })),
    [t.styles],
  );
  const themeOptions = useMemo(
    () =>
      t.themes.map((option) => ({
        ...option,
        swatch: swatchByThemeId[option.id],
      })),
    [t.themes],
  );

  return (
    <div className="grid w-full flex-1 grid-cols-1 gap-4 pb-2 lg:grid-cols-2">
      <h1 className="sr-only">{t.title}</h1>
      <section className="order-1 space-y-4 rounded-xl border bg-card p-4">
        <header className="flex items-center gap-2">
          <Palette className="size-4 text-primary" aria-hidden="true" />
          <h2 className="text-sm font-semibold">{t.appearanceBadge}</h2>
        </header>
        <section>
          <div className="mb-2">
            <h3 className="text-sm font-semibold">{t.styleTitle}</h3>
            <p className="text-xs text-muted-foreground">
              {t.styleDescription}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {styleOptions.map((option) => {
              const selected = style === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onStyleChange(option.id)}
                  className={`grid grid-cols-[1rem_minmax(0,1fr)_1rem] content-start items-center gap-x-2 gap-y-1 rounded-lg border p-2 text-left transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 ${selected ? 'border-primary bg-primary/5' : 'hover:border-primary/40 hover:bg-muted/50'}`}
                >
                  <span
                    className={`col-start-1 row-start-1 size-4 bg-primary ${option.shape}`}
                  />
                  <span className="col-start-2 row-start-1 block text-sm font-medium">
                    {option.name}
                  </span>
                  {selected && (
                    <Check className="col-start-3 row-start-1 size-4 text-primary" />
                  )}
                  <span className="col-start-1 col-end-4 row-start-2 self-start text-xs leading-4 text-muted-foreground">
                    {option.description}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
        <section>
          <div className="mb-2">
            <h3 className="text-sm font-semibold">{t.themeTitle}</h3>
            <p className="text-xs text-muted-foreground">
              {t.themeDescription}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {themeOptions.map((option) => {
              const selected = theme === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onThemeChange(option.id)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 ${selected ? 'border-primary bg-primary/5' : 'hover:border-primary/40 hover:bg-muted/50'}`}
                >
                  <span className={`size-4 rounded-full ${option.swatch}`} />
                  {option.name}
                  {selected && (
                    <Check className="ml-auto size-4 text-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </section>
      </section>

      <section className="order-2 space-y-4 rounded-xl border bg-card p-4">
        <h2 className="text-sm font-semibold">{t.interfaceTitle}</h2>
        <section>
          <div className="mb-2">
            <h3 className="text-sm font-semibold">{t.colorModeTitle}</h3>
            <p className="text-xs text-muted-foreground">
              {t.colorModeDescription}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              ['auto', t.auto, Monitor],
              ['light', t.light, Sun],
              ['dark', t.dark, Moon],
            ].map(([value, label, Icon]) => {
              const selected = colorMode === value;
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onColorModeChange(value)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 ${selected ? 'border-primary bg-primary/5 text-primary' : 'hover:border-primary/40 hover:bg-muted/50'}`}
                >
                  <Icon className="size-4" />
                  {label}
                  {selected && <Check className="ml-auto size-4" />}
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <div className="mb-2">
            <h3 className="text-sm font-semibold">{t.animationsTitle}</h3>
            <p className="text-xs text-muted-foreground">
              {t.animationsDescription}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              ['auto', t.animationsAuto, Monitor],
              ['on', t.animationsOn, Play],
              ['off', t.animationsOff, Pause],
            ].map(([value, label, Icon]) => {
              const selected = animationMode === value;
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onAnimationModeChange(value)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 ${selected ? 'border-primary bg-primary/5 text-primary' : 'hover:border-primary/40 hover:bg-muted/50'}`}
                >
                  <Icon className="size-4" />
                  {label}
                  {selected && <Check className="ml-auto size-4" />}
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <div className="mb-2">
            <h3 className="text-sm font-semibold">{t.languageTitle}</h3>
            <p className="text-xs text-muted-foreground">
              {t.languageDescription}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {supportedLanguages.map(({ id }) => {
              const selected = language === id;
              const label = id === 'en' ? t.english : t.romanian;
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setLanguage(id)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 ${selected ? 'border-primary bg-primary/5 text-primary' : 'hover:border-primary/40 hover:bg-muted/50'}`}
                >
                  <Globe className="size-4" />
                  {label}
                  {selected && <Check className="ml-auto size-4" />}
                </button>
              );
            })}
          </div>
        </section>
      </section>

      <section className="order-5 space-y-4 rounded-xl border bg-card p-4">
        <section className="space-y-2">
          <h2 className="text-sm font-semibold">
            {workspaces.strings.switchLabel}
          </h2>
          <WorkspaceSwitcher workspaces={workspaces} />
        </section>
        <section>
          <div className="mb-3">
            <h2 className="text-sm font-semibold">
              {t.workspaceDefaultsTitle}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t.workspaceDefaultsDescription}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label
                className="text-xs font-medium"
                htmlFor="default-task-filter"
              >
                {t.defaultTaskFilterTitle}
              </label>
              <VirtualSelect
                ariaLabel={t.defaultTaskFilterTitle}
                searchLabel={t.defaultTaskFilterTitle}
                value={defaultTaskFilter}
                onChange={onDefaultTaskFilterChange}
                options={[
                  ['current', t.taskFilters.current],
                  ['active', t.taskFilters.active],
                  ['completed', t.taskFilters.completed],
                  ['due-soon', t.taskFilters.dueSoon],
                  ['overdue', t.taskFilters.overdue],
                ].map(([value, label]) => ({ value, label }))}
                id="default-task-filter"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium" htmlFor="week-start-day">
                {t.weekStartTitle}
              </label>
              <VirtualSelect
                id="week-start-day"
                ariaLabel={t.weekStartTitle}
                searchLabel={t.weekStartTitle}
                value={String(weekStartsOn)}
                onChange={(value) => onWeekStartsOnChange(Number(value))}
                options={[
                  { value: '0', label: t.sunday },
                  { value: '1', label: t.monday },
                ]}
              />
            </div>
          </div>
        </section>
      </section>

      <section className="order-3 space-y-4 rounded-xl border bg-card p-4">
        <section className="space-y-3">
          <div>
            <h2 className="text-sm font-semibold">
              {workspaces.strings.notificationsTitle}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {workspaces.strings.notificationsDescription}
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {Object.entries(workspaces.strings.notificationKinds).map(
              ([kind, label]) => (
                <label
                  key={kind}
                  className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={workspaces.notificationPreferences[kind] !== false}
                    onChange={(event) =>
                      workspaces.updateNotificationPreferences({
                        notification_preferences: {
                          ...workspaces.notificationPreferences,
                          [kind]: event.target.checked,
                        },
                      })
                    }
                  />
                  {label}
                </label>
              ),
            )}
          </div>
          <div className="max-w-xs space-y-1">
            <label
              className="text-xs font-medium"
              htmlFor="notification-digest"
            >
              {workspaces.strings.digest}
            </label>
            <VirtualSelect
              id="notification-digest"
              ariaLabel={workspaces.strings.digest}
              searchLabel={workspaces.strings.digest}
              value={workspaces.digestFrequency}
              onChange={(digest_frequency) =>
                workspaces.updateNotificationPreferences({ digest_frequency })
              }
              options={['off', 'daily', 'weekly'].map((value) => ({
                value,
                label: workspaces.strings.digestFrequencies[value],
              }))}
            />
            <p className="text-xs text-muted-foreground">
              {workspaces.strings.digestDeliveryNote}
            </p>
          </div>
        </section>
      </section>

      {workspaces.canManageMembers && (
        <div className="order-4 rounded-xl border bg-card p-4">
          <WorkspaceAdministration userId={userId} workspaces={workspaces} />
        </div>
      )}
      <div className="order-6 rounded-xl border bg-card p-4">
        <WorkspaceDataTools
          userId={userId}
          workspaceId={workspaces.activeWorkspaceId}
        />
      </div>
      {import.meta.env.DEV && (
        <section className="order-7 space-y-3 rounded-xl border bg-card p-4">
          <div>
            <h2 className="text-sm font-semibold">
              {t.transferDiagnosticsTitle}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {t.transferDiagnosticsDescription}
            </p>
          </div>
          <label className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
            <input
              type="checkbox"
              checked={transferDiagnosticsEnabled}
              onChange={(event) => {
                const enabled = event.target.checked;
                window.localStorage.setItem(
                  supabaseTransferDiagnosticsStorageKey,
                  String(enabled),
                );
                setTransferDiagnosticsEnabled(enabled);
              }}
            />
            {t.transferDiagnosticsToggle}
          </label>
        </section>
      )}
    </div>
  );
}

export default SettingsPage;
