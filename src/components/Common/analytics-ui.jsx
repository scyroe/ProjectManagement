import { m as motion } from 'motion/react';
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from '@/components/reui/frame';
import { useAnimationsEnabled } from './animation-preferences';

const metricStripColumns = {
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-4',
  5: 'sm:grid-cols-3 xl:grid-cols-5',
};

export function MetricCard({
  label,
  value,
  Icon,
  color,
  loading = false,
  onClick,
  compact = false,
}) {
  const animationsEnabled = useAnimationsEnabled();
  const canAnimate = onClick && animationsEnabled;

  return (
    <motion.div
      className="h-full"
      transition={{ type: 'spring', stiffness: 450, damping: 32 }}
      whileHover={canAnimate ? { y: -2 } : undefined}
      whileTap={canAnimate ? { scale: 0.985 } : undefined}
    >
      <Frame
        className={`h-full ${compact ? 'min-h-16' : 'min-h-20'} ${onClick ? 'cursor-pointer transition-colors hover:border-primary/50 hover:bg-primary/5' : ''}`}
        dense
        onClick={onClick}
        onKeyDown={
          onClick
            ? (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onClick();
                }
              }
            : undefined
        }
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
      >
        <FramePanel
          className={`flex flex-1 items-start justify-between ${
            compact ? 'p-2' : 'p-3'
          } shadow-none`}
        >
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <p
              className={`font-semibold tracking-tight ${
                compact ? 'mt-0.5 text-xl' : 'mt-1 text-2xl'
              }`}
            >
              {loading ? '-' : value}
            </p>
          </div>
          <Icon className={`${compact ? 'size-3.5' : 'size-4'} ${color}`} />
        </FramePanel>
      </Frame>
    </motion.div>
  );
}

export function MetricStrip({
  metrics,
  loading = false,
  onSelect,
  columns = 4,
  ariaLabel,
}) {
  const columnsClassName = metricStripColumns[columns] ?? metricStripColumns[4];
  const itemClassName =
    'flex min-h-10 w-full min-w-0 items-center gap-1.5 rounded-md px-2 py-1 text-left sm:gap-2 sm:px-2.5';

  return (
    <section
      aria-label={ariaLabel}
      className={`grid w-full grid-cols-2 gap-1.5 rounded-lg border bg-muted/30 p-1.5 ${columnsClassName}`}
    >
      {metrics.map(([label, value, Icon, color]) => {
        const content = (
          <>
            <Icon
              className={`size-3.5 shrink-0 sm:size-4 ${color}`}
              aria-hidden="true"
            />
            <span className="min-w-0 flex-1 truncate text-[11px] font-medium leading-tight text-muted-foreground sm:text-xs">
              {label}
            </span>
            <span className="shrink-0 text-base font-semibold tabular-nums tracking-tight">
              {loading ? '-' : value}
            </span>
          </>
        );

        return onSelect ? (
          <button
            key={label}
            type="button"
            className={`${itemClassName} transition-colors hover:bg-muted/70 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}
            onClick={() => onSelect(label)}
          >
            {content}
          </button>
        ) : (
          <div key={label} className={itemClassName}>
            {content}
          </div>
        );
      })}
    </section>
  );
}

export function CompactSectionHeader({
  title,
  description,
  action,
  titleClassName = 'text-sm',
  descriptionClassName = 'text-xs',
  headerClassName = '',
  actionClassName = '',
}) {
  return (
    <FrameHeader
      className={`flex-row items-start justify-between gap-2 ${headerClassName}`}
    >
      <div>
        <FrameTitle className={titleClassName}>{title}</FrameTitle>
        {description && (
          <FrameDescription className={descriptionClassName}>
            {description}
          </FrameDescription>
        )}
      </div>
      {action ? <div className={actionClassName}>{action}</div> : null}
    </FrameHeader>
  );
}

export function ProgressRow({
  label,
  value,
  progress,
  barClassName = 'bg-primary',
  labelClassName = 'text-xs',
  valueClassName = 'text-xs text-muted-foreground',
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3 text-xs">
        <span className={`truncate font-medium ${labelClassName}`}>
          {label}
        </span>
        <span className={valueClassName}>{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${barClassName} transition-[width] duration-500 ease-out`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export function ActivityFeed({
  items,
  emptyLabel,
  renderItem,
  icon: Icon,
  className = 'space-y-1 p-2',
  itemClassName = '',
}) {
  return (
    <FramePanel className={`shadow-none ${className}`}>
      {items.length ? (
        items.map((item) => (
          <div
            key={item.id}
            className={`flex items-start gap-2 ${itemClassName}`}
          >
            {Icon ? (
              <Icon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
            ) : null}
            {renderItem ? renderItem(item) : null}
          </div>
        ))
      ) : (
        <p className="p-4 text-center text-xs text-muted-foreground">
          {emptyLabel}
        </p>
      )}
    </FramePanel>
  );
}
