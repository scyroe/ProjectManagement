import {
  Bell,
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

const UserPanel = ({ collapsed, onExpand, onSettings, onToggle }) => {
  const strings = useStrings();
  const t = strings.layout.userPanel;

  return (
    <aside
      className={`fixed inset-y-0 right-0 z-30 flex-col border-l bg-card transition-[width] duration-200 ${
        collapsed ? 'hidden lg:flex lg:w-[49px]' : 'flex w-80 lg:flex lg:w-80'
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
              <FrameDescription>{t.email}</FrameDescription>
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
                aria-label="Expand account panel for notifications"
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
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-3">
                <Avatar size="lg">
                  <AvatarFallback>AS</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold">{t.userName}</p>
                  <p className="text-xs text-muted-foreground">{t.userRole}</p>
                </div>
              </div>
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold">{t.notifications}</h3>
                  <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                    {t.newCount}
                  </span>
                </div>
                <div className="space-y-2">
                  {t.notificationItems.map(({ title, description }) => (
                    <div key={title} className="rounded-lg border bg-card p-3">
                      <p className="text-sm font-medium">{title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {description}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </FramePanel>
        <FrameFooter
          className={`border-t ${collapsed ? 'items-center p-2' : ''}`}
        >
          <Button
            variant={collapsed ? 'ghost' : 'outline'}
            size={collapsed ? 'icon' : 'default'}
            className={collapsed ? 'mx-auto' : 'w-full justify-start gap-2'}
            aria-label={t.settings}
            title={collapsed ? t.settings : undefined}
            onClick={onSettings}
          >
            <Settings2 />
            {!collapsed && t.settings}
          </Button>
        </FrameFooter>
      </Frame>
    </aside>
  );
};

export default UserPanel;
