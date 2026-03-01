import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Logo } from "@/components/ui/logo";
import { CheckCircle, Heart, Send, Users, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function PartnerOnboarding() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [preferredLanguage, setPreferredLanguage] = useState("en");

  const benefits = [
    {
      icon: Heart,
      title: t("partnerOnboarding.benefit1Title", "Support Your Community"),
      description: t("partnerOnboarding.benefit1Desc", "Help the people you care about stay safe and independent with 24/7 protection."),
    },
    {
      icon: Send,
      title: t("partnerOnboarding.benefit2Title", "Easy Referral Tools"),
      description: t("partnerOnboarding.benefit2Desc", "Share your unique link via email, WhatsApp, or on your community noticeboard."),
    },
    {
      icon: Users,
      title: t("partnerOnboarding.benefit3Title", "Dedicated Partner Support"),
      description: t("partnerOnboarding.benefit3Desc", "Your own account manager and co-branded materials to help you get started."),
    },
  ];

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex flex-col">
        <header className="p-6">
          <Logo />
        </header>

        <main className="flex-1 flex items-center justify-center px-4 pb-16">
          <Card className="max-w-md w-full text-center">
            <CardHeader>
              <div className="mx-auto rounded-full bg-green-100 p-4 w-fit dark:bg-green-900">
                <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-2xl">
                {t("partnerOnboarding.successTitle", "Thank You for Your Interest!")}
              </CardTitle>
              <CardDescription>
                {t("partnerOnboarding.successDesc", "Isabella will send you an email shortly with full details about our partner programme, including what you can earn and a link to complete your registration.")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => navigate("/")}>
                {t("partnerOnboarding.returnHome", "Return to Homepage")}
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex flex-col">
      <header className="p-6">
        <Logo />
      </header>

      <main className="flex-1 flex items-center justify-center px-4 pb-16">
        <div className="max-w-2xl w-full space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">
              {t("partnerOnboarding.title", "Become an ICE Alarm Partner")}
            </h1>
            <p className="text-xl text-muted-foreground">
              {t("partnerOnboarding.subtitle", "Help protect the people in your community — register your interest and Isabella will be in touch with everything you need to know.")}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {benefits.map((benefit) => (
              <Card key={benefit.title} className="text-center">
                <CardHeader>
                  <div className="mx-auto rounded-full bg-primary/10 p-3 w-fit">
                    <benefit.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{benefit.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="max-w-lg mx-auto">
            <CardContent className="pt-6">
              <form
                className="space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setIsSubmitting(true);

                  const formData = new FormData(e.currentTarget);
                  const contactName = formData.get("contact_name") as string;
                  const email = formData.get("email") as string;
                  const phone = formData.get("phone") as string;
                  const language = preferredLanguage;

                  const referralCode = `REF-${contactName.replace(/\s+/g, "").toUpperCase().slice(0, 6)}-${Date.now().toString(36).toUpperCase()}`;

                  try {
                    const { error } = await supabase.from("partners").insert({
                      contact_name: contactName,
                      email,
                      phone,
                      preferred_language: language,
                      referral_code: referralCode,
                      partner_type: "referral",
                      status: "pending",
                      payout_method: "bank_transfer",
                    });

                    if (error) throw error;
                    setSubmitted(true);
                  } catch (error: any) {
                    console.error("Error submitting partner application:", error);
                    toast.error(
                      error?.message?.includes("duplicate")
                        ? "An application with this email already exists."
                        : "Failed to submit application. Please try again."
                    );
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="contact_name">{t("partnerOnboarding.fullName", "Full Name")} *</Label>
                  <Input id="contact_name" name="contact_name" required placeholder="John Smith" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{t("partnerOnboarding.email", "Email")} *</Label>
                  <Input id="email" name="email" type="email" required placeholder="john@example.com" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">{t("partnerOnboarding.phone", "Phone")} *</Label>
                  <Input id="phone" name="phone" type="tel" required placeholder="+34 600 000 000" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">{t("partnerOnboarding.preferredLanguage", "Preferred Language")} *</Label>
                  <Select value={preferredLanguage} onValueChange={setPreferredLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-4">
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSubmitting
                      ? t("partnerOnboarding.submitting", "Submitting...")
                      : t("partnerOnboarding.registerInterest", "Register Your Interest")}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
