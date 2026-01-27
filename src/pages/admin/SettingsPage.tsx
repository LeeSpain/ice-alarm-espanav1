import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { 
  Building2,
  CreditCard,
  Phone,
  Mail,
  Check,
  Eye,
  EyeOff,
  Save,
  Loader2,
  AlertCircle,
  Map,
  Image as ImageIcon,
  Percent,
  Tag,
  Facebook
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ImagesSettingsTab } from "@/components/admin/settings/ImagesSettingsTab";
import { PRICING } from "@/config/pricing";

interface SystemSetting {
  key: string;
  value: string;
  updated_at?: string;
}

export default function SettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Company settings state
  const [companySettings, setCompanySettings] = useState({
    company_name: "ICE Alarm España",
    emergency_phone: "+34 900 123 456",
    support_email: "info@icealarm.es",
    address: "Calle Principal 1, Albox, 04800 Almería"
  });

  // Pricing settings state
  const [pricingSettings, setPricingSettings] = useState({
    single_monthly: "27.49",
    single_annual: "274.89",
    couple_monthly: "38.49",
    couple_annual: "384.89",
    registration_fee: "59.99",
    pendant_price: "151.25",
    shipping: "14.99"
  });

  // Registration fee settings state
  const [registrationFeeSettings, setRegistrationFeeSettings] = useState({
    enabled: true,
    discount: 0
  });

  // Integration keys state
  const [stripeKeys, setStripeKeys] = useState({
    secret_key: "",
    publishable_key: "",
    webhook_secret: ""
  });

  const [twilioKeys, setTwilioKeys] = useState({
    account_sid: "",
    auth_token: "",
    phone_number: "",
    whatsapp_number: ""
  });

  const [googleMapsKey, setGoogleMapsKey] = useState("");

  // Facebook settings state
  const [facebookSettings, setFacebookSettings] = useState({
    page_id: "",
    page_access_token: ""
  });

  const [showFacebookToken, setShowFacebookToken] = useState(false);
  // Track recently saved sections to prevent useEffect from resetting form values
  const [recentlySavedSection, setRecentlySavedSection] = useState<string | null>(null);
  // Password visibility toggles
  const [showStripeSecret, setShowStripeSecret] = useState(false);
  const [showTwilioToken, setShowTwilioToken] = useState(false);

  // Fetch settings from database
  const { data: settings } = useQuery({
    queryKey: ["system-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_settings")
        .select("key, value, updated_at");
      
      if (error) throw error;
      return (data || []) as SystemSetting[];
    }
  });

  // Populate state from fetched settings
  useEffect(() => {
    if (settings) {
      const settingsMap = settings.reduce((acc, s) => {
        acc[s.key] = s.value;
        return acc;
      }, {} as Record<string, string>);

      // Company - keys are stored with 'settings_' prefix
      setCompanySettings(prev => ({
        company_name: settingsMap.settings_company_name || prev.company_name,
        emergency_phone: settingsMap.settings_emergency_phone || prev.emergency_phone,
        support_email: settingsMap.settings_support_email || prev.support_email,
        address: settingsMap.settings_address || prev.address
      }));

      // Pricing
      setPricingSettings(prev => ({
        single_monthly: settingsMap.single_monthly || prev.single_monthly,
        single_annual: settingsMap.single_annual || prev.single_annual,
        couple_monthly: settingsMap.couple_monthly || prev.couple_monthly,
        couple_annual: settingsMap.couple_annual || prev.couple_annual,
        registration_fee: settingsMap.registration_fee || prev.registration_fee,
        pendant_price: settingsMap.pendant_price || prev.pendant_price,
        shipping: settingsMap.shipping || prev.shipping
      }));

      // Integrations (masked)
      setStripeKeys({
        secret_key: settingsMap.stripe_secret_key ? "••••••••••••" : "",
        publishable_key: settingsMap.stripe_publishable_key || "",
        webhook_secret: settingsMap.stripe_webhook_secret ? "••••••••••••" : ""
      });

      setTwilioKeys({
        account_sid: settingsMap.twilio_account_sid || "",
        auth_token: settingsMap.twilio_auth_token ? "••••••••••••" : "",
        phone_number: settingsMap.twilio_phone_number || "",
        whatsapp_number: settingsMap.twilio_whatsapp_number || ""
      });

      setGoogleMapsKey(settingsMap.google_maps_api_key || "");

      // Facebook settings - only update if we haven't just saved them
      if (recentlySavedSection !== "facebook") {
        setFacebookSettings({
          page_id: settingsMap.settings_facebook_page_id || "",
          page_access_token: settingsMap.settings_facebook_page_access_token ? "••••••••••••" : ""
        });
      }

      // Registration fee settings - keys are stored with 'settings_' prefix
      setRegistrationFeeSettings({
        enabled: settingsMap.settings_registration_fee_enabled !== "false",
        discount: parseFloat(settingsMap.settings_registration_fee_discount || "0")
      });
    }
  }, [settings]);

  // Save settings mutation
  const saveMutation = useMutation({
    mutationFn: async (updates: Record<string, string>) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error("Not authenticated");
      }

      const response = await supabase.functions.invoke("save-api-keys", {
        body: { service: "settings", keys: updates }
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-settings"] });
      queryClient.invalidateQueries({ queryKey: ["company-settings"] });
      queryClient.invalidateQueries({ queryKey: ["pricing-settings"] });
      toast({
        title: "Settings saved",
        description: "Your changes have been saved successfully."
      });
      // Clear the recently saved flag after a delay to allow the query to settle
      setTimeout(() => setRecentlySavedSection(null), 2000);
    },
    onError: (error) => {
      toast({
        title: "Error saving settings",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleSaveCompany = () => {
    saveMutation.mutate(companySettings);
  };

  const handleSavePricing = () => {
    saveMutation.mutate(pricingSettings);
  };

  const handleSaveRegistrationFee = () => {
    saveMutation.mutate({
      registration_fee_enabled: registrationFeeSettings.enabled.toString(),
      registration_fee_discount: registrationFeeSettings.discount.toString()
    });
  };

  const handleSaveStripe = () => {
    const updates: Record<string, string> = {};
    if (stripeKeys.secret_key && !stripeKeys.secret_key.includes("•")) {
      updates.stripe_secret_key = stripeKeys.secret_key;
    }
    if (stripeKeys.publishable_key) {
      updates.stripe_publishable_key = stripeKeys.publishable_key;
    }
    if (stripeKeys.webhook_secret && !stripeKeys.webhook_secret.includes("•")) {
      updates.stripe_webhook_secret = stripeKeys.webhook_secret;
    }

    if (Object.keys(updates).length === 0) {
      toast({
        title: "No changes to save",
        description: "Enter new values to update the keys."
      });
      return;
    }

    saveMutation.mutate(updates);
  };

  const handleSaveTwilio = () => {
    const updates: Record<string, string> = {};
    if (twilioKeys.account_sid) {
      updates.twilio_account_sid = twilioKeys.account_sid;
    }
    if (twilioKeys.auth_token && !twilioKeys.auth_token.includes("•")) {
      updates.twilio_auth_token = twilioKeys.auth_token;
    }
    if (twilioKeys.phone_number) {
      updates.twilio_phone_number = twilioKeys.phone_number;
    }
    if (twilioKeys.whatsapp_number) {
      updates.twilio_whatsapp_number = twilioKeys.whatsapp_number;
    }

    if (Object.keys(updates).length === 0) {
      toast({
        title: "No changes to save",
        description: "Enter new values to update the keys."
      });
      return;
    }

    saveMutation.mutate(updates);
  };

  const handleSaveGoogleMaps = () => {
    if (googleMapsKey) {
      saveMutation.mutate({ google_maps_api_key: googleMapsKey });
    }
  };

  const handleSaveFacebook = () => {
    const updates: Record<string, string> = {};
    if (facebookSettings.page_id) {
      updates.facebook_page_id = facebookSettings.page_id;
    }
    const hasNewToken = facebookSettings.page_access_token && !facebookSettings.page_access_token.includes("•");
    if (hasNewToken) {
      updates.facebook_page_access_token = facebookSettings.page_access_token;
    }

    if (Object.keys(updates).length === 0) {
      toast({
        title: "No changes to save",
        description: "Enter new values to update the settings."
      });
      return;
    }

    // Set flag to prevent useEffect from immediately resetting the form
    setRecentlySavedSection("facebook");
    
    // Immediately show masked value for the token to confirm it's being saved
    if (hasNewToken) {
      setFacebookSettings(prev => ({
        ...prev,
        page_access_token: "••••••••••••"
      }));
    }

    saveMutation.mutate(updates);
  };

  const getIntegrationStatus = (keys: string[]) => {
    const settingsMap = settings?.reduce((acc, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {} as Record<string, string>) || {};

    const hasAllKeys = keys.every(key => settingsMap[key]);
    return hasAllKeys;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage system configuration and integrations.
        </p>
      </div>

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="communications">Communications</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
        </TabsList>

        {/* Company Tab */}
        <TabsContent value="company">
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
                  <Input 
                    value={companySettings.company_name}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, company_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Emergency Phone</Label>
                  <Input 
                    value={companySettings.emergency_phone}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, emergency_phone: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Support Email</Label>
                  <Input 
                    value={companySettings.support_email}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, support_email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input 
                    value={companySettings.address}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, address: e.target.value }))}
                  />
                </div>
              </div>
              <Button onClick={handleSaveCompany} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pricing Tab */}
        <TabsContent value="pricing">
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
                      <Label>Single Monthly (€)</Label>
                      <Input 
                        value={pricingSettings.single_monthly}
                        onChange={(e) => setPricingSettings(prev => ({ ...prev, single_monthly: e.target.value }))}
                        type="number" 
                        step="0.01" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Single Annual (€)</Label>
                      <Input 
                        value={pricingSettings.single_annual}
                        onChange={(e) => setPricingSettings(prev => ({ ...prev, single_annual: e.target.value }))}
                        type="number" 
                        step="0.01" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Couple Monthly (€)</Label>
                      <Input 
                        value={pricingSettings.couple_monthly}
                        onChange={(e) => setPricingSettings(prev => ({ ...prev, couple_monthly: e.target.value }))}
                        type="number" 
                        step="0.01" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Couple Annual (€)</Label>
                      <Input 
                        value={pricingSettings.couple_annual}
                        onChange={(e) => setPricingSettings(prev => ({ ...prev, couple_annual: e.target.value }))}
                        type="number" 
                        step="0.01" 
                      />
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium mb-3">One-time Fees</h4>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Registration Fee (€)</Label>
                      <Input 
                        value={pricingSettings.registration_fee}
                        onChange={(e) => setPricingSettings(prev => ({ ...prev, registration_fee: e.target.value }))}
                        type="number" 
                        step="0.01" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Pendant Device (€)</Label>
                      <Input 
                        value={pricingSettings.pendant_price}
                        onChange={(e) => setPricingSettings(prev => ({ ...prev, pendant_price: e.target.value }))}
                        type="number" 
                        step="0.01" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Shipping (€)</Label>
                      <Input 
                        value={pricingSettings.shipping}
                        onChange={(e) => setPricingSettings(prev => ({ ...prev, shipping: e.target.value }))}
                        type="number" 
                        step="0.01" 
                      />
                    </div>
                  </div>
                </div>
                
                <Button onClick={handleSavePricing} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Pricing
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Registration Fee Settings Card */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Registration Fee Settings
              </CardTitle>
              <CardDescription>
                Toggle the registration fee on/off and apply discounts for promotions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Enable/Disable Toggle */}
                <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                  <div className="space-y-0.5">
                    <Label className="text-base">Enable Registration Fee</Label>
                    <p className="text-sm text-muted-foreground">
                      Base Price: €{PRICING.registration.amount.toFixed(2)}
                    </p>
                  </div>
                  <Switch
                    checked={registrationFeeSettings.enabled}
                    onCheckedChange={(checked) => 
                      setRegistrationFeeSettings(prev => ({ ...prev, enabled: checked }))
                    }
                  />
                </div>

                {/* Discount Slider - Only visible when enabled */}
                {registrationFeeSettings.enabled && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <Percent className="h-4 w-4" />
                        Discount
                      </Label>
                      <span className="text-lg font-semibold">
                        {registrationFeeSettings.discount}%
                      </span>
                    </div>
                    
                    <Slider
                      value={[registrationFeeSettings.discount]}
                      onValueChange={(value) => 
                        setRegistrationFeeSettings(prev => ({ ...prev, discount: value[0] }))
                      }
                      max={100}
                      step={5}
                      className="py-4"
                    />

                    {/* Quick preset buttons */}
                    <div className="flex flex-wrap gap-2">
                      {[0, 25, 50, 75, 100].map((preset) => (
                        <Button
                          key={preset}
                          variant={registrationFeeSettings.discount === preset ? "default" : "outline"}
                          size="sm"
                          onClick={() => setRegistrationFeeSettings(prev => ({ ...prev, discount: preset }))}
                        >
                          {preset}%{preset === 100 && " (FREE)"}
                        </Button>
                      ))}
                    </div>

                    {/* Preview */}
                    <div className="p-4 rounded-lg border bg-card">
                      <p className="text-sm text-muted-foreground mb-2">Preview:</p>
                      <div className="flex items-center gap-3">
                        {registrationFeeSettings.discount > 0 ? (
                          <>
                            <span className="text-muted-foreground line-through">
                              €{PRICING.registration.amount.toFixed(2)}
                            </span>
                            <span className="text-xl font-bold text-primary">
                              {registrationFeeSettings.discount === 100 
                                ? "FREE" 
                                : `€${(PRICING.registration.amount * (1 - registrationFeeSettings.discount / 100)).toFixed(2)}`
                              }
                            </span>
                            {registrationFeeSettings.discount < 100 && (
                              <Badge variant="secondary" className="bg-status-active/20 text-status-active border-0">
                                {registrationFeeSettings.discount}% off
                              </Badge>
                            )}
                            {registrationFeeSettings.discount === 100 && (
                              <Badge variant="secondary" className="bg-status-active/20 text-status-active border-0">
                                🎉 Free Promotion
                              </Badge>
                            )}
                          </>
                        ) : (
                          <span className="text-xl font-bold">
                            €{PRICING.registration.amount.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {!registrationFeeSettings.enabled && (
                  <div className="p-4 rounded-lg border bg-muted/50 text-center">
                    <p className="text-muted-foreground">
                      Registration fee is currently <span className="font-semibold text-foreground">disabled</span>.
                      New members will not be charged a registration fee.
                    </p>
                  </div>
                )}

                <Button onClick={handleSaveRegistrationFee} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Registration Fee Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab (Stripe) */}
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Stripe Configuration
                {getIntegrationStatus(["stripe_secret_key", "stripe_publishable_key"]) ? (
                  <Badge className="bg-alert-resolved text-alert-resolved-foreground ml-2">
                    <Check className="mr-1 h-3 w-3" />
                    Configured
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 ml-2">
                    <AlertCircle className="mr-1 h-3 w-3" />
                    Not Configured
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Connect your Stripe account for payment processing. Get your API keys from the{" "}
                <a 
                  href="https://dashboard.stripe.com/apikeys" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Stripe Dashboard
                </a>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Publishable Key</Label>
                  <Input 
                    value={stripeKeys.publishable_key}
                    onChange={(e) => setStripeKeys(prev => ({ ...prev, publishable_key: e.target.value }))}
                    placeholder="pk_live_..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Starts with pk_live_ (production) or pk_test_ (testing)
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>Secret Key</Label>
                  <div className="relative">
                    <Input 
                      type={showStripeSecret ? "text" : "password"}
                      value={stripeKeys.secret_key}
                      onChange={(e) => setStripeKeys(prev => ({ ...prev, secret_key: e.target.value }))}
                      placeholder="sk_live_..."
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowStripeSecret(!showStripeSecret)}
                    >
                      {showStripeSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Starts with sk_live_ (production) or sk_test_ (testing)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Webhook Secret</Label>
                  <Input 
                    type="password"
                    value={stripeKeys.webhook_secret}
                    onChange={(e) => setStripeKeys(prev => ({ ...prev, webhook_secret: e.target.value }))}
                    placeholder="whsec_..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Found in Stripe Dashboard → Webhooks → Your endpoint → Signing secret
                  </p>
                </div>
              </div>
              
              <Button onClick={handleSaveStripe} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Stripe Configuration
              </Button>

              <Separator className="my-6" />

              <div className="rounded-lg bg-muted p-4">
                <h4 className="font-medium mb-2">Webhook URL</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Add this URL to your Stripe webhook endpoints:
                </p>
                <code className="block p-2 bg-background rounded border text-sm break-all">
                  {`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-webhook`}
                </code>
                <p className="text-xs text-muted-foreground mt-2">
                  Events to listen for: checkout.session.completed, payment_intent.succeeded, 
                  payment_intent.payment_failed, customer.subscription.updated, 
                  customer.subscription.deleted, invoice.paid, invoice.payment_failed
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Communications Tab (Twilio + Maps) */}
        <TabsContent value="communications" className="space-y-6">
          {/* Twilio */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Twilio Configuration
                {getIntegrationStatus(["twilio_account_sid", "twilio_auth_token"]) ? (
                  <Badge className="bg-alert-resolved text-alert-resolved-foreground ml-2">
                    <Check className="mr-1 h-3 w-3" />
                    Configured
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 ml-2">
                    <AlertCircle className="mr-1 h-3 w-3" />
                    Not Configured
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Voice calls, SMS, and WhatsApp messaging. Get credentials from the{" "}
                <a 
                  href="https://console.twilio.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Twilio Console
                </a>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Account SID</Label>
                  <Input 
                    value={twilioKeys.account_sid}
                    onChange={(e) => setTwilioKeys(prev => ({ ...prev, account_sid: e.target.value }))}
                    placeholder="AC..."
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Auth Token</Label>
                  <div className="relative">
                    <Input 
                      type={showTwilioToken ? "text" : "password"}
                      value={twilioKeys.auth_token}
                      onChange={(e) => setTwilioKeys(prev => ({ ...prev, auth_token: e.target.value }))}
                      placeholder="Enter auth token"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowTwilioToken(!showTwilioToken)}
                    >
                      {showTwilioToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Phone Number (Voice/SMS)</Label>
                  <Input 
                    value={twilioKeys.phone_number}
                    onChange={(e) => setTwilioKeys(prev => ({ ...prev, phone_number: e.target.value }))}
                    placeholder="+34..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>WhatsApp Number</Label>
                  <Input 
                    value={twilioKeys.whatsapp_number}
                    onChange={(e) => setTwilioKeys(prev => ({ ...prev, whatsapp_number: e.target.value }))}
                    placeholder="+34..."
                  />
                </div>
              </div>
              
              <Button onClick={handleSaveTwilio} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Twilio Configuration
              </Button>

              <Separator className="my-6" />

              <div className="rounded-lg bg-muted p-4 space-y-3">
                <h4 className="font-medium">Webhook URLs</h4>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Voice (incoming calls):</p>
                    <code className="block p-2 bg-background rounded border text-xs break-all">
                      {`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/twilio-voice?action=incoming`}
                    </code>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">SMS (incoming):</p>
                    <code className="block p-2 bg-background rounded border text-xs break-all">
                      {`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/twilio-sms?action=incoming`}
                    </code>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">WhatsApp (incoming):</p>
                    <code className="block p-2 bg-background rounded border text-xs break-all">
                      {`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/twilio-whatsapp?action=incoming`}
                    </code>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Google Maps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Map className="h-5 w-5" />
                Google Maps Configuration
                {getIntegrationStatus(["google_maps_api_key"]) ? (
                  <Badge className="bg-alert-resolved text-alert-resolved-foreground ml-2">
                    <Check className="mr-1 h-3 w-3" />
                    Configured
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-muted text-muted-foreground ml-2">
                    Optional
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Optional: Enhanced map features. Basic maps work without an API key.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Google Maps API Key</Label>
                <Input 
                  value={googleMapsKey}
                  onChange={(e) => setGoogleMapsKey(e.target.value)}
                  placeholder="AIza..."
                />
                <p className="text-xs text-muted-foreground">
                  Get your key from the{" "}
                  <a 
                    href="https://console.cloud.google.com/google/maps-apis" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Google Cloud Console
                  </a>
                </p>
              </div>
              
              <Button onClick={handleSaveGoogleMaps} disabled={saveMutation.isPending || !googleMapsKey}>
                {saveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Google Maps Key
              </Button>
            </CardContent>
          </Card>

          {/* Facebook / Meta */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Facebook className="h-5 w-5" />
                Facebook Page Configuration
                {getIntegrationStatus(["settings_facebook_page_id", "settings_facebook_page_access_token"]) ? (
                  <Badge className="bg-alert-resolved text-alert-resolved-foreground ml-2">
                    <Check className="mr-1 h-3 w-3" />
                    Configured
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 ml-2">
                    <AlertCircle className="mr-1 h-3 w-3" />
                    Not Configured
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Connect your Facebook Page to publish social media posts. Get credentials from the{" "}
                <a 
                  href="https://developers.facebook.com/tools/explorer/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Meta Graph API Explorer
                </a>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Page ID</Label>
                  <Input 
                    value={facebookSettings.page_id}
                    onChange={(e) => setFacebookSettings(prev => ({ ...prev, page_id: e.target.value }))}
                    placeholder="123456789012345"
                  />
                  <p className="text-xs text-muted-foreground">
                    Your Facebook Page ID (numeric). Find it in Page Settings → About → Page ID
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>Page Access Token</Label>
                  <div className="relative">
                    <Input 
                      type={showFacebookToken ? "text" : "password"}
                      value={facebookSettings.page_access_token}
                      onChange={(e) => setFacebookSettings(prev => ({ ...prev, page_access_token: e.target.value }))}
                      placeholder="EAA..."
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowFacebookToken(!showFacebookToken)}
                    >
                      {showFacebookToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    A long-lived Page Access Token with pages_manage_posts permission
                  </p>
                </div>
              </div>
              
              <Button onClick={handleSaveFacebook} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Facebook Configuration
              </Button>

              <div className="rounded-lg bg-muted p-4 space-y-2">
                <h4 className="font-medium text-sm">Required Permissions</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• <code>pages_manage_posts</code> - Publish and manage posts</li>
                  <li>• <code>pages_read_engagement</code> - Read post metrics</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Email Service */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Service
                <Badge className="bg-alert-resolved text-alert-resolved-foreground ml-2">
                  <Check className="mr-1 h-3 w-3" />
                  Configured
                </Badge>
              </CardTitle>
              <CardDescription>
                Transactional emails are handled automatically via Supabase
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Email functionality is provided through the integrated backend. No additional configuration required.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Images Tab */}
        <ImagesSettingsTab />
      </Tabs>
    </div>
  );
}
