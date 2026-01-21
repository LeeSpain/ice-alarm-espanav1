import { useState } from "react";
import { 
  X, 
  MapPin, 
  Phone, 
  Clock, 
  User,
  Heart,
  Pill,
  AlertTriangle,
  Activity,
  Droplets,
  Building2,
  Stethoscope,
  Shield,
  Battery,
  Navigation,
  MessageSquare,
  PhoneCall,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  Globe,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";

type AlertType = "sos_button" | "fall_detected" | "low_battery" | "geo_fence" | "check_in" | "manual";

interface AlertDetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  alert: {
    id: string;
    type: AlertType;
    status: string;
    memberName: string;
    location?: string;
    locationLat?: number;
    locationLng?: number;
    receivedAt: Date;
    member?: {
      id: string;
      firstName: string;
      lastName: string;
      phone: string;
      email: string;
      photoUrl?: string;
      preferredLanguage: string;
      dateOfBirth: string;
      address: string;
      specialInstructions?: string;
    };
    medicalInfo?: {
      conditions: string[];
      medications: string[];
      allergies: string[];
      bloodType?: string;
      doctorName?: string;
      doctorPhone?: string;
      hospitalPreference?: string;
    };
    device?: {
      id: string;
      status: string;
      batteryLevel?: number;
      lastCheckin?: Date;
      imei: string;
    };
    emergencyContacts?: {
      id: string;
      name: string;
      relationship: string;
      phone: string;
      email?: string;
      speaksSpanish: boolean;
      priorityOrder: number;
    }[];
    subscription?: {
      planType: string;
      hasPendant: boolean;
    };
    previousAlerts?: {
      id: string;
      type: AlertType;
      receivedAt: Date;
      resolvedAt?: Date;
    }[];
  } | null;
  onResolve: (alertId: string, notes: string) => void;
  onEscalate: (alertId: string) => void;
}

const alertTypeConfig = {
  sos_button: { label: "SOS Alert", color: "bg-alert-sos", icon: AlertTriangle },
  fall_detected: { label: "Fall Detected", color: "bg-alert-fall", icon: Activity },
  low_battery: { label: "Low Battery", color: "bg-alert-battery", icon: Battery },
  geo_fence: { label: "Geo-Fence Alert", color: "bg-yellow-500", icon: Navigation },
  check_in: { label: "Check-in", color: "bg-alert-checkin", icon: CheckCircle },
  manual: { label: "Manual Alert", color: "bg-gray-500", icon: AlertTriangle },
};

const smsTemplates = [
  "We received your alert. Are you okay?",
  "Help is on the way",
  "Please call us back when you can",
];

export function AlertDetailPanel({ 
  isOpen, 
  onClose, 
  alert, 
  onResolve,
  onEscalate 
}: AlertDetailPanelProps) {
  const [notes, setNotes] = useState("");
  const [emergencyServicesCalled, setEmergencyServicesCalled] = useState(false);
  const [nextOfKinNotified, setNextOfKinNotified] = useState(false);
  const [showPreviousAlerts, setShowPreviousAlerts] = useState(false);
  const [selectedSmsTemplate, setSelectedSmsTemplate] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [isSendingSms, setIsSendingSms] = useState(false);
  const [sendingContactId, setSendingContactId] = useState<string | null>(null);

  if (!alert) return null;

  const config = alertTypeConfig[alert.type];
  const Icon = config.icon;

  const age = alert.member?.dateOfBirth 
    ? Math.floor((new Date().getTime() - new Date(alert.member.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  const timeSinceAlert = Math.floor((new Date().getTime() - alert.receivedAt.getTime()) / 1000);
  const minutes = Math.floor(timeSinceAlert / 60);
  const seconds = timeSinceAlert % 60;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const handleCallMember = () => {
    if (alert.member?.phone) {
      // In real implementation, this would trigger Twilio call
      toast({ title: "Initiating call...", description: `Calling ${alert.member.phone}` });
    }
  };

  const handleCall112 = () => {
    toast({ 
      title: "Calling 112", 
      description: "Connecting to emergency services",
      variant: "destructive"
    });
    setEmergencyServicesCalled(true);
  };

  const handleSendSms = async (message: string, toPhone?: string, recipientType: 'member' | 'emergency_contact' = 'member', contactId?: string) => {
    const phone = toPhone || alert.member?.phone;
    if (!phone) {
      toast({ title: "No phone number", description: "Cannot send SMS without a phone number", variant: "destructive" });
      return;
    }

    if (contactId) {
      setSendingContactId(contactId);
    } else {
      setIsSendingSms(true);
    }

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        toast({ title: "Not authenticated", variant: "destructive" });
        return;
      }

      const response = await supabase.functions.invoke("twilio-sms", {
        body: {
          to: phone,
          message,
          alertId: alert.id,
          recipientType,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to send SMS");
      }

      toast({ title: "SMS Sent", description: `Message sent to ${phone}` });
      
      // Log to member_interactions
      if (alert.member?.id) {
        const { data: staffData } = await supabase.auth.getUser();
        if (staffData.user) {
          const { data: staff } = await supabase
            .from("staff")
            .select("id")
            .eq("user_id", staffData.user.id)
            .single();
            
          if (staff) {
            await supabase.from("member_interactions").insert({
              member_id: alert.member.id,
              staff_id: staff.id,
              interaction_type: "sms_sent",
              description: message,
              metadata: { 
                twilio_sid: response.data?.sid,
                to: phone,
                alert_id: alert.id,
                recipient_type: recipientType
              }
            });
          }
        }
      }
    } catch (error) {
      console.error("SMS error:", error);
      toast({ 
        title: "Failed to send SMS", 
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive" 
      });
    } finally {
      setIsSendingSms(false);
      setSendingContactId(null);
    }
  };

  const handleSendWhatsApp = async (message: string, toPhone?: string, recipientType: 'member' | 'emergency_contact' = 'member') => {
    const phone = toPhone || alert.member?.phone;
    if (!phone) {
      toast({ title: "No phone number", description: "Cannot send WhatsApp without a phone number", variant: "destructive" });
      return;
    }

    setIsSendingSms(true);
    try {
      const response = await supabase.functions.invoke("twilio-whatsapp", {
        body: {
          to: phone,
          message,
          alertId: alert.id,
          recipientType,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to send WhatsApp");
      }

      toast({ title: "WhatsApp Sent", description: `Message sent to ${phone}` });
    } catch (error) {
      console.error("WhatsApp error:", error);
      toast({ 
        title: "Failed to send WhatsApp", 
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive" 
      });
    } finally {
      setIsSendingSms(false);
    }
  };

  const handleResolve = () => {
    if (!notes.trim()) {
      toast({ title: "Notes required", description: "Please add resolution notes", variant: "destructive" });
      return;
    }
    onResolve(alert.id, notes);
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl md:max-w-2xl overflow-hidden p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="p-4 border-b bg-card">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className={cn(config.color, "text-white")}>
                    <Icon className="w-3 h-3 mr-1" />
                    {config.label}
                  </Badge>
                  <Badge variant="outline" className="animate-pulse">
                    <Clock className="w-3 h-3 mr-1" />
                    {minutes}:{seconds.toString().padStart(2, '0')}
                  </Badge>
                </div>
                <SheetTitle className="text-2xl">
                  {alert.member?.firstName} {alert.member?.lastName || alert.memberName}
                </SheetTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  {alert.member?.preferredLanguage && (
                    <Badge variant="outline">
                      <Globe className="w-3 h-3 mr-1" />
                      {alert.member.preferredLanguage === 'es' ? 'Español' : 'English'}
                    </Badge>
                  )}
                  {alert.subscription?.planType && (
                    <Badge variant="outline">
                      {alert.subscription.planType === 'couple' ? '👫 Couple' : '👤 Single'}
                    </Badge>
                  )}
                  {alert.subscription?.hasPendant ? (
                    <Badge className="bg-status-active text-white">
                      <Shield className="w-3 h-3 mr-1" />
                      Has Pendant
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-alert-battery/10 text-alert-battery border-alert-battery/30">
                      <Phone className="w-3 h-3 mr-1" />
                      Phone Only
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </SheetHeader>

          {/* Scrollable Content */}
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {/* Phone-Only Warning */}
              {!alert.subscription?.hasPendant && (
                <div className="bg-alert-battery/10 border border-alert-battery/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-alert-battery shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-alert-battery">PHONE-ONLY MEMBER</h4>
                      <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                        <li>• No GPS tracking available</li>
                        <li>• No automatic location - ask member for their location</li>
                        <li>• No fall detection active</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Location Section */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {alert.location ? (
                    <>
                      <p className="text-sm">{alert.location}</p>
                      {alert.locationLat && alert.locationLng && (
                        <p className="text-xs text-muted-foreground">
                          GPS: {alert.locationLat.toFixed(6)}, {alert.locationLng.toFixed(6)}
                        </p>
                      )}
                      <div className="bg-muted h-40 rounded-lg flex items-center justify-center">
                        <span className="text-muted-foreground text-sm">
                          [Google Maps Integration]
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Open in Maps
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Navigation className="w-3 h-3 mr-1" />
                          Get Directions
                        </Button>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">No location data available</p>
                  )}
                </CardContent>
              </Card>

              {/* Member Info Section */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Member Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Phone</span>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{alert.member?.phone || "N/A"}</span>
                      {alert.member?.phone && (
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(alert.member!.phone)}>
                          <Copy className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  {age && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Age</span>
                      <span className="font-medium">{age} years</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Address</span>
                    <span className="font-medium text-right text-sm max-w-[60%]">{alert.member?.address || "N/A"}</span>
                  </div>
                  {alert.member?.specialInstructions && (
                    <div className="mt-2 p-3 bg-accent rounded-lg border-l-4 border-primary">
                      <p className="text-sm font-medium">Special Instructions</p>
                      <p className="text-sm text-muted-foreground">{alert.member.specialInstructions}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Medical Info Section */}
              <Card className="border-alert-sos/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-alert-sos">
                    <Heart className="w-4 h-4" />
                    Medical Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {alert.medicalInfo?.conditions && alert.medicalInfo.conditions.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Conditions</p>
                      <div className="flex flex-wrap gap-1">
                        {alert.medicalInfo.conditions.map((condition, i) => (
                          <Badge key={i} variant="outline">{condition}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {alert.medicalInfo?.medications && alert.medicalInfo.medications.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <Pill className="w-3 h-3" /> Medications
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {alert.medicalInfo.medications.map((med, i) => (
                          <Badge key={i} variant="secondary">{med}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {alert.medicalInfo?.allergies && alert.medicalInfo.allergies.length > 0 && (
                    <div className="p-3 bg-alert-sos/10 border border-alert-sos/30 rounded-lg">
                      <p className="text-xs text-alert-sos font-semibold mb-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> ALLERGIES
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {alert.medicalInfo.allergies.map((allergy, i) => (
                          <Badge key={i} variant="destructive">{allergy}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {alert.medicalInfo?.bloodType && (
                      <div className="flex items-center gap-2">
                        <Droplets className="w-4 h-4 text-alert-sos" />
                        <span>Blood: <strong>{alert.medicalInfo.bloodType}</strong></span>
                      </div>
                    )}
                    {alert.medicalInfo?.doctorName && (
                      <div className="flex items-center gap-2">
                        <Stethoscope className="w-4 h-4" />
                        <span>{alert.medicalInfo.doctorName}</span>
                      </div>
                    )}
                  </div>

                  {alert.medicalInfo?.doctorPhone && (
                    <Button variant="outline" size="sm" className="w-full">
                      <Phone className="w-3 h-3 mr-1" />
                      Call Doctor: {alert.medicalInfo.doctorPhone}
                    </Button>
                  )}

                  {alert.medicalInfo?.hospitalPreference && (
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="w-4 h-4" />
                      <span>Preferred: <strong>{alert.medicalInfo.hospitalPreference}</strong></span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Pendant Info (if has pendant) */}
              {alert.subscription?.hasPendant && alert.device && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Pendant Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <Badge className={alert.device.status === 'active' ? 'bg-status-active' : 'bg-status-inactive'}>
                        {alert.device.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Battery</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full transition-all",
                              (alert.device.batteryLevel || 0) > 50 ? "bg-status-active" :
                              (alert.device.batteryLevel || 0) > 20 ? "bg-alert-battery" : "bg-alert-sos"
                            )}
                            style={{ width: `${alert.device.batteryLevel || 0}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{alert.device.batteryLevel || 0}%</span>
                      </div>
                    </div>
                    {alert.device.lastCheckin && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Last Check-in</span>
                        <span className="text-sm">{new Date(alert.device.lastCheckin).toLocaleString()}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Emergency Contacts */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Emergency Contacts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {alert.emergencyContacts && alert.emergencyContacts.length > 0 ? (
                    alert.emergencyContacts.map((contact, index) => (
                      <div key={contact.id} className="p-3 bg-muted/50 rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              {index + 1}. {contact.name} ({contact.relationship})
                            </p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {contact.phone}
                            </p>
                          </div>
                          {contact.speaksSpanish && (
                            <Badge variant="outline">🇪🇸 Speaks Spanish</Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1">
                            <PhoneCall className="w-3 h-3 mr-1" />
                            Call
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1"
                            disabled={sendingContactId === contact.id}
                            onClick={() => handleSendSms(
                              `ICE Alarm: Alert received for ${alert.member?.firstName} ${alert.member?.lastName}. Please contact us.`,
                              contact.phone,
                              'emergency_contact',
                              contact.id
                            )}
                          >
                            {sendingContactId === contact.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <>
                                <MessageSquare className="w-3 h-3 mr-1" />
                                SMS
                              </>
                            )}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => handleSendWhatsApp(
                              `ICE Alarm: Alert received for ${alert.member?.firstName} ${alert.member?.lastName}. Please contact us.`,
                              contact.phone,
                              'emergency_contact'
                            )}
                          >
                            WhatsApp
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No emergency contacts on file</p>
                  )}
                </CardContent>
              </Card>

              {/* Communication Panel */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Quick Messages
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {smsTemplates.map((template, i) => (
                      <Button 
                        key={i} 
                        variant="outline" 
                        size="sm"
                        disabled={isSendingSms}
                        onClick={() => handleSendSms(template)}
                      >
                        {template}
                      </Button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Textarea 
                      placeholder="Custom message..."
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      className="min-h-[60px]"
                    />
                    <div className="flex flex-col gap-1">
                      <Button 
                        size="sm"
                        disabled={!customMessage.trim() || isSendingSms}
                        onClick={() => {
                          handleSendSms(customMessage);
                          setCustomMessage("");
                        }}
                      >
                        {isSendingSms ? <Loader2 className="w-4 h-4 animate-spin" /> : "SMS"}
                      </Button>
                      <Button 
                        size="sm"
                        variant="outline"
                        disabled={!customMessage.trim() || isSendingSms}
                        onClick={() => {
                          handleSendWhatsApp(customMessage);
                          setCustomMessage("");
                        }}
                      >
                        WA
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Previous Alerts */}
              {alert.previousAlerts && alert.previousAlerts.length > 0 && (
                <Collapsible open={showPreviousAlerts} onOpenChange={setShowPreviousAlerts}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between">
                      Previous Alerts ({alert.previousAlerts.length})
                      {showPreviousAlerts ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2 mt-2">
                    {alert.previousAlerts.map((prevAlert) => (
                      <div key={prevAlert.id} className="p-2 bg-muted rounded text-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {alertTypeConfig[prevAlert.type].label}
                          </Badge>
                          <span className="text-muted-foreground">
                            {new Date(prevAlert.receivedAt).toLocaleDateString()}
                          </span>
                        </div>
                        {prevAlert.resolvedAt && (
                          <Badge variant="outline" className="text-xs bg-status-active/10 text-status-active">
                            Resolved
                          </Badge>
                        )}
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          </ScrollArea>

          {/* Action Footer */}
          <div className="border-t p-4 space-y-4 bg-card">
            {/* Call Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button size="lg" className="bg-primary hover:bg-primary/90" onClick={handleCallMember}>
                <PhoneCall className="w-4 h-4 mr-2" />
                Call Member
              </Button>
              <Button size="lg" variant="destructive" onClick={handleCall112}>
                <Phone className="w-4 h-4 mr-2" />
                Call 112
              </Button>
            </div>

            {/* Notes */}
            <Textarea 
              placeholder="Resolution notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[80px]"
            />

            {/* Checkboxes */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="emergency" 
                  checked={emergencyServicesCalled}
                  onCheckedChange={(checked) => setEmergencyServicesCalled(checked as boolean)}
                />
                <Label htmlFor="emergency" className="text-sm">Emergency services (112) called</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="kin" 
                  checked={nextOfKinNotified}
                  onCheckedChange={(checked) => setNextOfKinNotified(checked as boolean)}
                />
                <Label htmlFor="kin" className="text-sm">Next of kin notified</Label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => onEscalate(alert.id)}
              >
                Escalate
              </Button>
              <Button 
                className="flex-1 bg-status-active hover:bg-status-active/90"
                onClick={handleResolve}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Resolve Alert
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
