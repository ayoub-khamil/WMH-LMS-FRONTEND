import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { INITIAL_USERS } from '../services/mockData';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => api.auth.getCurrentUser());
  const [token, setToken] = useState(() => {
    const u = api.auth.getCurrentUser();
    return u ? (localStorage.getItem('wmh_lms_jwt_token') || `jwt_token_${u.id}`) : null;
  });
  const [allUsers, setAllUsers] = useState(INITIAL_USERS);

  useEffect(() => {
    // Sync current user
    if (user) {
      api.auth.setCurrentUser(user);
    }
  }, [user]);

  const login = async (email, password) => {
    const res = await api.auth.login(email, password);
    setUser(res.user);
    setToken(res.token);
    return res;
  };

  const logout = () => {
    api.auth.logout();
    setUser(null);
    setToken(null);
  };

  // Fast prototype role switcher
  const switchRole = (newRole) => {
    const target = allUsers.find(u => u.role === newRole && u.status === 'active') || {
      id: newRole === 'manager' ? 1 : 2,
      first_name: newRole === 'manager' ? 'Sarah' : 'Ayoub',
      last_name: newRole === 'manager' ? 'Jenkins' : 'Tariq',
      name: newRole === 'manager' ? 'Sarah Jenkins' : 'Ayoub Tariq',
      email: newRole === 'manager' ? 'sarah.jenkins@watermelon-hub.com' : 'ayoub.tariq@watermelon-hub.com',
      role: newRole,
      status: 'active'
    };
    setUser(target);
    const newToken = `jwt_token_${target.id}_${Date.now()}`;
    setToken(newToken);
    localStorage.setItem('wmh_lms_jwt_token', newToken);
    localStorage.setItem('wmh_lms_current_user', JSON.stringify(target));
  };

  const switchUser = (userObj) => {
    setUser(userObj);
    const newToken = `jwt_token_${userObj.id}_${Date.now()}`;
    setToken(newToken);
    localStorage.setItem('wmh_lms_jwt_token', newToken);
    localStorage.setItem('wmh_lms_current_user', JSON.stringify(userObj));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        role: user?.role || 'agent',
        isManager: user?.role === 'manager',
        isAgent: user?.role === 'agent',
        login,
        logout,
        switchRole,
        switchUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
