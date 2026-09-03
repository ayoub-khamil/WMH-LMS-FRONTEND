import { http } from './httpClient';

/**
 * Backend contract (paginated shape {data, pagination} preserved
 * so useListQuery-based components keep working):
 * GET    /users?role&status&search&page&limit
 * POST   /users {first_name,last_name,email,password,role}
 * PATCH  /users/:id {...}
 * PATCH  /users/:id/status {status}
 * DELETE /users/:id
 * GET    /users/:id/assignments
 *
 * PASSWORD PERSISTENCE (binding on the backend — demo or production):
 * - POST /users MUST persist the supplied `password` (or a securely
 *   generated temporary one when omitted). Store ONLY a salted hash
 *   (BCrypt, Argon2, or ASP.NET Core PasswordHasher) — never plaintext.
 * - No user endpoint may ever return a password/hash (list, get,
 *   create, update responses must omit the field entirely).
 * - POST /auth/login MUST verify the candidate password against the
 *   stored hash (constant-time compare) and return 401 on mismatch.
 * - The old mock layer dropped `password` on create and never checked
 *   it on login; that behavior must NOT be reproduced.
 */
export const usersApi = {
  list(params = {}) {
    return http.get('/users', { params });
  },
  create(data) {
    return http.post('/users', data);
  },
  update(userId, data) {
    return http.patch(`/users/${userId}`, data);
  },
  updateStatus(userId, status) {
    return http.patch(`/users/${userId}/status`, { status });
  },
  remove(userId) {
    return http.del(`/users/${userId}`);
  },
  getAssignments(userId) {
    return http.get(`/users/${userId}/assignments`);
  }
};
