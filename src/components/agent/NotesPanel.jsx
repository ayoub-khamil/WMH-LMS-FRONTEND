import React, { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../../services/api';
import { editableGuard, readOnlyGuard } from '../../services/copyGuard';
import { reportError } from '../../services/logger';
import { ErrorBanner } from '../common/ErrorBanner';
import { IconNote, IconX } from '../common/Icons';

const MAX_LENGTH = 10000;
const SAVE_DELAY_MS = 800;

function formatSavedAt(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
  });
}

/**
 * The agent's private notepad for the course, docked on the right so a video
 * can keep playing while they write. One note per module; it saves itself
 * shortly after typing stops. Notes from the course's other modules are
 * listed underneath for review. Typing works normally, but nothing can be
 * pasted in or copied out.
 */
export function NotesPanel({ isOpen, onClose, courseId, currentItem, items, onSelectItem }) {
  const [notes, setNotes] = useState({});
  const [savedAt, setSavedAt] = useState({});
  const [saveState, setSaveState] = useState({});
  const [loadState, setLoadState] = useState('idle');
  const [error, setError] = useState('');
  const textareaRef = useRef(null);

  // Save bookkeeping lives in refs so a pending save survives re-renders and
  // can still be flushed from an unmount cleanup.
  const bodies = useRef({});
  const timers = useRef({});
  const inFlight = useRef({});
  const queued = useRef({});

  const currentId = currentItem?.id ?? null;

  useEffect(() => {
    if (!isOpen || loadState !== 'idle') return;
    setLoadState('loading');
    api.learn.getNotes(courseId)
      .then((list) => {
        const loaded = {};
        const stamps = {};
        (list || []).forEach((n) => {
          loaded[n.item_id] = n.body;
          stamps[n.item_id] = n.updated_at;
        });
        bodies.current = { ...loaded };
        setNotes(loaded);
        setSavedAt(stamps);
        setLoadState('ready');
      })
      .catch((err) => {
        reportError(err);
        setError(err);
        setLoadState('error');
      });
  }, [isOpen, loadState, courseId]);

  // Saves for one note never overlap: a change made while a save is in
  // flight is sent once that save returns, so the server always ends up
  // holding the latest text.
  const persist = useCallback(async (itemId) => {
    if (inFlight.current[itemId]) {
      queued.current[itemId] = true;
      return;
    }
    inFlight.current[itemId] = true;
    setSaveState((s) => ({ ...s, [itemId]: 'saving' }));
    try {
      const res = await api.learn.saveNote(itemId, courseId, bodies.current[itemId] ?? '');
      setSavedAt((s) => ({ ...s, [itemId]: res?.deleted ? null : res?.updated_at }));
      setSaveState((s) => ({ ...s, [itemId]: 'saved' }));
      setError('');
    } catch (err) {
      reportError(err);
      setSaveState((s) => ({ ...s, [itemId]: 'error' }));
      setError(err);
    } finally {
      inFlight.current[itemId] = false;
      if (queued.current[itemId]) {
        queued.current[itemId] = false;
        persist(itemId);
      }
    }
  }, [courseId]);

  const flushAll = useCallback(() => {
    Object.entries(timers.current).forEach(([itemId, timer]) => {
      clearTimeout(timer);
      persist(Number(itemId));
    });
    timers.current = {};
  }, [persist]);

  // Leaving the course (or the app route) must not drop the last keystrokes.
  const flushRef = useRef(flushAll);
  flushRef.current = flushAll;
  useEffect(() => () => flushRef.current(), []);

  // Closing the tab mid-save asks first instead of losing text silently.
  useEffect(() => {
    const onBeforeUnload = (e) => {
      const pending = Object.keys(timers.current).length > 0
        || Object.values(inFlight.current).some(Boolean);
      if (!pending) return;
      flushRef.current();
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  useEffect(() => {
    if (isOpen && loadState === 'ready') textareaRef.current?.focus({ preventScroll: true });
  }, [isOpen, loadState, currentId]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => {
    flushAll();
    onClose();
  };

  const handleChange = (e) => {
    if (currentId == null) return;
    const value = e.target.value;
    bodies.current[currentId] = value;
    setNotes((n) => ({ ...n, [currentId]: value }));
    setSaveState((s) => ({ ...s, [currentId]: 'pending' }));
    clearTimeout(timers.current[currentId]);
    timers.current[currentId] = setTimeout(() => {
      delete timers.current[currentId];
      persist(currentId);
    }, SAVE_DELAY_MS);
  };

  const currentBody = notes[currentId] ?? '';
  const currentState = saveState[currentId];
  const otherNotes = (items || []).filter(
    (it) => it.id !== currentId && (notes[it.id] || '').trim()
  );

  const statusText = (() => {
    if (currentState === 'pending' || currentState === 'saving') return 'Saving…';
    if (currentState === 'error') return 'Not saved';
    if (savedAt[currentId]) return `Saved ${formatSavedAt(savedAt[currentId])}`;
    return '';
  })();

  return (
    <aside
      {...editableGuard}
      aria-label="My notes"
      aria-hidden={!isOpen}
      className={`no-print fixed top-0 right-0 bottom-0 z-40 w-full sm:w-[380px] flex flex-col bg-[#F7F8ED] dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 transition-[transform,visibility] duration-200 ${
        isOpen ? 'translate-x-0 visible' : 'translate-x-full invisible'
      }`}
    >
      <div className="h-16 flex-shrink-0 flex items-center justify-between px-5 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
          <IconNote className="w-5 h-5 text-watermelon-green-600 dark:text-watermelon-green-400" />
          <h2 className="text-base font-black">My Notes</h2>
        </div>
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close notes"
          title="Close notes"
          className="p-1.5 rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
        >
          <IconX className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
        <ErrorBanner error={error} />

        {loadState === 'loading' || loadState === 'idle' ? (
          <p className="py-10 text-center text-sm text-zinc-400 font-medium">Loading your notes…</p>
        ) : loadState === 'error' ? null : (
          <>
            {/* Current module */}
            <section className="space-y-2">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">This module</p>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 break-words">
                  {currentItem?.title}
                </p>
              </div>
              <textarea
                ref={textareaRef}
                value={currentBody}
                onChange={handleChange}
                maxLength={MAX_LENGTH}
                rows={10}
                placeholder="Write your notes for this module…"
                aria-label={`Notes for ${currentItem?.title || 'this module'}`}
                spellCheck
                className="w-full px-3.5 py-3 text-sm leading-relaxed rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-watermelon-green-400 resize-y"
              />
              <div className="flex items-center justify-between text-[11px] font-medium text-zinc-400 tabular-nums">
                <span className={currentState === 'error' ? 'text-watermelon-red-600 dark:text-watermelon-red-400 font-bold' : ''}>
                  {statusText}
                  {currentState === 'error' && (
                    <button
                      type="button"
                      onClick={() => persist(currentId)}
                      className="ml-2 underline font-bold"
                    >
                      Retry
                    </button>
                  )}
                </span>
                <span>{currentBody.length.toLocaleString()} / {MAX_LENGTH.toLocaleString()}</span>
              </div>
            </section>

            {/* Notes from the rest of the course */}
            <section className="space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Other notes in this course
              </p>
              {otherNotes.length === 0 ? (
                <p className="text-xs text-zinc-400">
                  Notes you write on other modules will appear here.
                </p>
              ) : (
                otherNotes.map((it) => (
                  <div
                    key={it.id}
                    className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60"
                  >
                    <button
                      type="button"
                      onClick={() => onSelectItem(it.id)}
                      title="Open this module"
                      className="w-full text-left px-3.5 pt-3 pb-1 group"
                    >
                      <span className="block text-[11px] text-zinc-400 break-words">{it.section_title}</span>
                      <span className="block text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-watermelon-green-700 dark:group-hover:text-watermelon-green-400 break-words">
                        {it.title}
                      </span>
                    </button>
                    <p
                      {...readOnlyGuard}
                      className="select-none px-3.5 pb-3 text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap break-words"
                    >
                      {notes[it.id]}
                    </p>
                  </div>
                ))
              )}
            </section>
          </>
        )}
      </div>
    </aside>
  );
}
