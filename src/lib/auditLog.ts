import { supabase } from "@/integrations/supabase/client";

type EntityType = "member" | "device" | "alert" | "subscription" | "order" | "payment" | "staff" | "settings";
type ActionType = "create" | "update" | "delete" | "view" | "claim" | "resolve" | "escalate" | "login" | "logout";

interface AuditLogEntry {
  action: ActionType;
  entityType: EntityType;
  entityId: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
}

/**
 * Log an action to the activity_logs table for audit purposes.
 * This function is designed to be non-blocking - errors are logged but not thrown.
 */
export async function logActivity(entry: AuditLogEntry): Promise<void> {
  try {
    const { data: staffData } = await supabase.auth.getUser();
    if (!staffData.user) return;

    const { data: staff } = await supabase
      .from("staff")
      .select("id")
      .eq("user_id", staffData.user.id)
      .maybeSingle();

    // Get client IP (approximate via external service if needed, or null)
    const ipAddress = null; // Could be enhanced with an IP service

    const logEntry = {
      action: entry.action as string,
      entity_type: entry.entityType as string,
      entity_id: entry.entityId,
      old_values: entry.oldValues ? JSON.parse(JSON.stringify(entry.oldValues)) : null,
      new_values: entry.newValues ? JSON.parse(JSON.stringify(entry.newValues)) : null,
      staff_id: staff?.id || null,
      ip_address: ipAddress,
    };

    const { error } = await supabase.from("activity_logs").insert(logEntry);

    if (error) {
      console.error("Failed to log activity:", error);
    }
  } catch (error) {
    console.error("Error in audit logging:", error);
  }
}

/**
 * Log a member-related action
 */
export async function logMemberActivity(
  action: ActionType,
  memberId: string,
  oldValues?: Record<string, unknown>,
  newValues?: Record<string, unknown>
): Promise<void> {
  return logActivity({
    action,
    entityType: "member",
    entityId: memberId,
    oldValues,
    newValues,
  });
}

/**
 * Log an alert-related action
 */
export async function logAlertActivity(
  action: ActionType,
  alertId: string,
  oldValues?: Record<string, unknown>,
  newValues?: Record<string, unknown>
): Promise<void> {
  return logActivity({
    action,
    entityType: "alert",
    entityId: alertId,
    oldValues,
    newValues,
  });
}

/**
 * Log a device-related action
 */
export async function logDeviceActivity(
  action: ActionType,
  deviceId: string,
  oldValues?: Record<string, unknown>,
  newValues?: Record<string, unknown>
): Promise<void> {
  return logActivity({
    action,
    entityType: "device",
    entityId: deviceId,
    oldValues,
    newValues,
  });
}

/**
 * Log a settings change
 */
export async function logSettingsActivity(
  settingKey: string,
  oldValue?: string,
  newValue?: string
): Promise<void> {
  return logActivity({
    action: "update",
    entityType: "settings",
    entityId: settingKey,
    oldValues: oldValue ? { value: oldValue } : undefined,
    newValues: newValue ? { value: newValue } : undefined,
  });
}
