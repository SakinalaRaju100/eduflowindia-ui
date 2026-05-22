import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { authAPI } from '@/api/client';
import ShowSnackbar, { showSnackbar } from '@/components/common/ShowSnackbar';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await authAPI.getMe();
      setUser(data.data);
    } catch {
      localStorage.clear();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // Inactivity logout (30 min)
  useEffect(() => {
    if (!user) return;
    let timer;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(
        () => {
          logout();
        },
        30 * 60 * 1000,
      );
    };
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, reset));
    reset();
    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [user]);

  const login = async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    localStorage.setItem('accessToken', data.data.accessToken);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    setUser(data.data.user);
    showSnackbar('Logged in successfully!', 'success');
    // window.location.reload();
    return data.data;
  };

  const logout = async () => {
    try {
      await authAPI.logout(localStorage.getItem('refreshToken'));
    } catch (_) {}
    showSnackbar('Logged out successfully!', 'success');
    localStorage.clear();
    setUser(null);
  };

  const updatePreferences = async (prefs) => {
    await authAPI.updatePreferences(prefs);
    setUser((prev) => ({
      ...prev,
      preferences: { ...prev.preferences, ...prefs },
    }));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updatePreferences, setUser }}>
      {children}
      <ShowSnackbar />
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
