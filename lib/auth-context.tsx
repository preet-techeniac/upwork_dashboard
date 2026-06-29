'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface AuthUser {
  id: number;
  username: string;
  displayName: string;
  role: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Returns the token's expiry time in epoch milliseconds, or null if the token
 * is malformed or carries no `exp` claim. Tokens are signed with a 1-day
 * lifetime, so this is what enforces "sign in again after a day" on the client.
 */
function getTokenExpiry(token: string): number | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const { exp } = JSON.parse(json) as { exp?: number };
    return typeof exp === 'number' ? exp * 1000 : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('auth_user');
    const expiry = savedToken ? getTokenExpiry(savedToken) : null;
    if (savedToken && savedUser && expiry !== null && expiry > Date.now()) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    } else {
      // No session, or it has expired (more than a day old) — force re-login.
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
    setLoading(false);
  }, []);

  // Auto sign-out the moment the current token expires, so a user who leaves
  // the tab open is bounced to /login instead of staying signed in past a day.
  useEffect(() => {
    if (!token) return;
    const expiry = getTokenExpiry(token);
    if (expiry === null) return;
    const msUntilExpiry = expiry - Date.now();
    if (msUntilExpiry <= 0) {
      logout();
      return;
    }
    const timer = setTimeout(() => logout(), msUntilExpiry);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (!loading) {
      const isAuthPage = pathname === '/login';
      if (!user && !isAuthPage) {
        router.push('/login');
      } else if (user && isAuthPage) {
        router.push('/');
      }
    }
  }, [user, loading, pathname, router]);

  const login = (newToken: string, newUser: AuthUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('auth_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    router.push('/login');
  };

  const isAuthPage = pathname === '/login';

  // Decide what to render to prevent flashes of unauthorized UI
  const shouldRenderChildren = !loading && (
    (user && !isAuthPage) || (!user && isAuthPage)
  );

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {shouldRenderChildren ? (
        children
      ) : (
        <div style={{
          display: 'flex',
          minHeight: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#090d16',
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: '3px solid rgba(20,184,166,0.1)',
            borderTopColor: '#14b8a6',
            animation: 'auth-spin 1s linear infinite',
          }} />
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes auth-spin {
              to { transform: rotate(360deg); }
            }
          `}} />
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function authFetch(url: string, token: string | null, options: RequestInit = {}) {
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
}
