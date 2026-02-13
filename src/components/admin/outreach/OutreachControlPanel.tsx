import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Zap, Search, Star, FileText, Send, RefreshCw, Play,
  ToggleLeft, MapPin, Shield, User, AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useOutreachPipeline } from "@/hooks/useOutreachPipeline";
import { toast } from "@/hooks/use-toast";

interface SettingRow {
  setting_key: string;
  setting_value: any;
}

export function OutreachControlPanel() {
  const { runPipeline, isRunningPipeline, enrichLeads, isEnriching, generateDrafts, isDrafting, sendEmails, isSending } = useOutreachPipeline();

  const { data: settings, isLoading, refetch } = useQuery({
    queryKey: ["outreach-all-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("outreach_settings").select("setting_key, setting_value");
      if (error) throw error;
      const map: Record<string, any> = {};
      (data || []).forEach((r: SettingRow) => { map[r.setting_key] = r.setting_value; });
      return map;
    },
  });

  const updateSetting = async (key: string, value: any) => {
    const { error } = await supabase.from("outreach_settings")
      .update({ setting_value: JSON.parse(JSON.stringify(value)), updated_at: new Date().toISOString() })
      .eq("setting_key", key);
    if (error) {
      // Key might not exist yet, try insert
      await supabase.from("outreach_settings").insert({ setting_key: key, setting_value: JSON.parse(JSON.stringify(value)) });
    }
    refetch();
  };

  const handleToggle = async (key: string, value: boolean) => {
    await updateSetting(key, value);
  };

  const handleRunStep = async (step: string) => {
    try {
      switch (step) {
        case "enrich": await enrichLeads(); break;
        case "rate":
          await supabase.functions.invoke("rate-outreach-leads", { body: { rate_all_new: true } });
          toast({ title: "Rating complete" });
          break;
        case "draft": await generateDrafts(); break;
        case "send": await sendEmails(); break;
        case "pipeline":
          await runPipeline({ enrich: true, rate: true, draft: true, send: true, followup: true });
          break;
      }
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Failed", variant: "destructive" });
    }
  };

  if (isLoading || !settings) {
    return <div className="flex items-center justify-center p-8"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  }

  const automationToggles = [
    { key: "auto_enrichment_enabled", icon: Search, label: "Auto-Enrichment", desc: "Automatically enrich new leads with website data" },
    { key: "auto_rating_enabled", icon: Star, label: "Auto-Rating", desc: "Automatically score enriched leads with AI" },
    { key: "auto_drafting_enabled", icon: FileText, label: "Auto-Drafting", desc: "Automatically generate email drafts for qualified leads" },
    { key: "auto_sending_enabled", icon: Send, label: "Auto-Sending", desc: "Automatically send approved drafts" },
    { key: "auto_followup_enabled", icon: RefreshCw, label: "Auto-Follow-up", desc: "Automatically send follow-up emails" },
  ];

  return (
    <div className="space-y-6">
      {/* Pipeline Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">Pipeline Actions</CardTitle>
              <CardDescription>Run pipeline steps manually</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm" onClick={() => handleRunStep("enrich")} disabled={isEnriching}>
              <Search className="mr-2 h-4 w-4" />{isEnriching ? "Enriching..." : "Enrich Leads Now"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleRunStep("rate")}>
              <Star className="mr-2 h-4 w-4" />Rate Leads Now
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleRunStep("draft")} disabled={isDrafting}>
              <FileText className="mr-2 h-4 w-4" />{isDrafting ? "Drafting..." : "Generate Drafts Now"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleRunStep("send")} disabled={isSending}>
              <Send className="mr-2 h-4 w-4" />{isSending ? "Sending..." : "Send Approved Drafts"}
            </Button>
            <Separator orientation="vertical" className="h-8" />
            <Button onClick={() => handleRunStep("pipeline")} disabled={isRunningPipeline}>
              <Play className="mr-2 h-4 w-4" />{isRunningPipeline ? "Running Pipeline..." : "Run Full Pipeline Now"}
            </Button>
          </div>
          {settings.dry_run_mode === true && (
            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span>Dry run mode is ON — emails will be simulated, not actually sent</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Automation Toggles */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ToggleLeft className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">Automation Toggles</CardTitle>
              <CardDescription>Enable or disable automatic pipeline steps</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {automationToggles.map(({ key, icon: Icon, label, desc }) => (
            <div key={key} className="flex items-center justify-between gap-4 py-2 border-b last:border-b-0">
              <div className="flex items-center gap-3">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="text-sm font-medium">{label}</Label>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </div>
              <Switch checked={settings[key] === true} onCheckedChange={(v) => handleToggle(key, v)} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Send Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">Send & Safety Settings</CardTitle>
              <CardDescription>Control send limits, warmup, and test mode</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Daily Send Limit</Label>
              <Input type="number" value={settings.daily_send_limit || 20} onChange={(e) => updateSetting("daily_send_limit", parseInt(e.target.value) || 20)} />
            </div>
            <div className="space-y-2">
              <Label>Min Score to Send (0-100)</Label>
              <Input type="number" value={settings.min_score_to_send || 60} onChange={(e) => updateSetting("min_score_to_send", parseInt(e.target.value) || 60)} />
            </div>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <Label>Warmup Mode</Label>
              <p className="text-xs text-muted-foreground">Limit to 5 sends/day while building sender reputation</p>
            </div>
            <Switch checked={settings.warmup_mode === true} onCheckedChange={(v) => updateSetting("warmup_mode", v)} />
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <Label>Dry Run Mode</Label>
              <p className="text-xs text-muted-foreground">Simulate sends without actually sending emails</p>
            </div>
            <Switch checked={settings.dry_run_mode === true} onCheckedChange={(v) => updateSetting("dry_run_mode", v)} />
          </div>
          <div className="space-y-2">
            <Label>Follow-up Schedule (days)</Label>
            <Input
              value={Array.isArray(settings.followup_schedule) ? settings.followup_schedule.join(", ") : "2, 5, 10"}
              onChange={(e) => {
                const days = e.target.value.split(",").map((s: string) => parseInt(s.trim())).filter((n: number) => !isNaN(n));
                updateSetting("followup_schedule", days);
              }}
              placeholder="2, 5, 10"
            />
            <p className="text-xs text-muted-foreground">Comma-separated days between follow-ups</p>
          </div>
        </CardContent>
      </Card>

      {/* Target Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">Targeting</CardTitle>
              <CardDescription>Configure lead discovery parameters</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Target Industries</Label>
            <Input
              value={Array.isArray(settings.target_industries) ? settings.target_industries.join(", ") : ""}
              onChange={(e) => updateSetting("target_industries", e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean))}
              placeholder="Healthcare, Insurance, Residential, Pharmacies"
            />
          </div>
          <div className="space-y-2">
            <Label>Target Locations</Label>
            <Input
              value={Array.isArray(settings.target_locations) ? settings.target_locations.join(", ") : "Spain"}
              onChange={(e) => updateSetting("target_locations", e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean))}
              placeholder="Spain, Málaga, Andalusia"
            />
          </div>
          <div className="space-y-2">
            <Label>Keywords</Label>
            <Input
              value={Array.isArray(settings.target_keywords) ? settings.target_keywords.join(", ") : ""}
              onChange={(e) => updateSetting("target_keywords", e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean))}
              placeholder="elderly care, senior living, home care"
            />
          </div>
        </CardContent>
      </Card>

      {/* Sender Identity */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">Sender Identity</CardTitle>
              <CardDescription>Configure outreach email sender details</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Sender Name</Label>
              <Input
                value={typeof settings.sender_name === "string" ? settings.sender_name : "ICE Alarm España"}
                onChange={(e) => updateSetting("sender_name", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Sender Email</Label>
              <Input
                type="email"
                value={typeof settings.sender_email === "string" ? settings.sender_email : ""}
                onChange={(e) => updateSetting("sender_email", e.target.value)}
                placeholder="outreach@icealarm.es"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Email Signature (HTML)</Label>
            <Textarea
              value={typeof settings.sender_signature === "string" ? settings.sender_signature : ""}
              onChange={(e) => updateSetting("sender_signature", e.target.value)}
              rows={3}
              placeholder="<p>Best regards,<br/>ICE Alarm España Team</p>"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
