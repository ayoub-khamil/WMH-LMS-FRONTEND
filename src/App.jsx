import React, { useCallback, useState } from 'react';
import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useOutletContext,
  useParams
} from 'react-router-dom';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginScreen } from './components/auth/LoginScreen';
import { Sidebar } from './components/layout/Sidebar';
import { TopNav } from './components/layout/TopNav';
import { CoursesList } from './components/manager/CoursesList';
import { CourseEditor } from './components/manager/CourseEditor';
import { AssignmentsManager } from './components/manager/AssignmentsManager';
import { UserManagement } from './components/manager/UserManagement';
import { AgentDashboard } from './components/agent/AgentDashboard';
import { CourseViewer } from './components/agent/CourseViewer';
import { IconSun, IconMoon, IconLogout } from './components/common/Icons';
import { defaultHome, isAllowedPath, paths, viewFromPath } from './appRoutes';

function HomeRedirect() {
  const { isManager } = useAuth();
  return <Navigate to={isManager ? paths.managerCourses : paths.learn} replace />;
}

function ManagerOnly({ children }) {
  const { isManager } = useAuth();
  if (!isManager) return <Navigate to={paths.learn} replace />;
  return children;
}

function AgentDashboardPage() {
  const { progressRefreshKey } = useOutletContext();
  const navigate = useNavigate();
  return (
    <AgentDashboard
      onLaunchCourse={(courseId) => navigate(paths.course(courseId))}
      refreshTrigger={progressRefreshKey}
    />
  );
}

function AgentCoursePage() {
  const { courseId, itemId } = useParams();
  const navigate = useNavigate();
  const { onProgressUpdated } = useOutletContext();
  return (
    <CourseViewer
      courseId={Number(courseId)}
      activeItemId={itemId ? Number(itemId) : null}
      onBack={() => navigate(paths.learn)}
      onSelectItem={(id, options) => {
        navigate(paths.item(courseId, id), { replace: Boolean(options?.replace) });
      }}
      onProgressUpdated={onProgressUpdated}
    />
  );
}

function ManagerCoursesPage() {
  const navigate = useNavigate();
  return (
    <CoursesList
      onSelectCourse={(courseId) => navigate(paths.managerEditor(courseId))}
      onManageAssignments={(courseId) => navigate(paths.managerCourseAssignments(courseId))}
    />
  );
}

function ManagerEditorPage() {
  const { courseId, itemId } = useParams();
  const navigate = useNavigate();
  const onCloseItem = useCallback(() => {
    navigate(paths.managerEditor(courseId));
  }, [navigate, courseId]);
  return (
    <CourseEditor
      courseId={Number(courseId)}
      editingItemId={itemId ? Number(itemId) : null}
      onBack={() => navigate(paths.managerCourses)}
      onManageAssignments={(id) => navigate(paths.managerCourseAssignments(id))}
      onEditItem={(id) => navigate(paths.managerEditorItem(courseId, id))}
      onCloseItem={onCloseItem}
    />
  );
}

function ManagerAssignmentsPage() {
  const { courseId } = useParams();
  return (
    <AssignmentsManager initialCourseId={courseId ? Number(courseId) : null} />
  );
}

function ManagerUsersPage() {
  const navigate = useNavigate();
  return (
    <UserManagement onSimulateAgent={() => navigate(paths.learn)} />
  );
}

function AppLayout() {
  const { user, isManager, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [progressRefreshKey, setProgressRefreshKey] = useState(0);

  const currentView = viewFromPath(location.pathname) || (isManager ? 'manager_courses' : 'agent_dashboard');
  const courseMatch = location.pathname.match(/^\/learn\/([^/]+)/);
  const itemMatch = location.pathname.match(/^\/learn\/[^/]+\/items\/([^/]+)/);
  const managerCourseMatch = location.pathname.match(/^\/manager\/courses\/([^/]+)/);
  const selectedCourseId = courseMatch
    ? Number(courseMatch[1])
    : managerCourseMatch
      ? Number(managerCourseMatch[1])
      : null;
  const selectedItemId = itemMatch ? Number(itemMatch[1]) : null;

  const showSidebar = currentView.startsWith('manager_') || currentView === 'agent_course_viewer';

  const getManagerTopNav = () => {
    switch (currentView) {
      case 'manager_course_editor':
        return {
          title: 'Curriculum Tree Editor',
          breadcrumbs: [
            { label: 'Courses', onClick: () => navigate(paths.managerCourses) },
            { label: 'Editor' }
          ]
        };
      case 'manager_assignments':
        return {
          title: 'Course Assignments',
          breadcrumbs: [{ label: 'Manager Console' }, { label: 'Assignments' }]
        };
      case 'manager_users':
        return {
          title: 'Agent & User Directory',
          breadcrumbs: [{ label: 'Manager Console' }, { label: 'Users' }]
        };
      default:
        return {
          title: 'Course Catalog & Curriculum Management',
          breadcrumbs: [{ label: 'Manager Console' }, { label: 'Courses' }]
        };
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-zinc-50/70 dark:bg-zinc-950">

      {currentView === 'agent_course_viewer' && (
        <div className="fixed top-3 right-4 z-50 flex items-center gap-3">
          <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate max-w-[180px] sm:max-w-none">
            {user.name || user.email}
          </span>

          <button
            onClick={() => {
              logout();
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs sm:text-sm font-bold text-zinc-600 dark:text-zinc-300 hover:text-watermelon-red-600 dark:hover:text-watermelon-red-400 hover:border-watermelon-red-200 dark:hover:border-watermelon-red-900/60 transition-colors cursor-pointer shadow-sm flex-shrink-0"
            title="Sign Out"
          >
            <IconLogout className="w-4 h-4" />
            <span className="hidden md:inline">Sign Out</span>
          </button>

          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className="p-1.5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer shadow-sm flex-shrink-0"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <IconSun className="w-4 h-4" /> : <IconMoon className="w-4 h-4" />}
          </button>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {showSidebar && (
          <Sidebar
            currentView={currentView}
            onViewChange={(view) => {
              if (view === 'agent_dashboard') navigate(paths.learn);
              else if (view === 'manager_courses') navigate(paths.managerCourses);
              else if (view === 'manager_assignments') navigate(paths.managerAssignments);
              else if (view === 'manager_users') navigate(paths.managerUsers);
              else if (view === 'agent_course_viewer' && selectedCourseId) {
                navigate(selectedItemId
                  ? paths.item(selectedCourseId, selectedItemId)
                  : paths.course(selectedCourseId));
              }
            }}
            activeCourseId={selectedCourseId}
            onSelectCourse={(courseId) => navigate(paths.course(courseId))}
            activeItemId={selectedItemId}
            onSelectItem={(itemId) => {
              if (selectedCourseId) navigate(paths.item(selectedCourseId, itemId));
            }}
            refreshTrigger={progressRefreshKey}
          />
        )}

        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {currentView.startsWith('manager_') && (
            <TopNav {...getManagerTopNav()} />
          )}

          <main className="flex-1 overflow-y-auto [scrollbar-gutter:stable]">
            <div className="w-full p-8 md:p-10">
              <Outlet context={{
                progressRefreshKey,
                onProgressUpdated: () => setProgressRefreshKey(k => k + 1)
              }} />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) {
    return (
      <LoginScreen
        onLoginSuccess={(loggedInUser) => {
          if (isAllowedPath(location.pathname, loggedInUser.role)) return;
          navigate(defaultHome(loggedInUser.role), { replace: true });
        }}
      />
    );
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/learn" element={<AgentDashboardPage />} />
        <Route path="/learn/:courseId" element={<AgentCoursePage />} />
        <Route path="/learn/:courseId/items/:itemId" element={<AgentCoursePage />} />
        <Route
          path="/manager/courses"
          element={<ManagerOnly><ManagerCoursesPage /></ManagerOnly>}
        />
        <Route
          path="/manager/courses/:courseId/items/:itemId"
          element={<ManagerOnly><ManagerEditorPage /></ManagerOnly>}
        />
        <Route
          path="/manager/courses/:courseId"
          element={<ManagerOnly><ManagerEditorPage /></ManagerOnly>}
        />
        <Route
          path="/manager/courses/:courseId/assignments"
          element={<ManagerOnly><ManagerAssignmentsPage /></ManagerOnly>}
        />
        <Route
          path="/manager/assignments"
          element={<ManagerOnly><ManagerAssignmentsPage /></ManagerOnly>}
        />
        <Route
          path="/manager/users"
          element={<ManagerOnly><ManagerUsersPage /></ManagerOnly>}
        />
        <Route path="*" element={<HomeRedirect />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
