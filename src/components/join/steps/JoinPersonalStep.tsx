import { JoinWizardData, MemberDetails } from "@/types/wizard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Users, Info } from "lucide-react";

interface JoinPersonalStepProps {
  data: JoinWizardData;
  onUpdate: (data: Partial<JoinWizardData>) => void;
}

export function JoinPersonalStep({ data, onUpdate }: JoinPersonalStepProps) {
  const updatePrimaryMember = (field: keyof MemberDetails, value: string) => {
    onUpdate({
      primaryMember: {
        ...data.primaryMember,
        [field]: value,
      },
    });
  };

  const updatePartnerMember = (field: keyof MemberDetails, value: string) => {
    onUpdate({
      partnerMember: {
        firstName: data.partnerMember?.firstName || "",
        lastName: data.partnerMember?.lastName || "",
        email: data.partnerMember?.email || "",
        phone: data.partnerMember?.phone || "",
        dateOfBirth: data.partnerMember?.dateOfBirth || "",
        nieDni: data.partnerMember?.nieDni || "",
        preferredLanguage: data.partnerMember?.preferredLanguage || "es",
        [field]: value,
      },
    });
  };

  const PersonForm = ({
    title,
    icon: Icon,
    values,
    onChange,
  }: {
    title: string;
    icon: React.ElementType;
    values: MemberDetails;
    onChange: (field: keyof MemberDetails, value: string) => void;
  }) => (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <h3 className="font-semibold text-lg">{title}</h3>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${title}-firstName`}>First Name *</Label>
          <Input
            id={`${title}-firstName`}
            value={values.firstName}
            onChange={(e) => onChange("firstName", e.target.value)}
            placeholder="Enter first name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${title}-lastName`}>Last Name *</Label>
          <Input
            id={`${title}-lastName`}
            value={values.lastName}
            onChange={(e) => onChange("lastName", e.target.value)}
            placeholder="Enter last name"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${title}-email`}>Email Address *</Label>
          <Input
            id={`${title}-email`}
            type="email"
            value={values.email}
            onChange={(e) => onChange("email", e.target.value)}
            placeholder="email@example.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${title}-phone`}>Phone Number *</Label>
          <Input
            id={`${title}-phone`}
            type="tel"
            value={values.phone}
            onChange={(e) => onChange("phone", e.target.value)}
            placeholder="+34 600 000 000"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor={`${title}-dob`}>Date of Birth *</Label>
          <Input
            id={`${title}-dob`}
            type="date"
            value={values.dateOfBirth}
            onChange={(e) => onChange("dateOfBirth", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${title}-nieDni`}>NIE/DNI</Label>
          <Input
            id={`${title}-nieDni`}
            value={values.nieDni}
            onChange={(e) => onChange("nieDni", e.target.value)}
            placeholder="X0000000X"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${title}-language`}>Preferred Language</Label>
          <Select
            value={values.preferredLanguage}
            onValueChange={(value) => onChange("preferredLanguage", value as "en" | "es")}
          >
            <SelectTrigger id={`${title}-language`}>
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="es">Español</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Personal Details</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Enter the details of {data.membershipType === "couple" ? "both members" : "the member"} who will use the service.
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-start gap-3">
        <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
        <p className="text-sm text-muted-foreground">
          We use this information to provide emergency services with accurate details. 
          Please ensure all information is correct.
        </p>
      </div>

      {data.membershipType === "single" ? (
        <PersonForm
          title="Your Details"
          icon={User}
          values={data.primaryMember}
          onChange={updatePrimaryMember}
        />
      ) : (
        <Tabs defaultValue="primary" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="primary" className="gap-2">
              <User className="h-4 w-4" />
              Primary Member
            </TabsTrigger>
            <TabsTrigger value="partner" className="gap-2">
              <Users className="h-4 w-4" />
              Partner
            </TabsTrigger>
          </TabsList>
          <TabsContent value="primary" className="mt-6">
            <PersonForm
              title="Primary Member"
              icon={User}
              values={data.primaryMember}
              onChange={updatePrimaryMember}
            />
          </TabsContent>
          <TabsContent value="partner" className="mt-6">
            <PersonForm
              title="Partner"
              icon={Users}
              values={
                data.partnerMember || {
                  firstName: "",
                  lastName: "",
                  email: "",
                  phone: "",
                  dateOfBirth: "",
                  nieDni: "",
                  preferredLanguage: "es",
                }
              }
              onChange={updatePartnerMember}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
