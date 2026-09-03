import { http, setToken } from './httpClient';

/**
 * Real auth endpoints. Backend contract:
 * POST /auth/login {email,password} -> {token, user}
 * GET  /me                          -> {user} (Bearer required)
 * POST /auth/logout                 -> 200 (best effort)
 *
 * LOGIN MUST verify `password` against the persisted hash (see
 * users.api.js persistence notes) and return 401 for unknown email
 * OR wrong password (identical response, no user enumeration).
 * Disabled accounts (`status === 'disabled'`) return 403.
 */
export const authApi = {
  async login(email, password) {
    if (!email?.trim()) throw new Error('Please enter your email address');
    if (!password?.trim()) throw new Error('Please enter your password');
    const data = await http.post('/auth/login', { email: email.trim(), password }, { auth: false });
    const token = data?.token;
    const user = data?.user;
    if (!token || !user) throw new Error('Invalid login response from server');
    setToken(token);
    return { token, user };
  },

  async me() {
    const data = await http.get('/me');
    return data?.user ?? data;
  },

  async logout() {
    try {
      await http.post('/auth/logout');
    } catch {
      // best effort — always clear local token
    } finally {
      setToken(null);
    }
  }
};
