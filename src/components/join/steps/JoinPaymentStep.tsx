import { useState } from "react";
import { JoinWizardData } from "@/types/wizard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Loader2, Lock, Shield, ExternalLink, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { calculateOrder, formatPrice } from "@/config/pricing";

interface JoinPaymentStepProps {
  data: JoinWizardData;
  onUpdate: (data: Partial<JoinWizardData>) => void;
  onPaymentInitiated: () => void;
}

export function JoinPaymentStep({ data, onUpdate, onPaymentInitiated }: JoinPaymentStepProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate order using centralized pricing
  const order = calculateOrder({
    membershipType: data.membershipType,
    billingFrequency: data.billingFrequency,
    includePendant: data.includePendant,
    includeShipping: data.includePendant,
  });
  
  const total = order.grandTotal;

  const PARTNER_REF_KEY = "partner_ref";

  const handlePayWithStripe = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      // Get stored partner referral code if any
      const partnerRef = localStorage.getItem(PARTNER_REF_KEY);

      // Step 1: Submit registration data to create DB records
      const { data: registrationResult, error: registrationError } = await supabase.functions.invoke(
        "submit-registration",
        {
          body: {
            membershipType: data.membershipType,
            primaryMember: data.primaryMember,
            partnerMember: data.partnerMember,
            address: data.address,
            medicalInfo: data.medicalInfo,
            partnerMedicalInfo: data.partnerMedicalInfo,
            emergencyContacts: data.emergencyContacts,
            includePendant: data.includePendant,
            pendantCount: order.pendantCount,
            billingFrequency: data.billingFrequency,
            partnerRef: partnerRef, // Pass partner referral code for attribution
          },
        }
      );

      if (registrationError) {
        throw new Error(registrationError.message || "Failed to submit registration");
      }

      if (!registrationResult?.success) {
        throw new Error(registrationResult?.error || "Registration failed");
      }

      // Update wizard data with generated IDs
      onUpdate({
        memberId: registrationResult.memberId,
        orderId: registrationResult.orderNumber,
      });

      // Step 2: Create Stripe checkout session
      const successUrl = `${window.location.origin}/join?success=true&order=${registrationResult.orderNumber}`;
      const cancelUrl = `${window.location.origin}/join?cancelled=true`;

      const { data: checkoutResult, error: checkoutError } = await supabase.functions.invoke(
        "create-checkout",
        {
          body: {
            memberId: registrationResult.memberId,
            orderId: registrationResult.orderId,
            paymentId: registrationResult.paymentId,
            subscriptionId: registrationResult.subscriptionId,
            lineItems: registrationResult.lineItems,
            customerEmail: data.primaryMember.email,
            customerName: `${data.primaryMember.firstName} ${data.primaryMember.lastName}`,
            successUrl,
            cancelUrl,
          },
        }
      );

      if (checkoutError) {
        // If Stripe not configured, show a helpful message
        if (checkoutResult?.code === "STRIPE_NOT_CONFIGURED") {
          setError("Payment system is being configured. Please try again later or contact support.");
          return;
        }
        throw new Error(checkoutError.message || "Failed to create checkout session");
      }

      if (!checkoutResult?.url) {
        throw new Error("No checkout URL received");
      }

      // Notify parent that payment was initiated
      onPaymentInitiated();

      // Clear partner ref after successful registration (attribution is done)
      localStorage.removeItem(PARTNER_REF_KEY);

      // Redirect to Stripe Checkout
      window.location.href = checkoutResult.url;
    } catch (err) {
      console.error("Payment error:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  if (data.paymentComplete) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-status-active/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="h-8 w-8 text-status-active" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Payment Successful!</h3>
        <p className="text-muted-foreground">
          Your registration is complete. Click "Continue" to view your confirmation.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Complete Your Payment</h2>
        <p className="text-muted-foreground">
          You'll be redirected to our secure payment partner to complete your order.
        </p>
      </div>

      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {data.membershipType === "couple" ? "Couple" : "Individual"} Membership
              {data.billingFrequency === "annual" && " (Annual)"}
            </span>
            <span>{formatPrice(order.subscriptionFinal)}</span>
          </div>
          
          {order.pendantCount > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                GPS Safety Pendant {order.pendantCount > 1 && `(×${order.pendantCount})`}
              </span>
              <span>{formatPrice(order.pendantFinal)}</span>
            </div>
          )}
          
          {order.shipping > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span>{formatPrice(order.shipping)}</span>
            </div>
          )}
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">Registration Fee</span>
            <span>{formatPrice(order.registrationFee)}</span>
          </div>
          
          <div className="border-t pt-3 mt-3">
            <div className="flex justify-between text-lg font-bold">
              <span>Total Due Today</span>
              <span className="text-primary">{formatPrice(total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="pt-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-destructive">Payment Error</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Button */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <Button
            onClick={handlePayWithStripe}
            disabled={isProcessing}
            className="w-full h-14 text-lg gap-3"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="h-5 w-5" />
                Pay {formatPrice(total)} with Stripe
                <ExternalLink className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>

          <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" />
            <span>Secured by 256-bit SSL encryption</span>
          </div>

          <p className="text-xs text-center text-muted-foreground mt-3">
            You will be redirected to Stripe's secure checkout page to complete your payment.
            After payment, you'll be brought back to view your confirmation.
          </p>
        </CardContent>
      </Card>

      {/* Trust Badges */}
      <div className="flex items-center justify-center gap-6 py-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Shield className="h-5 w-5" />
          <span className="text-sm">Secure Payment</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <CreditCard className="h-5 w-5" />
          <span className="text-sm">All Cards Accepted</span>
        </div>
      </div>
    </div>
  );
}
