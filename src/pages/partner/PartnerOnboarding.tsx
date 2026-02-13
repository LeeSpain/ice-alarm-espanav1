import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Logo } from "@/components/ui/logo";
import { CheckCircle, Users, DollarSign, Send, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function PartnerOnboarding() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState<"info" | "form" | "success">("info");

  const benefits = [
    {
      icon: DollarSign,
      title: "Earn €50 per referral",
      description: "Get paid for every customer who signs up through your referral link",
    },
    {
      icon: Send,
      title: "Easy invite tools",
      description: "Send personalized invites via email, SMS, or WhatsApp",
    },
    {
      icon: Users,
      title: "Track your network",
      description: "Monitor all your referrals and commissions in real-time",
    },
  ];

  if (step === "info") {
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
                 {t("partnerOnboarding.subtitle", "Help protect seniors in your community while earning commissions")}
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

            <div className="flex justify-center">
              <Button size="lg" onClick={() => setStep("form")}>
                Apply Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (step === "success") {
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
              <CardTitle className="text-2xl">Application Submitted!</CardTitle>
              <CardDescription>
                Thank you for your interest in becoming an ICE Alarm partner. We'll review your
                application and get back to you within 2-3 business days.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => navigate("/")}>
                Return to Homepage
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
        <Card className="max-w-lg w-full">
          <CardHeader>
            <CardTitle>Partner Application</CardTitle>
            <CardDescription>
              Fill in your details to apply for our partner program
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                // TODO: Submit to Supabase
                setStep("success");
              }}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contact_name">Your Name *</Label>
                  <Input id="contact_name" required placeholder="John Smith" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name (optional)</Label>
                  <Input id="company_name" placeholder="ABC Care Services" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" required placeholder="john@example.com" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input id="phone" type="tel" placeholder="+34 600 000 000" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Preferred Language *</Label>
                <Select defaultValue="en">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Tell us about yourself</Label>
                <Textarea
                  id="message"
                  placeholder="How do you plan to refer customers? What's your network like?"
                  rows={4}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setStep("info")}>
                  Back
                </Button>
                <Button type="submit" className="flex-1">
                  Submit Application
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
