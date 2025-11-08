import { useState, useEffect } from "react";
import { User, Session } from '@supabase/supabase-js';
import { supabase } from "@/integrations/supabase/client";

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isLoading: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    session: null,
    isAdmin: false,
    isLoading: true,
  });

  useEffect(() => {
    const checkAdminRole = async (userId: string) => {
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();
      
      return !!roles;
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          // Update state synchronously first
          setAuthState({
            isAuthenticated: true,
            user: session.user,
            session: session,
            isAdmin: false,
            isLoading: false,
          });

          // Then check admin role asynchronously
          setTimeout(() => {
            checkAdminRole(session.user.id).then(isAdmin => {
              setAuthState(prev => ({
                ...prev,
                isAdmin
              }));
            });
          }, 0);
        } else {
          setAuthState({
            isAuthenticated: false,
            user: null,
            session: null,
            isAdmin: false,
            isLoading: false,
          });
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setAuthState({
          isAuthenticated: true,
          user: session.user,
          session: session,
          isAdmin: false,
          isLoading: false,
        });

        checkAdminRole(session.user.id).then(isAdmin => {
          setAuthState(prev => ({
            ...prev,
            isAdmin
          }));
        });
      } else {
        setAuthState({
          isAuthenticated: false,
          user: null,
          session: null,
          isAdmin: false,
          isLoading: false,
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error, data };
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return { ...authState, login, logout };
};
