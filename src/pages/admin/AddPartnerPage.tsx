import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, UserPlus } from "lucide-react";
import { toast } from "sonner";

const partnerFormSchema = z.object({
  contact_name: z.string().min(2, "Contact name is required"),
  company_name: z.string().optional(),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  preferred_language: z.enum(["en", "es"]),
  payout_beneficiary_name: z.string().optional(),
  payout_iban: z.string().optional(),
  notes_internal: z.string().optional(),
});

type PartnerFormValues = z.infer<typeof partnerFormSchema>;

export default function AddPartnerPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PartnerFormValues>({
    resolver: zodResolver(partnerFormSchema),
    defaultValues: {
      contact_name: "",
      company_name: "",
      email: "",
      phone: "",
      preferred_language: "es",
      payout_beneficiary_name: "",
      payout_iban: "",
      notes_internal: "",
    },
  });

  const onSubmit = async (data: PartnerFormValues) => {
    setIsSubmitting(true);
    try {
      // Get the current session for auth header
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error("Not authenticated");
      }

      // Call the edge function to create partner with auth user and email
      const response = await supabase.functions.invoke("partner-admin-create", {
        body: {
          contact_name: data.contact_name,
          company_name: data.company_name || null,
          email: data.email,
          phone: data.phone || null,
          preferred_language: data.preferred_language,
          payout_beneficiary_name: data.payout_beneficiary_name || null,
          payout_iban: data.payout_iban || null,
          notes_internal: data.notes_internal || null,
        },
      });

      // Handle edge function errors - parse the response body for details
      if (response.error) {
        // Try to get the actual error message from the response
        const errorData = response.data;
        const errorMessage = errorData?.error || response.error.message || "Failed to create partner";
        throw new Error(errorMessage);
      }

      const result = response.data;
      if (!result.success) {
        throw new Error(result.error || "Failed to create partner");
      }

      toast.success("Partner created successfully! Login credentials sent via email.");
      navigate(`/admin/partners/${result.partner_id}`);
    } catch (error: unknown) {
      console.error("Error creating partner:", error);
      const message = error instanceof Error ? error.message : "Failed to create partner";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/partners")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Add New Partner</h1>
          <p className="text-muted-foreground">
            Create a new affiliate partner manually
          </p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Contact Information
              </CardTitle>
              <CardDescription>
                Basic details about the partner
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contact_name">Contact Name *</Label>
                <Input
                  id="contact_name"
                  {...form.register("contact_name")}
                  placeholder="Full name"
                />
                {form.formState.errors.contact_name && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.contact_name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name</Label>
                <Input
                  id="company_name"
                  {...form.register("company_name")}
                  placeholder="Optional"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register("email")}
                  placeholder="partner@example.com"
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  {...form.register("phone")}
                  placeholder="+34 600 000 000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="preferred_language">Preferred Language</Label>
                <Select
                  value={form.watch("preferred_language")}
                  onValueChange={(value: "en" | "es") =>
                    form.setValue("preferred_language", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Payout Information */}
          <Card>
            <CardHeader>
              <CardTitle>Payout Information</CardTitle>
              <CardDescription>
                Bank details for commission payments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="payout_beneficiary_name">Beneficiary Name</Label>
                <Input
                  id="payout_beneficiary_name"
                  {...form.register("payout_beneficiary_name")}
                  placeholder="Name on bank account"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payout_iban">IBAN</Label>
                <Input
                  id="payout_iban"
                  {...form.register("payout_iban")}
                  placeholder="ES00 0000 0000 0000 0000 0000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes_internal">Internal Notes</Label>
                <Textarea
                  id="notes_internal"
                  {...form.register("notes_internal")}
                  placeholder="Private notes about this partner (not visible to partner)"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/admin/partners")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? "Creating..." : "Create Partner"}
          </Button>
        </div>
      </form>
    </div>
  );
}
