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
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
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

  const fetchUserRole = async (userId: string) => {
    try {
      // Prefer SECURITY DEFINER RPCs to avoid RLS issues when determining role.
      // NOTE: We pass the userId explicitly (instead of relying on auth.uid())
      // because these RPCs are designed to accept a _user_id argument.
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
      setIsStaff(false);
      setStaffRole(null);
      setMemberId(null);
      setPartnerId(null);
      setIsPartner(false);
    } catch (error) {
      console.error("Error fetching user role:", error);
      setIsStaff(false);
      setStaffRole(null);
      setMemberId(null);
      setPartnerId(null);
      setIsPartner(false);
    }
  };

  const refreshAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setSession(session);
    setUser(session?.user ?? null);
    if (session?.user) {
      await fetchUserRole(session.user.id);
    }
  };

  useEffect(() => {
    // Set up auth state listener BEFORE getting session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Use setTimeout to avoid potential race conditions
          setTimeout(() => fetchUserRole(session.user.id), 0);
        } else {
          setIsStaff(false);
          setStaffRole(null);
          setMemberId(null);
          setPartnerId(null);
          setIsPartner(false);
        }
        setIsLoading(false);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
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
        signOut,
        refreshAuth,
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
