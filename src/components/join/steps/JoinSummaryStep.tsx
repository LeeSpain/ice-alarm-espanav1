import { JoinWizardData } from "@/types/wizard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  User, MapPin, Smartphone, CreditCard, 
  Calendar, CalendarDays, Sparkles, Check, Shield 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  getSubscriptionFinalPrice,
  getSubscriptionMonthlyFinal,
  getAnnualSavings,
  formatPrice,
  calculateOrder
} from "@/config/pricing";

interface JoinSummaryStepProps {
  data: JoinWizardData;
  onUpdate: (data: Partial<JoinWizardData>) => void;
}

export function JoinSummaryStep({ data, onUpdate }: JoinSummaryStepProps) {
  // Use centralized pricing calculations
  const monthlyFinal = getSubscriptionMonthlyFinal(data.membershipType);
  const annualFinal = getSubscriptionFinalPrice(data.membershipType, 'annual');
  const annualMonthlyEquiv = annualFinal / 12;
  const annualSavings = getAnnualSavings(data.membershipType);
  const savingsPercentage = Math.round((annualSavings / (monthlyFinal * 12)) * 100);
  
  // Calculate order
  const order = calculateOrder({
    membershipType: data.membershipType,
    billingFrequency: data.billingFrequency,
    includePendant: data.includePendant,
    includeShipping: data.includePendant,
  });

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Review Your Order</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Please review your details and select a billing frequency.
        </p>
      </div>

      {/* Billing Frequency Selection */}
      <RadioGroup
        value={data.billingFrequency}
        onValueChange={(value: "monthly" | "annual") =>
          onUpdate({ billingFrequency: value })
        }
        className="grid gap-4 md:grid-cols-2"
      >
        {/* Monthly */}
        <Label htmlFor="monthly" className="cursor-pointer">
          <Card
            className={cn(
              "relative transition-all hover:shadow-md h-full",
              data.billingFrequency === "monthly" && "border-primary ring-2 ring-primary/20"
            )}
          >
            {data.billingFrequency === "monthly" && (
              <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                <Check className="h-4 w-4 text-primary-foreground" />
              </div>
            )}
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    data.billingFrequency === "monthly"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base">Monthly</CardTitle>
                  <p className="text-xl font-bold text-primary">
                    {formatPrice(monthlyFinal)}
                    <span className="text-sm font-normal text-muted-foreground">/mo</span>
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Cancel anytime, no commitment
              <RadioGroupItem value="monthly" id="monthly" className="sr-only" />
            </CardContent>
          </Card>
        </Label>

        {/* Annual */}
        <Label htmlFor="annual" className="cursor-pointer">
          <Card
            className={cn(
              "relative transition-all hover:shadow-md h-full",
              data.billingFrequency === "annual" && "border-primary ring-2 ring-primary/20"
            )}
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-status-active text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Save {savingsPercentage}%
              </span>
            </div>
            {data.billingFrequency === "annual" && (
              <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                <Check className="h-4 w-4 text-primary-foreground" />
              </div>
            )}
            <CardHeader className="pb-3 pt-8">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    data.billingFrequency === "annual"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <CalendarDays className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base">Annual</CardTitle>
                  <div className="flex items-baseline gap-2">
                    <p className="text-xl font-bold text-primary">
                      {formatPrice(annualMonthlyEquiv)}
                      <span className="text-sm font-normal text-muted-foreground">/mo</span>
                    </p>
                    <span className="text-xs line-through text-muted-foreground">
                      {formatPrice(monthlyFinal)}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-status-active font-medium">
              Save {formatPrice(annualSavings)} per year (2 months free)
              <RadioGroupItem value="annual" id="annual" className="sr-only" />
            </CardContent>
          </Card>
        </Label>
      </RadioGroup>

      {/* Member Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="h-4 w-4" />
              Member Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Plan</span>
              <Badge variant="outline">{data.membershipType === "single" ? "Individual" : "Couple"}</Badge>
            </div>
            <p className="font-medium">
              {data.primaryMember.firstName} {data.primaryMember.lastName}
            </p>
            <p className="text-muted-foreground">{data.primaryMember.email}</p>
            {data.membershipType === "couple" && data.partnerMember && (
              <>
                <Separator className="my-2" />
                <p className="font-medium">
                  {data.partnerMember.firstName} {data.partnerMember.lastName}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Service Address
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>{data.address.addressLine1}</p>
            {data.address.addressLine2 && <p>{data.address.addressLine2}</p>}
            <p>
              {data.address.city}, {data.address.province} {data.address.postalCode}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Order Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Order Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Subscription */}
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium">
                {data.membershipType === "single" ? "Individual" : "Couple"} Membership
              </p>
              <p className="text-sm text-muted-foreground">
                {data.billingFrequency === "monthly"
                  ? "Monthly subscription"
                  : "Annual subscription (10 months price)"}
              </p>
            </div>
            <p className="font-medium">{formatPrice(order.subscriptionFinal)}</p>
          </div>

          {/* Pendant */}
          {order.pendantCount > 0 && (
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  GPS Safety Pendant
                  {order.pendantCount > 1 && <span>× {order.pendantCount}</span>}
                </p>
                <p className="text-sm text-muted-foreground">One-time purchase (incl. 21% IVA)</p>
              </div>
              <p className="font-medium">{formatPrice(order.pendantFinal)}</p>
            </div>
          )}

          {/* Shipping */}
          {order.shipping > 0 && (
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">Shipping</p>
                <p className="text-sm text-muted-foreground">Delivery to your address</p>
              </div>
              <p className="font-medium">{formatPrice(order.shipping)}</p>
            </div>
          )}

          {/* Registration Fee */}
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium">Registration Fee</p>
              <p className="text-sm text-muted-foreground">One-time setup fee (no IVA)</p>
            </div>
            <p className="font-medium">{formatPrice(order.registrationFee)}</p>
          </div>

          <Separator />

          {/* Total */}
          <div className="flex justify-between text-lg font-bold">
            <span>Total Due Today</span>
            <span className="text-primary">{formatPrice(order.grandTotal)}</span>
          </div>

          {data.billingFrequency === "monthly" && (
            <p className="text-sm text-muted-foreground text-center">
              Then {formatPrice(monthlyFinal)}/month starting next billing cycle
            </p>
          )}
        </CardContent>
      </Card>

      {/* Terms & Conditions */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="terms"
              checked={data.acceptTerms}
              onCheckedChange={(checked) =>
                onUpdate({ acceptTerms: checked === true })
              }
            />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="terms"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                I accept the Terms of Service
              </label>
              <p className="text-xs text-muted-foreground">
                By checking this box, you agree to our{" "}
                <a href="/terms" className="text-primary hover:underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </a>
                .
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="privacy"
              checked={data.acceptPrivacy}
              onCheckedChange={(checked) =>
                onUpdate({ acceptPrivacy: checked === true })
              }
            />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="privacy"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                I consent to share medical information with emergency services
              </label>
              <p className="text-xs text-muted-foreground">
                Your medical information will only be shared with emergency responders when needed.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Note */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Shield className="h-4 w-4" />
        <span>Your payment information is secure and encrypted</span>
      </div>
    </div>
  );
}
