import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

function readPage(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
}

export function useListQuery() {
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get('q') || '';
  const status = searchParams.get('status') || '';
  const role = searchParams.get('role') || '';
  const page = readPage(searchParams.get('page'));

  const patch = useCallback((updates, { replace = false } = {}) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      for (const [key, value] of Object.entries(updates)) {
        const omit = value === '' || value == null || (key === 'page' && Number(value) === 1);
        if (omit) next.delete(key);
        else next.set(key, String(value));
      }
      return next;
    }, { replace });
  }, [setSearchParams]);

  return { search, status, role, page, patch };
}
