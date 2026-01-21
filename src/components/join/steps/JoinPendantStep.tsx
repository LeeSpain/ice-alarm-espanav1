import { JoinWizardData } from "@/types/wizard";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, Smartphone, Phone, Award, Shield, Droplets, Battery, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";
import { getPendantFinalPrice, formatPrice } from "@/config/pricing";

interface JoinPendantStepProps {
  data: JoinWizardData;
  onUpdate: (data: Partial<JoinWizardData>) => void;
}

export function JoinPendantStep({ data, onUpdate }: JoinPendantStepProps) {
  const pendantFinalPrice = getPendantFinalPrice(1);
  const pendantCount = data.membershipType === "couple" ? 2 : 1;

  const features = [
    { name: "24/7 Emergency Response", pendant: true, phoneOnly: true },
    { name: "GPS Location Tracking", pendant: true, phoneOnly: true },
    { name: "Automatic Fall Detection", pendant: true, phoneOnly: false },
    { name: "Waterproof Design (IP67)", pendant: true, phoneOnly: false },
    { name: "One-Touch SOS Button", pendant: true, phoneOnly: true },
    { name: "Two-Way Voice Communication", pendant: true, phoneOnly: true },
    { name: "No Smartphone Required", pendant: true, phoneOnly: false },
    { name: "Works Anywhere with 4G", pendant: true, phoneOnly: false },
  ];

  const pendantFeatures = [
    { icon: Shield, text: "Fall Detection" },
    { icon: Droplets, text: "Waterproof IP67" },
    { icon: Battery, text: "7-Day Battery" },
    { icon: Wifi, text: "4G Connectivity" },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Choose Your Device</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Select how you'd like to connect to our emergency response center.
        </p>
      </div>

      <RadioGroup
        value={data.includePendant ? "yes" : "no"}
        onValueChange={(value) => onUpdate({ includePendant: value === "yes" })}
        className="grid gap-4 md:grid-cols-2"
      >
        {/* With Pendant - Recommended */}
        <Label htmlFor="pendant-yes" className="cursor-pointer">
          <Card
            className={cn(
              "relative transition-all hover:shadow-lg h-full",
              data.includePendant && "border-primary ring-2 ring-primary/20"
            )}
          >
            {/* Recommended Badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                <Award className="h-3 w-3" />
                Recommended
              </span>
            </div>
            {data.includePendant && (
              <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                <Check className="h-4 w-4 text-primary-foreground" />
              </div>
            )}
            <CardHeader className="pt-8">
              <div className="flex flex-col items-center text-center gap-3">
                <div
                  className={cn(
                    "w-16 h-16 rounded-full flex items-center justify-center",
                    data.includePendant
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <Smartphone className="h-8 w-8" />
                </div>
                <div>
                  <CardTitle className="text-xl">GPS Safety Pendant</CardTitle>
                  <p className="text-2xl font-bold text-primary mt-2">
                    {formatPrice(pendantFinalPrice)}
                    {data.membershipType === "couple" && (
                      <span className="text-sm font-normal text-muted-foreground ml-1">
                        × {pendantCount}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">One-time purchase</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Our waterproof pendant provides complete protection with automatic 
                fall detection — no smartphone needed.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {pendantFeatures.map((feature) => (
                  <div key={feature.text} className="flex items-center gap-2 text-xs">
                    <feature.icon className="h-4 w-4 text-primary" />
                    <span>{feature.text}</span>
                  </div>
                ))}
              </div>
              <RadioGroupItem value="yes" id="pendant-yes" className="sr-only" />
            </CardContent>
          </Card>
        </Label>

        {/* Phone Only */}
        <Label htmlFor="pendant-no" className="cursor-pointer">
          <Card
            className={cn(
              "relative transition-all hover:shadow-lg h-full",
              !data.includePendant && "border-primary ring-2 ring-primary/20"
            )}
          >
            {!data.includePendant && (
              <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                <Check className="h-4 w-4 text-primary-foreground" />
              </div>
            )}
            <CardHeader className="pt-6">
              <div className="flex flex-col items-center text-center gap-3">
                <div
                  className={cn(
                    "w-16 h-16 rounded-full flex items-center justify-center",
                    !data.includePendant
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <Phone className="h-8 w-8" />
                </div>
                <div>
                  <CardTitle className="text-xl">Phone Only</CardTitle>
                  <p className="text-2xl font-bold text-status-active mt-2">
                    Free
                  </p>
                  <p className="text-xs text-muted-foreground">No additional cost</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Use our mobile app on your smartphone to connect with our 
                emergency response center.
              </p>
              <div className="text-center py-2">
                <p className="text-xs text-muted-foreground italic">
                  Requires smartphone with app installed
                </p>
              </div>
              <RadioGroupItem value="no" id="pendant-no" className="sr-only" />
            </CardContent>
          </Card>
        </Label>
      </RadioGroup>

      {/* Feature Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base text-center">Feature Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">Feature</th>
                  <th className="text-center py-2 font-medium">GPS Pendant</th>
                  <th className="text-center py-2 font-medium">Phone Only</th>
                </tr>
              </thead>
              <tbody>
                {features.map((feature) => (
                  <tr key={feature.name} className="border-b last:border-0">
                    <td className="py-2">{feature.name}</td>
                    <td className="text-center py-2">
                      {feature.pendant ? (
                        <Check className="h-5 w-5 text-status-active mx-auto" />
                      ) : (
                        <X className="h-5 w-5 text-muted-foreground mx-auto" />
                      )}
                    </td>
                    <td className="text-center py-2">
                      {feature.phoneOnly ? (
                        <Check className="h-5 w-5 text-status-active mx-auto" />
                      ) : (
                        <X className="h-5 w-5 text-muted-foreground mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
