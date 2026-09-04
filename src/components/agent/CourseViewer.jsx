import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';
import { YouTubePlayer } from './YouTubePlayer';
import { TextItemViewer } from './TextItemViewer';
import { QuizPlayer } from './QuizPlayer';
import { CourseCompleteModal } from './CourseCompleteModal';
import { markQuizContentReviewed } from '../../services/quizCooldownStore';
import {
  IconArrowLeft,
  IconArrowRight,
  IconCheck,
  IconVideo,
  IconDocumentText,
  IconQuestionMarkCircle,
  IconAudio,
  IconBook,
  IconLock
} from '../common/Icons';
import { reportError } from '../../services/logger';

export function CourseViewer({
  courseId,
  onBack,
  activeItemId,
  onSelectItem,
  onProgressUpdated
}) {
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [completedItemIds, setCompletedItemIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [error, setError] = useState('');

  const loadCourseData = async () => {
    setLoading(true);
    setError('');
    try {
      const tree = await api.learn.getCourseTree(courseId, user.id);
      setCourse(tree);
      setCompletedItemIds(tree.completed_item_ids || []);

      if (!activeItemId) {
        const replaceOpts = { replace: true };
        try {
          const resumeRes = await api.learn.resumeCourse(courseId, user.id);
          if (resumeRes?.next_item_id) {
            onSelectItem(resumeRes.next_item_id, replaceOpts);
          } else {
            const firstItem = tree.sections?.[0]?.items?.[0];
            if (firstItem) onSelectItem(firstItem.id, replaceOpts);
          }
        } catch {
          const firstItem = tree.sections?.[0]?.items?.[0];
          if (firstItem) onSelectItem(firstItem.id, replaceOpts);
        }
      }
    } catch (err) {
      reportError(err);
      setError(err.message || 'Failed to load course.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourseData();
  }, [courseId, user.id]);

  const allItems = [];
  (course?.sections || []).forEach(section => {
    (section.items || []).forEach(item => {
      allItems.push({ ...item, section_title: section.title });
    });
  });

  const currentIndex = allItems.findIndex(i => i.id === Number(activeItemId));
  const currentItem = allItems[currentIndex] || allItems[0];
  const nextItem = currentIndex >= 0 && currentIndex < allItems.length - 1 ? allItems[currentIndex + 1] : null;
  const isCurrentCompleted = currentItem && completedItemIds.includes(currentItem.id);
  const isLastItem = currentIndex === allItems.length - 1;

  const previousContentItem = (() => {
    if (currentIndex <= 0) {
      return allItems.find(i => i.type !== 'quiz') || null;
    }
    for (let i = currentIndex - 1; i >= 0; i -= 1) {
      if (allItems[i].type !== 'quiz') return allItems[i];
    }
    return allItems.find(i => i.type !== 'quiz') || null;
  })();

  // Sequential gating: deep links to locked items bounce to first incomplete.
  useEffect(() => {
    if (loading || !course || allItems.length === 0 || !activeItemId) return;
    const idx = allItems.findIndex(i => i.id === Number(activeItemId));
    if (idx > 0 && !allItems.slice(0, idx).every(i => completedItemIds.includes(i.id))) {
      const target = allItems.find(i => !completedItemIds.includes(i.id)) || allItems[0];
      if (target && target.id !== Number(activeItemId)) onSelectItem(target.id, { replace: true });
    }
  }, [loading, course, activeItemId, completedItemIds]); // eslint-disable-line react-hooks/exhaustive-deps

  // Every item change starts at the top of the scroll pane.
  // (The pane is <main>, not window — window.scrollTo is a no-op here.)
  useEffect(() => {
    const scroller = document.querySelector('main');
    if (scroller) scroller.scrollTo({ top: 0 });
    else window.scrollTo(0, 0);
  }, [courseId, activeItemId]);

  useEffect(() => {
    if (!user?.id || !course?.id || !currentItem || currentItem.type === 'quiz') return;
    let cancelled = false;
    // The server owns the quiz review gate, so the local mirror is only
    // credited once the server has actually recorded the view. Crediting it
    // first would let the retry button unlock locally and then be refused
    // with a 423.
    api.learn.recordView(user.id, course.id, currentItem.id)
      .then(() => {
        if (!cancelled) markQuizContentReviewed(user.id, course.id, currentItem.id);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user?.id, course?.id, currentItem?.id, currentItem?.type]);

  const handleReviewContent = () => {
    if (previousContentItem) {
      onSelectItem(previousContentItem.id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCompleteAndContinue = async () => {
    if (!currentItem) return;
    setCompleting(true);
    setError('');
    try {
      const res = await api.learn.completeItem(currentItem.id, course.id, user.id);
      const updatedCompleted = res.completed_item_ids || [...completedItemIds, currentItem.id];
      setCompletedItemIds(updatedCompleted);
      
      if (onProgressUpdated) onProgressUpdated();

      if (res.is_course_completed || isLastItem) {
        setShowCompletionModal(true);
      } else if (nextItem) {
        onSelectItem(nextItem.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      setError(err.message || 'Failed to save progress.');
    } finally {
      setCompleting(false);
    }
  };

  const handleQuizPassed = () => {
    setCompletedItemIds(prev => Array.from(new Set([...prev, currentItem.id])));
    if (onProgressUpdated) onProgressUpdated();
    if (isLastItem) {
      setShowCompletionModal(true);
    }
  };

  if (loading) {
    return <div className="py-28 text-center text-zinc-400 text-base font-medium">Preparing training workspace...</div>;
  }

  // A failed load is not the same as an empty curriculum. The server refuses
  // course content for anyone who is not enrolled (403), and that message is
  // the useful thing to show.
  if (!course) {
    return (
      <EmptyState
        icon={error ? IconLock : IconBook}
        title={error ? 'This course is not available' : 'Course not found'}
        description={
          error
            || 'This course may have been removed. Return to your dashboard and try again.'
        }
        action={<Button variant="secondary" onClick={onBack}>Return to Dashboard</Button>}
      />
    );
  }

  if (allItems.length === 0) {
    return (
      <EmptyState
        icon={IconBook}
        title="Course has no learning items"
        description="This curriculum is currently under authoring by the Training Manager."
        action={<Button variant="secondary" onClick={onBack}>Return to Dashboard</Button>}
      />
    );
  }

  const completedCount = completedItemIds.length;
  const progressPercent = Math.round((completedCount / (allItems.length || 1)) * 100);

  return (
    <div className="min-h-full flex flex-col justify-between pb-16">

      {/* Main Single-Item Focus Container */}
      <div className="flex-1 max-w-4xl w-full mx-auto px-6 py-10">
        {error && (
          <div className="mb-5 p-4 rounded-xl border border-watermelon-red-200 dark:border-watermelon-red-900/60 bg-watermelon-red-50 dark:bg-watermelon-red-950/40 text-watermelon-red-900 dark:text-watermelon-red-200 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Navigation Breadcrumb */}
        <div className="mb-5 text-xs tabular-nums font-bold text-zinc-400 flex items-center space-x-2">
          <span>{currentItem?.section_title}</span>
          <span className="text-watermelon-green-500 font-black">›</span>
          <span className="text-zinc-800 dark:text-zinc-200 font-black">{currentItem?.title}</span>
        </div>

        {/* ── SHARED FIXED TITLE BLOCK — always at the same position ── */}
        <div className="mb-8 pb-5 border-b border-zinc-100 dark:border-zinc-800 flex items-start justify-between gap-5">
          <div>
            <span className="text-xs tabular-nums font-black text-watermelon-green-600 dark:text-watermelon-green-400 uppercase tracking-wider">
              {currentItem?.type === 'video'  && '● VIDEO LECTURE MODULE'}
              {currentItem?.type === 'text'   && '● READING MATERIAL & STANDARD OPERATING PROCEDURE'}
              {currentItem?.type === 'quiz'   && '● KNOWLEDGE ASSESSMENT'}
              {currentItem?.type === 'audio'  && '● AUDIO LESSON'}
            </span>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-1">
              {currentItem?.title}
            </h2>
            {currentItem?.type === 'quiz' && (
              <p className="text-sm text-zinc-500 mt-1">
                Achieve 100% accuracy to pass. A failed attempt starts a review cooldown before the next try.
              </p>
            )}
          </div>
          <div className="flex-shrink-0 flex items-center gap-3">
            {isCurrentCompleted && currentItem?.type !== 'quiz' && (
              <Badge variant="completed" className="px-3 py-1 font-bold text-xs">
                <IconCheck className="w-4 h-4 mr-1.5" /> COMPLETED
              </Badge>
            )}
          </div>
        </div>

        {/* ── Content (no individual headers) ── */}
        {currentItem?.type === 'video' && (
          <div className="rounded-lg overflow-hidden bg-black">
            <YouTubePlayer
              url={currentItem.content_url}
              title={currentItem.title}
            />
          </div>
        )}

        {currentItem?.type === 'text' && (
          <TextItemViewer
            title={currentItem.title}
            content={currentItem.text_content}
            hideHeader
          />
        )}

        {currentItem?.type === 'quiz' && (
          <QuizPlayer
            item={currentItem}
            courseId={course.id}
            agentId={user.id}
            onQuizPassed={handleQuizPassed}
            onReviewContent={previousContentItem ? handleReviewContent : undefined}
            hideHeader
          />
        )}

        {currentItem?.type === 'audio' && (
          <div className="bg-[#F7F8ED] dark:bg-zinc-900 rounded-lg p-10">
            <YouTubePlayer
              url={currentItem.content_url}
              title={currentItem.title}
            />
          </div>
        )}

        {/* Bottom Primary Progression Bar: "Complete & Continue" */}
        {currentItem?.type !== 'quiz' && (
          <div className="mt-14 pt-8 border-t border-zinc-100 dark:border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-5 bg-gradient-to-r from-watermelon-green-50/50 to-transparent dark:from-watermelon-green-950/20 p-6 rounded-lg">
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              {isLastItem ? (
                <strong className="text-zinc-900 dark:text-zinc-100 font-bold">Final module in this course curriculum.</strong>
              ) : (
                <span>
                  Next module: <strong className="text-zinc-900 dark:text-zinc-100 font-bold">{nextItem?.title || 'Next Module'}</strong>
                </span>
              )}
            </div>

            <div className="flex items-center space-x-4 w-full sm:w-auto">
              <Button
                variant="primary"
                size="lg"
                onClick={handleCompleteAndContinue}
                disabled={completing}
                className="w-full sm:w-auto px-10 py-3.5 text-base font-black tracking-wide"
              >
                <span>{isLastItem ? 'Complete & Finalize Course' : 'Complete & Continue'}</span>
                <IconArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        )}

        {/* If Quiz is 100% Passed, show the same progression bar as lessons */}
        {currentItem?.type === 'quiz' && isCurrentCompleted && !isLastItem && (
          <div className="mt-14 pt-8 border-t border-zinc-100 dark:border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-5 bg-gradient-to-r from-watermelon-green-50/50 to-transparent dark:from-watermelon-green-950/20 p-6 rounded-lg">
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              <span>
                Next module: <strong className="text-zinc-900 dark:text-zinc-100 font-bold">{nextItem?.title || 'Next Module'}</strong>
              </span>
            </div>

            <div className="flex items-center space-x-4 w-full sm:w-auto">
              <Button
                variant="primary"
                size="lg"
                className="w-full sm:w-auto px-10 py-3.5 text-base font-black tracking-wide"
                onClick={() => {
                  if (nextItem) {
                    onSelectItem(nextItem.id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
              >
                <span>Continue to Next Module</span>
                <IconArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Completion Modal */}
      <CourseCompleteModal
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        course={course}
        agentName={user?.name || 'Agent Specialist'}
        onReturnToDashboard={() => {
          setShowCompletionModal(false);
          onBack();
        }}
      />
    </div>
  );
}
