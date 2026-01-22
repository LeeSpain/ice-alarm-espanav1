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
import { Save, Eye } from "lucide-react";
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

  const [formData, setFormData] = useState({
    payoutBeneficiaryName: "",
    payoutIban: "",
    preferredLanguage: "en",
  });

  // Update form when partner data loads
  useEffect(() => {
    if (partner) {
      setFormData({
        payoutBeneficiaryName: partner.payout_beneficiary_name || "",
        payoutIban: partner.payout_iban || "",
        preferredLanguage: partner.preferred_language || "en",
      });
    }
  }, [partner]);

  const updateSettingsMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("partners")
        .update({
          payout_beneficiary_name: formData.payoutBeneficiaryName || null,
          payout_iban: formData.payoutIban || null,
          preferred_language: formData.preferredLanguage,
        })
        .eq("id", partner!.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Settings updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["my-partner-data"] });
    },
    onError: (error) => {
      toast.error(`Failed to update settings: ${error.message}`);
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
        
        {/* Account info card skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-40" />
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
                You are viewing this partner's settings in read-only mode. Changes made here will update the partner's account.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Partner account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Contact Name</Label>
              <p className="font-medium">{partner?.contact_name}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Company Name</Label>
              <p className="font-medium">{partner?.company_name || "-"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Email</Label>
              <p className="font-medium">{partner?.email}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Phone</Label>
              <p className="font-medium">{partner?.phone || "-"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Referral Code</Label>
              <p className="font-medium font-mono">{partner?.referral_code}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Status</Label>
              <div className="mt-1">
                <Badge 
                  variant={partner?.status === "active" ? "default" : "secondary"}
                  className="capitalize"
                >
                  {partner?.status}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payout Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Payout Information</CardTitle>
          <CardDescription>
            Bank details for receiving commission payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateSettingsMutation.mutate();
            }}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="beneficiaryName">Beneficiary Name</Label>
              <Input
                id="beneficiaryName"
                value={formData.payoutBeneficiaryName}
                onChange={(e) =>
                  setFormData({ ...formData, payoutBeneficiaryName: e.target.value })
                }
                placeholder="Full name as it appears on your bank account"
                disabled={isAdminViewMode}
              />
            </div>

            <div>
              <Label htmlFor="iban">IBAN</Label>
              <Input
                id="iban"
                value={formData.payoutIban}
                onChange={(e) =>
                  setFormData({ ...formData, payoutIban: e.target.value.toUpperCase() })
                }
                placeholder="ES00 0000 0000 0000 0000 0000"
                className="font-mono"
                disabled={isAdminViewMode}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Your IBAN for bank transfers
              </p>
            </div>

            <div>
              <Label htmlFor="language">Preferred Language</Label>
              <Select
                value={formData.preferredLanguage}
                onValueChange={(value) =>
                  setFormData({ ...formData, preferredLanguage: value })
                }
                disabled={isAdminViewMode}
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

            {!isAdminViewMode && (
              <Button
                type="submit"
                disabled={updateSettingsMutation.isPending}
              >
                {updateSettingsMutation.isPending ? (
                  "Saving..."
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
