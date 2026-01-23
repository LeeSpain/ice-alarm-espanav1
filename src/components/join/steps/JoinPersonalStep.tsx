import { useTranslation } from "react-i18next";
import { JoinWizardData, MemberDetails } from "@/types/wizard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { User, Users, Info, MessageCircle, Phone, Mail, Clock } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface JoinPersonalStepProps {
  data: JoinWizardData;
  onUpdate: (data: Partial<JoinWizardData>) => void;
}

export function JoinPersonalStep({ data, onUpdate }: JoinPersonalStepProps) {
  const { t } = useTranslation();
  
  const updatePrimaryMember = (field: keyof MemberDetails, value: string | undefined) => {
    onUpdate({
      primaryMember: {
        ...data.primaryMember,
        [field]: value,
      },
    });
  };

  const updatePartnerMember = (field: keyof MemberDetails, value: string | undefined) => {
    onUpdate({
      partnerMember: {
        firstName: data.partnerMember?.firstName || "",
        lastName: data.partnerMember?.lastName || "",
        email: data.partnerMember?.email || "",
        phone: data.partnerMember?.phone || "",
        dateOfBirth: data.partnerMember?.dateOfBirth || "",
        nieDni: data.partnerMember?.nieDni || "",
        preferredLanguage: data.partnerMember?.preferredLanguage || "es",
        preferredContactMethod: data.partnerMember?.preferredContactMethod,
        preferredContactTime: data.partnerMember?.preferredContactTime,
        specialInstructions: data.partnerMember?.specialInstructions,
        [field]: value,
      },
    });
  };

  const PersonForm = ({
    title,
    icon: Icon,
    values,
    onChange,
    isPrimary = false,
  }: {
    title: string;
    icon: React.ElementType;
    values: MemberDetails;
    onChange: (field: keyof MemberDetails, value: string | undefined) => void;
    isPrimary?: boolean;
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
          <Label htmlFor={`${title}-firstName`}>{t("joinWizard.personal.firstName")} *</Label>
          <Input
            id={`${title}-firstName`}
            value={values.firstName}
            onChange={(e) => onChange("firstName", e.target.value)}
            placeholder={t("joinWizard.personal.enterFirstName")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${title}-lastName`}>{t("joinWizard.personal.lastName")} *</Label>
          <Input
            id={`${title}-lastName`}
            value={values.lastName}
            onChange={(e) => onChange("lastName", e.target.value)}
            placeholder={t("joinWizard.personal.enterLastName")}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${title}-email`}>{t("joinWizard.personal.emailAddress")} *</Label>
          <Input
            id={`${title}-email`}
            type="email"
            value={values.email}
            onChange={(e) => onChange("email", e.target.value)}
            placeholder="email@example.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${title}-phone`}>{t("joinWizard.personal.phoneNumber")} *</Label>
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
          <Label htmlFor={`${title}-dob`}>{t("joinWizard.personal.dateOfBirth")} *</Label>
          <Input
            id={`${title}-dob`}
            type="date"
            value={values.dateOfBirth}
            onChange={(e) => onChange("dateOfBirth", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${title}-nieDni`}>{t("joinWizard.personal.nieDni")}</Label>
          <Input
            id={`${title}-nieDni`}
            value={values.nieDni}
            onChange={(e) => onChange("nieDni", e.target.value)}
            placeholder="X0000000X"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${title}-language`}>{t("joinWizard.personal.preferredLanguage")}</Label>
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

      {/* Contact Preferences - only show for primary member */}
      {isPrimary && (
        <div className="space-y-4 pt-4 border-t">
          <h4 className="font-medium text-sm text-muted-foreground">
            {t("joinWizard.personal.contactPreferences", "Contact Preferences")} ({t("common.optional", "Optional")})
          </h4>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("joinWizard.personal.preferredContactMethod", "Preferred Contact Method")}</Label>
              <RadioGroup
                value={values.preferredContactMethod || ""}
                onValueChange={(value) => onChange("preferredContactMethod", value as "whatsapp" | "phone" | "email")}
                className="flex flex-wrap gap-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="whatsapp" id={`${title}-whatsapp`} />
                  <Label htmlFor={`${title}-whatsapp`} className="flex items-center gap-1.5 cursor-pointer font-normal">
                    <MessageCircle className="h-4 w-4 text-green-600" />
                    WhatsApp
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="phone" id={`${title}-phone-pref`} />
                  <Label htmlFor={`${title}-phone-pref`} className="flex items-center gap-1.5 cursor-pointer font-normal">
                    <Phone className="h-4 w-4" />
                    {t("joinWizard.personal.phone", "Phone")}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="email" id={`${title}-email-pref`} />
                  <Label htmlFor={`${title}-email-pref`} className="flex items-center gap-1.5 cursor-pointer font-normal">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>{t("joinWizard.personal.bestTimeToContact", "Best Time to Contact")}</Label>
              <Select
                value={values.preferredContactTime || ""}
                onValueChange={(value) => onChange("preferredContactTime", value as "morning" | "afternoon" | "evening" | "anytime")}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("joinWizard.personal.selectTime", "Select time")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {t("joinWizard.personal.morning", "Morning")} (9:00-12:00)
                    </span>
                  </SelectItem>
                  <SelectItem value="afternoon">
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {t("joinWizard.personal.afternoon", "Afternoon")} (12:00-18:00)
                    </span>
                  </SelectItem>
                  <SelectItem value="evening">
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {t("joinWizard.personal.evening", "Evening")} (18:00-21:00)
                    </span>
                  </SelectItem>
                  <SelectItem value="anytime">
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {t("joinWizard.personal.anytime", "Anytime")}
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${title}-instructions`}>
              {t("joinWizard.personal.specialInstructions", "Special Instructions")}
            </Label>
            <Textarea
              id={`${title}-instructions`}
              value={values.specialInstructions || ""}
              onChange={(e) => onChange("specialInstructions", e.target.value)}
              placeholder={t("joinWizard.personal.specialInstructionsPlaceholder", "Any special instructions for contacting you or providing service (e.g., 'I use a hearing aid', 'Prefer morning calls', 'Gate code 1234')")}
              rows={2}
              className="resize-none"
            />
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">{t("joinWizard.personal.title")}</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          {t("joinWizard.personal.subtitle", { 
            memberType: data.membershipType === "couple" 
              ? t("joinWizard.personal.bothMembers") 
              : t("joinWizard.personal.theMember") 
          })}
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-start gap-3">
        <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
        <p className="text-sm text-muted-foreground">
          {t("joinWizard.personal.infoNote")}
        </p>
      </div>

      {data.membershipType === "single" ? (
        <PersonForm
          title={t("joinWizard.personal.yourDetails")}
          icon={User}
          values={data.primaryMember}
          onChange={updatePrimaryMember}
          isPrimary={true}
        />
      ) : (
        <Tabs defaultValue="primary" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="primary" className="gap-2">
              <User className="h-4 w-4" />
              {t("joinWizard.personal.primaryMember")}
            </TabsTrigger>
            <TabsTrigger value="partner" className="gap-2">
              <Users className="h-4 w-4" />
              {t("joinWizard.personal.partner")}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="primary" className="mt-6">
            <PersonForm
              title={t("joinWizard.personal.primaryMember")}
              icon={User}
              values={data.primaryMember}
              onChange={updatePrimaryMember}
              isPrimary={true}
            />
          </TabsContent>
          <TabsContent value="partner" className="mt-6">
            <PersonForm
              title={t("joinWizard.personal.partner")}
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
                  preferredContactMethod: undefined,
                  preferredContactTime: undefined,
                  specialInstructions: undefined,
                }
              }
              onChange={updatePartnerMember}
              isPrimary={false}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}