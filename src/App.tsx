import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Layouts
import { AdminLayout } from "@/components/layout/AdminLayout";
import { CallCentreLayout } from "@/components/layout/CallCentreLayout";
import { ClientLayout } from "@/components/layout/ClientLayout";

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";

// Call Centre Pages
import CallCentreDashboard from "./pages/call-centre/CallCentreDashboard";

// Client Pages
import ClientDashboard from "./pages/client/ClientDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Index />} />

          {/* Admin Dashboard Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="members" element={<AdminDashboard />} />
            <Route path="devices" element={<AdminDashboard />} />
            <Route path="subscriptions" element={<AdminDashboard />} />
            <Route path="payments" element={<AdminDashboard />} />
            <Route path="alerts" element={<AdminDashboard />} />
            <Route path="staff" element={<AdminDashboard />} />
            <Route path="reports" element={<AdminDashboard />} />
            <Route path="settings" element={<AdminDashboard />} />
          </Route>

          {/* Call Centre Dashboard Routes */}
          <Route path="/call-centre" element={<CallCentreLayout />}>
            <Route index element={<CallCentreDashboard />} />
            <Route path="shift-notes" element={<CallCentreDashboard />} />
          </Route>

          {/* Client Dashboard Routes */}
          <Route path="/dashboard" element={<ClientLayout />}>
            <Route index element={<ClientDashboard />} />
            <Route path="profile" element={<ClientDashboard />} />
            <Route path="medical" element={<ClientDashboard />} />
            <Route path="contacts" element={<ClientDashboard />} />
            <Route path="device" element={<ClientDashboard />} />
            <Route path="subscription" element={<ClientDashboard />} />
            <Route path="alerts" element={<ClientDashboard />} />
            <Route path="support" element={<ClientDashboard />} />
          </Route>

          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
