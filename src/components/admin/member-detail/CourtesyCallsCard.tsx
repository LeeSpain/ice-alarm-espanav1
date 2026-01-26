import { useState, useEffect } from "react";
import { Phone, Calendar, Clock, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

interface CourtesyCallsCardProps {
  memberId: string;
}

interface CompletedCall {
  id: string;
  title: string;
  completed_at: string;
}

export function CourtesyCallsCard({ memberId }: CourtesyCallsCardProps) {
  const [isEnabled, setIsEnabled] = useState(true);
  const [nextCallDate, setNextCallDate] = useState<string | null>(null);
  const [completedCalls, setCompletedCalls] = useState<CompletedCall[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [memberId]);

  const fetchData = async () => {
    try {
      // Fetch member's courtesy call settings
      const { data: member, error: memberError } = await supabase
        .from("members")
        .select("courtesy_calls_enabled, next_courtesy_call_date, created_at")
        .eq("id", memberId)
        .single();

      if (memberError) throw memberError;

      setIsEnabled(member?.courtesy_calls_enabled ?? true);
      setNextCallDate(member?.next_courtesy_call_date || null);

      // Calculate next call date if not set
      if (!member?.next_courtesy_call_date && member?.created_at) {
        const createdDate = new Date(member.created_at);
        const today = new Date();
        const nextDate = new Date(today.getFullYear(), today.getMonth() + 1, createdDate.getDate());
        if (nextDate <= today) {
          nextDate.setMonth(nextDate.getMonth() + 1);
        }
        setNextCallDate(nextDate.toISOString().split("T")[0]);
      }

      // Fetch completed courtesy call tasks
      const { data: calls, error: callsError } = await supabase
        .from("tasks")
        .select("id, title, completed_at")
        .eq("member_id", memberId)
        .eq("task_type", "courtesy_call")
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(5);

      if (callsError) throw callsError;
      setCompletedCalls(calls || []);
    } catch (error) {
      console.error("Error fetching courtesy call data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (enabled: boolean) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("members")
        .update({ courtesy_calls_enabled: enabled })
        .eq("id", memberId);

      if (error) throw error;

      setIsEnabled(enabled);
      toast.success(enabled ? "Courtesy calls enabled" : "Courtesy calls disabled");
    } catch (error) {
      console.error("Error updating courtesy call setting:", error);
      toast.error("Failed to update setting");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Courtesy Calls
        </CardTitle>
        <CardDescription>
          Monthly check-in calls scheduled on the member's join anniversary
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="courtesy-calls-toggle" className="text-base">
              Enable Monthly Courtesy Calls
            </Label>
            <p className="text-sm text-muted-foreground">
              Automatically generate call tasks each month
            </p>
          </div>
          <Switch
            id="courtesy-calls-toggle"
            checked={isEnabled}
            onCheckedChange={handleToggle}
            disabled={isSaving}
          />
        </div>

        <Separator />

        {/* Next Call Date */}
        {isEnabled && (
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Calendar className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Next Scheduled Call</p>
              <p className="text-lg font-semibold text-primary">
                {nextCallDate ? format(parseISO(nextCallDate), "MMMM d, yyyy") : "Not scheduled"}
              </p>
            </div>
          </div>
        )}

        {/* Call History */}
        {completedCalls.length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Recent Completed Calls
              </h4>
              <div className="space-y-2">
                {completedCalls.map((call) => (
                  <div
                    key={call.id}
                    className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded"
                  >
                    <span className="text-muted-foreground">{call.title}</span>
                    <Badge variant="outline" className="text-xs">
                      {call.completed_at
                        ? format(parseISO(call.completed_at), "MMM d, yyyy")
                        : "Unknown"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {completedCalls.length === 0 && isEnabled && (
          <p className="text-sm text-muted-foreground text-center py-2">
            No courtesy calls completed yet
          </p>
        )}
      </CardContent>
    </Card>
  );
}
