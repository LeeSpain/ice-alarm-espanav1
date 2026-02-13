import { supabase } from "@/integrations/supabase/client";

export interface IsabellaFunctionConfig {
  agent_key: string;
  triggers: string[];
  description: string;
  capabilities: string[];
}

export const ISABELLA_FUNCTION_CONFIG: Record<string, IsabellaFunctionConfig> = {
  device_offline_response: {
    agent_key: "customer_service_expert",
    triggers: ["device.offline", "alert.device_offline"],
    description: "Handle device offline alerts",
    capabilities: ["voice_call", "sms", "escalate"],
  },
  low_battery_alerts: {
    agent_key: "customer_service_expert",
    triggers: ["device.low_battery", "alert.low_battery"],
    description: "Send battery reminders",
    capabilities: ["sms"],
  },
  sos_button_triage: {
    agent_key: "customer_service_expert",
    triggers: ["alert.sos_button"],
    description: "Triage SOS alerts",
    capabilities: ["voice_call", "escalate"],
  },
  fall_detection_triage: {
    agent_key: "customer_service_expert",
    triggers: ["alert.fall_detected"],
    description: "Triage fall alerts",
    capabilities: ["voice_call", "escalate"],
  },
  inbound_phone_calls: {
    agent_key: "customer_service_expert",
    triggers: ["call.inbound"],
    description: "Answer inbound calls",
    capabilities: ["voice_call", "escalate", "transfer"],
  },
  inbound_sms: {
    agent_key: "customer_service_expert",
    triggers: ["sms.inbound"],
    description: "Auto-respond to SMS",
    capabilities: ["sms", "escalate"],
  },
  inbound_whatsapp: {
    agent_key: "customer_service_expert",
    triggers: ["whatsapp.inbound"],
    description: "Auto-respond to WhatsApp",
    capabilities: ["whatsapp", "escalate"],
  },
  inbound_email: {
    agent_key: "customer_service_expert",
    triggers: ["email.inbound"],
    description: "Auto-respond to email",
    capabilities: ["email", "escalate"],
  },
  chat_widget: {
    agent_key: "customer_service_expert",
    triggers: ["chat.message"],
    description: "Handle website chat",
    capabilities: ["chat", "escalate"],
  },
  courtesy_calls: {
    agent_key: "customer_service_expert",
    triggers: ["scheduled.courtesy_call"],
    description: "Make courtesy calls",
    capabilities: ["voice_call"],
  },
  welcome_calls: {
    agent_key: "customer_service_expert",
    triggers: ["member.created"],
    description: "Welcome new members",
    capabilities: ["voice_call"],
  },
  onboarding_checkins: {
    agent_key: "customer_service_expert",
    triggers: ["scheduled.onboarding_checkin"],
    description: "Onboarding check-in calls",
    capabilities: ["voice_call"],
  },
  payment_reminders: {
    agent_key: "customer_service_expert",
    triggers: ["payment.failed"],
    description: "Payment reminder calls",
    capabilities: ["voice_call", "sms"],
  },
  followup_calls: {
    agent_key: "customer_service_expert",
    triggers: ["scheduled.followup"],
    description: "Follow-up calls",
    capabilities: ["voice_call"],
  },
  birthday_calls: {
    agent_key: "customer_service_expert",
    triggers: ["scheduled.birthday"],
    description: "Birthday calls",
    capabilities: ["voice_call"],
  },
  lead_followup_calls: {
    agent_key: "customer_service_expert",
    triggers: ["lead.created", "lead.stale"],
    description: "Lead follow-up calls",
    capabilities: ["voice_call", "sms"],
  },
  abandoned_signup_recovery: {
    agent_key: "customer_service_expert",
    triggers: ["registration.abandoned"],
    description: "Recover abandoned signups",
    capabilities: ["voice_call", "sms", "email"],
  },
  partner_enquiry_handling: {
    agent_key: "customer_service_expert",
    triggers: ["partner.enquiry"],
    description: "Handle partner enquiries",
    capabilities: ["voice_call", "email", "escalate"],
  },
  b2b_outreach_campaigns: {
    agent_key: "customer_service_expert",
    triggers: ["outreach.scheduled"],
    description: "B2B outreach",
    capabilities: ["email", "voice_call"],
  },
};

/** Check if a specific Isabella function is enabled */
export async function isIsabellaFunctionEnabled(functionKey: string): Promise<boolean> {
  const { data } = await supabase
    .from("isabella_settings")
    .select("enabled")
    .eq("function_key", functionKey)
    .single();
  return data?.enabled ?? false;
}
