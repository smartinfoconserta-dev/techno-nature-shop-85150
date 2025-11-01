import { useState, useEffect } from "react";

interface AuthState {
  isAuthenticated: boolean;
  user: { email: string } | null;
}

const getInitialAuthState = (): AuthState => {
  const token = localStorage.getItem("auth_token");
  const userEmail = localStorage.getItem("user_email");
  
  if (token === "admin_logged_in" && userEmail) {
    return {
      isAuthenticated: true,
      user: { email: userEmail },
    };
  }
  
  return {
    isAuthenticated: false,
    user: null,
  };
};

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>(getInitialAuthState());

  const login = (email: string, password: string): boolean => {
    if (email === "laricasagrandee@gmail.com" && password === "macacapreta02") {
      localStorage.setItem("auth_token", "admin_logged_in");
      localStorage.setItem("user_email", email);
      setAuthState({
        isAuthenticated: true,
        user: { email },
      });
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_email");
    setAuthState({
      isAuthenticated: false,
      user: null,
    });
  };

  return { ...authState, login, logout };
};
