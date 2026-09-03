import { http } from './httpClient';

/**
 * Backend contract:
 * POST   /assignments/bulk {course_id, agent_ids}
 * DELETE /assignments/bulk {course_id, agent_ids}
 * GET    /courses/:id/assignments
 */
export const assignmentsApi = {
  assignBulk(data) {
    return http.post('/assignments/bulk', data);
  },
  unassignBulk(data) {
    return http.del('/assignments/bulk', data);
  },
  getCourseAssignments(courseId) {
    return http.get(`/courses/${courseId}/assignments`);
  }
};
