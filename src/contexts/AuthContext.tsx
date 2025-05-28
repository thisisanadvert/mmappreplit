import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

type UserRole = 
  | 'rtm-director' 
  | 'sof-director' 
  | 'leaseholder' 
  | 'shareholder' 
  | 'management-company';

type BuildingType = 'rtm' | 'share-of-freehold' | 'landlord-managed';

interface AuthUser extends User {
  role?: UserRole;
  metadata?: {
    firstName?: string;
    lastName?: string;
    buildingId?: string;
    buildingName?: string;
    buildingAddress?: string;
    unitNumber?: string;
    onboardingComplete?: boolean;
  };
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: { message: string } }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: { message: string } }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        const userWithRole = {
          ...session.user,
          role: session.user.user_metadata?.role,
          metadata: session.user.user_metadata
        };
        setUser(userWithRole);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        // Create a user object with metadata from the session
        const userWithRole: AuthUser = {
          ...session.user,
          role: session.user.user_metadata?.role,
          metadata: session.user.user_metadata
        };
        
        // If we don't have a buildingId in metadata, try to fetch it
        if (!userWithRole.metadata?.buildingId) {
          // Fetch the building ID from building_users table
          supabase
            .from('building_users')
            .select('building_id')
            .eq('user_id', session.user.id)
            .maybeSingle()
            .then(({ data, error }) => {
              if (error && error.code !== 'PGRST116') {
                console.error('Error fetching building ID:', error);
              } else if (data) {
                // Update user metadata with the building ID
                const buildingId = data.building_id;
                
                // Update local user state
                userWithRole.metadata = {
                  ...userWithRole.metadata,
                  buildingId
                };
                setUser(userWithRole);
                
                // Also update the user metadata in Supabase
                supabase.auth.updateUser({
                  data: { 
                    ...session.user.user_metadata,
                    buildingId 
                  }
                }).catch(err => {
                  console.error('Error updating user metadata:', err);
                });
              }
            });
        }
        
        setUser(userWithRole);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      if (data.session && data.user) {
        setSession(data.session);
        const userWithRole = {
          ...data.user,
          role: data.user.user_metadata?.role,
          metadata: data.user.user_metadata
        };
        setUser(userWithRole);

        const basePath = data.user.user_metadata?.role?.split('-')[0];
        navigate(`/${basePath}`);
      }

      return {};
    } catch (error: any) {
      return { error };
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    setUser(null);
    setSession(null);
    navigate('/login');
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `https://app.manage.management/reset-password`,
      });

      if (error) {
        return { error };
      }

      return {};
    } catch (error: any) {
      return { error };
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      signIn,
      signOut,
      resetPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}