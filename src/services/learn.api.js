import { http } from './httpClient';

/**
 * Backend contract (agent learning experience):
 * GET  /learn/courses?agent_id=            -> {in_progress,not_started,completed}
 * GET  /learn/courses/:id?agent_id=        -> {...course, completed_item_ids, assignment_status}
 * GET  /learn/courses/:id/resume?agent_id= -> {next_item_id}
 * POST /learn/complete {item_id,course_id,agent_id}
 * POST /learn/quiz/submit {item_id,course_id,agent_id,answers}
 * POST /learn/views {agent_id,course_id,viewed_item_id} (review gate)
 * GET  /learn/quiz/lock?agent_id&item_id (server lock status)
 *
 * NOTE: sessionStorage (services/quizCooldownStore.js) remains as a fast
 * local mirror, but the server lock is authoritative and survives reloads.
 *
 * The agent_id these calls send is a convenience only. The server derives
 * identity from the bearer token: an agent may act only as themselves
 * (403 otherwise), and every read and write requires an existing assignment
 * for that course (403 if not enrolled). Quiz submission returns 423 while
 * the cooldown is running or until another item in the course has been
 * viewed (POST /learn/views).
 */
export const learnApi = {
  getCourses(agentId) {
    return http.get('/learn/courses', { params: { agent_id: agentId } });
  },
  getCourseTree(courseId, agentId) {
    return http.get(`/learn/courses/${courseId}`, { params: { agent_id: agentId } });
  },
  resumeCourse(courseId, agentId) {
    return http.get(`/learn/courses/${courseId}/resume`, { params: { agent_id: agentId } });
  },
  completeItem(itemId, courseId, agentId) {
    return http.post('/learn/complete', { item_id: itemId, course_id: courseId, agent_id: agentId });
  },
  submitQuiz(itemId, courseId, agentId, answers) {
    return http.post('/learn/quiz/submit', {
      item_id: itemId,
      course_id: courseId,
      agent_id: agentId,
      answers
    });
  },
  recordView(agentId, courseId, viewedItemId) {
    return http.post('/learn/views', {
      agent_id: agentId,
      course_id: courseId,
      viewed_item_id: viewedItemId
    });
  },
  getQuizLock(agentId, itemId) {
    return http.get('/learn/quiz/lock', { params: { agent_id: agentId, item_id: itemId } });
  }
};
