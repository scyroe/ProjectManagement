import { useEffect, useState } from 'react';

export function useAppShell() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [accountPanelCollapsed, setAccountPanelCollapsed] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [sidebarCollapsedFinished, setSidebarCollapsedFinished] =
    useState(true);

  useEffect(() => {
    if (sidebarCollapsed) {
      setTimeout(() => {
        setSidebarCollapsedFinished(true);
      }, 200);
    } else {
      setSidebarCollapsedFinished(false);
    }
  }, [sidebarCollapsed]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (
        event.key.toLowerCase() !== 'k' ||
        (!event.metaKey && !event.ctrlKey) ||
        event.altKey
      ) {
        return;
      }
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
      ) {
        return;
      }
      event.preventDefault();
      setSearchOpen(true);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const rememberSearch = (value) => {
    const search = value.trim();
    if (!search) return;
    setRecentSearches((current) =>
      [search, ...current.filter((item) => item !== search)].slice(0, 5),
    );
  };

  return {
    accountPanelCollapsed,
    searchOpen,
    searchQuery,
    recentSearches,
    rememberSearch,
    setAccountPanelCollapsed,
    setSearchOpen,
    setSearchQuery,
    sidebarCollapsed,
    setSidebarCollapsed,
    sidebarCollapsedFinished,
  };
}
