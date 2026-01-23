import { useTranslation } from "react-i18next";
import { JoinWizardData } from "@/types/wizard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Truck } from "lucide-react";

interface JoinAddressStepProps {
  data: JoinWizardData;
  onUpdate: (data: Partial<JoinWizardData>) => void;
}

const spanishProvinces = [
  "Álava", "Albacete", "Alicante", "Almería", "Asturias", "Ávila", "Badajoz",
  "Barcelona", "Burgos", "Cáceres", "Cádiz", "Cantabria", "Castellón", "Ciudad Real",
  "Córdoba", "Cuenca", "Girona", "Granada", "Guadalajara", "Guipúzcoa", "Huelva",
  "Huesca", "Islas Baleares", "Jaén", "La Coruña", "La Rioja", "Las Palmas", "León",
  "Lérida", "Lugo", "Madrid", "Málaga", "Murcia", "Navarra", "Orense", "Palencia",
  "Pontevedra", "Salamanca", "Santa Cruz de Tenerife", "Segovia", "Sevilla", "Soria",
  "Tarragona", "Teruel", "Toledo", "Valencia", "Valladolid", "Vizcaya", "Zamora", "Zaragoza"
];

export function JoinAddressStep({ data, onUpdate }: JoinAddressStepProps) {
  const { t } = useTranslation();
  
  const updateAddress = (field: string, value: string) => {
    onUpdate({
      address: {
        ...data.address,
        [field]: value,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">{t("joinWizard.address.title")}</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          {t("joinWizard.address.subtitle")}
        </p>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-start gap-3">
          <MapPin className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-sm">{t("joinWizard.address.emergencyResponse")}</p>
            <p className="text-xs text-muted-foreground">
              {t("joinWizard.address.emergencyResponseDesc")}
            </p>
          </div>
        </div>
        {data.includePendant && (
          <div className="bg-muted/50 border rounded-lg p-4 flex items-start gap-3">
            <Truck className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-sm">{t("joinWizard.address.shippingAddress")}</p>
              <p className="text-xs text-muted-foreground">
                {t("joinWizard.address.shippingAddressDesc")}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4 pt-4">
        <div className="space-y-2">
          <Label htmlFor="addressLine1">{t("joinWizard.address.streetAddress")} *</Label>
          <Input
            id="addressLine1"
            value={data.address.addressLine1}
            onChange={(e) => updateAddress("addressLine1", e.target.value)}
            placeholder={t("joinWizard.address.streetPlaceholder")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="addressLine2">{t("joinWizard.address.apartment")}</Label>
          <Input
            id="addressLine2"
            value={data.address.addressLine2}
            onChange={(e) => updateAddress("addressLine2", e.target.value)}
            placeholder={t("joinWizard.address.apartmentPlaceholder")}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="city">{t("joinWizard.address.city")} *</Label>
            <Input
              id="city"
              value={data.address.city}
              onChange={(e) => updateAddress("city", e.target.value)}
              placeholder={t("joinWizard.address.city")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="province">{t("joinWizard.address.province")} *</Label>
            <Select
              value={data.address.province}
              onValueChange={(value) => updateAddress("province", value)}
            >
              <SelectTrigger id="province">
                <SelectValue placeholder={t("joinWizard.address.selectProvince")} />
              </SelectTrigger>
              <SelectContent>
                {spanishProvinces.map((province) => (
                  <SelectItem key={province} value={province}>
                    {province}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="postalCode">{t("joinWizard.address.postalCode")} *</Label>
            <Input
              id="postalCode"
              value={data.address.postalCode}
              onChange={(e) => updateAddress("postalCode", e.target.value)}
              placeholder="00000"
              maxLength={5}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">{t("joinWizard.address.country")}</Label>
            <Select
              value={data.address.country}
              onValueChange={(value) => updateAddress("country", value)}
            >
              <SelectTrigger id="country">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Spain">Spain</SelectItem>
                <SelectItem value="Portugal">Portugal</SelectItem>
                <SelectItem value="Andorra">Andorra</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}