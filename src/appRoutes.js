export const DASHBOARD_TABS = ['in_progress', 'not_started', 'completed', 'all'];

export const paths = {
  home: '/',
  learn: '/learn',
  learnTab: (tab) => (tab && tab !== 'in_progress' ? `/learn?tab=${tab}` : '/learn'),
  course: (courseId) => `/learn/${courseId}`,
  item: (courseId, itemId) => `/learn/${courseId}/items/${itemId}`,
  managerCourses: '/manager/courses',
  managerEditor: (courseId) => `/manager/courses/${courseId}`,
  managerEditorItem: (courseId, itemId) => `/manager/courses/${courseId}/items/${itemId}`,
  managerCourseAssignments: (courseId) => `/manager/courses/${courseId}/assignments`,
  managerUsers: '/manager/users',
};

export function viewFromPath(pathname) {
  if (/\/assignments(?:\/|$)/.test(pathname)) return 'manager_assignments';
  if (pathname === '/manager/users' || pathname.startsWith('/manager/users/')) return 'manager_users';
  if (/^\/manager\/courses\/[^/]+/.test(pathname)) return 'manager_course_editor';
  if (pathname.startsWith('/manager')) return 'manager_courses';
  if (pathname.startsWith('/learn/') && pathname !== '/learn/') return 'agent_course_viewer';
  if (pathname === '/learn' || pathname === '/learn/') return 'agent_dashboard';
  return null;
}

export function defaultHome(role) {
  return role === 'manager' ? paths.managerCourses : paths.learn;
}

export function isAllowedPath(pathname, role) {
  if (role === 'manager') {
    return pathname.startsWith('/manager') || pathname.startsWith('/learn');
  }
  return pathname.startsWith('/learn');
}
