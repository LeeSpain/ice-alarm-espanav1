import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePartnerData } from "@/hooks/usePartnerData";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Save, Eye, Building2, User, CreditCard, Languages } from "lucide-react";
import { toast } from "sonner";

export default function PartnerSettingsPage() {
  const queryClient = useQueryClient();
  const { isStaff, staffRole } = useAuth();
  const [searchParams] = useSearchParams();

  // Admin view mode detection
  const isAdminRole = isStaff && (staffRole === "admin" || staffRole === "super_admin");
  const partnerIdParam = searchParams.get("partnerId");
  const isAdminViewMode = isAdminRole && !!partnerIdParam;

  const { data: partner, isLoading: partnerLoading } = usePartnerData(
    isAdminViewMode ? partnerIdParam : undefined
  );

  // Profile form data
  const [profileData, setProfileData] = useState({
    contactName: "",
    companyName: "",
    cif: "",
    email: "",
    phone: "",
  });

  // Payout form data
  const [payoutData, setPayoutData] = useState({
    payoutBeneficiaryName: "",
    payoutIban: "",
    preferredLanguage: "en",
  });

  // Update forms when partner data loads
  useEffect(() => {
    if (partner) {
      setProfileData({
        contactName: partner.contact_name || "",
        companyName: partner.company_name || "",
        cif: (partner as any).cif || "",
        email: partner.email || "",
        phone: partner.phone || "",
      });
      setPayoutData({
        payoutBeneficiaryName: partner.payout_beneficiary_name || "",
        payoutIban: partner.payout_iban || "",
        preferredLanguage: partner.preferred_language || "en",
      });
    }
  }, [partner]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("partners")
        .update({
          contact_name: profileData.contactName,
          company_name: profileData.companyName || null,
          cif: profileData.cif || null,
          email: profileData.email,
          phone: profileData.phone || null,
        } as any)
        .eq("id", partner!.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profile updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["my-partner-data"] });
      if (partnerIdParam) {
        queryClient.invalidateQueries({ queryKey: ["partner-data", partnerIdParam] });
      }
    },
    onError: (error) => {
      toast.error(`Failed to update profile: ${error.message}`);
    },
  });

  // Update payout settings mutation
  const updatePayoutMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("partners")
        .update({
          payout_beneficiary_name: payoutData.payoutBeneficiaryName || null,
          payout_iban: payoutData.payoutIban || null,
          preferred_language: payoutData.preferredLanguage,
        })
        .eq("id", partner!.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Payout settings updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["my-partner-data"] });
      if (partnerIdParam) {
        queryClient.invalidateQueries({ queryKey: ["partner-data", partnerIdParam] });
      }
    },
    onError: (error) => {
      toast.error(`Failed to update payout settings: ${error.message}`);
    },
  });

  if (partnerLoading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-5 w-64" />
        </div>
        
        {/* Profile card skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Payout settings card skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          {isAdminViewMode 
            ? `Viewing ${partner?.contact_name}'s settings`
            : "Manage your partner account settings"
          }
        </p>
      </div>

      {/* Admin View Mode Notice */}
      {isAdminViewMode && (
        <Card className="border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
              <Eye className="h-4 w-4" />
              <span className="text-sm">
                You are viewing this partner's settings. Changes made here will update their account.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Account Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Account Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <Label className="text-muted-foreground text-xs">Referral Code</Label>
              <p className="font-mono font-medium">{partner?.referral_code}</p>
            </div>
            <Separator orientation="vertical" className="h-8" />
            <div>
              <Label className="text-muted-foreground text-xs">Status</Label>
              <div className="mt-0.5">
                <Badge 
                  variant={partner?.status === "active" ? "default" : "secondary"}
                  className="capitalize"
                >
                  {partner?.status}
                </Badge>
              </div>
            </div>
            <Separator orientation="vertical" className="h-8" />
            <div>
              <Label className="text-muted-foreground text-xs">Member Since</Label>
              <p className="font-medium">
                {partner?.created_at 
                  ? new Date(partner.created_at).toLocaleDateString()
                  : "-"
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Information - Editable */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Your contact and company details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateProfileMutation.mutate();
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contactName">Contact Name *</Label>
                <Input
                  id="contactName"
                  value={profileData.contactName}
                  onChange={(e) =>
                    setProfileData({ ...profileData, contactName: e.target.value })
                  }
                  placeholder="Your full name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) =>
                    setProfileData({ ...profileData, email: e.target.value })
                  }
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) =>
                    setProfileData({ ...profileData, phone: e.target.value })
                  }
                  placeholder="+34 600 000 000"
                />
              </div>

              <div>
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={profileData.companyName}
                  onChange={(e) =>
                    setProfileData({ ...profileData, companyName: e.target.value })
                  }
                  placeholder="Your company (if applicable)"
                />
              </div>

              <div>
                <Label htmlFor="cif">CIF / NIF</Label>
                <Input
                  id="cif"
                  value={profileData.cif}
                  onChange={(e) =>
                    setProfileData({ ...profileData, cif: e.target.value.toUpperCase() })
                  }
                  placeholder="B12345678"
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Spanish tax identification number (required for companies)
                </p>
              </div>
            </div>

            <Button
              type="submit"
              disabled={updateProfileMutation.isPending || !profileData.contactName || !profileData.email}
            >
              {updateProfileMutation.isPending ? (
                "Saving..."
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Profile
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Payout Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payout Information
          </CardTitle>
          <CardDescription>
            Bank details for receiving commission payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updatePayoutMutation.mutate();
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="beneficiaryName">Beneficiary Name</Label>
                <Input
                  id="beneficiaryName"
                  value={payoutData.payoutBeneficiaryName}
                  onChange={(e) =>
                    setPayoutData({ ...payoutData, payoutBeneficiaryName: e.target.value })
                  }
                  placeholder="Full name as it appears on your bank account"
                />
              </div>

              <div>
                <Label htmlFor="iban">IBAN</Label>
                <Input
                  id="iban"
                  value={payoutData.payoutIban}
                  onChange={(e) =>
                    setPayoutData({ ...payoutData, payoutIban: e.target.value.toUpperCase() })
                  }
                  placeholder="ES00 0000 0000 0000 0000 0000"
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Your IBAN for bank transfers
                </p>
              </div>
            </div>

            <Button
              type="submit"
              disabled={updatePayoutMutation.isPending}
            >
              {updatePayoutMutation.isPending ? (
                "Saving..."
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Payout Details
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5" />
            Preferences
          </CardTitle>
          <CardDescription>
            Language and communication settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updatePayoutMutation.mutate();
            }}
            className="space-y-4"
          >
            <div className="max-w-xs">
              <Label htmlFor="language">Preferred Language</Label>
              <Select
                value={payoutData.preferredLanguage}
                onValueChange={(value) =>
                  setPayoutData({ ...payoutData, preferredLanguage: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Language for emails and notifications
              </p>
            </div>

            <Button
              type="submit"
              disabled={updatePayoutMutation.isPending}
            >
              {updatePayoutMutation.isPending ? (
                "Saving..."
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Preferences
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
