import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireStaff?: boolean;
  requireAdmin?: boolean;
  requireMember?: boolean;
  requirePartner?: boolean;
}

export function ProtectedRoute({
  children,
  requireStaff = false,
  requireAdmin = false,
  requireMember = false,
  requirePartner = false,
}: ProtectedRouteProps) {
  const { user, isLoading, isStaff, staffRole, memberId, isPartner } = useAuth();
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
    if (requirePartner) {
      return <Navigate to="/partner/login" state={{ from: location }} replace />;
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Partner trying to access admin or member routes
  if (isPartner && (requireStaff || requireAdmin || requireMember)) {
    return <Navigate to="/partner-dashboard" replace />;
  }

  // Staff or member trying to access partner routes
  if (requirePartner && !isPartner) {
    if (isStaff) {
      return <Navigate to="/admin" replace />;
    }
    if (memberId) {
      return <Navigate to="/dashboard" replace />;
    }
    return <Navigate to="/unauthorized" replace />;
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

  // Require partner access
  if (requirePartner && !isPartner) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
