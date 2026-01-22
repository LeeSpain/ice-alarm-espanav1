import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ScrollToTop } from "@/components/ScrollToTop";

// Auth
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Layouts
import { AdminLayout } from "@/components/layout/AdminLayout";
import { CallCentreLayout } from "@/components/layout/CallCentreLayout";
import { ClientLayout } from "@/components/layout/ClientLayout";

// Pages
import Index from "./pages/Index";
import ContactPage from "./pages/ContactPage";
import PendantPage from "./pages/PendantPage";
import NotFound from "./pages/NotFound";

// Join Flow
import JoinWizard from "./pages/join/JoinWizard";

// Auth Pages
import Login from "./pages/auth/Login";
import StaffLogin from "./pages/auth/StaffLogin";
import { Navigate } from "react-router-dom";
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
import AdminTicketsPage from "./pages/admin/TicketsPage";
import LeadsPage from "./pages/admin/LeadsPage";
import MemberDetailPage from "./pages/admin/MemberDetailPage";
import AddMemberWizard from "./pages/admin/AddMemberWizard";
import PartnersPage from "./pages/admin/PartnersPage";
import PartnerDetailPage from "./pages/admin/PartnerDetailPage";
import AddPartnerPage from "./pages/admin/AddPartnerPage";
import CommissionsPage from "./pages/admin/CommissionsPage";
import PartnersQAPage from "./pages/admin/PartnersQAPage";

// Partner Pages
import PartnerOnboarding from "./pages/partner/PartnerOnboarding";
import PartnerJoin from "./pages/partner/PartnerJoin";
import PartnerVerify from "./pages/partner/PartnerVerify";
import PartnerLogin from "./pages/partner/PartnerLogin";
import PartnerDashboard from "./pages/partner/PartnerDashboard";
import PartnerInvitesPage from "./pages/partner/PartnerInvitesPage";
import PartnerCommissionsPage from "./pages/partner/PartnerCommissionsPage";
import PartnerSettingsPage from "./pages/partner/PartnerSettingsPage";
import { PartnerLayout } from "./components/layout/PartnerLayout";

// Call Centre Pages
import StaffDashboard from "./pages/call-centre/StaffDashboard";
import CallCentreDashboard from "./pages/call-centre/CallCentreDashboard";
import ShiftNotesPage from "./pages/call-centre/ShiftNotesPage";
import ShiftHistoryPage from "./pages/call-centre/ShiftHistoryPage";
import StaffPreferencesPage from "./pages/call-centre/StaffPreferencesPage";
import CallCentreTasksPage from "./pages/call-centre/TasksPage";
import CallCentreMembersPage from "./pages/call-centre/MembersPage";
import CallCentreMessagesPage from "./pages/call-centre/MessagesPage";
import CallCentreTicketsPage from "./pages/call-centre/TicketsPage";
import CallCentreLeadsPage from "./pages/call-centre/LeadsPage";

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
      <ScrollToTop />
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/pendant" element={<PendantPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/join" element={<JoinWizard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/staff/login" element={<StaffLogin />} />
            <Route path="/register" element={<Navigate to="/join" replace />} />
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
              <Route path="tickets" element={<AdminTicketsPage />} />
              <Route path="leads" element={<LeadsPage />} />
              <Route path="members/new" element={<AddMemberWizard />} />
              <Route path="members/:id" element={<MemberDetailPage />} />
              <Route path="partners" element={<PartnersPage />} />
              <Route path="partners/new" element={<AddPartnerPage />} />
              <Route path="partners/:id" element={<PartnerDetailPage />} />
              <Route path="partners-qa" element={<PartnersQAPage />} />
              <Route path="commissions" element={<CommissionsPage />} />
            </Route>

            {/* Partner Public Routes */}
            <Route path="/partner" element={<PartnerOnboarding />} />
            <Route path="/partner/join" element={<PartnerJoin />} />
            <Route path="/partner/verify" element={<PartnerVerify />} />
            <Route path="/partner/login" element={<PartnerLogin />} />

            {/* Partner Dashboard Routes - Require Partner Role */}
            <Route
              path="/partner-dashboard"
              element={
                <ProtectedRoute requirePartner>
                  <PartnerLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<PartnerDashboard />} />
              <Route path="invites" element={<PartnerInvitesPage />} />
              <Route path="commissions" element={<PartnerCommissionsPage />} />
              <Route path="settings" element={<PartnerSettingsPage />} />
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
              <Route path="shift-history" element={<ShiftHistoryPage />} />
              <Route path="preferences" element={<StaffPreferencesPage />} />
              <Route path="messages" element={<CallCentreMessagesPage />} />
              <Route path="tasks" element={<CallCentreTasksPage />} />
              <Route path="tickets" element={<CallCentreTicketsPage />} />
              <Route path="leads" element={<CallCentreLeadsPage />} />
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
