import { useMedicalInfo } from "@/hooks/useMemberProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  Heart, 
  Droplet, 
  Pill, 
  AlertTriangle,
  Building2,
  User,
  Phone,
  Activity,
  FileText
} from "lucide-react";

export default function MedicalInfoPage() {
  const { data: medicalInfo, isLoading } = useMedicalInfo();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Medical Information</h1>
          <p className="text-muted-foreground mt-1">Important health details for emergencies</p>
        </div>
      </div>

      {/* Important Notice */}
      <Card className="border-destructive/20 bg-destructive/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Emergency Medical Data</p>
              <p className="text-sm text-muted-foreground mt-1">
                This information is shared with emergency services when you need help.
                Keep it up to date for your safety.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {!medicalInfo ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">No Medical Information</h3>
            <p className="text-muted-foreground mb-4">
              Add your medical details so we can provide better emergency care.
            </p>
            <Button asChild>
              <a href="/dashboard/support">Contact Support to Add</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Allergies - Full Width Alert */}
          {medicalInfo.allergies && medicalInfo.allergies.length > 0 && (
            <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2 text-red-700 dark:text-red-400">
                  <AlertTriangle className="h-5 w-5" />
                  Allergies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {medicalInfo.allergies.map((allergy, i) => (
                    <Badge key={i} variant="destructive" className="text-sm py-1 px-3">
                      {allergy}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Blood Type */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Droplet className="h-4 w-4 text-red-500" />
                  Blood Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-center py-4">
                  {medicalInfo.blood_type || "—"}
                </p>
              </CardContent>
            </Card>

            {/* Doctor */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Doctor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-medium">{medicalInfo.doctor_name || "Not specified"}</p>
                {medicalInfo.doctor_phone && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Phone className="h-3 w-3" />
                    {medicalInfo.doctor_phone}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Hospital */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Preferred Hospital
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">
                  {medicalInfo.hospital_preference || "Not specified"}
                </p>
              </CardContent>
            </Card>

            {/* Medical Conditions */}
            <Card className="md:col-span-2 lg:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Medical Conditions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {medicalInfo.medical_conditions && medicalInfo.medical_conditions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {medicalInfo.medical_conditions.map((condition, i) => (
                      <Badge key={i} variant="secondary" className="py-1">
                        {condition}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">None recorded</p>
                )}
              </CardContent>
            </Card>

            {/* Medications */}
            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Pill className="h-4 w-4" />
                  Current Medications
                </CardTitle>
              </CardHeader>
              <CardContent>
                {medicalInfo.medications && medicalInfo.medications.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {medicalInfo.medications.map((med, i) => (
                      <Badge key={i} variant="outline" className="py-1">
                        {med}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">None recorded</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Additional Notes */}
          {medicalInfo.additional_notes && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Additional Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {medicalInfo.additional_notes}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Help Card */}
          <Card className="border-dashed">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">Need to update your medical information?</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Contact our support team to update your medical details. Changes are usually processed within 24 hours.
                  </p>
                </div>
                <Button asChild className="flex-shrink-0">
                  <a href="/dashboard/support">Request Update</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
