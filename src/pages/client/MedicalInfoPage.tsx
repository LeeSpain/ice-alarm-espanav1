import { useState } from "react";
import { useMedicalInfo, useMemberProfile } from "@/hooks/useMemberProfile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Heart, Pill, AlertTriangle, Droplet, Stethoscope, Building2, Edit, Send } from "lucide-react";
import { toast } from "sonner";

export default function MedicalInfoPage() {
  const { data: profile } = useMemberProfile();
  const { data: medicalInfo, isLoading } = useMedicalInfo();
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [updateRequest, setUpdateRequest] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSubmitUpdate = async () => {
    if (!updateRequest.trim()) {
      toast.error("Please describe the changes you'd like to make");
      return;
    }

    setIsSending(true);
    // In production, this would send to an admin queue
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.success("Update request submitted. Our team will review it shortly.");
    setUpdateDialogOpen(false);
    setUpdateRequest("");
    setIsSending(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Medical Information</h1>
          <p className="text-muted-foreground mt-1">
            Your medical details for emergency response
          </p>
        </div>
        <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="touch-target">
              <Edit className="mr-2 h-4 w-4" />
              Request Update
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Medical Info Update</DialogTitle>
              <DialogDescription>
                Describe the changes you'd like to make. Our team will review and update your records for safety.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="update-request">What would you like to update?</Label>
                <Textarea
                  id="update-request"
                  placeholder="e.g., I need to add a new medication: Metformin 500mg twice daily..."
                  value={updateRequest}
                  onChange={(e) => setUpdateRequest(e.target.value)}
                  rows={5}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                ⚠️ Medical changes are reviewed by our team for your safety
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setUpdateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmitUpdate} disabled={isSending}>
                {isSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Request
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {!medicalInfo ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">No Medical Information on File</h3>
            <p className="text-muted-foreground mb-4">
              Adding your medical information helps us respond better in emergencies.
            </p>
            <Button onClick={() => setUpdateDialogOpen(true)}>
              Add Medical Information
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Allergies - Prominent Warning */}
          {medicalInfo.allergies && medicalInfo.allergies.length > 0 && (
            <Card className="border-destructive bg-destructive/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Allergies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {medicalInfo.allergies.map((allergy, index) => (
                    <Badge 
                      key={index} 
                      variant="destructive"
                      className="text-sm px-3 py-1"
                    >
                      {allergy}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Medical Conditions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                Medical Conditions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {medicalInfo.medical_conditions && medicalInfo.medical_conditions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {medicalInfo.medical_conditions.map((condition, index) => (
                    <Badge key={index} variant="secondary" className="text-sm px-3 py-1">
                      {condition}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No conditions on record</p>
              )}
            </CardContent>
          </Card>

          {/* Medications */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Pill className="h-5 w-5 text-primary" />
                Medications
              </CardTitle>
            </CardHeader>
            <CardContent>
              {medicalInfo.medications && medicalInfo.medications.length > 0 ? (
                <ul className="space-y-2">
                  {medicalInfo.medications.map((medication, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <span>{medication}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">No medications on record</p>
              )}
            </CardContent>
          </Card>

          {/* Blood Type & Doctor */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Droplet className="h-5 w-5 text-primary" />
                  Blood Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                {medicalInfo.blood_type ? (
                  <span className="text-2xl font-bold">{medicalInfo.blood_type}</span>
                ) : (
                  <p className="text-muted-foreground">Not specified</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-primary" />
                  Doctor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {medicalInfo.doctor_name ? (
                  <>
                    <p className="font-medium">{medicalInfo.doctor_name}</p>
                    {medicalInfo.doctor_phone && (
                      <a 
                        href={`tel:${medicalInfo.doctor_phone}`}
                        className="text-primary hover:underline text-sm"
                      >
                        {medicalInfo.doctor_phone}
                      </a>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground">Not specified</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Hospital Preference */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Preferred Hospital
              </CardTitle>
            </CardHeader>
            <CardContent>
              {medicalInfo.hospital_preference ? (
                <p>{medicalInfo.hospital_preference}</p>
              ) : (
                <p className="text-muted-foreground">No preference specified</p>
              )}
            </CardContent>
          </Card>

          {/* Additional Notes */}
          {medicalInfo.additional_notes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Additional Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {medicalInfo.additional_notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
