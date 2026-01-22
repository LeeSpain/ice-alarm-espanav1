import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePartnerData } from "@/hooks/usePartnerData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save } from "lucide-react";
import { toast } from "sonner";

export default function PartnerSettingsPage() {
  const queryClient = useQueryClient();
  const { data: partner, isLoading: partnerLoading } = usePartnerData();

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
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your partner account settings
        </p>
      </div>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Your partner account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
              <p className="font-medium capitalize">{partner?.status}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payout Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Payout Information</CardTitle>
          <CardDescription>
            Bank details for receiving your commission payments
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
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
