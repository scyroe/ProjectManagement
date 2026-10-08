import { useVirtualizer } from '@tanstack/react-virtual';
import { useEffect, useRef, useState } from 'react';

const defaultGetItemKey = (item, index) => item?.id ?? index;

const VirtualList = ({
  ariaLabel,
  className = '',
  estimateSize = 72,
  getItemKey = defaultGetItemKey,
  itemClassName = '',
  items,
  onScroll,
  overscan = 6,
  renderItem,
  semantic = true,
}) => {
  const viewportRef = useRef(null);
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => viewportRef.current,
    estimateSize: (index) =>
      typeof estimateSize === 'function'
        ? estimateSize(items[index], index)
        : estimateSize,
    getItemKey: (index) => getItemKey(items[index], index),
    overscan,
  });

  const virtualRows = virtualizer.getVirtualItems().map((virtualItem) => {
    const item = items[virtualItem.index];
    const itemStyle = { transform: `translateY(${virtualItem.start}px)` };
    const content = renderItem(item, virtualItem.index);

    return semantic ? (
      <li
        key={virtualItem.key}
        ref={virtualizer.measureElement}
        data-index={virtualItem.index}
        aria-setsize={items.length}
        aria-posinset={virtualItem.index + 1}
        className={`absolute top-0 left-0 w-full ${itemClassName}`}
        style={itemStyle}
      >
        {content}
      </li>
    ) : (
      <div
        key={virtualItem.key}
        ref={virtualizer.measureElement}
        data-index={virtualItem.index}
        className={`absolute top-0 left-0 w-full ${itemClassName}`}
        style={itemStyle}
      >
        {content}
      </div>
    );
  });

  return (
    <div
      ref={viewportRef}
      className={`min-h-0 overflow-auto ${className}`}
      onScroll={onScroll}
    >
      {semantic ? (
        <ul
          aria-label={ariaLabel}
          className="relative m-0 w-full list-none p-0"
          style={{ height: virtualizer.getTotalSize() }}
        >
          {virtualRows}
        </ul>
      ) : (
        <div
          className="relative w-full"
          style={{ height: virtualizer.getTotalSize() }}
        >
          {virtualRows}
        </div>
      )}
    </div>
  );
};

const VirtualGrid = ({
  className = '',
  estimateSize = 240,
  getItemKey = defaultGetItemKey,
  items,
  overscan = 3,
  renderItem,
}) => {
  const viewportRef = useRef(null);
  const [columnCount, setColumnCount] = useState(1);
  const rowCount = Math.ceil(items.length / columnCount);
  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => viewportRef.current,
    estimateSize: (index) =>
      typeof estimateSize === 'function'
        ? estimateSize(items[index * columnCount], index)
        : estimateSize,
    getItemKey: (index) =>
      getItemKey(items[index * columnCount], index * columnCount),
    overscan,
  });

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return undefined;

    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      setColumnCount(width >= 1280 ? 3 : width >= 640 ? 2 : 1);
    });
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  const virtualRows = virtualizer.getVirtualItems().map((virtualRow) => {
    const firstIndex = virtualRow.index * columnCount;
    const rowItems = items.slice(firstIndex, firstIndex + columnCount);
    return (
      <div
        key={virtualRow.key}
        ref={virtualizer.measureElement}
        data-index={virtualRow.index}
        className="absolute top-0 left-0 grid w-full gap-3 pb-3"
        style={{
          gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
          transform: `translateY(${virtualRow.start}px)`,
        }}
      >
        {rowItems.map((item, itemIndex) => {
          const index = firstIndex + itemIndex;
          return (
            <div key={getItemKey(item, index)} className="min-w-0">
              {renderItem(item, index)}
            </div>
          );
        })}
      </div>
    );
  });

  return (
    <div ref={viewportRef} className={`min-h-0 overflow-auto ${className}`}>
      <div
        className="relative w-full"
        style={{ height: virtualizer.getTotalSize() }}
      >
        {virtualRows}
      </div>
    </div>
  );
};

export { VirtualGrid, VirtualList };
