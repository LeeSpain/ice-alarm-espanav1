import { supabase } from "@/integrations/supabase/client";

export interface IsabellaFunctionConfig {
  agent_key: string;
  triggers: string[];
  description: string;
  capabilities: string[];
}

export const ISABELLA_FUNCTION_CONFIG: Record<string, IsabellaFunctionConfig> = {
  // --- Existing 19 ---
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

  // --- Boss / Owner Intelligence (7) ---
  new_sale_notification: {
    agent_key: "customer_service_expert",
    triggers: ["subscription.created"],
    description: "Notify owner of new sales",
    capabilities: ["in_app", "email", "whatsapp"],
  },
  cancellation_alert: {
    agent_key: "customer_service_expert",
    triggers: ["subscription.cancelled"],
    description: "Alert owner on cancellations",
    capabilities: ["in_app", "email"],
  },
  failed_payment_escalation: {
    agent_key: "customer_service_expert",
    triggers: ["payment.failed_escalation"],
    description: "Escalate persistent failed payments",
    capabilities: ["in_app", "email"],
  },
  daily_boss_briefing: {
    agent_key: "customer_service_expert",
    triggers: ["scheduled.daily_briefing"],
    description: "Daily morning briefing for owner",
    capabilities: ["in_app", "email"],
  },
  weekly_revenue_summary: {
    agent_key: "customer_service_expert",
    triggers: ["scheduled.weekly_revenue"],
    description: "Weekly revenue summary report",
    capabilities: ["email"],
  },
  emergency_escalation_alert: {
    agent_key: "customer_service_expert",
    triggers: ["alert.escalated_to_human"],
    description: "Alert owner on real emergencies",
    capabilities: ["in_app", "email", "whatsapp"],
  },
  negative_feedback_alert: {
    agent_key: "customer_service_expert",
    triggers: ["feedback.submitted_low"],
    description: "Alert on negative member feedback",
    capabilities: ["in_app", "email"],
  },

  // --- Member Lifecycle Automation (6) ---
  membership_anniversary: {
    agent_key: "customer_service_expert",
    triggers: ["scheduled.anniversary"],
    description: "Membership milestone celebrations",
    capabilities: ["voice_call", "sms"],
  },
  inactivity_check: {
    agent_key: "customer_service_expert",
    triggers: ["device.inactive"],
    description: "Reach out to inactive device users",
    capabilities: ["sms", "voice_call"],
  },
  subscription_renewal_reminder: {
    agent_key: "customer_service_expert",
    triggers: ["subscription.renewal_upcoming"],
    description: "Remind about upcoming renewal",
    capabilities: ["sms", "email"],
  },
  medical_profile_incomplete: {
    agent_key: "customer_service_expert",
    triggers: ["member.medical_incomplete"],
    description: "Nudge to complete medical profile",
    capabilities: ["sms", "email"],
  },
  device_not_activated: {
    agent_key: "customer_service_expert",
    triggers: ["device.not_activated"],
    description: "Follow up on unactivated devices",
    capabilities: ["sms", "voice_call"],
  },
  upgrade_suggestion: {
    agent_key: "customer_service_expert",
    triggers: ["member.upgrade_eligible"],
    description: "Suggest plan upgrades",
    capabilities: ["in_app", "email"],
  },

  // --- Device & Infrastructure Monitoring (5) ---
  stock_low_alert: {
    agent_key: "customer_service_expert",
    triggers: ["inventory.stock_low"],
    description: "Alert on low pendant stock",
    capabilities: ["in_app", "email"],
  },
  device_health_monitor: {
    agent_key: "customer_service_expert",
    triggers: ["device.health_flap"],
    description: "Monitor device health flapping",
    capabilities: ["in_app"],
  },
  sim_expiry_warning: {
    agent_key: "customer_service_expert",
    triggers: ["sim.expiry_approaching"],
    description: "Warn about expiring SIMs",
    capabilities: ["in_app", "email"],
  },
  bulk_offline_alert: {
    agent_key: "customer_service_expert",
    triggers: ["device.bulk_offline"],
    description: "Alert on mass device outage",
    capabilities: ["in_app", "email", "whatsapp"],
  },
  provisioning_stalled: {
    agent_key: "customer_service_expert",
    triggers: ["device.provisioning_stalled"],
    description: "Flag stalled provisioning",
    capabilities: ["in_app"],
  },

  // --- Partner Network Management (5) ---
  new_partner_signup: {
    agent_key: "customer_service_expert",
    triggers: ["partner.created"],
    description: "Notify on new partner signup",
    capabilities: ["in_app", "email"],
  },
  partner_first_referral: {
    agent_key: "customer_service_expert",
    triggers: ["partner.first_referral"],
    description: "Celebrate first partner referral",
    capabilities: ["in_app", "email"],
  },
  partner_commission_due: {
    agent_key: "customer_service_expert",
    triggers: ["partner.commission_threshold"],
    description: "Alert on commission payout due",
    capabilities: ["in_app", "email"],
  },
  partner_inactive_warning: {
    agent_key: "customer_service_expert",
    triggers: ["partner.inactive"],
    description: "Warn about inactive partners",
    capabilities: ["email"],
  },
  partner_agreement_expiring: {
    agent_key: "customer_service_expert",
    triggers: ["partner.agreement_expiring"],
    description: "Alert on expiring agreements",
    capabilities: ["in_app", "email"],
  },

  // --- Content & Marketing Automation (5) ---
  auto_generate_scheduled_content: {
    agent_key: "customer_service_expert",
    triggers: ["content.generate_scheduled"],
    description: "Auto-generate scheduled content",
    capabilities: [],
  },
  content_approval_reminder: {
    agent_key: "customer_service_expert",
    triggers: ["content.awaiting_approval"],
    description: "Remind admins of pending content",
    capabilities: ["in_app"],
  },
  auto_publish_approved_content: {
    agent_key: "customer_service_expert",
    triggers: ["content.approved"],
    description: "Auto-publish approved content",
    capabilities: [],
  },
  blog_post_performance: {
    agent_key: "customer_service_expert",
    triggers: ["scheduled.blog_performance"],
    description: "Weekly blog performance report",
    capabilities: ["email"],
  },
  social_engagement_alert: {
    agent_key: "customer_service_expert",
    triggers: ["social.engagement_spike"],
    description: "Alert on social engagement spikes",
    capabilities: ["in_app"],
  },

  // --- Compliance & Legal (5) ---
  gdpr_deletion_request: {
    agent_key: "customer_service_expert",
    triggers: ["gdpr.deletion_request"],
    description: "Track GDPR deletion requests",
    capabilities: ["in_app", "email"],
  },
  gdpr_export_request: {
    agent_key: "customer_service_expert",
    triggers: ["gdpr.export_request"],
    description: "Track GDPR export requests",
    capabilities: ["in_app", "email"],
  },
  sla_breach_alert: {
    agent_key: "customer_service_expert",
    triggers: ["sla.breach"],
    description: "Alert on SLA breaches",
    capabilities: ["in_app", "email"],
  },
  audit_anomaly_detection: {
    agent_key: "customer_service_expert",
    triggers: ["audit.anomaly_detected"],
    description: "Detect audit anomalies",
    capabilities: ["in_app", "email"],
  },
  operational_cost_due: {
    agent_key: "customer_service_expert",
    triggers: ["finance.cost_due"],
    description: "Remind about operational costs",
    capabilities: ["in_app", "email"],
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
