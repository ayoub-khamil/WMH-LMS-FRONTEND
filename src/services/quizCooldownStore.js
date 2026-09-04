import { reportError } from './logger';

/**
 * Fast local mirror of the quiz retake lock (sessionStorage).
 *
 * The server is authoritative: POST /learn/quiz/submit enforces both the
 * cooldown and the review gate, and GET /learn/quiz/lock is the source of
 * truth across reloads. This store exists so the countdown can tick without
 * polling, and it must never be more permissive than the server.
 *
 * Cooldown length is a server setting (Quiz:CooldownMinutes), so pass the
 * duration the server reports rather than assuming the fallback below.
 */
export const QUIZ_COOLDOWN_MS = 5 * 60 * 1000;
const PREFIX = 'wmh_quiz_ui_lock_';

function key(agentId, quizItemId) {
  return `${PREFIX}${agentId}_${quizItemId}`;
}

function read(k) {
  try {
    const raw = sessionStorage.getItem(k);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function write(k, val) {
  try {
    sessionStorage.setItem(k, JSON.stringify(val));
  } catch (e) {
    reportError(e);
  }
}

export function getQuizUiLock(agentId, quizItemId) {
  if (agentId == null || quizItemId == null) return null;
  return read(key(agentId, quizItemId));
}

export function startQuizUiLock({
  agentId,
  courseId,
  quizItemId,
  lastResult,
  durationMs,
  reviewedItemIds
}) {
  const ms = Number.isFinite(durationMs) && durationMs >= 0 ? durationMs : QUIZ_COOLDOWN_MS;
  const lock = {
    agentId,
    courseId,
    quizItemId,
    lockedUntil: Date.now() + ms,
    reviewedItemIds: reviewedItemIds || [],
    lastResult: lastResult || null
  };
  write(key(agentId, quizItemId), lock);
  return lock;
}

export function markQuizContentReviewed(agentId, courseId, viewedItemId) {
  if (agentId == null || courseId == null || viewedItemId == null) return;
  const viewedId = Number(viewedItemId);
  try {
    for (let i = 0; i < sessionStorage.length; i += 1) {
      const k = sessionStorage.key(i);
      if (!k || !k.startsWith(PREFIX)) continue;
      const lock = read(k);
      if (!lock) continue;
      if (Number(lock.agentId) !== Number(agentId)) continue;
      if (Number(lock.courseId) !== Number(courseId)) continue;
      if (Number(lock.quizItemId) === viewedId) continue;
      const ids = lock.reviewedItemIds || [];
      if (!ids.includes(viewedId)) {
        write(k, { ...lock, reviewedItemIds: [...ids, viewedId] });
      }
    }
  } catch (e) {
    reportError(e);
  }
}

export function clearQuizUiLock(agentId, quizItemId) {
  try {
    sessionStorage.removeItem(key(agentId, quizItemId));
  } catch (e) {
    reportError(e);
  }
}

export function getLockStatus(lock) {
  if (!lock) {
    return {
      remainingMs: 0,
      reviewSatisfied: true,
      timeElapsed: true,
      canRetry: true,
      isLocked: false
    };
  }
  const remainingMs = Math.max(0, lock.lockedUntil - Date.now());
  const reviewSatisfied = (lock.reviewedItemIds || []).length > 0;
  const timeElapsed = remainingMs === 0;
  const canRetry = timeElapsed && reviewSatisfied;
  return {
    remainingMs,
    reviewSatisfied,
    timeElapsed,
    canRetry,
    isLocked: !canRetry
  };
}

export function formatCountdown(ms) {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
