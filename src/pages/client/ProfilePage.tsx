import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { useMemberProfile } from "@/hooks/useMemberProfile";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, User, Globe, Mail, Phone, MapPin, Edit } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Link } from "react-router-dom";

export default function ProfilePage() {
  const { t } = useTranslation();
  const { memberId, isLoading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useMemberProfile();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  const profileSchema = z.object({
    first_name: z.string().min(1, t("validation.nameRequired")),
    last_name: z.string().min(1, t("validation.nameRequired")),
    phone: z.string().min(1, t("validation.phoneRequired")),
    address_line_1: z.string().min(1, t("validation.addressRequired")),
    address_line_2: z.string().optional(),
    city: z.string().min(1, t("validation.required")),
    province: z.string().min(1, t("validation.required")),
    postal_code: z.string().min(1, t("validation.required")),
    preferred_language: z.enum(["en", "es"]),
  });

  type ProfileFormData = z.infer<typeof profileSchema>;

  const isLoading = authLoading || profileLoading;

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: profile ? {
      first_name: profile.first_name,
      last_name: profile.last_name,
      phone: profile.phone,
      address_line_1: profile.address_line_1,
      address_line_2: profile.address_line_2 || "",
      city: profile.city,
      province: profile.province,
      postal_code: profile.postal_code,
      preferred_language: profile.preferred_language,
    } : undefined,
  });

  const onSubmit = async (data: ProfileFormData) => {
    if (!memberId) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("members")
        .update({
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone,
          address_line_1: data.address_line_1,
          address_line_2: data.address_line_2 || null,
          city: data.city,
          province: data.province,
          postal_code: data.postal_code,
          preferred_language: data.preferred_language,
        })
        .eq("id", memberId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["member-profile"] });
      toast.success(t("profile.updateSuccess"));
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(t("profile.updateFailed"));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile && !isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t("profile.notFound")}</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t("profile.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("profile.subtitle")}</p>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sidebar - Photo Card */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("profile.profilePhoto")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <Avatar className="h-32 w-32">
                <AvatarImage src={profile?.photo_url || undefined} />
                <AvatarFallback className="text-3xl bg-primary/10 text-primary">
                  {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <p className="text-sm text-muted-foreground text-center">
                {t("profile.contactSupportToChange")}
              </p>
            </CardContent>
          </Card>

          {/* Language Preference Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("profile.preferences")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t("profile.preferredLanguage")}</Label>
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium capitalize">
                    {profile?.preferred_language === "es" ? "Español" : "English"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("profile.languageDesc")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                {t("profile.personalInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t("profile.firstName")}</Label>
                  <div className="p-3 bg-muted/50 rounded-lg font-medium">
                    {profile?.first_name || "—"}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t("profile.lastName")}</Label>
                  <div className="p-3 bg-muted/50 rounded-lg font-medium">
                    {profile?.last_name || "—"}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t("profile.dateOfBirth")}</Label>
                  <div className="p-3 bg-muted/50 rounded-lg font-medium">
                    {profile?.date_of_birth 
                      ? format(new Date(profile.date_of_birth), "dd MMMM yyyy")
                      : "—"
                    }
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t("profile.nieDni")}</Label>
                  <div className="p-3 bg-muted/50 rounded-lg font-medium">
                    {profile?.nie_dni || "—"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="h-5 w-5" />
                {t("profile.contactInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t("profile.emailAddress")}</Label>
                  <div className="p-3 bg-muted/50 rounded-lg font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {profile?.email || "—"}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t("profile.phoneNumber")}</Label>
                  <div className="p-3 bg-muted/50 rounded-lg font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {profile?.phone || "—"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {t("profile.address")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label>{t("profile.streetAddress")}</Label>
                  <div className="p-3 bg-muted/50 rounded-lg font-medium">
                    {profile?.address_line_1 || "—"}
                    {profile?.address_line_2 && <span className="block text-muted-foreground">{profile.address_line_2}</span>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t("profile.city")}</Label>
                  <div className="p-3 bg-muted/50 rounded-lg font-medium">
                    {profile?.city || "—"}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t("profile.province")}</Label>
                  <div className="p-3 bg-muted/50 rounded-lg font-medium">
                    {profile?.province || "—"}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t("profile.postalCode")}</Label>
                  <div className="p-3 bg-muted/50 rounded-lg font-medium">
                    {profile?.postal_code || "—"}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t("profile.country")}</Label>
                  <div className="p-3 bg-muted/50 rounded-lg font-medium">
                    {profile?.country || "Spain"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Update Request */}
          <Card className="border-dashed">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Edit className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">{t("profile.needToUpdate")}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("profile.contactSupportDesc")}
                  </p>
                </div>
                <Button asChild className="flex-shrink-0">
                  <Link to="/dashboard/support">{t("support.contactSupport")}</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
