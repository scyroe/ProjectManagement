import {
  Bell,
  Keyboard,
  PanelRightClose,
  PanelRightOpen,
  Settings2,
  UserRound,
} from 'lucide-react';
import {
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from '@/components/reui/frame';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useStrings } from '@/lib/i18n';

const UserPanel = ({
  collapsed,
  email,
  notifications,
  onExpand,
  onOpenNotification,
  onSettings,
  onShortcuts,
  onToggle,
  profile,
  syncStatus,
  unreadCount,
}) => {
  const strings = useStrings();
  const t = strings.layout.userPanel;
  const syncStatusLabel = strings.layout.syncStatus[syncStatus];

  return (
    <aside
      className={`fixed inset-y-0 right-0 z-30 flex-col border-l bg-card transition-[width] duration-200 ${
        collapsed
          ? 'hidden lg:flex lg:w-[49px]'
          : 'flex w-[min(20rem,calc(100vw-3rem))] lg:flex lg:w-80'
      }`}
    >
      <Frame
        className="h-full rounded-none border-0"
        stacked
        dense
        maximizable={false}
      >
        <FrameHeader
          className={`h-16 shrink-0 flex-row items-center border-b border-border ${
            collapsed ? 'grid place-items-center px-0' : 'justify-between gap-3'
          }`}
        >
          {!collapsed && (
            <div className="min-w-0">
              <FrameTitle>{t.title}</FrameTitle>
              <FrameDescription>
                {email ?? profile?.username ?? ''}
              </FrameDescription>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon-lg"
            aria-label={collapsed ? t.expand : t.collapse}
            title={collapsed ? t.expand : t.collapse}
            onClick={onToggle}
          >
            {collapsed ? <PanelRightOpen /> : <PanelRightClose />}
          </Button>
        </FrameHeader>
        <FramePanel
          className={`flex-1 overflow-y-auto border-0 bg-transparent shadow-none ${
            collapsed ? 'flex flex-col items-center p-2' : 'space-y-6 p-5'
          }`}
        >
          {collapsed ? (
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
              <span
                role="img"
                className={`mt-2 size-2 rounded-full ${
                  syncStatus === 'connected'
                    ? 'bg-success'
                    : syncStatus === 'offline' || syncStatus === 'error'
                      ? 'bg-destructive'
                      : 'bg-warning'
                }`}
                title={syncStatusLabel}
                aria-label={syncStatusLabel}
              />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-3">
                <Avatar size="lg">
                  <AvatarFallback>
                    {(profile?.display_name ?? email ?? '?')
                      .slice(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold">
                    {profile?.display_name ?? t.memberFallback}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {email ?? profile?.username}
                  </p>
                  <p
                    className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"
                    aria-live="polite"
                  >
                    <span
                      className={`size-1.5 rounded-full ${
                        syncStatus === 'connected'
                          ? 'bg-success'
                          : syncStatus === 'offline' || syncStatus === 'error'
                            ? 'bg-destructive'
                            : 'bg-warning'
                      }`}
                    />
                    {syncStatusLabel}
                  </p>
                </div>
              </div>
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold">{t.notifications}</h3>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div className="space-y-2" aria-live="polite">
                  {notifications.length ? (
                    notifications.map((notification) => (
                      <button
                        key={notification.id}
                        type="button"
                        className={`w-full rounded-lg border bg-card p-3 text-left focus-visible:ring-3 focus-visible:ring-ring/50 ${
                          notification.read_at
                            ? ''
                            : 'border-primary/40 bg-primary/5'
                        }`}
                        onClick={() => onOpenNotification(notification)}
                      >
                        <span className="block text-sm font-medium">
                          {t.notificationKinds[notification.kind] ??
                            notification.title}
                        </span>
                        {notification.body && (
                          <span className="mt-1 block text-xs text-muted-foreground">
                            {notification.body}
                          </span>
                        )}
                      </button>
                    ))
                  ) : (
                    <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                      {t.noNotifications}
                    </p>
                  )}
                </div>
              </section>
            </>
          )}
        </FramePanel>
        <FrameFooter
          className={`border-t ${collapsed ? 'items-center p-2' : ''}`}
        >
          {collapsed ? (
            <Button
              variant="ghost"
              size="icon"
              className="mx-auto"
              aria-label={t.settings}
              title={t.settings}
              onClick={onSettings}
            >
              <Settings2 />
            </Button>
          ) : (
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
          )}
        </FrameFooter>
      </Frame>
    </aside>
  );
};

export default UserPanel;
