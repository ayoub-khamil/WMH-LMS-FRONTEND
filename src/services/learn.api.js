import { http } from './httpClient';

/**
 * Backend contract (agent learning experience):
 * GET  /learn/courses?agent_id=            -> {in_progress,not_started,completed}
 * GET  /learn/courses/:id?agent_id=        -> {...course, completed_item_ids, assignment_status}
 * GET  /learn/courses/:id/resume?agent_id= -> {next_item_id}
 * POST /learn/complete {item_id,course_id,agent_id}
 * POST /learn/quiz/submit {item_id,course_id,agent_id,answers}
 *
 * NOTE: quiz retake cooldown stays UI-only (sessionStorage,
 * services/quizCooldownStore.js) until the backend adds
 * getQuizLock/recordItemView endpoints.
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
  }
};
