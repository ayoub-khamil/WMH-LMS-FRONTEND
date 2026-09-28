import { http } from './httpClient';

/**
 * Backend contract (root account only; 403 for anyone else):
 * GET /audit?limit= -> [{id, actor_email, action, target_type, target_id,
 *                        target_label, detail, created_at}] newest first
 */
export const auditApi = {
  recent(limit = 200) {
    return http.get('/audit', { params: { limit } });
  }
};
