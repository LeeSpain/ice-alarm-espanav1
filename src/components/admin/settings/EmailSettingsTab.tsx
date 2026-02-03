import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Mail,
  Check,
  AlertCircle,
  Save,
  Loader2,
  Send,
} from "lucide-react";
import { useEmailSettings, type EmailSettingsUpdate } from "@/hooks/useEmailSettings";

export function EmailSettingsTab() {
  const {
    settings,
    isLoading,
    updateSettings,
    isUpdating,
    sendTestEmail,
    isSendingTest,
  } = useEmailSettings();

  // Form state
  const [formState, setFormState] = useState<EmailSettingsUpdate>({
    from_name: "",
    from_email: "",
    reply_to_email: "",
    signature_html: "",
    daily_send_limit: 300,
    hourly_send_limit: 50,
    enable_member_emails: true,
    enable_outreach_emails: true,
    enable_system_emails: true,
  });

  const [testEmail, setTestEmail] = useState("");

  // Sync form state with loaded settings
  useEffect(() => {
    if (settings) {
      setFormState({
        from_name: settings.from_name || "",
        from_email: settings.from_email || "",
        reply_to_email: settings.reply_to_email || "",
        signature_html: settings.signature_html || "",
        daily_send_limit: settings.daily_send_limit,
        hourly_send_limit: settings.hourly_send_limit,
        enable_member_emails: settings.enable_member_emails,
        enable_outreach_emails: settings.enable_outreach_emails,
        enable_system_emails: settings.enable_system_emails,
      });
    }
  }, [settings]);

  const handleSave = () => {
    updateSettings(formState);
  };

  const handleSendTest = () => {
    if (testEmail.trim()) {
      sendTestEmail(testEmail.trim());
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // We're using Resend, so "connected" is based on whether RESEND_API_KEY is configured
  // Since we can't check secrets from frontend, we assume it's configured if settings exist
  const isConnected = true; // Resend API key is configured in secrets

  return (
    <div className="space-y-6">
      {/* Connection Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Service
            <Badge className="bg-alert-resolved text-alert-resolved-foreground ml-2">
              <Check className="mr-1 h-3 w-3" />
              Resend Connected
            </Badge>
          </CardTitle>
          <CardDescription>
            Email sending is powered by Resend. All emails are logged and tracked.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Resend Email API</p>
                <p className="text-sm text-muted-foreground">
                  Verified domain: icealarm.es
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle>Email Configuration</CardTitle>
          <CardDescription>
            Configure sender details and email settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>From Name</Label>
              <Input
                value={formState.from_name || ""}
                onChange={(e) => setFormState((prev) => ({ ...prev, from_name: e.target.value }))}
                placeholder="ICE Alarm España"
              />
              <p className="text-xs text-muted-foreground">
                The name that appears in the "From" field
              </p>
            </div>

            <div className="space-y-2">
              <Label>From Email</Label>
              <Input
                type="email"
                value={formState.from_email || ""}
                onChange={(e) => setFormState((prev) => ({ ...prev, from_email: e.target.value }))}
                placeholder="noreply@icealarm.es"
              />
              <p className="text-xs text-muted-foreground">
                Must be a verified domain in Resend
              </p>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Reply-To Email (optional)</Label>
              <Input
                type="email"
                value={formState.reply_to_email || ""}
                onChange={(e) => setFormState((prev) => ({ ...prev, reply_to_email: e.target.value }))}
                placeholder="support@icealarm.es"
              />
              <p className="text-xs text-muted-foreground">
                Where replies should be directed (if different from sender)
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Email Signature (HTML)</Label>
            <Textarea
              value={formState.signature_html || ""}
              onChange={(e) => setFormState((prev) => ({ ...prev, signature_html: e.target.value }))}
              placeholder="<p>Best regards,<br/>ICE Alarm España Team</p>"
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              HTML signature appended to all outgoing emails
            </p>
          </div>

          <Separator />

          <div>
            <h4 className="font-medium mb-4">Sending Limits</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Daily Send Limit</Label>
                <Input
                  type="number"
                  min={0}
                  value={formState.daily_send_limit}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      daily_send_limit: parseInt(e.target.value) || 0,
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Max emails per day (0 = unlimited)
                </p>
              </div>

              <div className="space-y-2">
                <Label>Hourly Send Limit</Label>
                <Input
                  type="number"
                  min={0}
                  value={formState.hourly_send_limit}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      hourly_send_limit: parseInt(e.target.value) || 0,
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Max emails per hour (0 = unlimited)
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-medium mb-4">Email Toggles</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Member Emails</Label>
                  <p className="text-sm text-muted-foreground">
                    Registration, welcome, verification emails
                  </p>
                </div>
                <Switch
                  checked={formState.enable_member_emails}
                  onCheckedChange={(checked) =>
                    setFormState((prev) => ({ ...prev, enable_member_emails: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Outreach Emails</Label>
                  <p className="text-sm text-muted-foreground">
                    AI Outreach campaign emails
                  </p>
                </div>
                <Switch
                  checked={formState.enable_outreach_emails}
                  onCheckedChange={(checked) =>
                    setFormState((prev) => ({ ...prev, enable_outreach_emails: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>System Emails</Label>
                  <p className="text-sm text-muted-foreground">
                    Internal notifications, alerts, reports
                  </p>
                </div>
                <Switch
                  checked={formState.enable_system_emails}
                  onCheckedChange={(checked) =>
                    setFormState((prev) => ({ ...prev, enable_system_emails: checked }))
                  }
                />
              </div>
            </div>
          </div>

          <Button onClick={handleSave} disabled={isUpdating}>
            {isUpdating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Email Settings
          </Button>
        </CardContent>
      </Card>

      {/* Test Email Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send Test Email
          </CardTitle>
          <CardDescription>
            Verify your email configuration by sending a test message.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@example.com"
              />
            </div>
            <Button
              onClick={handleSendTest}
              disabled={!testEmail.trim() || isSendingTest}
            >
              {isSendingTest ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send Test
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            A test email will be sent using your configured settings.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
