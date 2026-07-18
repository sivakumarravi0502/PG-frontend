import { useState } from 'react';

const STORAGE_PREFIX = 'pg-view-mode:';

function getDefaultView() {
  if (typeof window === 'undefined') return 'list';
  return window.matchMedia('(max-width: 1023px)').matches ? 'grid' : 'list';
}

function getInitialView(pageKey) {
  try {
    const stored = localStorage.getItem(STORAGE_PREFIX + pageKey);
    if (stored === 'grid' || stored === 'list') return stored;
  } catch { /* ignore */ }
  return getDefaultView();
}

/**
 * Per-page grid/list preference — persists until the user changes it on that page.
 * Default: list on desktop (≥1024px), grid on mobile.
 */
export default function useViewMode(pageKey) {
  const [view, setViewState] = useState(() => getInitialView(pageKey));

  const setView = (next) => {
    setViewState(next);
    try {
      localStorage.setItem(STORAGE_PREFIX + pageKey, next);
    } catch { /* ignore */ }
  };

  return [view, setView];
}
