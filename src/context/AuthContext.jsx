import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { getToken } from '../services/httpClient';

const AuthContext = createContext();

// One-time cleanup of legacy mock persistence (safe to run on every boot).
function clearLegacyMockKeys() {
  try {
    localStorage.removeItem('wmh_lms_users');
    localStorage.removeItem('wmh_lms_courses');
    localStorage.removeItem('wmh_lms_assignments');
    localStorage.removeItem('wmh_lms_jwt_token');
    localStorage.removeItem('wmh_lms_current_user');
  } catch (e) {
    console.error(e);
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(() => getToken());
  const [authLoading, setAuthLoading] = useState(() => !!getToken());

  useEffect(() => {
    clearLegacyMockKeys();
  }, []);

  // Validate persisted token on boot via GET /me
  useEffect(() => {
    let cancelled = false;
    const t = getToken();
    if (!t) {
      setAuthLoading(false);
      return undefined;
    }
    setAuthLoading(true);
    api.auth.me()
      .then((meUser) => {
        if (!cancelled) {
          setUser(meUser);
          setTokenState(getToken());
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null);
          setTokenState(null);
        }
      })
      .finally(() => {
        if (!cancelled) setAuthLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } finally {
      setUser(null);
      setTokenState(null);
    }
  }, []);

  // Auto-logout when httpClient sees a 401
  useEffect(() => {
    const onUnauthorized = () => {
      setUser(null);
      setTokenState(null);
    };
    window.addEventListener('auth:unauthorized', onUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', onUnauthorized);
  }, []);

  const login = async (email, password) => {
    const res = await api.auth.login(email, password);
    setUser(res.user);
    setTokenState(res.token);
    return res;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        authLoading,
        isAuthenticated: !!user,
        role: user?.role || 'agent',
        isManager: user?.role === 'manager',
        isAgent: user?.role === 'agent',
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
