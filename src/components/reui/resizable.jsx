import { cn } from 'cn';
import { GripHorizontal, GripVertical } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export function ResizableVertical({
  top,
  bottom,
  defaultTop = 48,
  minTop = 24,
  maxTop = 76,
  className,
}) {
  const [topPercent, setTopPercent] = useState(defaultTop);
  const dragging = useRef(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handlePointerMove = (event) => {
      if (!dragging.current) return;
      const container = containerRef.current;
      if (!container) return;
      const bounds = container.getBoundingClientRect();
      const next = ((event.clientY - bounds.top) / bounds.height) * 100;
      setTopPercent(Math.min(maxTop, Math.max(minTop, next)));
    };
    const stopDragging = () => {
      dragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', stopDragging);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', stopDragging);
    };
  }, [maxTop, minTop]);

  return (
    <div
      ref={containerRef}
      data-resizable-container
      className={cn('flex min-h-0 flex-col overflow-hidden', className)}
      onPointerMove={(event) => {
        if (!dragging.current) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        const next = ((event.clientY - bounds.top) / bounds.height) * 100;
        setTopPercent(Math.min(maxTop, Math.max(minTop, next)));
      }}
    >
      <div
        className="min-h-0 overflow-auto"
        style={{ height: `${topPercent}%` }}
      >
        {top}
      </div>
      <button
        type="button"
        aria-label="Resize task panels"
        className="group relative z-10 flex h-3 shrink-0 cursor-row-resize items-center justify-center border-y border-border bg-muted/40 hover:bg-primary/10"
        onPointerDown={() => {
          dragging.current = true;
          document.body.style.cursor = 'row-resize';
          document.body.style.userSelect = 'none';
        }}
      >
        <GripHorizontal className="size-4 text-muted-foreground transition-colors group-hover:text-primary" />
      </button>
      <div className="min-h-0 flex-1 overflow-auto">{bottom}</div>
    </div>
  );
}

export function ResizableResponsive({
  first,
  second,
  defaultSize = 46,
  minSize = 28,
  maxSize = 72,
  className,
}) {
  const [size, setSize] = useState(defaultSize);
  const dragging = useRef(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const updateSize = (event) => {
      if (!dragging.current || !containerRef.current) return;
      const bounds = containerRef.current.getBoundingClientRect();
      const isDesktop = window.matchMedia('(min-width: 768px)').matches;
      const next = isDesktop
        ? ((event.clientX - bounds.left) / bounds.width) * 100
        : ((event.clientY - bounds.top) / bounds.height) * 100;
      setSize(Math.min(maxSize, Math.max(minSize, next)));
    };
    const stopDragging = () => {
      dragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('pointermove', updateSize);
    window.addEventListener('pointerup', stopDragging);
    return () => {
      window.removeEventListener('pointermove', updateSize);
      window.removeEventListener('pointerup', stopDragging);
    };
  }, [maxSize, minSize]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex min-h-0 flex-col overflow-hidden md:flex-row',
        className,
      )}
    >
      <div
        className="h-[var(--panel-size)] min-h-0 min-w-0 w-full shrink-0 overflow-x-hidden overflow-y-auto md:h-full md:w-[var(--panel-size)]"
        style={{ '--panel-size': `${size}%` }}
        data-resizable-first
      >
        {first}
      </div>
      <button
        type="button"
        aria-label="Resize task panels"
        className="group relative z-10 flex h-3 w-full shrink-0 cursor-row-resize items-center justify-center border-y border-border bg-muted/40 hover:bg-primary/10 md:h-full md:w-3 md:cursor-col-resize md:border-y-0 md:border-x"
        onPointerDown={() => {
          dragging.current = true;
          document.body.style.cursor = window.matchMedia('(min-width: 768px)')
            .matches
            ? 'col-resize'
            : 'row-resize';
          document.body.style.userSelect = 'none';
        }}
      >
        <GripHorizontal className="size-4 text-muted-foreground transition-colors group-hover:text-primary md:hidden" />
        <GripVertical className="hidden size-4 text-muted-foreground transition-colors group-hover:text-primary md:block" />
      </button>
      <div className="min-h-0 min-w-0 w-full flex-1 overflow-x-hidden overflow-y-auto md:w-0">
        {second}
      </div>
    </div>
  );
}
