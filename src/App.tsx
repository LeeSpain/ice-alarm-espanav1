import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ScrollToTop } from "@/components/ScrollToTop";
import { PageLoader } from "@/components/ui/page-loader";
import { PageTracker } from "@/components/analytics/PageTracker";

// Auth - Not lazy loaded (critical path)
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Layouts - Not lazy loaded (used frequently)
import { AdminLayout } from "@/components/layout/AdminLayout";
import { CallCentreLayout } from "@/components/layout/CallCentreLayout";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { PartnerLayout } from "@/components/layout/PartnerLayout";

// Public Pages - Lazy loaded
const Index = lazy(() => import("./pages/Index"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const PendantPage = lazy(() => import("./pages/PendantPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Join Flow - Lazy loaded
const JoinWizard = lazy(() => import("./pages/join/JoinWizard"));

// Auth Pages - Lazy loaded
const Login = lazy(() => import("./pages/auth/Login"));
const StaffLogin = lazy(() => import("./pages/auth/StaffLogin"));
const CompleteRegistration = lazy(() => import("./pages/auth/CompleteRegistration"));
const Unauthorized = lazy(() => import("./pages/auth/Unauthorized"));

// Admin Pages - Lazy loaded
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const MembersPage = lazy(() => import("./pages/admin/MembersPage"));
const DevicesPage = lazy(() => import("./pages/admin/DevicesPage"));
const OrdersPage = lazy(() => import("./pages/admin/OrdersPage"));
const SubscriptionsPage = lazy(() => import("./pages/admin/SubscriptionsPage"));
const PaymentsPage = lazy(() => import("./pages/admin/PaymentsPage"));
const AlertsPage = lazy(() => import("./pages/admin/AlertsPage"));
const StaffPage = lazy(() => import("./pages/admin/StaffPage"));
const ReportsPage = lazy(() => import("./pages/admin/ReportsPage"));
const SettingsPage = lazy(() => import("./pages/admin/SettingsPage"));
const MessagesPage = lazy(() => import("./pages/admin/MessagesPage"));
const TasksPage = lazy(() => import("./pages/admin/TasksPage"));
const AdminTicketsPage = lazy(() => import("./pages/admin/TicketsPage"));
const LeadsPage = lazy(() => import("./pages/admin/LeadsPage"));
const MemberDetailPage = lazy(() => import("./pages/admin/MemberDetailPage"));
const AddMemberWizard = lazy(() => import("./pages/admin/AddMemberWizard"));
const PartnersPage = lazy(() => import("./pages/admin/PartnersPage"));
const PartnerDetailPage = lazy(() => import("./pages/admin/PartnerDetailPage"));
const AddPartnerPage = lazy(() => import("./pages/admin/AddPartnerPage"));
const CommissionsPage = lazy(() => import("./pages/admin/CommissionsPage"));
const PartnersQAPage = lazy(() => import("./pages/admin/PartnersQAPage"));
const CRMImportPage = lazy(() => import("./pages/admin/CRMImportPage"));
const CRMContactsPage = lazy(() => import("./pages/admin/CRMContactsPage"));
const CRMContactDetailPage = lazy(() => import("./pages/admin/CRMContactDetailPage"));
const ImportBatchesPage = lazy(() => import("./pages/admin/ImportBatchesPage"));
const FinanceDashboard = lazy(() => import("./pages/admin/FinanceDashboard"));
const AnalyticsPage = lazy(() => import("./pages/admin/AnalyticsPage"));
const ProductsPage = lazy(() => import("./pages/admin/ProductsPage"));

// Partner Pages - Lazy loaded
const PartnerOnboarding = lazy(() => import("./pages/partner/PartnerOnboarding"));
const PartnerJoin = lazy(() => import("./pages/partner/PartnerJoin"));
const PartnerVerify = lazy(() => import("./pages/partner/PartnerVerify"));
const PartnerLogin = lazy(() => import("./pages/partner/PartnerLogin"));
const PartnerDashboard = lazy(() => import("./pages/partner/PartnerDashboard"));
const PartnerInvitesPage = lazy(() => import("./pages/partner/PartnerInvitesPage"));
const PartnerCommissionsPage = lazy(() => import("./pages/partner/PartnerCommissionsPage"));
const PartnerSettingsPage = lazy(() => import("./pages/partner/PartnerSettingsPage"));

// Call Centre Pages - Lazy loaded
const StaffDashboard = lazy(() => import("./pages/call-centre/StaffDashboard"));
const CallCentreDashboard = lazy(() => import("./pages/call-centre/CallCentreDashboard"));
const ShiftNotesPage = lazy(() => import("./pages/call-centre/ShiftNotesPage"));
const ShiftHistoryPage = lazy(() => import("./pages/call-centre/ShiftHistoryPage"));
const StaffPreferencesPage = lazy(() => import("./pages/call-centre/StaffPreferencesPage"));
const CallCentreTasksPage = lazy(() => import("./pages/call-centre/TasksPage"));
const CallCentreMembersPage = lazy(() => import("./pages/call-centre/MembersPage"));
const CallCentreMessagesPage = lazy(() => import("./pages/call-centre/MessagesPage"));
const CallCentreTicketsPage = lazy(() => import("./pages/call-centre/TicketsPage"));
const CallCentreLeadsPage = lazy(() => import("./pages/call-centre/LeadsPage"));

// Client Pages - Lazy loaded
const ClientDashboard = lazy(() => import("./pages/client/ClientDashboard"));
const ProfilePage = lazy(() => import("./pages/client/ProfilePage"));
const MedicalInfoPage = lazy(() => import("./pages/client/MedicalInfoPage"));
const EmergencyContactsPage = lazy(() => import("./pages/client/EmergencyContactsPage"));
const DevicePage = lazy(() => import("./pages/client/DevicePage"));
const SubscriptionPage = lazy(() => import("./pages/client/SubscriptionPage"));
const AlertHistoryPage = lazy(() => import("./pages/client/AlertHistoryPage"));
const SupportPage = lazy(() => import("./pages/client/SupportPage"));
const ClientMessagesPage = lazy(() => import("./pages/client/MessagesPage"));

// Optimized QueryClient with global caching defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes - data considered fresh
      gcTime: 1000 * 60 * 10, // 10 minutes - garbage collection time
      retry: 1, // Only 1 retry on failure
      refetchOnWindowFocus: false, // Don't refetch on window focus
      refetchOnReconnect: true, // Refetch when connection is restored
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <ScrollToTop />
      <PageTracker />
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/pendant" element={<PendantPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
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
                <Route path="finance" element={<FinanceDashboard />} />
                <Route path="orders" element={<OrdersPage />} />
                <Route path="subscriptions" element={<SubscriptionsPage />} />
                <Route path="payments" element={<PaymentsPage />} />
                <Route path="alerts" element={<AlertsPage />} />
                <Route path="staff" element={<StaffPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="products" element={<ProductsPage />} />
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
                <Route path="crm-import" element={<CRMImportPage />} />
                <Route path="crm-import/batches" element={<ImportBatchesPage />} />
                <Route path="crm-contacts" element={<CRMContactsPage />} />
                <Route path="crm-contacts/:id" element={<CRMContactDetailPage />} />
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
          </Suspense>
        </AuthProvider>
      </TooltipProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
