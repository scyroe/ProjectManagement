import { Bell, Keyboard, Settings2, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';

function UserPanelActions({ collapsed, onExpand, onSettings, onShortcuts, t }) {
  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="mx-auto"
          aria-label={t.expandNotifications}
          title={t.notifications}
          onClick={onExpand}
        >
          <Bell />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="mx-auto"
          aria-label={t.expand}
          title={t.account}
          onClick={onExpand}
        >
          <UserRound />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="mx-auto"
          aria-label={t.keyboardShortcuts}
          title={t.keyboardShortcuts}
          onClick={onShortcuts}
        >
          <Keyboard />
        </Button>
      </div>
    );
  }

  return (
    <div className="grid w-full gap-2">
      <Button
        variant="outline"
        className="w-full justify-start gap-2"
        aria-label={t.keyboardShortcuts}
        onClick={onShortcuts}
      >
        <Keyboard />
        {t.keyboardShortcuts}
      </Button>
      <Button
        variant="outline"
        className="w-full justify-start gap-2"
        aria-label={t.settings}
        onClick={onSettings}
      >
        <Settings2 />
        {t.settings}
      </Button>
    </div>
  );
}

export default UserPanelActions;
