import { useState } from "react";
import { JoinWizardData, EmergencyContact } from "@/types/wizard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Phone, User, AlertCircle, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface JoinContactsStepProps {
  data: JoinWizardData;
  onUpdate: (data: Partial<JoinWizardData>) => void;
}

const relationships = [
  "Spouse/Partner",
  "Son",
  "Daughter",
  "Sibling",
  "Friend",
  "Neighbor",
  "Caregiver",
  "Other Family",
  "Other",
];

const emptyContact: EmergencyContact = {
  contactName: "",
  relationship: "",
  phone: "",
  email: "",
  speaksSpanish: false,
  notes: "",
};

export function JoinContactsStep({ data, onUpdate }: JoinContactsStepProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [contactForm, setContactForm] = useState<EmergencyContact>(emptyContact);

  const resetForm = () => {
    setContactForm(emptyContact);
    setEditIndex(null);
  };

  const openAddDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (index: number) => {
    setContactForm(data.emergencyContacts[index]);
    setEditIndex(index);
    setDialogOpen(true);
  };

  const saveContact = () => {
    if (!contactForm.contactName || !contactForm.relationship || !contactForm.phone) {
      return;
    }

    const newContacts = [...data.emergencyContacts];
    if (editIndex !== null) {
      newContacts[editIndex] = contactForm;
    } else {
      newContacts.push(contactForm);
    }

    onUpdate({ emergencyContacts: newContacts });
    setDialogOpen(false);
    resetForm();
  };

  const deleteContact = (index: number) => {
    const newContacts = data.emergencyContacts.filter((_, i) => i !== index);
    onUpdate({ emergencyContacts: newContacts });
  };

  const canAddMore = data.emergencyContacts.length < 3;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Emergency Contacts</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Who should we contact in case of an emergency? Add at least one trusted contact.
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
        <div>
          <p className="font-medium text-sm text-destructive">Important</p>
          <p className="text-xs text-muted-foreground">
            Your emergency contacts will be called if we cannot reach you after an alert. 
            Please ensure they are aware and available to respond.
          </p>
        </div>
      </div>

      {/* Contact Cards */}
      <div className="space-y-4">
        {data.emergencyContacts.map((contact, index) => (
          <Card key={index} className={cn(index === 0 && "border-primary ring-1 ring-primary/20")}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    index === 0 ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}>
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <span>{contact.contactName}</span>
                    {index === 0 && (
                      <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                        Primary
                      </span>
                    )}
                  </div>
                </CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(index)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteContact(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="grid gap-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span>{contact.relationship}</span>
                  {contact.speaksSpanish && (
                    <span className="bg-muted px-2 py-0.5 rounded text-xs">Speaks Spanish</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{contact.phone}</span>
                </div>
                {contact.email && <span className="text-muted-foreground">{contact.email}</span>}
                {contact.notes && (
                  <p className="text-muted-foreground italic mt-1">"{contact.notes}"</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Button */}
      {canAddMore ? (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" onClick={openAddDialog} className="w-full gap-2 h-12">
              <Plus className="h-5 w-5" />
              Add Emergency Contact ({data.emergencyContacts.length}/3)
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editIndex !== null ? "Edit Contact" : "Add Emergency Contact"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contactName">Full Name *</Label>
                  <Input
                    id="contactName"
                    value={contactForm.contactName}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, contactName: e.target.value })
                    }
                    placeholder="Contact's full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="relationship">Relationship *</Label>
                  <Select
                    value={contactForm.relationship}
                    onValueChange={(value) =>
                      setContactForm({ ...contactForm, relationship: value })
                    }
                  >
                    <SelectTrigger id="relationship">
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      {relationships.map((rel) => (
                        <SelectItem key={rel} value={rel}>
                          {rel}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={contactForm.phone}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, phone: e.target.value })
                    }
                    placeholder="+34 600 000 000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email (optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={contactForm.email}
                    onChange={(e) =>
                      setContactForm({ ...contactForm, email: e.target.value })
                    }
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="speaksSpanish"
                  checked={contactForm.speaksSpanish}
                  onCheckedChange={(checked) =>
                    setContactForm({ ...contactForm, speaksSpanish: checked })
                  }
                />
                <Label htmlFor="speaksSpanish">Speaks Spanish</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={contactForm.notes}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, notes: e.target.value })
                  }
                  placeholder="Any special instructions for contacting this person..."
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveContact}>
                {editIndex !== null ? "Save Changes" : "Add Contact"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : (
        <p className="text-center text-sm text-muted-foreground">
          Maximum of 3 emergency contacts reached
        </p>
      )}

      {/* Minimum requirement note */}
      {data.emergencyContacts.length === 0 && (
        <p className="text-center text-sm text-destructive">
          Please add at least one emergency contact to continue
        </p>
      )}
    </div>
  );
}
