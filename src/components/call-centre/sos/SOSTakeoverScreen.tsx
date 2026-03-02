import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSOSTakeover } from "@/hooks/useSOSTakeover";
import { useSOSConference } from "@/hooks/useSOSConference";
import { useTwilioDevice } from "@/hooks/useTwilioDevice";
import { SOSVitalsStrip } from "./SOSVitalsStrip";
import { SOSMedicalPanel } from "./SOSMedicalPanel";
import { SOSSituationPanel } from "./SOSSituationPanel";
import { SOSActionPanel } from "./SOSActionPanel";
import { SOSCallControls } from "./SOSCallControls";
import { SOSParticipantStrip } from "./SOSParticipantStrip";
import { supabase } from "@/integrations/supabase/client";

interface SOSSecondaryAlertStripProps {
  pendingAlerts: Array<{ id: string; alert_type: string; received_at: string }>;
}

function SOSSecondaryAlertStrip({ pendingAlerts }: SOSSecondaryAlertStripProps) {
  const { t } = useTranslation();
  if (pendingAlerts.length === 0) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-1.5 bg-orange-900/60 border-b border-orange-700">
      <AlertTriangle className="h-3.5 w-3.5 text-orange-400" />
      <span className="text-xs text-orange-300 font-medium">
        {t("sos.secondary.otherAlerts", "{{count}} other pending alert(s)", {
          count: pendingAlerts.length,
        })}
      </span>
      {pendingAlerts.map((a) => (
        <Badge key={a.id} variant="outline" className="text-xs border-orange-600 text-orange-300">
          {a.alert_type.replace("_", " ")}
        </Badge>
      ))}
    </div>
  );
}

export function SOSTakeoverScreen() {
  const { t } = useTranslation();
  const { activeAlert, pendingAlerts, resolveAlert } = useSOSTakeover();
  const {
    conference,
    participants,
    isabellaLogs,
    escalations,
    joinConference,
    leaveConference,
    muteParticipant,
    unmuteParticipant,
    addParticipantByPhone,
  } = useSOSConference(activeAlert?.id || null);

  const { connect, disconnect, toggleMute, isMuted, activeCall } = useTwilioDevice();

  const [isInConference, setIsInConference] = useState(false);
  const [isIsabellaHolding, setIsIsabellaHolding] = useState(false);
  const [memberSpecialInstructions, setMemberSpecialInstructions] = useState<string | null>(null);
  const [doctorPhone, setDoctorPhone] = useState<string | null>(null);
  const [acceptedByName, setAcceptedByName] = useState<string | null>(null);
  const [privateCall, setPrivateCall] = useState<{
    contactName: string;
    phone: string;
    ecId?: string;
    startTime: number;
  } | null>(null);

  // Fetch member special instructions and doctor phone
  useEffect(() => {
    if (!activeAlert?.member_id) return;

    const fetchExtra = async () => {
      const [memberRes, medRes] = await Promise.all([
        supabase
          .from("members")
          .select("special_instructions")
          .eq("id", activeAlert.member_id)
          .maybeSingle(),
        supabase
          .from("medical_information")
          .select("doctor_phone")
          .eq("member_id", activeAlert.member_id)
          .maybeSingle(),
      ]);
      setMemberSpecialInstructions(memberRes.data?.special_instructions || null);
      setDoctorPhone(medRes.data?.doctor_phone || null);
    };
    fetchExtra();
  }, [activeAlert?.member_id]);

  // Fetch accepting staff name
  useEffect(() => {
    if (!activeAlert?.accepted_by_staff_id) return;

    const fetchStaff = async () => {
      const { data } = await supabase
        .from("staff")
        .select("first_name, last_name")
        .eq("id", activeAlert.accepted_by_staff_id)
        .maybeSingle();
      if (data) setAcceptedByName(`${data.first_name} ${data.last_name}`);
    };
    fetchStaff();
  }, [activeAlert?.accepted_by_staff_id]);

  // Track if current staff is in conference
  useEffect(() => {
    const staffParticipant = participants.find(
      (p) => p.participant_type === "staff" && !p.left_at
    );
    setIsInConference(!!staffParticipant);
  }, [participants]);

  // Track Isabella holding state
  useEffect(() => {
    const ai = participants.find(
      (p) => p.participant_type === "ai" && !p.left_at
    );
    const staff = participants.find(
      (p) => p.participant_type === "staff" && !p.left_at
    );
    setIsIsabellaHolding(!!(ai && !ai.is_muted && staff?.is_muted));
  }, [participants]);

  const handleJoinConference = useCallback(async () => {
    await joinConference();
  }, [joinConference]);

  const handleIsabellaHold = useCallback(async () => {
    // Mute staff, unmute Isabella
    const staffP = participants.find((p) => p.participant_type === "staff" && !p.left_at);
    const aiP = participants.find((p) => p.participant_type === "ai" && !p.left_at);
    if (staffP) await muteParticipant(staffP.id);
    if (aiP) await unmuteParticipant(aiP.id);
  }, [participants, muteParticipant, unmuteParticipant]);

  const handlePatchBackIn = useCallback(async () => {
    // Unmute staff, mute Isabella
    const staffP = participants.find((p) => p.participant_type === "staff" && !p.left_at);
    const aiP = participants.find((p) => p.participant_type === "ai" && !p.left_at);
    if (staffP) await unmuteParticipant(staffP.id);
    if (aiP) await muteParticipant(aiP.id);
  }, [participants, muteParticipant, unmuteParticipant]);

  const handleAddParticipant = useCallback(
    (name: string, phone: string) => {
      addParticipantByPhone(name, phone, "external_service");
    },
    [addParticipantByPhone]
  );

  const handleAddToCall = useCallback(
    (name: string, phone: string, type: string, ecId?: string) => {
      addParticipantByPhone(name, phone, type, ecId);
    },
    [addParticipantByPhone]
  );

  const handleCallPrivately = useCallback(
    async (phone: string, contactName: string, ecId?: string) => {
      const call = await connect({ To: phone });
      if (call) {
        setPrivateCall({ contactName, phone, ecId, startTime: Date.now() });
        call.on("disconnect", () => setPrivateCall(null));
      }
    },
    [connect]
  );

  const handleBridgeToConference = useCallback(() => {
    if (!privateCall) return;
    // End the private call
    disconnect();
    // Add the contact to the conference
    addParticipantByPhone(
      privateCall.contactName,
      privateCall.phone,
      "emergency_contact",
      privateCall.ecId
    );
    setPrivateCall(null);
  }, [privateCall, disconnect, addParticipantByPhone]);

  const handleEndPrivateCall = useCallback(() => {
    disconnect();
    setPrivateCall(null);
  }, [disconnect]);

  const handleResolveAlert = useCallback(
    async (notes: string, isFalseAlarm: boolean, resolutionType?: string) => {
      if (!activeAlert) return;
      await resolveAlert(activeAlert.id, notes, isFalseAlarm, resolutionType);
    },
    [activeAlert, resolveAlert]
  );

  const handleLeaveParticipant = useCallback(
    async (participantId: string) => {
      await leaveConference();
    },
    [leaveConference]
  );

  if (!activeAlert) return null;

  return (
    <div className="fixed inset-0 z-50 bg-zinc-900 flex flex-col overflow-hidden">
      {/* Secondary alerts strip */}
      <SOSSecondaryAlertStrip pendingAlerts={pendingAlerts} />

      {/* Vitals strip */}
      <SOSVitalsStrip
        alertId={activeAlert.id}
        alertType={activeAlert.alert_type}
        memberId={activeAlert.member_id}
        receivedAt={activeAlert.received_at}
        isUnresponsive={!!(activeAlert as any).is_unresponsive}
      />

      {/* Main three-column layout */}
      <div className="flex-1 min-h-0 flex">
        {/* Left: Medical (30%) */}
        <div className="w-[30%] border-r border-zinc-700 p-3 overflow-hidden">
          <SOSMedicalPanel
            memberId={activeAlert.member_id}
            specialInstructions={memberSpecialInstructions}
          />
        </div>

        {/* Centre: Situation (40%) */}
        <div className="w-[40%] border-r border-zinc-700 p-3 overflow-hidden">
          <SOSSituationPanel
            alertId={activeAlert.id}
            memberId={activeAlert.member_id}
            receivedAt={activeAlert.received_at}
            alertStatus={activeAlert.status}
            acceptedAt={activeAlert.accepted_at}
            acceptedByName={acceptedByName}
            locationLat={activeAlert.location_lat}
            locationLng={activeAlert.location_lng}
            locationAddress={activeAlert.location_address}
            isabellaLogs={isabellaLogs}
            participants={participants}
            escalations={escalations}
          />
        </div>

        {/* Right: Actions (30%) */}
        <div className="w-[30%] overflow-hidden">
          <SOSActionPanel
            alertId={activeAlert.id}
            memberId={activeAlert.member_id}
            conferenceId={conference?.id || null}
            isInConference={isInConference}
            onJoinConference={handleJoinConference}
            onAddToCall={handleAddToCall}
            onCallPrivately={handleCallPrivately}
            privateCall={privateCall}
            onBridgeToConference={handleBridgeToConference}
            onEndPrivateCall={handleEndPrivateCall}
            doctorPhone={doctorPhone}
          />
        </div>
      </div>

      {/* Participant strip */}
      {isInConference && (
        <SOSParticipantStrip
          participants={participants}
          onMute={muteParticipant}
          onUnmute={unmuteParticipant}
          onRemove={handleLeaveParticipant}
        />
      )}

      {/* Call controls — only when in conference */}
      {isInConference && (
        <SOSCallControls
          isMuted={isMuted}
          onToggleMute={toggleMute}
          isIsabellaHolding={isIsabellaHolding}
          onIsabellaHold={handleIsabellaHold}
          onPatchBackIn={handlePatchBackIn}
          onAddParticipant={handleAddParticipant}
          onResolveAlert={handleResolveAlert}
        />
      )}
    </div>
  );
}
