import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { DASHBOARD_TABS } from '../../appRoutes';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';
import { downloadCertificatePDF } from '../../services/certificate';
import { 
  IconAcademicCap, 
  IconPlay, 
  IconDownload, 
  IconCheck, 
  IconLogout, 
  IconSun, 
  IconMoon 
} from '../common/Icons';
import lightLogoSrc from '/assets/newTransparentLogo.png';
import darkLogoSrc from '/assets/darkModeLogo.png';
import { reportError } from '../../services/logger';

export function AgentDashboard({ onLaunchCourse, refreshTrigger = 0 }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [coursesData, setCoursesData] = useState({ in_progress: [], not_started: [], completed: [] });
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const activeTab = DASHBOARD_TABS.includes(tabFromUrl) ? tabFromUrl : 'in_progress';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const setActiveTab = (tabId) => {
    const next = new URLSearchParams(searchParams);
    if (!tabId || tabId === 'in_progress') next.delete('tab');
    else next.set('tab', tabId);
    setSearchParams(next);
  };

  useEffect(() => {
    setLoading(true);
    setError('');
    api.learn.getCourses(user.id)
      .then(data => setCoursesData(data))
      .catch((err) => {
        reportError(err);
        setError(err.message || 'Failed to load courses.');
      })
      .finally(() => setLoading(false));
  }, [user.id, refreshTrigger, reloadKey]);

  const handleDownloadCert = (course) => {
    downloadCertificatePDF({
      agentName: user?.name || 'Frontline Specialist',
      courseTitle: course.title,
      completionDate: course.completed_at || new Date().toISOString(),
      courseId: course.id
    });
  };

  const tabs = [
    { id: 'in_progress', label: 'In Progress',  count: coursesData.in_progress.length },
    { id: 'not_started', label: 'Not Started',   count: coursesData.not_started.length },
    { id: 'completed',   label: 'Completed',     count: coursesData.completed.length   },
    { id: 'all',         label: 'All',           count: coursesData.in_progress.length + coursesData.not_started.length + coursesData.completed.length },
  ];

  const displayedCourses = activeTab === 'all'
    ? [...coursesData.in_progress, ...coursesData.not_started, ...coursesData.completed]
    : coursesData[activeTab] || [];

  return (
    <div className="space-y-8">

      {/* ── Brand Logo + Centered Tabs + Right Agent Controls ── */}
      <div className="flex items-end justify-between border-b border-zinc-200 dark:border-zinc-800 gap-4">
        
        {/* Left: Logo */}
        <div className="flex-1 flex items-end min-w-0">
          <img
            src={theme === 'dark' ? darkLogoSrc : lightLogoSrc}
            alt="WatermelonHub"
            className="h-[64px] w-auto object-contain mb-1"
          />
        </div>

        {/* Center: Tabs */}
        <div className="flex justify-center space-x-6 sm:space-x-8 flex-shrink-0">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 text-sm font-black transition-all -mb-px flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-b-4 border-watermelon-green-500 text-watermelon-green-900 dark:text-watermelon-green-300'
                  : 'text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-xs tabular-nums px-1.5 py-0.5 rounded-full ${
                activeTab === tab.id
                  ? 'bg-watermelon-green-100 text-watermelon-green-900 dark:bg-watermelon-green-900 dark:text-watermelon-green-200'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Right: Agent Name + Sign Out + Theme Toggle */}
        <div className="flex-1 flex items-center justify-end gap-3 sm:gap-3.5 pb-3 min-w-0">
          <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-[180px] sm:max-w-none">
            {user?.name || user?.email}
          </span>

          <button
            onClick={logout}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#F7F8ED] dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs sm:text-sm font-bold text-zinc-600 dark:text-zinc-300 hover:text-watermelon-red-600 dark:hover:text-watermelon-red-400 hover:border-watermelon-red-200 dark:hover:border-watermelon-red-900/60 transition-colors cursor-pointer shadow-sm flex-shrink-0"
            title="Sign Out"
          >
            <IconLogout className="w-4 h-4" />
            <span className="hidden md:inline">Sign Out</span>
          </button>

          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className="p-1.5 rounded-full bg-[#F7F8ED] dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer shadow-sm flex-shrink-0"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <IconSun className="w-4 h-4" /> : <IconMoon className="w-4 h-4" />}
          </button>
        </div>

      </div>

      {/* ── Full-Width Course Cards ───────────────────────────────── */}
      {loading ? (
        <div className="py-28 text-center text-zinc-400 text-base font-medium">
          Loading your training courses…
        </div>
      ) : error ? (
        <div className="py-16 text-center space-y-4">
          <p className="text-sm font-semibold text-watermelon-red-600 dark:text-watermelon-red-400">{error}</p>
          <Button variant="secondary" size="md" onClick={() => setReloadKey(k => k + 1)}>
            Retry
          </Button>
        </div>
      ) : displayedCourses.length === 0 ? (
        <EmptyState
          icon={IconAcademicCap}
          title="No courses in this category"
          description="Enroll in published courses through your Training Manager to see training content here."
        />
      ) : (
        <div className="space-y-4">
          {displayedCourses.map((course) => {
            const state = course.assignment_status || course.status;
            const isDone     = state === 'completed' || course.progress === 100;
            const notStarted = state === 'not_started' || (course.completed_item_ids?.length || 0) === 0;
            const pct        = course.progress || 0;
            const completed  = course.completed_item_ids?.length || 0;
            const total      = course.total_items || 0;

            return (
              <div
                key={course.id}
                className={`w-full bg-[#F7F8ED] dark:bg-zinc-900 rounded-xl overflow-hidden border-t-4 ${
                  isDone
                    ? 'border-t-watermelon-green-500'
                    : notStarted
                    ? 'border-t-zinc-300 dark:border-t-zinc-700'
                    : 'border-t-watermelon-green-400'
                } border-x-[1.5px] border-b-[1.5px] border-zinc-200 dark:border-zinc-800 hover:bg-[#F7F8ED] dark:hover:bg-zinc-800/60 transition-all`}
              >
                <div className="px-8 pt-5 pb-6 space-y-4">
                  {/* FAR TOP: Status Badge */}
                  <div className="flex items-center justify-start">
                    <Badge variant={isDone ? 'completed' : notStarted ? 'not_started' : 'in_progress'} className="w-28 justify-center text-center font-bold tabular-nums">
                      {isDone ? 'COMPLETED' : notStarted ? 'NOT STARTED' : 'IN PROGRESS'}
                    </Badge>
                  </div>

                  {/* Main Grid Content */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">

                    {/* COLUMN 1: Course Title & Description (Span 6) */}
                    <div className="lg:col-span-6 space-y-1.5 pr-2">
                      <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 leading-snug break-words">
                        {course.title}
                      </h3>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-2">
                        {course.description}
                      </p>
                      {(course.assigned_at || (isDone && course.completed_at)) && (
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">
                          {course.assigned_at && (
                            <>Assigned {new Date(course.assigned_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</>
                          )}
                          {course.assigned_at && isDone && course.completed_at && <> · </>}
                          {isDone && course.completed_at && (
                            <>Completed {new Date(course.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</>
                          )}
                        </p>
                      )}
                    </div>

                    {/* COLUMN 2: Progress Gauge (Span 3) */}
                    <div className="lg:col-span-3 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-zinc-400 uppercase tracking-wide">
                        <span>Progress</span>
                        <span className="tabular-nums text-watermelon-green-700 dark:text-watermelon-green-400 text-sm">
                          {pct}%
                        </span>
                      </div>
                      <div
                        className="h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden"
                        role="progressbar"
                        aria-label={`${course.title} progress`}
                        aria-valuenow={pct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <div
                          className="h-full bg-watermelon-green-500 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-xs tabular-nums text-zinc-400 dark:text-zinc-500 font-medium">
                        {completed} of {total} modules
                      </p>
                    </div>

                    {/* COLUMN 3: Actions (Span 3) - Centered */}
                    <div className="lg:col-span-3 flex items-center justify-center lg:justify-end">
                      <div className="flex flex-col items-center justify-center gap-2.5 w-full max-w-[170px]">
                        <Button
                          variant="secondary"
                          size="md"
                          onClick={() => onLaunchCourse(course.id)}
                          className="whitespace-nowrap w-full justify-center text-center"
                        >
                          {isDone ? (
                            <IconCheck className="w-4 h-4 text-watermelon-green-600 dark:text-watermelon-green-400" />
                          ) : (
                            <IconPlay className="w-4 h-4 text-watermelon-green-600 dark:text-watermelon-green-400" />
                          )}
                          <span>{isDone ? 'Review' : notStarted ? 'Start Course' : 'Resume'}</span>
                        </Button>

                        {isDone && (
                          <Button
                            variant="secondary"
                            size="md"
                            onClick={() => handleDownloadCert(course)}
                            className="whitespace-nowrap w-full justify-center text-center"
                          >
                            <IconDownload className="w-4 h-4 text-watermelon-green-600 dark:text-watermelon-green-400" />
                            <span>Certificate</span>
                          </Button>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
