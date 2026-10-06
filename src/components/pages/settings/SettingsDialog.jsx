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
import { useMemo } from 'react';
import { Badge } from '@/components/reui/badge';
import { Frame, FramePanel } from '@/components/reui/frame';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import VirtualSelect from '@/components/ui/virtual-select';
import { supportedLanguages, useLanguage } from '@/lib/i18n';
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

const SettingsDialog = ({
  open,
  onOpenChange,
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
  tasks = [],
  userId,
}) => {
  const { language, setLanguage, strings } = useLanguage();
  const t = strings.settingsDialog;
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-2xl overflow-y-auto">
        <div className="space-y-1 pr-8">
          <div className="flex items-center gap-2 text-primary">
            <Palette className="size-4" />
            <Badge variant="secondary" size="sm">
              {t.appearanceBadge}
            </Badge>
          </div>
          <DialogTitle className="text-xl font-semibold">{t.title}</DialogTitle>
          <DialogDescription>{t.description}</DialogDescription>
        </div>

        <Frame className="mt-6" stacked dense maximizable={false}>
          <FramePanel className="space-y-5 p-4 shadow-none">
            <section>
              <div className="mb-2">
                <h3 className="text-sm font-semibold">{t.styleTitle}</h3>
                <p className="text-xs text-muted-foreground">
                  {t.styleDescription}
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {styleOptions.map((option) => {
                  const selected = style === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => onStyleChange(option.id)}
                      className={`relative rounded-lg border p-3 text-left transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 ${selected ? 'border-primary bg-primary/5' : 'hover:border-primary/40 hover:bg-muted/50'}`}
                    >
                      <span
                        className={`mb-3 block size-5 bg-primary ${option.shape}`}
                      />
                      <span className="block text-sm font-medium">
                        {option.name}
                      </span>
                      <span className="mt-1 block text-xs leading-4 text-muted-foreground">
                        {option.description}
                      </span>
                      {selected && (
                        <Check className="absolute top-3 right-3 size-4 text-primary" />
                      )}
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
                      <span
                        className={`size-4 rounded-full ${option.swatch}`}
                      />
                      {option.name}
                      {selected && (
                        <Check className="ml-auto size-4 text-primary" />
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

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
            <section>
              <div className="mb-3">
                <h3 className="text-sm font-semibold">
                  {t.workspaceDefaultsTitle}
                </h3>
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
                  <label
                    className="text-xs font-medium"
                    htmlFor="week-start-day"
                  >
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
            <WorkspaceDataTools tasks={tasks} userId={userId} />
          </FramePanel>
        </Frame>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
