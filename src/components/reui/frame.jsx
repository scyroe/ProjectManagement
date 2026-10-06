import { cva } from 'class-variance-authority';
import { cn } from 'cn';
import { Maximize2, Minimize2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useStrings } from '@/lib/i18n';

/**
 * Frame sets --frame-panel-bg and --frame-panel-border-color; FramePanel reads
 * them back as bg-(--frame-panel-bg) and border-(--frame-panel-border-color).
 * So variant="inverse" re-points every panel from one place, and a consumer's
 * own bg-* on a panel still wins on source order, with no :not() and no `!`.
 */
const frameVariants = cva(
  [
    'relative flex flex-col bg-muted/50 gap-(--frame-gap) px-(--frame-px) py-(--frame-py) rounded-(--frame-radius)',
    // Each rung is the radius that style's own .cn-card resolves through, so a
    // Frame and a Card side by side agree. lyra/sera are 0px, NOT
    // var(--radius-none): no such token exists, and it only reached 0 by being
    // invalid, which also left --frame-radius empty for anything reading it.
    '[--frame-radius:var(--radius-xl)]',
    '[--frame-gap:--spacing(0.75)] [--frame-px:--spacing(0.75)] [--frame-py:--spacing(0.75)] [--frame-panel-header-gap:0rem] [--frame-panel-footer-gap:--spacing(1)]',
    '[--frame-panel-px-adjust:0px] [--frame-panel-py-adjust:0px] [--frame-panel-header-px-adjust:0px] [--frame-panel-header-py-adjust:0px] [--frame-panel-footer-px-adjust:0px] [--frame-panel-footer-py-adjust:0px]',
    '[--frame-panel-px:calc(var(--frame-panel-px-base)+var(--frame-panel-px-adjust))] [--frame-panel-py:calc(var(--frame-panel-py-base)+var(--frame-panel-py-adjust))] [--frame-panel-header-px:calc(var(--frame-panel-header-px-base)+var(--frame-panel-header-px-adjust))] [--frame-panel-header-py:calc(var(--frame-panel-header-py-base)+var(--frame-panel-header-py-adjust))] [--frame-panel-footer-px:calc(var(--frame-panel-footer-px-base)+var(--frame-panel-footer-px-adjust))] [--frame-panel-footer-py:calc(var(--frame-panel-footer-py-base)+var(--frame-panel-footer-py-adjust))]',
    // Frame spacing scales globally through the selected style's --spacing.
    '',
    '[--frame-panel-bg:var(--color-card)] [--frame-panel-border-color:var(--color-border)] [--frame-border-color:var(--color-border)]',
    // Concentric: the panel nests inside the frame's corner rather than copying
    // it. It is inset by the 1px border plus --frame-px, so subtracting exactly
    // that keeps the two arcs parallel. `ghost` drops the border term (no
    // border), `dense` pins it to the frame radius (panels sit flush).
    '[--frame-panel-radius:calc(var(--frame-radius)-var(--frame-px)-1px)]',
  ],
  {
    variants: {
      variant: {
        default: 'border border-[var(--frame-border-color)] bg-clip-padding',
        inverse:
          '[--frame-panel-bg:color-mix(in_oklch,var(--color-muted)_40%,transparent)] border border-[var(--frame-border-color)] bg-background bg-clip-padding',
        ghost:
          '[--frame-panel-radius:calc(var(--frame-radius)-var(--frame-px))]',
      },
      // Bars read as chrome, not a second content block: py runs 0.5/1.5/2/2.5
      // against a body py of 2/3.5/4/5, while px stays level with the body so
      // header, content and footer left-align. xs floors at 0.5 (2px), below
      // which it stops reading as padding. The selected style scales each rung
      // consistently through the shared --spacing token.
      spacing: {
        xs: '[--frame-panel-px-base:--spacing(2)] [--frame-panel-py-base:--spacing(2)] [--frame-panel-header-px-base:--spacing(2)] [--frame-panel-header-py-base:--spacing(0.5)] [--frame-panel-footer-px-base:--spacing(2)] [--frame-panel-footer-py-base:--spacing(0.5)]',
        sm: '[--frame-panel-px-base:--spacing(3)] [--frame-panel-py-base:--spacing(3.5)] [--frame-panel-header-px-base:--spacing(3)] [--frame-panel-header-py-base:--spacing(1.5)] [--frame-panel-footer-px-base:--spacing(3)] [--frame-panel-footer-py-base:--spacing(1.5)]',
        default:
          '[--frame-panel-px-base:--spacing(4)] [--frame-panel-py-base:--spacing(4)] [--frame-panel-header-px-base:--spacing(4)] [--frame-panel-header-py-base:--spacing(2)] [--frame-panel-footer-px-base:--spacing(4)] [--frame-panel-footer-py-base:--spacing(2)]',
        lg: '[--frame-panel-px-base:--spacing(5)] [--frame-panel-py-base:--spacing(5)] [--frame-panel-header-px-base:--spacing(5)] [--frame-panel-header-py-base:--spacing(2.5)] [--frame-panel-footer-px-base:--spacing(5)] [--frame-panel-footer-py-base:--spacing(2.5)]',
      },
      stacked: {
        true: [
          'gap-0 *:has-[+[data-slot=frame-panel]]:rounded-b-none',
          '*:has-[+[data-slot=frame-panel]]:before:hidden',
          '*:[[data-slot=frame-panel]+[data-slot=frame-panel]]:rounded-t-none',
          '*:[[data-slot=frame-panel]+[data-slot=frame-panel]]:border-t-0',
        ],
        false: [
          'data-[spacing=sm]:*:[[data-slot=frame-panel]+[data-slot=frame-panel]]:mt-0.5',
          'data-[spacing=default]:*:[[data-slot=frame-panel]+[data-slot=frame-panel]]:mt-1',
          'data-[spacing=lg]:*:[[data-slot=frame-panel]+[data-slot=frame-panel]]:mt-2',
        ],
      },
      dense: {
        // Parent selectors, not CSS vars: these are positional. Panels are
        // pulled flush (-mx-px), so corners align with the frame's own radius.
        true: 'p-0 gap-0 border-[var(--frame-border-color)] [--frame-panel-radius:var(--frame-radius)] [&_[data-slot=frame-panel]]:-mx-px [&_[data-slot=frame-panel]]:before:hidden [&_[data-slot=frame-panel]:last-child]:-mb-px [&:not(:has([data-slot=frame-panel-header]))_[data-slot=frame-panel]:is(:first-child)]:-mt-px',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      spacing: 'default',
      stacked: false,
      dense: false,
    },
  },
);

function Frame({
  className,
  variant,
  spacing,
  stacked,
  dense,
  maximizable = true,
  ...props
}) {
  const t = useStrings().common;
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    if (!maximized) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setMaximized(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [maximized]);

  return (
    <div
      className={cn(
        frameVariants({ variant, spacing, stacked, dense }),
        maximized &&
          'fixed top-16 right-0 bottom-0 left-0 z-40 !h-auto overflow-auto rounded-none !bg-background shadow-xl lg:left-[var(--workspace-sidebar-width)] lg:right-[var(--workspace-user-panel-width)]',
        className,
      )}
      data-slot="frame"
      data-maximized={maximized}
      data-spacing={spacing}
      {...props}
    >
      {maximizable && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute top-0 right-0 z-10 rounded-none rounded-tr-[inherit] rounded-bl-md bg-primary text-white opacity-0 backdrop-blur transition-opacity hover:bg-primary/90 hover:text-white hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
          aria-label={maximized ? t.restoreCard : t.expandCard}
          title={maximized ? t.restoreCard : t.expandCard}
          aria-pressed={maximized}
          onClick={() => setMaximized((current) => !current)}
        >
          {maximized ? <Minimize2 /> : <Maximize2 />}
        </Button>
      )}
      {props.children}
    </div>
  );
}

function FramePanel({ className, fit, ...props }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-(--frame-panel-radius) border border-(--frame-panel-border-color) bg-(--frame-panel-bg) bg-clip-padding shadow-xs',
        // `fit` sizes the panel to its content; otherwise it grows to fill the frame.
        !fit && 'grow',
        'before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--frame-panel-radius)-1px)] before:shadow-black/5',
        'dark:bg-clip-border dark:before:shadow-white/5',
        'px-(--frame-panel-px) py-(--frame-panel-py)',
        className,
      )}
      data-slot="frame-panel"
      {...props}
    />
  );
}

function FrameHeader({ className, ...props }) {
  return (
    <header
      className={cn(
        'flex flex-col gap-(--frame-panel-header-gap) px-(--frame-panel-header-px) py-(--frame-panel-header-py)',
        className,
      )}
      data-slot="frame-panel-header"
      {...props}
    />
  );
}

function FrameTitle({ className, ...props }) {
  return (
    <div
      className={cn('text-sm font-semibold', className)}
      data-slot="frame-panel-title"
      {...props}
    />
  );
}

function FrameDescription({ className, ...props }) {
  return (
    <div
      className={cn('text-muted-foreground text-sm', className)}
      data-slot="frame-panel-description"
      {...props}
    />
  );
}

function FrameFooter({ className, ...props }) {
  return (
    <footer
      className={cn(
        'flex flex-col gap-(--frame-panel-footer-gap) px-(--frame-panel-footer-px) py-(--frame-panel-footer-py)',
        className,
      )}
      data-slot="frame-panel-footer"
      {...props}
    />
  );
}

export {
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
  frameVariants,
};
