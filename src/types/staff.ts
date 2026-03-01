export type StaffStatus = "active" | "on_leave" | "suspended" | "terminated";

export type StaffRole = "super_admin" | "admin" | "call_centre_supervisor" | "call_centre";

export type StaffDocumentType = "nie_copy" | "contract" | "cv" | "certification" | "other";

export interface StaffMember {
  id: string;
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  role: StaffRole;
  status: StaffStatus;
  is_active: boolean;
  preferred_language: string;
  last_login_at: string | null;
  nie_number: string | null;
  social_security_number: string | null;
  date_of_birth: string | null;
  nationality: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  country: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relationship: string | null;
  hire_date: string | null;
  termination_date: string | null;
  department: string | null;
  position: string | null;
  contract_type: string | null;
  notes: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface StaffDocument {
  id: string;
  staff_id: string;
  document_type: StaffDocumentType;
  file_name: string;
  file_url: string;
  uploaded_by: string | null;
  notes: string | null;
  created_at: string;
}

export interface StaffActivityLog {
  id: string;
  staff_id: string;
  action: string;
  details: Record<string, unknown>;
  performed_by: string | null;
  performed_by_name?: string;
  created_at: string;
}

export interface StaffFilters {
  search: string;
  status: string;
  role: string;
  department: string;
}

export type StaffFormData = Omit<
  StaffMember,
  "id" | "user_id" | "created_at" | "updated_at" | "is_active" | "last_login_at"
>;
