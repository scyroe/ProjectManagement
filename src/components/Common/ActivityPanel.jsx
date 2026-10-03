import { useMemo, useState } from 'react';
import {
  filterEntriesByRange,
  getRangeBounds,
  groupEntriesByUser,
} from '@/lib/activity';
import ActivityRangeFilter from './ActivityRangeFilter';
import { AnimatedTabPanel } from './animated-tabs';
import ContributorSummary from './ContributorSummary';

const ActivityPanel = ({ entries, showTask = false }) => {
  const [preset, setPreset] = useState('last7');
  const [custom, setCustom] = useState({ from: '', to: '' });

  const groups = useMemo(() => {
    const bounds = getRangeBounds(preset, custom);
    return groupEntriesByUser(filterEntriesByRange(entries, bounds));
  }, [custom, entries, preset]);

  return (
    <div className="space-y-3">
      <ActivityRangeFilter
        preset={preset}
        onPresetChange={setPreset}
        custom={custom}
        onCustomChange={setCustom}
      />
      <AnimatedTabPanel activeId={preset} className="min-h-0">
        <ContributorSummary groups={groups} showTask={showTask} />
      </AnimatedTabPanel>
    </div>
  );
};

export default ActivityPanel;
