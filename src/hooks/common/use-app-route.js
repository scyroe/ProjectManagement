import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  Clock3,
  FolderKanban,
  LayoutDashboard,
  Settings2,
  UserRound,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';

export const routes = [
  { id: 'dashboard', icon: LayoutDashboard },
  { id: 'tasks', icon: ClipboardList },
  { id: 'projects', icon: FolderKanban },
  { id: 'clients', icon: Users },
  { id: 'calendar', icon: CalendarDays },
  { id: 'work-log', icon: Clock3 },
  { id: 'reports', icon: BarChart3 },
  { id: 'users', icon: UserRound },
  { id: 'settings', icon: Settings2 },
];

const getRouteFromHash = () => {
  const route = window.location.hash.replace('#/', '').split('/')[0];
  return routes.some((item) => item.id === route) ? route : 'dashboard';
};

export function useAppRoute() {
  const [activeRoute, setActiveRoute] = useState(getRouteFromHash);

  useEffect(() => {
    const handleHashChange = () => setActiveRoute(getRouteFromHash());
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (route) => {
    window.location.hash = `/${route}`;
    setActiveRoute(route);
  };

  return {
    activeRoute,
    currentPage: routes.find((route) => route.id === activeRoute),
    navigate,
  };
}
