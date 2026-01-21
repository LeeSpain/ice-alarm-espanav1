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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Phone, Edit, Trash2, User, GripVertical } from "lucide-react";
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
    <div className="space-y-6 max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Emergency Contacts</h1>
          <p className="text-muted-foreground mt-1">
            People we contact in an emergency (up to 3)
          </p>
        </div>
        {canAddMore && (
          <Button onClick={openAddDialog} className="touch-target">
            <Plus className="mr-2 h-4 w-4" />
            Add Contact
          </Button>
        )}
      </div>

      {!contacts || contacts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">No Emergency Contacts</h3>
            <p className="text-muted-foreground mb-4">
              Add contacts so we can reach your loved ones in an emergency.
            </p>
            <Button onClick={openAddDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Contact
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {contacts.map((contact, index) => (
            <Card key={contact.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-stretch">
                  {/* Priority Handle */}
                  <div className="flex items-center justify-center px-3 bg-muted border-r">
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                  </div>
                  
                  {/* Contact Info */}
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{contact.contact_name}</h3>
                          {contact.is_primary && (
                            <Badge variant="default" className="text-xs">Primary</Badge>
                          )}
                          {!contact.is_primary && (
                            <Badge variant="outline" className="text-xs">
                              #{contact.priority_order}
                            </Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground">{contact.relationship}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(contact)}
                          className="touch-target"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setDeletingContact(contact.id);
                            setDeleteDialogOpen(true);
                          }}
                          className="touch-target text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                      <a 
                        href={`tel:${contact.phone}`}
                        className="flex items-center gap-2 text-primary hover:underline"
                      >
                        <Phone className="h-4 w-4" />
                        {contact.phone}
                      </a>
                      {contact.speaks_spanish && (
                        <Badge variant="secondary" className="text-xs">
                          🇪🇸 Speaks Spanish
                        </Badge>
                      )}
                    </div>

                    {contact.notes && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {contact.notes}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {canAddMore && (
            <Button 
              variant="outline" 
              onClick={openAddDialog}
              className="w-full touch-target"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Another Contact ({3 - (contacts?.length || 0)} remaining)
            </Button>
          )}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingContact ? "Edit Contact" : "Add Emergency Contact"}
            </DialogTitle>
            <DialogDescription>
              This person will be contacted in case of an emergency.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contact_name">Full Name</Label>
              <Input
                id="contact_name"
                {...form.register("contact_name")}
                placeholder="e.g., Juan García"
              />
              {form.formState.errors.contact_name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.contact_name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="relationship">Relationship</Label>
              <Select
                value={form.watch("relationship")}
                onValueChange={(value) => form.setValue("relationship", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONSHIPS.map((rel) => (
                    <SelectItem key={rel} value={rel}>
                      {rel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.relationship && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.relationship.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                {...form.register("phone")}
                placeholder="+34 600 000 000"
              />
              {form.formState.errors.phone && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.phone.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email (Optional)</Label>
              <Input
                id="email"
                type="email"
                {...form.register("email")}
                placeholder="email@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                {...form.register("notes")}
                placeholder="e.g., Best to call after 6pm"
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="speaks_spanish"
                checked={form.watch("speaks_spanish")}
                onCheckedChange={(checked) => 
                  form.setValue("speaks_spanish", checked as boolean)
                }
              />
              <Label htmlFor="speaks_spanish" className="cursor-pointer">
                🇪🇸 This person speaks Spanish
              </Label>
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  editingContact ? "Update Contact" : "Add Contact"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove this person from your emergency contacts. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
