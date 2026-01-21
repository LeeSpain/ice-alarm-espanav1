import { JoinWizardData } from "@/types/wizard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  PartyPopper, CheckCircle2, Mail, Phone, Calendar, 
  Smartphone, Package, ArrowRight, Download
} from "lucide-react";
import { Link } from "react-router-dom";

interface JoinConfirmationStepProps {
  data: JoinWizardData;
}

export function JoinConfirmationStep({ data }: JoinConfirmationStepProps) {
  const nextSteps = [
    {
      icon: Mail,
      title: "Check Your Email",
      description: "We've sent a confirmation email with your membership details and login credentials.",
    },
    {
      icon: Phone,
      title: "Save Our Number",
      description: "Add our 24/7 emergency hotline to your contacts: +34 900 000 000",
    },
    ...(data.includePendant
      ? [
          {
            icon: Package,
            title: "Pendant Shipping",
            description: "Your GPS safety pendant will be shipped within 2-3 business days.",
          },
        ]
      : [
          {
            icon: Download,
            title: "Download the App",
            description: "Download our mobile app from the App Store or Google Play to get started.",
          },
        ]),
    {
      icon: Calendar,
      title: "Welcome Call",
      description: "One of our team members will call you within 24 hours to help you get set up.",
    },
  ];

  return (
    <div className="space-y-8 text-center">
      {/* Success Animation */}
      <div className="flex flex-col items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-status-active/10 flex items-center justify-center animate-pulse">
          <PartyPopper className="h-10 w-10 text-status-active" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-status-active">Welcome to ICE Alarm España!</h2>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">
            Thank you for joining, {data.primaryMember.firstName}! Your membership is now active 
            and you're protected 24/7.
          </p>
        </div>
      </div>

      {/* Confirmation Details */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-2 text-primary">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-medium">Registration Complete</span>
          </div>
          {data.orderId && (
            <p className="text-sm text-muted-foreground mt-2">
              Order Reference: <span className="font-mono">{data.orderId}</span>
            </p>
          )}
        </CardContent>
      </Card>

      {/* What's Next */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">What Happens Next?</h3>
        <div className="grid gap-4 md:grid-cols-2 text-left">
          {nextSteps.map((step, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <step.icon className="h-4 w-4 text-primary" />
                  </div>
                  {step.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Pendant Info */}
      {data.includePendant && (
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-3">
              <Smartphone className="h-8 w-8 text-primary" />
              <div className="text-left">
                <p className="font-medium">GPS Safety Pendant</p>
                <p className="text-sm text-muted-foreground">
                  Shipping to: {data.address.city}, {data.address.province}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
        <Button asChild size="lg" className="gap-2">
          <Link to="/login">
            Go to Dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link to="/">
            Return Home
          </Link>
        </Button>
      </div>

      {/* Support Note */}
      <div className="text-sm text-muted-foreground">
        <p>Questions? Our support team is here to help.</p>
        <p>
          Call us at{" "}
          <a href="tel:+34900000000" className="text-primary hover:underline">
            +34 900 000 000
          </a>{" "}
          or email{" "}
          <a href="mailto:support@icealarm.es" className="text-primary hover:underline">
            support@icealarm.es
          </a>
        </p>
      </div>
    </div>
  );
}
