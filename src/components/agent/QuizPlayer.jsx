import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { IconCheck, IconX, IconClock, IconBook, IconLock } from '../common/Icons';
import {
  clearQuizUiLock,
  formatCountdown,
  getLockStatus,
  getQuizUiLock,
  startQuizUiLock
} from '../../services/quizCooldownStore';

export function QuizPlayer({ item, courseId, agentId, onQuizPassed, onReviewContent, hideHeader = false }) {
  const questions = item.questions || [];
  
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [lock, setLock] = useState(() => getQuizUiLock(agentId, item.id));
  const [now, setNow] = useState(Date.now());
  const [error, setError] = useState('');
  const [showIncompleteHint, setShowIncompleteHint] = useState(false);
  const [searchParams] = useSearchParams();
  // Testing hook: only visible with ?autofill in the URL. Never shown otherwise.
  const showAutofill = searchParams.has('autofill');

  const handleAutofillCorrect = () => {
    if (retakeLocked) return;
    const filled = {};
    for (const q of questions) {
      filled[q.id] = (q.options || []).filter(o => o.is_correct).map(o => o.id);
    }
    setSelectedAnswers(filled);
    setResult(null);
    setShowIncompleteHint(false);
  };

  const handleResetTimer = async () => {
    try {
      await api.learn.resetQuizLock(agentId, item.id);
    } catch {
      // Dev helper only; server errors must not block local unlock.
    }
    clearQuizUiLock(agentId, item.id);
    setLock(null);
    setResult(null);
    setSelectedAnswers({});
    setNow(Date.now());
  };

  // Mirrors a GET /learn/quiz/lock payload into the local store.
  // Returns true when the server still considers the quiz locked.
  const applyServerLock = useCallback((s) => {
    if (!s || s.can_retry) return false;
    let lastResult = null;
    try { lastResult = s.last_result ? JSON.parse(s.last_result) : null; }
    catch { lastResult = null; }
    setLock(startQuizUiLock({
      agentId,
      courseId,
      quizItemId: item.id,
      lastResult,
      // Cooldown length is a server setting, so take it from the server
      // rather than assuming the local fallback constant.
      durationMs: (s.remaining_seconds || 0) * 1000,
      reviewedItemIds: s.review_satisfied ? ['server'] : []
    }));
    if (lastResult && !lastResult.passed) {
      setResult(lastResult);
      setSelectedAnswers({});
    }
    setNow(Date.now());
    return true;
  }, [agentId, courseId, item.id]);

  useEffect(() => {
    const stored = getQuizUiLock(agentId, item.id);
    setLock(stored);
    if (stored?.lastResult && !stored.lastResult.passed) {
      setResult(stored.lastResult);
      setSelectedAnswers({});
    }
    // Server lock is authoritative (survives reload / new tab). The mirror is
    // never allowed to be stricter OR looser than the server.
    let cancelled = false;
    api.learn.getQuizLock(agentId, item.id)
      .then((s) => {
        if (cancelled) return;
        if (!applyServerLock(s)) {
          clearQuizUiLock(agentId, item.id);
          setLock(null);
          setNow(Date.now());
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [agentId, item.id, courseId, applyServerLock]);

  const lockStatus = getLockStatus(lock);

  useEffect(() => {
    if (!lock || lockStatus.timeElapsed) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [lock, lockStatus.timeElapsed]);

  const liveStatus = getLockStatus(lock);
  const remainingMs = lock ? Math.max(0, lock.lockedUntil - now) : 0;
  const retakeLocked = liveStatus.isLocked;
  const countdown = formatCountdown(remainingMs);

  const handleToggleOption = (questionId, optionId, type) => {
    if (retakeLocked) return;
    if (result && !result.passed) {
      setResult(null);
    }
    setShowIncompleteHint(false);

    const currentSelected = selectedAnswers[questionId] || [];

    if (type === 'multiple_choice' || type === 'true_false') {
      setSelectedAnswers({
        ...selectedAnswers,
        [questionId]: [optionId]
      });
    } else {
      const exists = currentSelected.includes(optionId);
      const updated = exists
        ? currentSelected.filter(id => id !== optionId)
        : [...currentSelected, optionId];
      setSelectedAnswers({
        ...selectedAnswers,
        [questionId]: updated
      });
    }
  };

  const handleSubmitQuiz = async (e) => {
    e.preventDefault();
    if (questions.length === 0) return;
    if (getLockStatus(getQuizUiLock(agentId, item.id)).isLocked) return;
    if (!allAnswered) {
      setShowIncompleteHint(true);
      return;
    }
    setShowIncompleteHint(false);

    const formattedAnswers = questions.map(q => ({
      question_id: q.id,
      selected_option_ids: selectedAnswers[q.id] || []
    }));

    setSubmitting(true);
    setError('');
    try {
      const res = await api.learn.submitQuiz(item.id, courseId, agentId, formattedAnswers);
      setResult(res);

      const scrollToTop = () => {
        const scrollContainer = document.querySelector('main');
        if (scrollContainer) {
          scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      };

      if (res.passed) {
        clearQuizUiLock(agentId, item.id);
        setLock(null);
        scrollToTop();
        if (onQuizPassed) {
          onQuizPassed();
        }
      } else {
        const nextLock = startQuizUiLock({
          agentId,
          courseId,
          quizItemId: item.id,
          lastResult: res,
          // The server decides how long the cooldown runs.
          durationMs: (res.locked_seconds_remaining || 0) * 1000
        });
        setLock(nextLock);
        setNow(Date.now());
        setSelectedAnswers({});
        scrollToTop();
      }
    } catch (err) {
      if (err.status === 423) {
        // The server refused the retry: the cooldown is still running, or the
        // review gate is unsatisfied. Re-sync instead of guessing locally.
        try {
          applyServerLock(await api.learn.getQuizLock(agentId, item.id));
        } catch {
          // Leave the mirror as-is; the message below still explains the block.
        }
      }
      setError(err.message || 'Failed to submit assessment.');
    } finally {
      setSubmitting(false);
    }
  };

  const allAnswered = questions.every(q => (selectedAnswers[q.id]?.length || 0) > 0);
  const submitDisabled = submitting || (result && result.passed) || retakeLocked;

  return (
    <div className={hideHeader ? 'space-y-8 w-full' : 'bg-[#F7F8ED] dark:bg-zinc-900 rounded-lg py-10 space-y-8 w-full'}>
      {error && (
        <div className="p-4 rounded-xl border border-watermelon-red-200 dark:border-watermelon-red-900/60 bg-watermelon-red-50 dark:bg-watermelon-red-950/40 text-watermelon-red-900 dark:text-watermelon-red-200 text-xs font-semibold">
          {error}
        </div>
      )}
      {/* Quiz Header — only shown when not embedded inside CourseViewer */}
      {!hideHeader && (
        <div className="pb-5 border-b border-zinc-100 dark:border-zinc-800 flex items-start justify-between gap-5">
          <div>
            <span className="text-xs tabular-nums font-black text-watermelon-green-600 dark:text-watermelon-green-400 uppercase tracking-wider">
              ● KNOWLEDGE ASSESSMENT (100% MASTERY REQUIRED)
            </span>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-2">
              {item.title}
            </h2>
            <p className="text-sm text-zinc-500 mt-1">
              Achieve 100% accuracy to pass. A failed attempt starts a review cooldown before the next try.
            </p>
          </div>
          <Badge variant="neutral" className="px-3 py-1 text-xs font-bold tabular-nums">
            {questions.length} Questions
          </Badge>
        </div>
      )}

      {/* Result Status Banner */}
      {result && !result.passed && (
        <div className="p-5 rounded-lg bg-watermelon-red-50 dark:bg-watermelon-red-950/40 flex items-start space-x-4">
          <div className="p-2 rounded-lg bg-watermelon-red-200 dark:bg-watermelon-red-900 text-watermelon-red-900 dark:text-watermelon-red-100">
            <IconX className="w-5 h-5" />
          </div>
          <div className="flex-1 space-y-3">
            <div className="space-y-1">
              <h4 className="text-base font-black text-watermelon-red-900 dark:text-watermelon-red-200">
                Score: {result.score} ({result.score_percentage}%)
                {retakeLocked ? ' — Retake locked' : ' — Ready to retry'}
              </h4>
              <p className="text-sm text-watermelon-red-800 dark:text-watermelon-red-300">
                {retakeLocked
                  ? '100% is required. Review the highlighted questions, then open the course content. You can retry only after the cooldown and after you have opened a previous module.'
                  : '100% is required. Review the highlighted questions below, then submit again when you are ready.'}
              </p>
            </div>

            {retakeLocked && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#F7F8ED]/70 dark:bg-zinc-950/40">
                  <IconClock className="w-4 h-4 text-watermelon-red-800 dark:text-watermelon-red-300" />
                  <span className="text-xs font-bold uppercase tracking-wider text-watermelon-red-800 dark:text-watermelon-red-300">
                    Cooldown
                  </span>
                  <span className="text-base font-black tabular-nums text-watermelon-red-900 dark:text-watermelon-red-100">
                    {liveStatus.timeElapsed ? '00:00' : countdown}
                  </span>
                </div>
                <Badge
                  variant={liveStatus.reviewSatisfied ? 'completed' : 'not_started'}
                  className="w-36 justify-center text-center font-bold"
                >
                  {liveStatus.reviewSatisfied ? 'Content reviewed' : 'Review required'}
                </Badge>
              </div>
            )}

            {retakeLocked && onReviewContent && (
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={onReviewContent}
                className="whitespace-nowrap"
              >
                <IconBook className="w-4 h-4" />
                <span>Review course content</span>
              </Button>
            )}

            {liveStatus.timeElapsed && !liveStatus.reviewSatisfied && (
              <p className="text-sm font-bold text-watermelon-red-900 dark:text-watermelon-red-200">
                Cooldown finished. Open a previous video or SOP in the sidebar, then return here to retry.
              </p>
            )}
          </div>
        </div>
      )}

      {result && result.passed && (
        <div className="p-5 rounded-lg bg-watermelon-green-50 dark:bg-watermelon-green-950/50 flex items-start space-x-4">
          <div className="p-2 rounded-lg bg-watermelon-green-200 dark:bg-watermelon-green-900 text-watermelon-green-900 dark:text-watermelon-green-100">
            <IconCheck className="w-5 h-5" />
          </div>
          <div className="flex-1 space-y-1">
            <h4 className="text-base font-black text-watermelon-green-900 dark:text-watermelon-green-200">
              Assessment Mastered! Score: {result.score} (100%)
            </h4>
            <p className="text-sm text-watermelon-green-800 dark:text-watermelon-green-300">
              You have passed this module assessment with 100% mastery. Proceed to the next section.
            </p>
          </div>
        </div>
      )}

      {/* Questions Form */}
      <form onSubmit={handleSubmitQuiz} className="space-y-8">
        {questions.map((q, idx) => {
          const selected = selectedAnswers[q.id] || [];
          const wasIncorrect = result?.incorrect_question_ids?.includes(q.id);

          // Single-answer questions are radios, multi-answer are checkboxes.
          // These were clickable <div>s, which no keyboard or screen reader
          // could operate; the visual treatment is unchanged.
          const isSingle = q.type === 'multiple_choice' || q.type === 'true_false';

          return (
            <fieldset
              key={q.id}
              className={`py-6 px-4 rounded-lg transition-colors border-l-4 ${
                wasIncorrect
                  ? 'bg-watermelon-red-100/80 border-watermelon-red-400 dark:bg-watermelon-red-950/50 dark:border-watermelon-red-500'
                  : 'bg-[#F7F8ED] border-transparent dark:bg-zinc-950/60'
              }`}
            >
              <legend className="flex items-start gap-4 mb-4">
                <div className="flex items-start space-x-3">
                  <span className="text-sm tabular-nums font-black text-watermelon-green-700 dark:text-watermelon-green-400 mt-0.5">
                    0{idx + 1}.
                  </span>
                  <p className="text-base font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
                    {q.prompt}
                    {!isSingle && (
                      <span className="ml-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
                        select all that apply
                      </span>
                    )}
                  </p>
                </div>
              </legend>

              {/* Options */}
              <div className="space-y-2.5 pl-7">
                {(q.options || []).map((opt) => {
                  const isChecked = selected.includes(opt.id);

                  return (
                    <label
                      key={opt.id}
                      className={`flex items-center space-x-3.5 p-4 rounded-lg select-none transition-all focus-within:outline focus-within:outline-2 focus-within:outline-watermelon-green-400 ${
                        retakeLocked ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
                      } ${
                        isChecked
                          ? 'bg-watermelon-green-50 text-zinc-900 dark:bg-watermelon-green-950/60 dark:text-watermelon-green-100 font-bold'
                          : 'bg-[#F7F8ED] dark:bg-zinc-900 hover:bg-zinc-100/80 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium'
                      }`}
                    >
                      <input
                        type={isSingle ? 'radio' : 'checkbox'}
                        name={`question-${q.id}`}
                        value={opt.id}
                        checked={isChecked}
                        disabled={retakeLocked}
                        onChange={() => handleToggleOption(q.id, opt.id, q.type)}
                        className="sr-only"
                      />
                      {/* Visual control. The real input above drives it. */}
                      <span
                        aria-hidden="true"
                        className={`w-5 h-5 flex-shrink-0 flex items-center justify-center rounded ${
                          isChecked
                            ? 'bg-watermelon-green-500'
                            : 'border-2 border-zinc-300 dark:border-zinc-600 bg-[#F7F8ED] dark:bg-zinc-800'
                        }`}
                      >
                        {isChecked && (
                          <IconCheck className="w-3.5 h-3.5 text-zinc-950" />
                        )}
                      </span>
                      <span className="text-sm">{opt.text}</span>
                    </label>
                  );
                })}
              </div>

            </fieldset>
          );
        })}

        {/* Submit Button */}
        <div className="flex flex-col items-center gap-3 pt-6 border-t border-zinc-100 dark:border-zinc-800">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="px-8 py-3 font-black text-base"
            disabled={submitDisabled}
          >
            {submitting ? (
              'Evaluating Assessment...'
            ) : retakeLocked ? (
              <>
                <IconLock className="w-4 h-4" />
                <span>
                  {liveStatus.timeElapsed
                    ? 'Review content to unlock retry'
                    : `Retry locked · ${countdown}`}
                </span>
              </>
            ) : (
              'Submit Assessment'
            )}
          </Button>
          {!allAnswered && showIncompleteHint && !retakeLocked && !(result && result.passed) && questions.length > 0 && (
            <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500">
              Answer all {questions.length} questions to enable submit.
            </p>
          )}
          {showAutofill && (
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleAutofillCorrect}
                disabled={submitDisabled}
                className="text-xs font-mono text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 disabled:opacity-40 underline underline-offset-2 cursor-pointer"
                title="Testing helper: tick all correct answers"
              >
                autofill correct (test)
              </button>
              <button
                type="button"
                onClick={handleResetTimer}
                className="text-xs font-mono text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 underline underline-offset-2 cursor-pointer"
                title="Testing helper: clear the retake cooldown on server and client"
              >
                reset timer (test)
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
