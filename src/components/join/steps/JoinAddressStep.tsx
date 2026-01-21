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
        <h2 className="text-2xl font-bold">Service Address</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Where will you be using the service? This is where emergency services will be directed.
        </p>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-start gap-3">
          <MapPin className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-sm">Emergency Response</p>
            <p className="text-xs text-muted-foreground">
              This address is shared with emergency services for rapid response.
            </p>
          </div>
        </div>
        {data.includePendant && (
          <div className="bg-muted/50 border rounded-lg p-4 flex items-start gap-3">
            <Truck className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-sm">Shipping Address</p>
              <p className="text-xs text-muted-foreground">
                Your pendant device will be shipped to this address.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4 pt-4">
        <div className="space-y-2">
          <Label htmlFor="addressLine1">Street Address *</Label>
          <Input
            id="addressLine1"
            value={data.address.addressLine1}
            onChange={(e) => updateAddress("addressLine1", e.target.value)}
            placeholder="Street name and number"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="addressLine2">Apartment, Floor, Building</Label>
          <Input
            id="addressLine2"
            value={data.address.addressLine2}
            onChange={(e) => updateAddress("addressLine2", e.target.value)}
            placeholder="Optional - apartment, floor, building details"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              value={data.address.city}
              onChange={(e) => updateAddress("city", e.target.value)}
              placeholder="City"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="province">Province *</Label>
            <Select
              value={data.address.province}
              onValueChange={(value) => updateAddress("province", value)}
            >
              <SelectTrigger id="province">
                <SelectValue placeholder="Select province" />
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
            <Label htmlFor="postalCode">Postal Code *</Label>
            <Input
              id="postalCode"
              value={data.address.postalCode}
              onChange={(e) => updateAddress("postalCode", e.target.value)}
              placeholder="00000"
              maxLength={5}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
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
