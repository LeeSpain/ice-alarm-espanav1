import { WizardData } from "@/pages/admin/AddMemberWizard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { User, MapPin, Heart, Phone, Smartphone, CreditCard } from "lucide-react";

interface OrderSummaryStepProps {
  data: WizardData;
}

export function OrderSummaryStep({ data }: OrderSummaryStepProps) {
  // Pricing calculations
  const monthlyPrice = data.membershipType === "single" ? 27.49 : 43.99;
  const annualMonthlyPrice = data.membershipType === "single" ? 22.99 : 36.99;
  const basePrice = data.billingFrequency === "monthly" ? monthlyPrice : annualMonthlyPrice * 12;
  
  const pendantPrice = 151.25;
  const pendantCount = data.membershipType === "couple" && data.includePendant ? 2 : data.includePendant ? 1 : 0;
  const pendantTotal = pendantCount * pendantPrice;
  
  const registrationFee = 29.99;
  
  const subtotal = basePrice + pendantTotal + registrationFee;
  const taxRate = 0.21; // 21% IVA
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;

  return (
    <div className="space-y-6">
      {/* Member Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            Member Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Membership Type</span>
            <Badge variant="outline">{data.membershipType === "single" ? "Single" : "Couple"}</Badge>
          </div>
          <div>
            <span className="text-muted-foreground">Primary Member</span>
            <p className="font-medium">
              {data.primaryMember.firstName} {data.primaryMember.lastName}
            </p>
            <p className="text-sm text-muted-foreground">{data.primaryMember.email}</p>
          </div>
          {data.membershipType === "couple" && data.partnerMember && (
            <div>
              <span className="text-muted-foreground">Partner</span>
              <p className="font-medium">
                {data.partnerMember.firstName} {data.partnerMember.lastName}
              </p>
              <p className="text-sm text-muted-foreground">{data.partnerMember.email}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Shipping & Service Address
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>{data.address.addressLine1}</p>
          {data.address.addressLine2 && <p>{data.address.addressLine2}</p>}
          <p>
            {data.address.city}, {data.address.province} {data.address.postalCode}
          </p>
          <p>{data.address.country}</p>
        </CardContent>
      </Card>

      {/* Medical & Contacts Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Medical Info
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {data.medicalInfo.bloodType && (
              <p>Blood Type: {data.medicalInfo.bloodType}</p>
            )}
            {data.medicalInfo.allergies.length > 0 && (
              <p>Allergies: {data.medicalInfo.allergies.join(", ")}</p>
            )}
            {data.medicalInfo.medications.length > 0 && (
              <p>Medications: {data.medicalInfo.medications.length}</p>
            )}
            {!data.medicalInfo.bloodType &&
              data.medicalInfo.allergies.length === 0 &&
              data.medicalInfo.medications.length === 0 && (
                <p className="text-muted-foreground italic">No medical info provided</p>
              )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Emergency Contacts
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            {data.emergencyContacts.map((contact, index) => (
              <div key={index}>
                <p className="font-medium">{contact.contactName}</p>
                <p className="text-muted-foreground">{contact.relationship}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Order Items */}
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
                {data.membershipType === "single" ? "Single" : "Couple"} Membership
              </p>
              <p className="text-sm text-muted-foreground">
                {data.billingFrequency === "monthly"
                  ? "Monthly subscription"
                  : "Annual subscription (12 months)"}
              </p>
            </div>
            <p className="font-medium">€{basePrice.toFixed(2)}</p>
          </div>

          {/* Pendant */}
          {pendantCount > 0 && (
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  Medical Alert Pendant
                  {pendantCount > 1 && <span>× {pendantCount}</span>}
                </p>
                <p className="text-sm text-muted-foreground">One-time purchase</p>
              </div>
              <p className="font-medium">€{pendantTotal.toFixed(2)}</p>
            </div>
          )}

          {/* Registration Fee */}
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium">Registration Fee</p>
              <p className="text-sm text-muted-foreground">One-time setup fee</p>
            </div>
            <p className="font-medium">€{registrationFee.toFixed(2)}</p>
          </div>

          <Separator />

          {/* Subtotal */}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>€{subtotal.toFixed(2)}</span>
          </div>

          {/* Tax */}
          <div className="flex justify-between">
            <span className="text-muted-foreground">IVA (21%)</span>
            <span>€{taxAmount.toFixed(2)}</span>
          </div>

          <Separator />

          {/* Total */}
          <div className="flex justify-between text-lg font-bold">
            <span>Total Due Today</span>
            <span className="text-primary">€{total.toFixed(2)}</span>
          </div>

          {data.billingFrequency === "monthly" && (
            <p className="text-sm text-muted-foreground text-center">
              Then €{(monthlyPrice * 1.21).toFixed(2)}/month starting next month
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
