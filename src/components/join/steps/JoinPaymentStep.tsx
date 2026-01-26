import { useState } from "react";
import { useTranslation } from "react-i18next";
import { JoinWizardData } from "@/types/wizard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Loader2, Lock, Shield, ExternalLink, AlertCircle, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { calculateOrder, formatPrice } from "@/config/pricing";
import { getStoredReferralData, clearReferralData } from "@/lib/crmEvents";
import { usePricingSettings } from "@/hooks/usePricingSettings";

interface JoinPaymentStepProps {
  data: JoinWizardData;
  onUpdate: (data: Partial<JoinWizardData>) => void;
  onPaymentInitiated: () => void;
}

export function JoinPaymentStep({ data, onUpdate, onPaymentInitiated }: JoinPaymentStepProps) {
  const { t } = useTranslation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { registrationFeeEnabled, registrationFeeDiscount } = usePricingSettings();

  const order = calculateOrder({ 
    membershipType: data.membershipType, 
    billingFrequency: data.billingFrequency, 
    includePendant: data.includePendant, 
    pendantCount: data.pendantCount,
    includeShipping: data.includePendant,
    registrationFeeEnabled,
    registrationFeeDiscount
  });
  const total = order.grandTotal;

  const handlePayWithStripe = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      const { referralCode: partnerRef, utmParams } = getStoredReferralData();
      const { data: registrationResult, error: registrationError } = await supabase.functions.invoke("submit-registration", { body: { membershipType: data.membershipType, primaryMember: data.primaryMember, partnerMember: data.partnerMember, address: data.address, separateAddresses: data.separateAddresses, partnerAddress: data.partnerAddress, emergencyContacts: data.emergencyContacts, includePendant: data.includePendant, pendantCount: data.pendantCount, billingFrequency: data.billingFrequency, partnerRef, utmParams } });
      if (registrationError) throw new Error(registrationError.message || "Failed to submit registration");
      if (!registrationResult?.success) throw new Error(registrationResult?.error || "Registration failed");
      onUpdate({ memberId: registrationResult.memberId, orderId: registrationResult.orderNumber });
      const successUrl = `${window.location.origin}/join?success=true&order=${registrationResult.orderNumber}`;
      const cancelUrl = `${window.location.origin}/join?cancelled=true`;
      const { data: checkoutResult, error: checkoutError } = await supabase.functions.invoke("create-checkout", { body: { memberId: registrationResult.memberId, orderId: registrationResult.orderId, paymentId: registrationResult.paymentId, subscriptionId: registrationResult.subscriptionId, lineItems: registrationResult.lineItems, customerEmail: data.primaryMember.email, customerName: `${data.primaryMember.firstName} ${data.primaryMember.lastName}`, successUrl, cancelUrl } });
      if (checkoutError) { if (checkoutResult?.code === "STRIPE_NOT_CONFIGURED") { setError("Payment system is being configured. Please try again later or contact support."); return; } throw new Error(checkoutError.message || "Failed to create checkout session"); }
      if (!checkoutResult?.url) throw new Error("No checkout URL received");
      onPaymentInitiated();
      clearReferralData();
      window.location.href = checkoutResult.url;
    } catch (err) { console.error("Payment error:", err); setError(err instanceof Error ? err.message : "An unexpected error occurred"); } finally { setIsProcessing(false); }
  };

  if (data.paymentComplete) {
    return (<div className="text-center py-8"><div className="w-16 h-16 bg-status-active/20 rounded-full flex items-center justify-center mx-auto mb-4"><Shield className="h-8 w-8 text-status-active" /></div><h3 className="text-xl font-semibold mb-2">{t("joinWizard.payment.paymentSuccess")}</h3><p className="text-muted-foreground">{t("joinWizard.payment.paymentSuccessDesc")}</p></div>);
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8"><h2 className="text-2xl font-bold mb-2">{t("joinWizard.payment.title")}</h2><p className="text-muted-foreground">{t("joinWizard.payment.subtitle")}</p></div>
      <Card><CardHeader><CardTitle className="text-lg">{t("joinWizard.payment.orderSummary")}</CardTitle></CardHeader><CardContent className="space-y-3">
        <div className="flex justify-between"><span className="text-muted-foreground">{data.membershipType === "couple" ? "Couple" : "Individual"} Membership{data.billingFrequency === "annual" && " (Annual)"}</span><span>{formatPrice(order.subscriptionFinal)}</span></div>
        {order.pendantCount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">GPS Safety Pendant {order.pendantCount > 1 && `(×${order.pendantCount})`}</span><span>{formatPrice(order.pendantFinal)}</span></div>}
        {order.shipping > 0 && <div className="flex justify-between"><span className="text-muted-foreground">{t("joinWizard.summary.shipping")}</span><span>{formatPrice(order.shipping)}</span></div>}
        {/* Registration Fee - with discount display */}
        {order.registrationFeeEnabled && (
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground flex items-center gap-2">
              {t("joinWizard.payment.registrationFee")}
              {order.registrationFeeDiscount === 100 && (
                <Badge className="bg-status-active/20 text-status-active border-0 gap-1 text-xs">
                  <Gift className="h-3 w-3" />
                  {t("common.free") || "FREE"}
                </Badge>
              )}
              {order.registrationFeeDiscount > 0 && order.registrationFeeDiscount < 100 && (
                <Badge className="bg-status-active/20 text-status-active border-0 text-xs">
                  {order.registrationFeeDiscount}% {t("common.off") || "off"}
                </Badge>
              )}
            </span>
            <span className="flex items-center gap-2">
              {order.registrationFeeDiscount > 0 && (
                <span className="text-sm text-muted-foreground line-through">{formatPrice(order.registrationFeeOriginal)}</span>
              )}
              <span>{order.registrationFeeDiscount === 100 ? (t("common.free") || "FREE") : formatPrice(order.registrationFee)}</span>
            </span>
          </div>
        )}
        <div className="border-t pt-3 mt-3"><div className="flex justify-between text-lg font-bold"><span>{t("joinWizard.payment.totalDueToday")}</span><span className="text-primary">{formatPrice(total)}</span></div></div>
      </CardContent></Card>
      {error && <Card className="border-destructive bg-destructive/10"><CardContent className="pt-6 flex items-start gap-3"><AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" /><div><p className="font-medium text-destructive">{t("joinWizard.payment.paymentError")}</p><p className="text-sm text-muted-foreground">{error}</p></div></CardContent></Card>}
      <Card className="bg-muted/50"><CardContent className="pt-6"><Button onClick={handlePayWithStripe} disabled={isProcessing} className="w-full h-14 text-lg gap-3" size="lg">{isProcessing ? (<><Loader2 className="h-5 w-5 animate-spin" />{t("joinWizard.payment.processing")}</>) : (<><CreditCard className="h-5 w-5" />{t("joinWizard.payment.payWithStripe", { amount: formatPrice(total) })}<ExternalLink className="h-4 w-4 ml-1" /></>)}</Button><div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground"><Lock className="h-3 w-3" /><span>{t("joinWizard.payment.securedBy")}</span></div><p className="text-xs text-center text-muted-foreground mt-3">{t("joinWizard.payment.redirectNote")}</p></CardContent></Card>
      <div className="flex items-center justify-center gap-6 py-4"><div className="flex items-center gap-2 text-muted-foreground"><Shield className="h-5 w-5" /><span className="text-sm">{t("joinWizard.payment.securePayment")}</span></div><div className="flex items-center gap-2 text-muted-foreground"><CreditCard className="h-5 w-5" /><span className="text-sm">{t("joinWizard.payment.allCardsAccepted")}</span></div></div>
    </div>
  );
}