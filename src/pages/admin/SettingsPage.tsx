import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Building2,
  CreditCard,
  MessageSquare,
  Mail,
  Phone,
  Settings,
  Check
} from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage system configuration and integrations.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Company Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Company Profile
            </CardTitle>
            <CardDescription>
              Basic company information displayed to members
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input defaultValue="ICE Alarm España" />
              </div>
              <div className="space-y-2">
                <Label>Emergency Phone</Label>
                <Input defaultValue="+34 900 123 456" />
              </div>
              <div className="space-y-2">
                <Label>Support Email</Label>
                <Input defaultValue="info@icealarm.es" />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input defaultValue="Calle Principal 1, Albox, 04800 Almería" />
              </div>
            </div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>

        {/* Pricing Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Pricing Configuration
            </CardTitle>
            <CardDescription>
              Configure membership and product pricing (prices include IVA)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-3">Membership Fees</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Single Monthly</Label>
                    <Input defaultValue="27.49" type="number" step="0.01" />
                  </div>
                  <div className="space-y-2">
                    <Label>Single Annual</Label>
                    <Input defaultValue="274.89" type="number" step="0.01" />
                  </div>
                  <div className="space-y-2">
                    <Label>Couple Monthly</Label>
                    <Input defaultValue="38.49" type="number" step="0.01" />
                  </div>
                  <div className="space-y-2">
                    <Label>Couple Annual</Label>
                    <Input defaultValue="384.89" type="number" step="0.01" />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h4 className="font-medium mb-3">One-time Fees</h4>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Registration Fee</Label>
                    <Input defaultValue="59.99" type="number" step="0.01" />
                  </div>
                  <div className="space-y-2">
                    <Label>Pendant Device</Label>
                    <Input defaultValue="151.25" type="number" step="0.01" />
                  </div>
                  <div className="space-y-2">
                    <Label>Shipping</Label>
                    <Input defaultValue="14.99" type="number" step="0.01" />
                  </div>
                </div>
              </div>
              
              <Button>Save Pricing</Button>
            </div>
          </CardContent>
        </Card>

        {/* Integrations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Integrations
            </CardTitle>
            <CardDescription>
              Configure third-party service integrations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Stripe */}
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">Stripe</p>
                    <p className="text-sm text-muted-foreground">Payment processing</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                  Not Configured
                </Badge>
              </div>

              {/* Twilio */}
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                    <Phone className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium">Twilio</p>
                    <p className="text-sm text-muted-foreground">Voice, SMS, and WhatsApp</p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                  Not Configured
                </Badge>
              </div>

              {/* Email */}
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Email Service</p>
                    <p className="text-sm text-muted-foreground">Transactional emails</p>
                  </div>
                </div>
                <Badge className="bg-alert-resolved text-alert-resolved-foreground">
                  <Check className="mr-1 h-3 w-3" />
                  Configured
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
