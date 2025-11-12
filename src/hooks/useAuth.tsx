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
          // Keep loading while verifying admin role
          setAuthState({
            isAuthenticated: true,
            user: session.user,
            session: session,
            isAdmin: false,
            isLoading: true,
          });

          // Check admin role directly without setTimeout
          checkAdminRole(session.user.id).then(isAdmin => {
            setAuthState(prev => ({
              ...prev,
              isAdmin,
              isLoading: false
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
          isLoading: true,
        });

        checkAdminRole(session.user.id).then(isAdmin => {
          setAuthState(prev => ({
            ...prev,
            isAdmin,
            isLoading: false
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

  const checkIsAdmin = async (): Promise<boolean> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return false;
    
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('role', 'admin')
      .maybeSingle();
    
    return !!roles;
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.email) {
      return { error: new Error('Usuário não autenticado') };
    }
    
    // Re-autenticar com senha atual
    const { error: reAuthError } = await supabase.auth.signInWithPassword({
      email: session.user.email,
      password: currentPassword,
    });
    
    if (reAuthError) {
      return { error: reAuthError };
    }
    
    // Atualizar senha
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    return { error };
  };

  return { ...authState, login, logout, checkIsAdmin, changePassword };
};
