import { PanelRightClose, PanelRightOpen, Settings2 } from 'lucide-react';
import {
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from '@/components/reui/frame';
import { Button } from '@/components/ui/button';
import { useStrings } from '@/lib/i18n';
import UserPanelActions from './UserPanelActions';
import UserPanelIdentity from './UserPanelIdentity';
import UserPanelNotifications from './UserPanelNotifications';

function UserPanel({
  collapsed,
  email,
  hasMoreNotifications,
  loadingMoreNotifications,
  notifications,
  onLoadMoreNotifications,
  onExpand,
  onMarkAllNotificationsRead,
  onMarkNotificationRead,
  onOpenNotification,
  onSettings,
  onShortcuts,
  onToggle,
  profile,
  syncStatus,
  unreadCount,
}) {
  const strings = useStrings();
  const t = strings.layout.userPanel;
  const syncStatusLabel = strings.layout.syncStatus[syncStatus];
  const syncStatusTone =
    syncStatus === 'connected'
      ? 'bg-success'
      : syncStatus === 'offline' || syncStatus === 'error'
        ? 'bg-destructive'
        : 'bg-warning';

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
          className={`flex min-h-0 flex-1 flex-col border-0 bg-transparent shadow-none ${
            collapsed
              ? 'items-center overflow-y-auto p-2'
              : 'overflow-hidden p-0'
          }`}
        >
          {collapsed ? (
            <div className="flex flex-col items-center gap-1">
              <UserPanelActions
                collapsed
                onExpand={onExpand}
                onShortcuts={onShortcuts}
                t={t}
                unreadCount={unreadCount}
              />
              <span
                role="img"
                className={`mt-2 size-2 rounded-full ${syncStatusTone}`}
                title={syncStatusLabel}
                aria-label={syncStatusLabel}
              />
            </div>
          ) : (
            <>
              <div className="shrink-0 px-5 pt-5">
                <UserPanelIdentity
                  email={email}
                  profile={profile}
                  syncStatusLabel={syncStatusLabel}
                  syncStatusTone={syncStatusTone}
                  t={t}
                />
              </div>
              <UserPanelNotifications
                hasMoreNotifications={hasMoreNotifications}
                loadingMoreNotifications={loadingMoreNotifications}
                notifications={notifications}
                onLoadMoreNotifications={onLoadMoreNotifications}
                onMarkAllNotificationsRead={onMarkAllNotificationsRead}
                onMarkNotificationRead={onMarkNotificationRead}
                onOpenNotification={onOpenNotification}
                t={t}
                unreadCount={unreadCount}
              />
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
            <UserPanelActions
              collapsed={false}
              onSettings={onSettings}
              onShortcuts={onShortcuts}
              t={t}
            />
          )}
        </FrameFooter>
      </Frame>
    </aside>
  );
}

export default UserPanel;
