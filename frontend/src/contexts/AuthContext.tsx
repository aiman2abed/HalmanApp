"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { type User } from "@supabase/supabase-js";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// --- New RBAC Types ---
export type UserRole = 'app_developer' | 'school_admin' | 'space_admin' | 'class_teacher' | 'parent' | 'student';
export type ScopeType = 'global' | 'school' | 'space' | 'class' | 'family' | 'self';

export interface UserRoleAssignment {
  id: string;
  role: UserRole;
  scope_type: ScopeType;
  scope_id: string | null;
}
// ----------------------

interface PublicUserProfile {
  id: string;
  display_name: string;
  total_xp: number;
  current_level: number;
}

interface AuthContextType {
  user: User | null;
  profile: PublicUserProfile | null;
  roleAssignments: UserRoleAssignment[]; // NEW
  loading: boolean;
  hasCompletedOnboarding: boolean | null;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [roleAssignments, setRoleAssignments] = useState<UserRoleAssignment[]>([]); // NEW
  const [loading, setLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);

  const router = useRouter();
  const pathname = usePathname();

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("users")
      .select("id, display_name, total_xp, current_level")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Failed to fetch public.users profile:", error);
      setProfile(null);
      return;
    }
    setProfile(data);
  };

  const checkOnboardingStatus = async (userId: string) => {
    const { data, error } = await supabase
      .from("riasec_profiles")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Failed to fetch onboarding status:", error);
      setHasCompletedOnboarding(null);
      return;
    }
    setHasCompletedOnboarding(Boolean(data));
  };

  // NEW: Fetch roles and scopes
  const fetchRoleAssignments = async (userId: string) => {
    const { data, error } = await supabase
      .from("user_role_assignments")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      console.error("Failed to fetch role assignments:", error);
      setRoleAssignments([]);
      return;
    }
    
    // Fallback: If no roles exist in DB yet, assume they are a standard student (Self Scope)
    if (!data || data.length === 0) {
      setRoleAssignments([{ id: 'default', role: 'student', scope_type: 'self', scope_id: userId }]);
    } else {
      setRoleAssignments(data as UserRoleAssignment[]);
    }
  };

const refreshProfile = async () => {
    if (!user) return;
    await Promise.all([
      fetchProfile(user.id),
      checkOnboardingStatus(user.id),
      fetchRoleAssignments(user.id) // NEW
    ]);
  };

  useEffect(() => {
    const initializeSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const activeUser = session?.user ?? null;
      setUser(activeUser);

      if (activeUser) {
        await Promise.all([
          fetchProfile(activeUser.id),
          checkOnboardingStatus(activeUser.id),
          fetchRoleAssignments(activeUser.id) // NEW
        ]);
      } else {
        setProfile(null);
        setRoleAssignments([]);
        setHasCompletedOnboarding(null);
      }
      setLoading(false);
    };

    initializeSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const activeUser = session?.user ?? null;
      setUser(activeUser);

      if (activeUser) {
        await Promise.all([
          fetchProfile(activeUser.id),
          checkOnboardingStatus(activeUser.id),
          fetchRoleAssignments(activeUser.id) // NEW
        ]);
      } else {
        setProfile(null);
        setRoleAssignments([]);
        setHasCompletedOnboarding(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;

    if (!user && pathname !== "/login") {
      router.replace("/login");
      return;
    }

    if (user && hasCompletedOnboarding === false && pathname !== "/assessment") {
      router.replace("/assessment");
    }
  }, [loading, user, hasCompletedOnboarding, pathname, router]);

  const signUp = async (email: string, password: string, displayName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    if (error) throw error;
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setRoleAssignments([]); // NEW
    setHasCompletedOnboarding(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        roleAssignments, // NEW
        loading,
        hasCompletedOnboarding,
        signUp,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};