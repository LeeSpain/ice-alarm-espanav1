import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type StaffRole = "super_admin" | "admin" | "call_centre" | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isStaff: boolean;
  staffRole: StaffRole;
  memberId: string | null;
  partnerId: string | null;
  isPartner: boolean;
  roleLoadFailed: boolean;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  retryRoleLoad: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStaff, setIsStaff] = useState(false);
  const [staffRole, setStaffRole] = useState<StaffRole>(null);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [isPartner, setIsPartner] = useState(false);
  const [roleLoadFailed, setRoleLoadFailed] = useState(false);

  const withTimeout = async <T,>(promise: Promise<T>, ms: number): Promise<T> => {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Role fetch timed out after ${ms}ms`)), ms)
      ),
    ]);
  };

  const fetchUserRole = async (userId: string) => {
    // Clear previous role state first to avoid stale data when switching accounts
    setIsStaff(false);
    setStaffRole(null);
    setMemberId(null);
    setPartnerId(null);
    setIsPartner(false);
    setRoleLoadFailed(false);

    try {
      // Prefer SECURITY DEFINER RPCs to avoid RLS issues when determining role.
      const [isStaffRes, roleRes, isPartnerRes, partnerIdRes, memberIdRes] = await Promise.all([
        supabase.rpc("is_staff", { _user_id: userId }),
        supabase.rpc("get_staff_role", { _user_id: userId }),
        supabase.rpc("is_partner", { _user_id: userId }),
        supabase.rpc("get_partner_id", { _user_id: userId }),
        supabase.rpc("get_member_id", { _user_id: userId }),
      ]);

      const isStaff = Boolean(isStaffRes.data);
      const staffRole = (roleRes.data as StaffRole) ?? null;
      const isPartner = Boolean(isPartnerRes.data);
      const partnerId = (partnerIdRes.data as string | null) ?? null;
      const memberId = (memberIdRes.data as string | null) ?? null;

      if (isStaff && staffRole) {
        setIsStaff(true);
        setStaffRole(staffRole);
        setMemberId(null);
        setPartnerId(null);
        setIsPartner(false);
        return;
      }

      if (isPartner && partnerId) {
        setPartnerId(partnerId);
        setIsPartner(true);
        setIsStaff(false);
        setStaffRole(null);
        setMemberId(null);
        return;
      }

      if (memberId) {
        setMemberId(memberId);
        setIsStaff(false);
        setStaffRole(null);
        setPartnerId(null);
        setIsPartner(false);
        return;
      }

      // User exists but is neither staff, partner, nor member yet
    } catch (error) {
      console.error("Error fetching user role:", error);
      setRoleLoadFailed(true);
    }
  };

  const refreshAuth = async () => {
    setRoleLoadFailed(false);
    const { data: { session } } = await supabase.auth.getSession();
    setSession(session);
    setUser(session?.user ?? null);
    if (session?.user) {
      try {
        await withTimeout(fetchUserRole(session.user.id), 8000);
      } catch (e) {
        console.error("[AuthContext] Role fetch failed on refresh:", e);
        setRoleLoadFailed(true);
      }
    }
  };

  const retryRoleLoad = async () => {
    if (user) {
      setIsLoading(true);
      setRoleLoadFailed(false);
      try {
        await withTimeout(fetchUserRole(user.id), 8000);
      } catch (e) {
        console.error("[AuthContext] Role fetch failed on retry:", e);
        setRoleLoadFailed(true);
      }
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Set up auth state listener BEFORE getting session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        setIsLoading(true);
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Avoid getting stuck in a forever-loading state if RPCs hang.
          try {
            await withTimeout(fetchUserRole(session.user.id), 8000);
          } catch (e) {
            console.error("[AuthContext] Role fetch failed:", e);
            if (isMounted) setRoleLoadFailed(true);
          }
        } else {
          setIsStaff(false);
          setStaffRole(null);
          setMemberId(null);
          setPartnerId(null);
          setIsPartner(false);
        }
        
        if (isMounted) {
          setIsLoading(false);
        }
      }
    );

    // Get initial session
    const initializeAuth = async () => {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!isMounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Avoid getting stuck in a forever-loading state if RPCs hang.
        try {
          await withTimeout(fetchUserRole(session.user.id), 8000);
        } catch (e) {
          console.error("[AuthContext] Role fetch failed:", e);
          if (isMounted) setRoleLoadFailed(true);
        }
      }
      
      if (isMounted) {
        setIsLoading(false);
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsStaff(false);
    setStaffRole(null);
    setMemberId(null);
    setPartnerId(null);
    setIsPartner(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsStaff(false);
    setStaffRole(null);
    setMemberId(null);
    setPartnerId(null);
    setIsPartner(false);
    setRoleLoadFailed(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isStaff,
        staffRole,
        memberId,
        partnerId,
        isPartner,
        roleLoadFailed,
        signOut: handleSignOut,
        refreshAuth,
        retryRoleLoad,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
