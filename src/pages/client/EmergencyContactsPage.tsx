import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEmergencyContacts } from "@/hooks/useMemberProfile";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Loader2, 
  Phone as PhoneIcon, 
  User,
  Users,
  UserPlus,
  Shield,
  Mail
} from "lucide-react";
import { toast } from "sonner";

const contactSchema = z.object({
  contact_name: z.string().min(1, "Name is required"),
  relationship: z.string().min(1, "Relationship is required"),
  phone: z.string().min(1, "Phone number is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  notes: z.string().optional(),
  speaks_spanish: z.boolean(),
});

type ContactFormData = z.infer<typeof contactSchema>;

const RELATIONSHIPS = [
  "Spouse",
  "Partner",
  "Child",
  "Son",
  "Daughter",
  "Sibling",
  "Brother",
  "Sister",
  "Parent",
  "Friend",
  "Neighbor",
  "Caregiver",
  "Other",
];

export default function EmergencyContactsPage() {
  const { memberId } = useAuth();
  const { data: contacts, isLoading } = useEmergencyContacts();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<string | null>(null);
  const [deletingContact, setDeletingContact] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      contact_name: "",
      relationship: "",
      phone: "",
      email: "",
      notes: "",
      speaks_spanish: false,
    },
  });

  const openAddDialog = () => {
    form.reset({
      contact_name: "",
      relationship: "",
      phone: "",
      email: "",
      notes: "",
      speaks_spanish: false,
    });
    setEditingContact(null);
    setDialogOpen(true);
  };

  const openEditDialog = (contact: typeof contacts[number]) => {
    form.reset({
      contact_name: contact.contact_name,
      relationship: contact.relationship,
      phone: contact.phone,
      email: contact.email || "",
      notes: contact.notes || "",
      speaks_spanish: contact.speaks_spanish || false,
    });
    setEditingContact(contact.id);
    setDialogOpen(true);
  };

  const onSubmit = async (data: ContactFormData) => {
    if (!memberId) return;
    
    setIsSaving(true);
    try {
      if (editingContact) {
        // Update existing contact
        const { error } = await supabase
          .from("emergency_contacts")
          .update({
            contact_name: data.contact_name,
            relationship: data.relationship,
            phone: data.phone,
            email: data.email || null,
            notes: data.notes || null,
            speaks_spanish: data.speaks_spanish,
          })
          .eq("id", editingContact);

        if (error) throw error;
        toast.success("Contact updated successfully");
      } else {
        // Add new contact
        const nextOrder = (contacts?.length || 0) + 1;
        const isPrimary = nextOrder === 1;

        const { error } = await supabase
          .from("emergency_contacts")
          .insert({
            member_id: memberId,
            contact_name: data.contact_name,
            relationship: data.relationship,
            phone: data.phone,
            email: data.email || null,
            notes: data.notes || null,
            speaks_spanish: data.speaks_spanish,
            priority_order: nextOrder,
            is_primary: isPrimary,
          });

        if (error) throw error;
        toast.success("Contact added successfully");
      }

      queryClient.invalidateQueries({ queryKey: ["emergency-contacts"] });
      setDialogOpen(false);
      form.reset();
    } catch (error) {
      console.error("Error saving contact:", error);
      toast.error("Failed to save contact");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingContact) return;

    try {
      const { error } = await supabase
        .from("emergency_contacts")
        .delete()
        .eq("id", deletingContact);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["emergency-contacts"] });
      toast.success("Contact deleted");
    } catch (error) {
      console.error("Error deleting contact:", error);
      toast.error("Failed to delete contact");
    } finally {
      setDeleteDialogOpen(false);
      setDeletingContact(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const canAddMore = (contacts?.length || 0) < 3;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Emergency Contacts</h1>
          <p className="text-muted-foreground mt-1">People we call if you need help</p>
        </div>
      </div>

      {/* Info Banner */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Your Emergency Network</p>
              <p className="text-sm text-muted-foreground mt-1">
                These contacts will be called in order of priority if we can't reach you during an emergency.
                You can have up to 3 contacts.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contacts Grid */}
      {contacts && contacts.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {contacts.map((contact, index) => (
            <Card key={contact.id} className={contact.is_primary ? "border-primary/50" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {contact.contact_name.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">{contact.contact_name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{contact.relationship}</p>
                    </div>
                  </div>
                  <Badge variant={contact.is_primary ? "default" : "outline"}>
                    #{index + 1}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <PhoneIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{contact.phone}</span>
                </div>
                {contact.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{contact.email}</span>
                  </div>
                )}
                {contact.speaks_spanish && (
                  <Badge variant="secondary" className="text-xs">
                    Speaks Spanish
                  </Badge>
                )}
                {contact.notes && (
                  <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                    {contact.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">No Emergency Contacts</h3>
            <p className="text-muted-foreground mb-4">
              Add emergency contacts so we can reach your loved ones if needed.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Help Card */}
      <Card className="border-dashed">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <UserPlus className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold">Need to update your emergency contacts?</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Contact our support team to add, remove, or update your emergency contact list.
              </p>
            </div>
            <Button asChild className="flex-shrink-0">
              <a href="/dashboard/support">Contact Support</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
