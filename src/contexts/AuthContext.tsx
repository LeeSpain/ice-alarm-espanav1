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

  // Reduced timeout from 8s to 4s for faster perceived performance
  const withTimeout = async <T,>(promise: Promise<T>, ms: number): Promise<T> => {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Role fetch timed out after ${ms}ms`)), ms)
      ),
    ]);
  };
  
  const ROLE_FETCH_TIMEOUT = 4000; // 4 seconds (reduced from 8s)

  const fetchUserRole = async (userId: string) => {
    // Clear previous role state first to avoid stale data when switching accounts
    setIsStaff(false);
    setStaffRole(null);
    setMemberId(null);
    setPartnerId(null);
    setIsPartner(false);
    setRoleLoadFailed(false);

    try {
      // Single RPC call to get all role info - replaces 5 separate calls
      const { data, error } = await supabase.rpc("get_user_role_info", { _user_id: userId });

      if (error) throw error;

      const roleInfo = data as {
        is_staff: boolean;
        staff_role: StaffRole;
        is_partner: boolean;
        partner_id: string | null;
        member_id: string | null;
      };

      if (roleInfo.is_staff && roleInfo.staff_role) {
        setIsStaff(true);
        setStaffRole(roleInfo.staff_role);
        setMemberId(null);
        setPartnerId(null);
        setIsPartner(false);
        return;
      }

      if (roleInfo.is_partner && roleInfo.partner_id) {
        setPartnerId(roleInfo.partner_id);
        setIsPartner(true);
        setIsStaff(false);
        setStaffRole(null);
        setMemberId(null);
        return;
      }

      if (roleInfo.member_id) {
        setMemberId(roleInfo.member_id);
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
        await withTimeout(fetchUserRole(session.user.id), ROLE_FETCH_TIMEOUT);
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
        await withTimeout(fetchUserRole(user.id), ROLE_FETCH_TIMEOUT);
      } catch (e) {
        console.error("[AuthContext] Role fetch failed on retry:", e);
        setRoleLoadFailed(true);
      }
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    let initialSessionHandled = false;

    // Set up auth state listener BEFORE getting session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        // Skip INITIAL_SESSION since we handle it in initializeAuth
        // This prevents duplicate role fetching
        if (event === 'INITIAL_SESSION') {
          return;
        }

        // Only re-fetch roles on actual auth changes (sign in/out)
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setIsLoading(true);
          setSession(session);
          setUser(session?.user ?? null);

          if (session?.user) {
            try {
              await withTimeout(fetchUserRole(session.user.id), ROLE_FETCH_TIMEOUT);
            } catch (e) {
              console.error("[AuthContext] Role fetch failed:", e);
              if (isMounted) setRoleLoadFailed(true);
            }
          }
          
          if (isMounted) {
            setIsLoading(false);
          }
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setIsStaff(false);
          setStaffRole(null);
          setMemberId(null);
          setPartnerId(null);
          setIsPartner(false);
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
          await withTimeout(fetchUserRole(session.user.id), ROLE_FETCH_TIMEOUT);
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
