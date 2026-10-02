import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Frame, FrameHeader, FramePanel } from '@/components/reui/frame';
import { Button } from '@/components/ui/button';
import { routes } from '@/hooks/common/use-app-route';
import { useStrings } from '@/lib/i18n';

const Sidebar = ({
  activeRoute,
  collapsed,
  onNavigate,
  onToggle,
  collapsedFinished,
}) => {
  const strings = useStrings();
  const t = strings.layout.sidebar;

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 flex-col border-r bg-card transition-[width] duration-200 ${
        collapsed ? 'hidden lg:flex lg:w-[49px]' : 'flex w-64 lg:flex lg:w-64'
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
            collapsedFinished ? 'grid place-items-center px-0' : 'justify-start'
          }`}
        >
          <Button
            type="button"
            variant="ghost"
            size="icon-lg"
            aria-label={collapsed ? t.expand : t.collapse}
            title={collapsed ? t.expand : t.collapse}
            onClick={onToggle}
          >
            {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          </Button>
        </FrameHeader>
        <FramePanel
          className={`flex-1 border-0 bg-transparent p-3 shadow-none ${
            collapsedFinished ? 'px-0' : ''
          }`}
        >
          <nav
            className={
              collapsedFinished
                ? 'grid justify-items-center gap-1'
                : 'space-y-1'
            }
            aria-label="Main navigation"
          >
            {routes.map((route) => {
              const Icon = route.icon;
              const label = strings.routes[route.id];
              return (
                <Button
                  key={route.id}
                  type="button"
                  variant={route.id === activeRoute ? 'default' : 'ghost'}
                  className={`gap-3 transition-none ${
                    collapsedFinished
                      ? 'size-8 w-8 justify-self-center justify-center px-0'
                      : 'w-full justify-start'
                  }`}
                  title={collapsedFinished ? label : undefined}
                  onClick={() => onNavigate(route.id)}
                >
                  <Icon className="shrink-0" />

                  {collapsedFinished ? null : (
                    <span
                      className={`overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200 ${
                        collapsed
                          ? 'max-w-0 opacity-0 w-0'
                          : 'max-w-40 opacity-100'
                      }`}
                    >
                      {label}
                    </span>
                  )}
                </Button>
              );
            })}
          </nav>
        </FramePanel>
      </Frame>
    </aside>
  );
};

export default Sidebar;
