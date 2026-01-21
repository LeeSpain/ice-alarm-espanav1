import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Auth
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Layouts
import { AdminLayout } from "@/components/layout/AdminLayout";
import { CallCentreLayout } from "@/components/layout/CallCentreLayout";
import { ClientLayout } from "@/components/layout/ClientLayout";

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Auth Pages
import Login from "./pages/auth/Login";
import StaffLogin from "./pages/auth/StaffLogin";
import Register from "./pages/auth/Register";
import CompleteRegistration from "./pages/auth/CompleteRegistration";
import Unauthorized from "./pages/auth/Unauthorized";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import MembersPage from "./pages/admin/MembersPage";
import DevicesPage from "./pages/admin/DevicesPage";
import OrdersPage from "./pages/admin/OrdersPage";
import SubscriptionsPage from "./pages/admin/SubscriptionsPage";
import PaymentsPage from "./pages/admin/PaymentsPage";
import AlertsPage from "./pages/admin/AlertsPage";
import StaffPage from "./pages/admin/StaffPage";
import ReportsPage from "./pages/admin/ReportsPage";
import SettingsPage from "./pages/admin/SettingsPage";
import MessagesPage from "./pages/admin/MessagesPage";
import TasksPage from "./pages/admin/TasksPage";
import MemberDetailPage from "./pages/admin/MemberDetailPage";
import AddMemberWizard from "./pages/admin/AddMemberWizard";

// Call Centre Pages
import StaffDashboard from "./pages/call-centre/StaffDashboard";
import CallCentreDashboard from "./pages/call-centre/CallCentreDashboard";
import ShiftNotesPage from "./pages/call-centre/ShiftNotesPage";
import CallCentreTasksPage from "./pages/call-centre/TasksPage";
import CallCentreMembersPage from "./pages/call-centre/MembersPage";
import CallCentreMessagesPage from "./pages/call-centre/MessagesPage";

// Client Pages
import ClientDashboard from "./pages/client/ClientDashboard";
import ProfilePage from "./pages/client/ProfilePage";
import MedicalInfoPage from "./pages/client/MedicalInfoPage";
import EmergencyContactsPage from "./pages/client/EmergencyContactsPage";
import DevicePage from "./pages/client/DevicePage";
import SubscriptionPage from "./pages/client/SubscriptionPage";
import AlertHistoryPage from "./pages/client/AlertHistoryPage";
import SupportPage from "./pages/client/SupportPage";
import ClientMessagesPage from "./pages/client/MessagesPage";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/staff/login" element={<StaffLogin />} />
            <Route path="/register" element={<Register />} />
            <Route path="/complete-registration" element={<CompleteRegistration />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Admin Dashboard Routes - Require Admin Role */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireStaff requireAdmin>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="members" element={<MembersPage />} />
              <Route path="devices" element={<DevicesPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="subscriptions" element={<SubscriptionsPage />} />
              <Route path="payments" element={<PaymentsPage />} />
              <Route path="alerts" element={<AlertsPage />} />
              <Route path="staff" element={<StaffPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="messages" element={<MessagesPage />} />
              <Route path="tasks" element={<TasksPage />} />
              <Route path="members/new" element={<AddMemberWizard />} />
              <Route path="members/:id" element={<MemberDetailPage />} />
            </Route>

            {/* Call Centre Dashboard Routes - Require Staff Role */}
            <Route
              path="/call-centre"
              element={
                <ProtectedRoute requireStaff>
                  <CallCentreLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<StaffDashboard />} />
              <Route path="alerts" element={<CallCentreDashboard />} />
              <Route path="members" element={<CallCentreMembersPage />} />
              <Route path="members/:id" element={<MemberDetailPage />} />
              <Route path="shift-notes" element={<ShiftNotesPage />} />
              <Route path="messages" element={<CallCentreMessagesPage />} />
              <Route path="tasks" element={<CallCentreTasksPage />} />
            </Route>

            {/* Client Dashboard Routes - Require Member */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute requireMember>
                  <ClientLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<ClientDashboard />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="medical" element={<MedicalInfoPage />} />
              <Route path="contacts" element={<EmergencyContactsPage />} />
              <Route path="device" element={<DevicePage />} />
              <Route path="subscription" element={<SubscriptionPage />} />
              <Route path="alerts" element={<AlertHistoryPage />} />
              <Route path="support" element={<SupportPage />} />
              <Route path="messages" element={<ClientMessagesPage />} />
            </Route>

            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </TooltipProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
