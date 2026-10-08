import { useMemo, useState } from 'react';
import {
  filterEntriesByRange,
  getRangeBounds,
  groupEntriesByUser,
} from '@/lib/activity';
import ActivityRangeFilter from './ActivityRangeFilter';
import { AnimatedTabPanel } from './animated-tabs';
import ContributorSummary from './ContributorSummary';

const ActivityPanel = ({
  entries,
  showTask = false,
  scrollable = true,
  status,
}) => {
  const [preset, setPreset] = useState('last7');
  const [custom, setCustom] = useState({ from: '', to: '' });

  const groups = useMemo(() => {
    const bounds = getRangeBounds(preset, custom);
    return groupEntriesByUser(filterEntriesByRange(entries, bounds));
  }, [custom, entries, preset]);

  return (
    <div
      className={
        scrollable ? 'space-y-3' : 'flex h-full min-h-0 flex-col gap-3'
      }
    >
      <div className={scrollable ? '' : 'shrink-0'}>
        <ActivityRangeFilter
          preset={preset}
          onPresetChange={setPreset}
          custom={custom}
          onCustomChange={setCustom}
        />
      </div>
      <AnimatedTabPanel
        activeId={preset}
        className={scrollable ? 'min-h-0' : 'min-h-0 flex-1 overflow-y-auto'}
      >
        {status}
        <ContributorSummary
          groups={groups}
          showTask={showTask}
          scrollable={scrollable}
        />
      </AnimatedTabPanel>
    </div>
  );
};

export default ActivityPanel;
