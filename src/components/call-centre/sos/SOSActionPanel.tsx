import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Phone,
  PhoneCall,
  UserPlus,
  Clock,
  History,
  FileText,
  Stethoscope,
  Building2,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface EmergencyContact {
  id: string;
  contact_name: string;
  relationship: string;
  phone: string;
  speaks_spanish: boolean;
  priority_order: number;
}

interface PreviousAlert {
  id: string;
  alert_type: string;
  received_at: string;
  resolved_at: string | null;
  resolution_notes: string | null;
}

interface PrivateCallState {
  contactName: string;
  phone: string;
  ecId?: string;
  startTime: number;
}

interface SOSActionPanelProps {
  alertId: string;
  memberId: string;
  conferenceId: string | null;
  isInConference: boolean;
  onJoinConference: () => void;
  onAddToCall: (name: string, phone: string, type: string, ecId?: string) => void;
  onCallPrivately: (phone: string, contactName: string, ecId?: string) => void;
  privateCall: PrivateCallState | null;
  onBridgeToConference: () => void;
  onEndPrivateCall: () => void;
  doctorPhone?: string | null;
}

function PrivateCallElapsed({ startTime }: { startTime: number }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [startTime]);
  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");
  return <span>{mm}:{ss}</span>;
}

export function SOSActionPanel({
  alertId,
  memberId,
  conferenceId,
  isInConference,
  onJoinConference,
  onAddToCall,
  onCallPrivately,
  privateCall,
  onBridgeToConference,
  onEndPrivateCall,
  doctorPhone,
}: SOSActionPanelProps) {
  const { t } = useTranslation();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [previousAlerts, setPreviousAlerts] = useState<PreviousAlert[]>([]);
  const [notes, setNotes] = useState("");
  const notesTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch emergency contacts
  useEffect(() => {
    const fetchContacts = async () => {
      const { data } = await supabase
        .from("emergency_contacts")
        .select("id, contact_name, relationship, phone, speaks_spanish, priority_order")
        .eq("member_id", memberId)
        .order("priority_order");
      if (data) setContacts(data);
    };
    fetchContacts();
  }, [memberId]);

  // Fetch previous alerts
  useEffect(() => {
    const fetchPrev = async () => {
      const { data } = await supabase
        .from("alerts")
        .select("id, alert_type, received_at, resolved_at, resolution_notes")
        .eq("member_id", memberId)
        .eq("status", "resolved")
        .neq("id", alertId)
        .order("received_at", { ascending: false })
        .limit(3);
      if (data) setPreviousAlerts(data);
    };
    fetchPrev();
  }, [memberId, alertId]);

  // Fetch existing notes
  useEffect(() => {
    const fetchNotes = async () => {
      const { data } = await supabase
        .from("alerts")
        .select("resolution_notes")
        .eq("id", alertId)
        .maybeSingle();
      if (data?.resolution_notes) setNotes(data.resolution_notes);
    };
    fetchNotes();
  }, [alertId]);

  // Auto-save notes every 30 seconds
  const saveNotes = useCallback(async () => {
    if (!notes.trim()) return;
    await supabase
      .from("alerts")
      .update({ resolution_notes: notes })
      .eq("id", alertId);
  }, [alertId, notes]);

  useEffect(() => {
    if (notesTimerRef.current) clearTimeout(notesTimerRef.current);
    notesTimerRef.current = setTimeout(saveNotes, 30000);
    return () => {
      if (notesTimerRef.current) clearTimeout(notesTimerRef.current);
    };
  }, [notes, saveNotes]);

  const handleNotesBlur = () => saveNotes();

  return (
    <ScrollArea className="h-full">
      <div className="space-y-3 p-1 pr-3">
        {/* Join Call Button */}
        {!isInConference ? (
          <Button
            size="lg"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold text-lg py-6"
            onClick={onJoinConference}
            disabled={!conferenceId}
          >
            <PhoneCall className="h-5 w-5 mr-2" />
            {t("sos.action.joinCall", "JOIN CALL")}
          </Button>
        ) : (
          <div className="flex items-center justify-center gap-2 bg-green-900/30 border border-green-700 rounded-lg px-4 py-3">
            <div className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-green-300 font-semibold">
              {t("sos.action.connected", "Connected to Conference")}
            </span>
          </div>
        )}

        {/* Private Call Active Indicator */}
        {privateCall && (
          <Card className="bg-yellow-900/30 border-yellow-700">
            <CardContent className="px-3 py-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-500 animate-pulse" />
                  <span className="text-sm font-semibold text-yellow-300">
                    {t("sos.action.privateCallActive", "Private Call Active")}
                  </span>
                </div>
                <span className="text-xs text-yellow-400 font-mono">
                  <PrivateCallElapsed startTime={privateCall.startTime} />
                </span>
              </div>
              <p className="text-xs text-yellow-200">
                {privateCall.contactName} — {privateCall.phone}
              </p>
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  className="flex-1 text-xs bg-blue-700 hover:bg-blue-800"
                  disabled={!conferenceId}
                  onClick={onBridgeToConference}
                >
                  <UserPlus className="h-3 w-3 mr-1" />
                  {t("sos.action.bridgeToConference", "Bridge to Conference")}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="text-xs"
                  onClick={onEndPrivateCall}
                >
                  <Phone className="h-3 w-3 mr-1" />
                  {t("sos.action.endCall", "End Call")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Emergency Contacts */}
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader className="py-2 px-3">
            <CardTitle className="text-sm text-zinc-300 flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" />
              {t("sos.action.emergencyContacts", "Emergency Contacts")}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 space-y-2">
            {contacts.length === 0 ? (
              <p className="text-xs text-zinc-500">{t("sos.action.noContacts", "No emergency contacts on file")}</p>
            ) : (
              contacts.map((contact) => (
                <div key={contact.id} className="bg-zinc-900 rounded-lg p-2 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-zinc-200">
                        {contact.contact_name}
                        <span className="text-zinc-500 text-xs ml-1">({contact.relationship})</span>
                      </p>
                      <p className="text-xs text-zinc-500">{contact.phone}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {contact.speaks_spanish && <span className="text-xs">🇪🇸</span>}
                      <Badge variant="outline" className="text-xs border-zinc-600 text-zinc-400">
                        #{contact.priority_order}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                      disabled={!!privateCall}
                      onClick={() => onCallPrivately(contact.phone, contact.contact_name, contact.id)}
                    >
                      <Phone className="h-3 w-3 mr-1" />
                      {t("sos.action.callPrivately", "Call Privately")}
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 text-xs bg-blue-700 hover:bg-blue-800"
                      disabled={!conferenceId}
                      onClick={() =>
                        onAddToCall(
                          contact.contact_name,
                          contact.phone,
                          "emergency_contact",
                          contact.id
                        )
                      }
                    >
                      <UserPlus className="h-3 w-3 mr-1" />
                      {t("sos.action.addToCall", "Add to Call")}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader className="py-2 px-3">
            <CardTitle className="text-sm text-zinc-300 flex items-center gap-1.5">
              <PhoneCall className="h-3.5 w-3.5" />
              {t("sos.action.quickActions", "Quick Actions")}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="grid grid-cols-3 gap-1.5">
              <Button
                size="sm"
                variant="destructive"
                className="text-xs"
                onClick={() => window.open("tel:112", "_self")}
              >
                <Phone className="h-3 w-3 mr-1" />
                112
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-xs border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                disabled={!doctorPhone}
                onClick={() => doctorPhone && window.open(`tel:${doctorPhone}`, "_self")}
              >
                <Stethoscope className="h-3 w-3 mr-1" />
                {t("sos.action.doctor", "Doctor")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-xs border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                disabled
              >
                <Building2 className="h-3 w-3 mr-1" />
                {t("sos.action.hospital", "Hospital")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Previous Alerts */}
        {previousAlerts.length > 0 && (
          <Card className="bg-zinc-800 border-zinc-700">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-sm text-zinc-300 flex items-center gap-1.5">
                <History className="h-3.5 w-3.5" />
                {t("sos.action.previousAlerts", "Previous Alerts")}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 space-y-1.5">
              {previousAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between bg-zinc-900 rounded px-2 py-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs border-zinc-600 text-zinc-400">
                      {alert.alert_type.replace("_", " ")}
                    </Badge>
                    <span className="text-zinc-500">
                      {new Date(alert.received_at).toLocaleDateString()}
                    </span>
                  </div>
                  {alert.resolved_at && (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader className="py-2 px-3">
            <CardTitle className="text-sm text-zinc-300 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              {t("sos.action.notes", "Notes")}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleNotesBlur}
              placeholder={t("sos.action.notesPlaceholder", "Staff notes during call...")}
              className="bg-zinc-900 border-zinc-700 text-zinc-300 placeholder:text-zinc-600 min-h-[80px] text-sm"
            />
            <p className="text-[10px] text-zinc-600 mt-1">
              {t("sos.action.autoSave", "Auto-saves every 30 seconds")}
            </p>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
