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
import { Users, DollarSign, Send, ArrowRight, Loader2, Mail, Home, ArrowLeft, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

// Partner type for selection
type PartnerType = "referral" | "care" | "residential";

const partnerFormSchema = z.object({
  // Step 1: Partner type
  partner_type: z.enum(["referral", "care", "residential"]),
  
  // Step 2: Basic info
  contact_name: z.string().min(2, "Name must be at least 2 characters"),
  company_name: z.string().optional(),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().optional(),
  preferred_language: z.enum(["en", "es"]),
  
  // Step 3: Organization details (for care/residential)
  organization_type: z.string().optional(),
  organization_registration: z.string().optional(),
  organization_website: z.string().optional(),
  estimated_monthly_referrals: z.string().optional(),
  facility_address: z.string().optional(),
  facility_resident_count: z.number().optional(),
  
  // Step 4: Payout
  payout_beneficiary_name: z.string().min(2, "Beneficiary name is required"),
  payout_iban: z.string().min(15, "Please enter a valid IBAN").max(34),
  
  // Step 5: Account
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

// Step definitions
type Step = "info" | "type" | "contact" | "organization" | "payout" | "account" | "success";

const partnerTypeOptions = [
  {
    type: "referral" as PartnerType,
    title: "Referral Partner",
    description: "Recommend ICE Alarm to friends, family, or clients and earn €50 per signup",
    icon: Users,
    features: ["Personal referral link", "Earn €50 per referral", "Track your commissions"],
  },
  {
    type: "care" as PartnerType,
    title: "Care Partner",
    description: "Healthcare agencies, charities, or care organizations referring clients",
    icon: Heart,
    features: ["Organization branding", "Bulk referral tracking", "Volume-based commissions"],
  },
  {
    type: "residential" as PartnerType,
    title: "Residential Partner",
    description: "Care homes, urbanizations, or retirement communities with residents",
    icon: Home,
    features: ["Resident management", "Alert visibility", "Custom pricing available"],
  },
];

const organizationTypes: Record<PartnerType, { value: string; label: string }[]> = {
  referral: [{ value: "individual", label: "Individual" }],
  care: [
    { value: "charity", label: "Charity / Non-profit" },
    { value: "care_agency", label: "Care Agency" },
    { value: "home_care", label: "Home Care Provider" },
    { value: "other", label: "Other" },
  ],
  residential: [
    { value: "care_home", label: "Care Home" },
    { value: "urbanization", label: "Urbanization / Community" },
    { value: "retirement_community", label: "Retirement Community" },
    { value: "other", label: "Other" },
  ],
};

export default function PartnerJoin() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("info");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const form = useForm<PartnerFormValues>({
    resolver: zodResolver(partnerFormSchema),
    defaultValues: {
      partner_type: "referral",
      contact_name: "",
      company_name: "",
      email: "",
      phone: "",
      preferred_language: "en",
      organization_type: "individual",
      organization_registration: "",
      organization_website: "",
      estimated_monthly_referrals: "",
      facility_address: "",
      facility_resident_count: undefined,
      payout_beneficiary_name: "",
      payout_iban: "",
      password: "",
      confirmPassword: "",
      accept_terms: false,
    },
  });

  const partnerType = form.watch("partner_type");
  const isB2B = partnerType === "care" || partnerType === "residential";

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
          // B2B fields
          partner_type: data.partner_type,
          organization_type: isB2B ? data.organization_type : "individual",
          organization_registration: data.organization_registration || undefined,
          organization_website: data.organization_website || undefined,
          estimated_monthly_referrals: data.estimated_monthly_referrals || undefined,
          facility_address: data.facility_address || undefined,
          facility_resident_count: data.facility_resident_count || undefined,
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

  const goToNextStep = () => {
    if (step === "type") {
      setStep("contact");
    } else if (step === "contact") {
      if (isB2B) {
        setStep("organization");
      } else {
        setStep("payout");
      }
    } else if (step === "organization") {
      setStep("payout");
    } else if (step === "payout") {
      setStep("account");
    }
  };

  const goToPreviousStep = () => {
    if (step === "contact") {
      setStep("type");
    } else if (step === "organization") {
      setStep("contact");
    } else if (step === "payout") {
      if (isB2B) {
        setStep("organization");
      } else {
        setStep("contact");
      }
    } else if (step === "account") {
      setStep("payout");
    }
  };

  // Info screen
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
              <Button size="lg" onClick={() => setStep("type")}>
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

  // Success screen
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

  // Partner Type Selection
  if (step === "type") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex flex-col">
        <header className="p-6">
          <Logo />
        </header>

        <main className="flex-1 flex items-center justify-center px-4 pb-16">
          <div className="max-w-3xl w-full space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">
                Choose Your Partner Type
              </h1>
              <p className="text-muted-foreground">
                Select the option that best describes how you'll work with ICE Alarm
              </p>
            </div>

            <Form {...form}>
              <div className="grid gap-4 md:grid-cols-3">
                {partnerTypeOptions.map((option) => {
                  const isSelected = form.watch("partner_type") === option.type;
                  return (
                    <Card
                      key={option.type}
                      className={cn(
                        "cursor-pointer transition-all hover:border-primary/50",
                        isSelected && "border-primary ring-2 ring-primary/20"
                      )}
                      onClick={() => form.setValue("partner_type", option.type)}
                    >
                      <CardHeader>
                        <div className={cn(
                          "rounded-full p-3 w-fit",
                          isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                        )}>
                          <option.icon className="h-6 w-6" />
                        </div>
                        <CardTitle className="text-lg">{option.title}</CardTitle>
                        <CardDescription className="text-sm">
                          {option.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ul className="text-sm space-y-1">
                          {option.features.map((feature) => (
                            <li key={feature} className="flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep("info")}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button onClick={goToNextStep}>
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </Form>
          </div>
        </main>
      </div>
    );
  }

  // Form steps
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex flex-col">
      <header className="p-6">
        <Logo />
      </header>

      <main className="flex-1 flex items-center justify-center px-4 pb-16">
        <Card className="max-w-lg w-full">
          <CardHeader>
            <CardTitle>
              {step === "contact" && "Contact Information"}
              {step === "organization" && "Organization Details"}
              {step === "payout" && "Payout Information"}
              {step === "account" && "Create Account"}
            </CardTitle>
            <CardDescription>
              {step === "contact" && "Tell us about yourself"}
              {step === "organization" && "Tell us about your organization"}
              {step === "payout" && "Where should we send your commissions?"}
              {step === "account" && "Set up your login credentials"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                
                {/* Contact Step */}
                {step === "contact" && (
                  <>
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
                  </>
                )}

                {/* Organization Step */}
                {step === "organization" && (
                  <>
                    <FormField
                      control={form.control}
                      name="organization_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Organization Type *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {organizationTypes[partnerType].map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="organization_registration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Registration Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Charity/Company registration" {...field} />
                          </FormControl>
                          <FormDescription>
                            Official registration number (if applicable)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="organization_website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website</FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {partnerType === "care" && (
                      <FormField
                        control={form.control}
                        name="estimated_monthly_referrals"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estimated Monthly Referrals</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select range" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="1-5">1-5 per month</SelectItem>
                                <SelectItem value="5-10">5-10 per month</SelectItem>
                                <SelectItem value="10-20">10-20 per month</SelectItem>
                                <SelectItem value="20+">20+ per month</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {partnerType === "residential" && (
                      <>
                        <FormField
                          control={form.control}
                          name="facility_address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Facility Address</FormLabel>
                              <FormControl>
                                <Input placeholder="Full address of your facility" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="facility_resident_count"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Number of Residents</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="Approximate number"
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                />
                              </FormControl>
                              <FormDescription>
                                Helps us understand your facility size
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}
                  </>
                )}

                {/* Payout Step */}
                {step === "payout" && (
                  <>
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
                  </>
                )}

                {/* Account Step */}
                {step === "account" && (
                  <>
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
                  </>
                )}

                {/* Navigation buttons */}
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={goToPreviousStep}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  
                  {step === "account" ? (
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
                  ) : (
                    <Button type="button" className="flex-1" onClick={goToNextStep}>
                      Continue
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
