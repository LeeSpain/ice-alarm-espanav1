import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Logo } from "@/components/ui/logo";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Users, DollarSign, Send, ArrowRight, Loader2, Mail } from "lucide-react";

const partnerFormSchema = z.object({
  contact_name: z.string().min(2, "Name must be at least 2 characters"),
  company_name: z.string().optional(),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().optional(),
  preferred_language: z.enum(["en", "es"]),
  payout_beneficiary_name: z.string().min(2, "Beneficiary name is required"),
  payout_iban: z.string().min(15, "Please enter a valid IBAN").max(34),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  accept_terms: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type PartnerFormValues = z.infer<typeof partnerFormSchema>;

export default function PartnerJoin() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"info" | "form" | "success">("info");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const form = useForm<PartnerFormValues>({
    resolver: zodResolver(partnerFormSchema),
    defaultValues: {
      contact_name: "",
      company_name: "",
      email: "",
      phone: "",
      preferred_language: "en",
      payout_beneficiary_name: "",
      payout_iban: "",
      password: "",
      confirmPassword: "",
      accept_terms: false,
    },
  });

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

  const onSubmit = async (data: PartnerFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await supabase.functions.invoke("partner-register", {
        body: {
          contact_name: data.contact_name,
          company_name: data.company_name || undefined,
          email: data.email,
          phone: data.phone || undefined,
          preferred_language: data.preferred_language,
          payout_beneficiary_name: data.payout_beneficiary_name,
          payout_iban: data.payout_iban,
          password: data.password,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Registration failed");
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      setSubmittedEmail(data.email);
      setStep("success");
      toast.success("Registration successful!");
    } catch (error) {
      console.error("Registration error:", error);
      toast.error(error instanceof Error ? error.message : "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

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
                Become an ICE Alarm Partner
              </h1>
              <p className="text-xl text-muted-foreground">
                Help protect seniors in your community while earning commissions
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
                Join Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              Already a partner?{" "}
              <a href="/partner/login" className="text-primary hover:underline">
                Sign in here
              </a>
            </p>
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
                <Mail className="h-12 w-12 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-2xl">Check Your Email</CardTitle>
              <CardDescription className="text-base">
                We've sent a verification link to:
                <br />
                <strong className="text-foreground">{submittedEmail}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Click the link in the email to verify your account and start referring customers.
                The link will expire in 24 hours.
              </p>
              <div className="flex flex-col gap-2">
                <Button variant="outline" onClick={() => navigate("/partner/login")}>
                  Go to Login
                </Button>
                <Button variant="ghost" onClick={() => navigate("/")}>
                  Return to Homepage
                </Button>
              </div>
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
            <CardTitle>Partner Registration</CardTitle>
            <CardDescription>
              Fill in your details to join our partner program
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="contact_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="John Smith" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="company_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Optional" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="+34 600 000 000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="preferred_language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred Language *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Spanish</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="border-t pt-4">
                  <h3 className="font-medium mb-3">Payout Information</h3>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="payout_beneficiary_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Beneficiary Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Full name as on bank account" {...field} />
                          </FormControl>
                          <FormDescription>
                            Name on the bank account for commission payouts
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="payout_iban"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>IBAN *</FormLabel>
                          <FormControl>
                            <Input placeholder="ES00 0000 0000 0000 0000 0000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-medium mb-3">Account Security</h3>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password *</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Minimum 8 characters" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password *</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Repeat your password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="accept_terms"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          I accept the terms and conditions *
                        </FormLabel>
                        <FormDescription>
                          By registering, you agree to our partner program terms, including
                          commission rates and payout schedules.
                        </FormDescription>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setStep("info")}>
                    Back
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      "Create Partner Account"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
