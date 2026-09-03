import { authApi } from './auth.api';
import { usersApi } from './users.api';
import { coursesApi } from './courses.api';
import { assignmentsApi } from './assignments.api';
import { learnApi } from './learn.api';

/**
 * API-ready barrel. Same `api.{auth,users,courses,assignments,learn}`
 * call shape as the old mock layer, now backed by real HTTP.
 * No localStorage DB, no seed data, no fake latency.
 */
export const api = {
  auth: {
    login: (email, password) => authApi.login(email, password),
    me: () => authApi.me(),
    logout: () => authApi.logout()
  },
  users: {
    list: (params) => usersApi.list(params),
    create: (data) => usersApi.create(data),
    update: (userId, data) => usersApi.update(userId, data),
    updateStatus: (userId, status) => usersApi.updateStatus(userId, status),
    delete: (userId) => usersApi.remove(userId),
    getAssignments: (userId) => usersApi.getAssignments(userId)
  },
  courses: {
    list: (params) => coursesApi.list(params),
    getById: (courseId) => coursesApi.getById(courseId),
    create: (data) => coursesApi.create(data),
    update: (courseId, data) => coursesApi.update(courseId, data),
    delete: (courseId) => coursesApi.remove(courseId),
    addSection: (courseId, data) => coursesApi.addSection(courseId, data),
    reorderSections: (courseId, section_ids) => coursesApi.reorderSections(courseId, section_ids),
    updateSection: (sectionId, data) => coursesApi.updateSection(sectionId, data),
    deleteSection: (sectionId) => coursesApi.deleteSection(sectionId),
    addItem: (sectionId, data) => coursesApi.addItem(sectionId, data),
    reorderItems: (sectionId, item_ids) => coursesApi.reorderItems(sectionId, item_ids),
    updateItem: (itemId, data) => coursesApi.updateItem(itemId, data),
    deleteItem: (itemId) => coursesApi.deleteItem(itemId),
    addQuestion: (itemId, data) => coursesApi.addQuestion(itemId, data),
    updateQuestion: (questionId, data) => coursesApi.updateQuestion(questionId, data),
    deleteQuestion: (questionId) => coursesApi.deleteQuestion(questionId)
  },
  assignments: {
    assignBulk: (data) => assignmentsApi.assignBulk(data),
    unassignBulk: (data) => assignmentsApi.unassignBulk(data),
    getCourseAssignments: (courseId) => assignmentsApi.getCourseAssignments(courseId)
  },
  learn: {
    getCourses: (agentId) => learnApi.getCourses(agentId),
    getCourseTree: (courseId, agentId) => learnApi.getCourseTree(courseId, agentId),
    resumeCourse: (courseId, agentId) => learnApi.resumeCourse(courseId, agentId),
    completeItem: (itemId, courseId, agentId) => learnApi.completeItem(itemId, courseId, agentId),
    submitQuiz: (itemId, courseId, agentId, answers) => learnApi.submitQuiz(itemId, courseId, agentId, answers)
  }
};
