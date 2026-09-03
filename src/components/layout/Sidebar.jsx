import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { api } from '../../services/api';
import lightLogoSrc from '/assets/newTransparentLogo.png';
import darkLogoSrc from '/assets/darkModeLogo.png';
import {
  IconBook,
  IconUsers,
  IconAcademicCap,
  IconVideo,
  IconDocumentText,
  IconQuestionMarkCircle,
  IconAudio,
  IconDownload,
  IconCheck,
  IconLock
} from '../common/Icons';
import { downloadCertificatePDF } from '../../services/certificate';

// ── Straight Vector Art Back Icon (10% larger) ───────────────────
function IconStraightBack({ className = "w-[18px] h-[18px]" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path
        d="M19 12H5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11 18L5 12L11 6"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Item type icons ──────────────────────────────────────────────
function ItemTypeIcon({ type, className = '' }) {
  switch (type) {
    case 'video': return <IconVideo className={className} />;
    case 'quiz':  return <IconQuestionMarkCircle className={className} />;
    case 'audio': return <IconAudio className={className} />;
    default:      return <IconDocumentText className={className} />;
  }
}

// ── Circle-check badge: green check means DONE, never just selected ────────
function CheckCircle({ done, active }) {
  if (done) {
    return (
      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-watermelon-green-400 flex items-center justify-center">
        <IconCheck className="w-3.5 h-3.5 text-white" />
      </span>
    );
  }
  if (active) {
    return (
      <span className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-watermelon-green-500 bg-[#F7F8ED] dark:bg-zinc-900 flex items-center justify-center">
        <span className="w-2 h-2 rounded-full bg-watermelon-green-500" />
      </span>
    );
  }
  return (
    <span className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-zinc-300 dark:border-zinc-600 bg-[#F7F8ED] dark:bg-zinc-900" />
  );
}

// ────────────────────────────────────────────────────────────────
export function Sidebar({
  currentView,
  onViewChange,
  activeCourseId,
  onSelectCourse,
  activeItemId,
  onSelectItem,
  refreshTrigger = 0
}) {
  const { user, role, isManager } = useAuth();
  const { theme } = useTheme();

  const [agentCourses,    setAgentCourses]    = useState([]);
  const [activeCourseTree, setActiveCourseTree] = useState(null);
  const [loadingCurriculum, setLoadingCurriculum] = useState(false);
  const activeItemRef = useRef(null);

  // ── Keep the current item visible as the agent progresses ──────────────
  useEffect(() => {
    activeItemRef.current?.scrollIntoView({ block: 'nearest' });
  }, [activeItemId, activeCourseTree]);

  // ── Load enrolled courses list ───────────────────────────────
  useEffect(() => {
    if (!isManager && user?.id) {
      api.learn.getCourses(user.id).then(res => {
        const all = [...res.in_progress, ...res.not_started, ...res.completed];
        setAgentCourses(all);
      }).catch(console.error);
    }
  }, [isManager, user?.id, refreshTrigger]);

  // ── Load full curriculum tree for selected course ─────────────
  useEffect(() => {
    if (!isManager && activeCourseId && user?.id) {
      setLoadingCurriculum(true);
      api.learn.getCourseTree(activeCourseId, user.id)
        .then(tree => setActiveCourseTree(tree))
        .catch(console.error)
        .finally(() => setLoadingCurriculum(false));
    }
  }, [activeCourseId, isManager, user?.id, refreshTrigger]);

  // ── Derived progress numbers ─────────────────────────────────
  const completedIds  = activeCourseTree?.completed_item_ids || [];
  const allItems      = (activeCourseTree?.sections || []).flatMap(s => s.items || []);
  const totalItems    = allItems.length;
  const completedCount= allItems.filter(i => completedIds.includes(i.id)).length;
  const progressPct   = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;
  const isCourseComplete = totalItems > 0 && completedCount >= totalItems;

  // ── Sequential gating: item N unlocks only when all items before it are done ──
  const orderIndex = new Map(allItems.map((it, idx) => [it.id, idx]));
  const isItemLocked = (itemId) => {
    const idx = orderIndex.get(itemId) ?? 0;
    if (idx <= 0) return false;
    return !allItems.slice(0, idx).every(x => completedIds.includes(x.id));
  };

  const handleDownloadCert = (course) => {
    downloadCertificatePDF({
      agentName:      user?.name || 'Frontline Specialist',
      courseTitle:    course.title,
      completionDate: course.completed_at || new Date().toISOString(),
      courseId:       course.id
    });
  };

  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('wmh_sidebar_width');
    return saved ? Math.max(240, Math.min(600, Number(saved))) : 320;
  });
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      const newWidth = Math.max(240, Math.min(640, e.clientX));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
        localStorage.setItem('wmh_sidebar_width', sidebarWidth.toString());
      }
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, sidebarWidth]);

  // ─────────────────────────────────────────────────────────────
  return (
    <aside
      style={{ width: `${sidebarWidth}px` }}
      className="relative flex-shrink-0 flex flex-col h-full bg-[#F7F8ED] dark:bg-zinc-950 border-r border-zinc-200/70 dark:border-zinc-800/70 select-none overflow-hidden"
    >
      {/* ── Draggable Right Resize Handle ───────────────────────── */}
      <div
        onMouseDown={(e) => {
          e.preventDefault();
          setIsResizing(true);
        }}
        className="absolute top-0 right-0 bottom-0 w-2 cursor-col-resize z-30 group flex items-center justify-center hover:bg-watermelon-green-400/30 active:bg-watermelon-green-500/50 transition-colors"
        title="Drag left/right to resize sidebar"
      >
        <div className="w-0.5 h-8 bg-transparent group-hover:bg-watermelon-green-500/80 rounded-full transition-colors" />
      </div>

      {/* ── Brand Header with Logo on Left, Back Button on Opposite (Right) Side ──────────────── */}
      <div className="h-20 flex items-center justify-between gap-3 px-4 border-b border-zinc-100 dark:border-zinc-900 bg-[#F7F8ED] dark:bg-zinc-950 flex-shrink-0">
        <img
          src={theme === 'dark' ? darkLogoSrc : lightLogoSrc}
          alt="WatermelonHub"
          className="h-[64px] w-auto object-contain min-w-0"
        />
        {!isManager && (
          <button
            onClick={() => onViewChange('agent_dashboard')}
            className="flex-shrink-0 w-9 h-9 rounded-full grid place-items-center transition-all bg-[#FC1E1D] hover:bg-[#D81514] active:bg-[#B91211] text-white group cursor-pointer shadow-sm"
            title="Back to Dashboard"
            aria-label="Back to Dashboard"
          >
            <IconStraightBack className="w-[21px] h-[21px] transition-transform duration-200 group-hover:-translate-x-0.5" />
          </button>
        )}
      </div>


      {/* ══════════════════════════════════════════════════════
          AGENT MODE — Udemy-style sidebar
         ══════════════════════════════════════════════════════ */}
      {!isManager ? (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

          {/* Course title + progress (like the reference image) */}
          <div className="px-5 pt-5 pb-4 bg-[#F7F8ED]/60 dark:bg-zinc-900/40 flex-shrink-0">
            {/* Course Title with word wrap */}
            <h3 className="text-base font-black text-zinc-900 dark:text-zinc-100 leading-snug break-words whitespace-normal mb-3">
              {activeCourseTree?.title || agentCourses.find(c => c.id === activeCourseId)?.title || 'Course Curriculum'}
            </h3>

            {/* Progress bar — exact style from reference */}
            <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-watermelon-green-500 transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="text-center text-xs font-black text-zinc-600 dark:text-zinc-300 tracking-wide uppercase">
              <span className="text-base font-black text-zinc-900 dark:text-zinc-100">{progressPct}%</span>
              &nbsp;Complete
            </p>
          </div>

          <div className="flex-shrink-0 border-b border-zinc-200 dark:border-zinc-800" />

          {/* ── Scrollable curriculum — flat Udemy layout ─────── */}
          <div className="flex-1 overflow-y-auto">
            {loadingCurriculum ? (
              <p className="py-12 text-center text-sm text-zinc-400 font-medium">Loading curriculum…</p>
            ) : !activeCourseTree || (activeCourseTree.sections || []).length === 0 ? (
              <p className="py-12 text-center text-sm text-zinc-400 font-medium">No modules yet.</p>
            ) : (
              activeCourseTree.sections.map((sec, secIdx) => {
                const secItems    = sec.items || [];

                return (
                  <div key={sec.id}>
                    {/* Section title — plain bold heading, no box */}
                    <div className="px-5 pt-5 pb-2">
                      <h4 className="text-sm font-black text-zinc-900 dark:text-zinc-100 leading-snug break-words">
                        {sec.title}
                      </h4>
                    </div>

                    {/* Items — flat rows separated by thin hr */}
                    {secItems.map((item, iIdx) => {
                      const isDone     = completedIds.includes(item.id);
                      const isSelected = Number(activeItemId) === Number(item.id) && currentView === 'agent_course_viewer';
                      const isLocked   = !isManager && isItemLocked(item.id);

                      return (
                        <React.Fragment key={item.id}>
                          <button
                            ref={isSelected ? activeItemRef : null}
                            disabled={isLocked}
                            title={isLocked ? 'Complete previous modules to unlock' : item.title}
                            onClick={isLocked ? undefined : () => {
                              onSelectItem(item.id);
                              if (currentView !== 'agent_course_viewer') onViewChange('agent_course_viewer');
                            }}
                            className={`w-full text-left flex items-start gap-3 px-5 py-3.5 transition-colors ${
                              isLocked
                                ? 'opacity-50'
                                : isSelected
                                ? 'bg-watermelon-green-50 dark:bg-watermelon-green-950/40'
                                : 'hover:bg-[#F7F8ED] dark:hover:bg-zinc-900/60'
                            }`}
                          >
                            {/* Circle check (reference style) */}
                            <div className="mt-0.5 flex-shrink-0">
                              {isLocked ? (
                                <span className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                  <IconLock className="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
                                </span>
                              ) : (
                                <CheckCircle done={isDone} active={isSelected} />
                              )}
                            </div>

                            {/* Type icon (lines / play / etc) */}
                            <div className="mt-1 flex-shrink-0">
                              <ItemTypeIcon
                                type={item.type}
                                className={`w-4 h-4 ${
                                  isLocked ? 'text-zinc-300 dark:text-zinc-600'
                                    : isSelected ? 'text-watermelon-green-600 dark:text-watermelon-green-400'
                                    : 'text-zinc-400'
                                }`}
                              />
                            </div>

                            {/* Title with responsive text wrapping */}
                            <span className={`text-sm leading-snug flex-1 min-w-0 break-words whitespace-normal ${
                              isLocked
                                ? 'font-medium text-zinc-400 dark:text-zinc-600'
                                : isSelected
                                ? 'font-bold text-zinc-900 dark:text-zinc-100'
                                : isDone
                                ? 'font-semibold text-zinc-700 dark:text-zinc-300'
                                : 'font-medium text-zinc-700 dark:text-zinc-400'
                            }`}>
                              {item.title}
                            </span>
                          </button>

                          {/* Thin divider between items (like reference) */}
                          {iIdx < secItems.length - 1 && (
                            <div className="mx-5 border-b border-zinc-100 dark:border-zinc-800/60" />
                          )}
                        </React.Fragment>
                      );
                    })}

                    {/* Thicker divider between sections */}
                    {secIdx < activeCourseTree.sections.length - 1 && (
                      <div className="mt-3 border-b border-zinc-200 dark:border-zinc-800" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Certificate strip if course complete */}
          {isCourseComplete && activeCourseTree && (
            <div className="p-4 border-t border-zinc-100 dark:border-zinc-900 bg-watermelon-green-50 dark:bg-watermelon-green-950/30 flex-shrink-0">
              <button
                onClick={() => handleDownloadCert(activeCourseTree)}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-black rounded-lg bg-watermelon-green-500 hover:bg-watermelon-green-600 text-white transition-colors"
              >
                <IconDownload className="w-4 h-4" />
                Download Certificate
              </button>
            </div>
          )}
        </div>

      ) : (
        /* ══════════════════════════════════════════════════════
            MANAGER MODE — simple nav links
           ══════════════════════════════════════════════════════ */
        <nav className="p-5 space-y-2 flex-1">
          {[
            { id: 'manager_courses',     label: 'Course Catalog & Tree',   icon: IconBook    },
            { id: 'manager_users',       label: 'Agent & User Roster',      icon: IconUsers   },
          ].map(item => {
            const Icon = item.icon;
            const isActive = currentView === item.id
              || (item.id === 'manager_courses' && currentView === 'manager_course_editor');
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-start gap-3.5 px-4 py-3 text-sm font-bold rounded-lg transition-colors text-left ${
                  isActive
                    ? 'bg-watermelon-green-400 text-zinc-950 font-black'
                    : 'text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:text-white dark:hover:bg-zinc-900'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span className="break-words whitespace-normal leading-snug">{item.label}</span>
              </button>
            );
          })}
        </nav>
      )}

    </aside>
  );
}

