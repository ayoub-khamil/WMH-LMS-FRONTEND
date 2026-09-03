import { http } from './httpClient';

/**
 * Backend contract:
 * GET    /courses?status&search&page&limit
 * GET    /courses/:id
 * POST   /courses {title,description}
 * PATCH  /courses/:id {...}
 * DELETE /courses/:id
 * POST   /courses/:id/sections {title}
 * PUT    /courses/:id/sections/order {section_ids}
 * PATCH  /sections/:id {title}
 * DELETE /sections/:id
 * POST   /sections/:id/items {title,type,content_url,text_content}
 * PUT    /sections/:id/items/order {item_ids}
 * PATCH  /items/:id {...}
 * DELETE /items/:id
 * POST   /items/:id/questions {type,prompt,options}
 * PATCH  /questions/:id {...}
 * DELETE /questions/:id
 */
export const coursesApi = {
  list(params = {}) {
    return http.get('/courses', { params });
  },
  getById(courseId) {
    return http.get(`/courses/${courseId}`);
  },
  create(data) {
    return http.post('/courses', data);
  },
  update(courseId, data) {
    return http.patch(`/courses/${courseId}`, data);
  },
  remove(courseId) {
    return http.del(`/courses/${courseId}`);
  },

  addSection(courseId, data) {
    return http.post(`/courses/${courseId}/sections`, data);
  },
  reorderSections(courseId, section_ids) {
    return http.put(`/courses/${courseId}/sections/order`, { section_ids });
  },
  updateSection(sectionId, data) {
    return http.patch(`/sections/${sectionId}`, data);
  },
  deleteSection(sectionId) {
    return http.del(`/sections/${sectionId}`);
  },

  addItem(sectionId, data) {
    return http.post(`/sections/${sectionId}/items`, data);
  },
  reorderItems(sectionId, item_ids) {
    return http.put(`/sections/${sectionId}/items/order`, { item_ids });
  },
  updateItem(itemId, data) {
    return http.patch(`/items/${itemId}`, data);
  },
  deleteItem(itemId) {
    return http.del(`/items/${itemId}`);
  },

  addQuestion(itemId, data) {
    return http.post(`/items/${itemId}/questions`, data);
  },
  updateQuestion(questionId, data) {
    return http.patch(`/questions/${questionId}`, data);
  },
  deleteQuestion(questionId) {
    return http.del(`/questions/${questionId}`);
  }
};
