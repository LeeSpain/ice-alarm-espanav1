import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireStaff?: boolean;
  requireAdmin?: boolean;
  requireMember?: boolean;
}

export function ProtectedRoute({
  children,
  requireStaff = false,
  requireAdmin = false,
  requireMember = false,
}: ProtectedRouteProps) {
  const { user, isLoading, isStaff, staffRole, memberId } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    // Redirect to appropriate login page
    if (requireStaff || requireAdmin) {
      return <Navigate to="/staff/login" state={{ from: location }} replace />;
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Require staff access
  if (requireStaff && !isStaff) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Require admin access (admin or super_admin)
  if (requireAdmin && (!isStaff || (staffRole !== "admin" && staffRole !== "super_admin"))) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Require member access
  if (requireMember && !memberId) {
    // User is logged in but not a member - redirect to complete registration
    return <Navigate to="/complete-registration" replace />;
  }

  return <>{children}</>;
}
