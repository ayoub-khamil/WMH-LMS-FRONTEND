import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { reportError } from '../../services/logger';
import { ErrorBanner } from '../common/ErrorBanner';
import { EmptyState } from '../common/EmptyState';
import { IconSearch, IconClock } from '../common/Icons';
import { INPUT } from './formStyles';

// Same panel look as the item editor cards, without padding so the table
// runs edge to edge.
const TABLE_CARD =
  'rounded-xl border border-zinc-200 dark:border-zinc-700 bg-[#FBFCF6] dark:bg-zinc-900 overflow-x-auto';

const ACTION_LABELS = {
  'user.created': 'Created user',
  'user.updated': 'Updated user',
  'user.password_changed': 'Changed password',
  'user.role_changed': 'Changed role',
  'user.status_changed': 'Changed status',
  'user.deleted': 'Deleted user'
};

const ACTION_TONES = {
  'user.deleted': 'text-watermelon-red-700 dark:text-watermelon-red-300',
  'user.status_changed': 'text-amber-700 dark:text-amber-300',
  'user.role_changed': 'text-amber-700 dark:text-amber-300',
  'user.password_changed': 'text-amber-700 dark:text-amber-300'
};

function formatWhen(iso) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
  });
}

/**
 * Root-only, read-only view of the administrative audit trail: who created,
 * changed, disabled or deleted which account, and when. Newest first.
 */
export function AuditLog() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError('');
    api.audit.recent(200)
      .then(setEntries)
      .catch((err) => {
        reportError(err);
        setError(err);
      })
      .finally(() => setLoading(false));
  }, [reloadKey]);

  const needle = filter.trim().toLowerCase();
  const shown = needle
    ? entries.filter((e) =>
      [e.actor_email, e.target_label, e.detail, e.action, ACTION_LABELS[e.action]]
        .some((v) => (v || '').toLowerCase().includes(needle)))
    : entries;

  return (
    <div className="space-y-6">
      <ErrorBanner error={error} onRetry={() => setReloadKey((k) => k + 1)} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-2xl">
          Every account change made by a manager, newest first. Only the root account can see this page.
        </p>
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
            <IconSearch className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by person, account or action…"
            aria-label="Filter audit log"
            className={`${INPUT} pl-10`}
          />
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center text-zinc-400 text-base font-medium">Loading audit log…</div>
      ) : error ? null : shown.length === 0 ? (
        <EmptyState
          icon={IconClock}
          title={needle ? 'No matching entries' : 'No account changes recorded yet'}
          description={needle ? 'Try a different filter.' : 'Creating, editing, disabling or deleting a user will appear here.'}
        />
      ) : (
        <div className={TABLE_CARD}>
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 whitespace-nowrap">When</th>
                <th className="py-3.5 px-4">By</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Account</th>
                <th className="py-3.5 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {shown.map((e) => (
                <tr key={e.id} className="align-top">
                  <td className="py-3 px-4 whitespace-nowrap text-xs font-medium text-zinc-500 dark:text-zinc-400 tabular-nums">
                    {formatWhen(e.created_at)}
                  </td>
                  <td className="py-3 px-4 text-zinc-800 dark:text-zinc-200 break-all">{e.actor_email}</td>
                  <td className={`py-3 px-4 font-bold whitespace-nowrap ${ACTION_TONES[e.action] || 'text-zinc-900 dark:text-zinc-100'}`}>
                    {ACTION_LABELS[e.action] || e.action}
                  </td>
                  <td className="py-3 px-4 text-zinc-800 dark:text-zinc-200 break-all">{e.target_label}</td>
                  <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400 font-mono text-xs">{e.detail || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
