import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  Loader2, Smartphone, Battery, MapPin, Clock, Settings, 
  Send, X, AlertTriangle, Wifi, WifiOff, Package, Truck, CheckCircle, Wrench
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, formatDistanceToNow } from "date-fns";
import { LocationMap } from "@/components/maps/LocationMap";
import { useDeviceRealtime } from "@/hooks/useDeviceRealtime";

interface Device {
  id: string;
  imei: string;
  sim_phone_number: string;
  device_type: string;
  status: string;
  battery_level: number | null;
  last_checkin_at: string | null;
  last_location_lat: number | null;
  last_location_lng: number | null;
  last_location_address: string | null;
  configuration_status: string;
  is_online: boolean | null;
  offline_since: string | null;
  model: string | null;
  collected_at: string | null;
  live_at: string | null;
}

interface DeviceTabProps {
  memberId: string;
}

export function DeviceTab({ memberId }: DeviceTabProps) {
  const [availableDevices, setAvailableDevices] = useState<Device[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const queryClient = useQueryClient();

  // Realtime subscription for device updates
  useDeviceRealtime(memberId);

  // Use React Query for device fetching - benefits from realtime invalidation
  const { data: device, isLoading, refetch } = useQuery({
    queryKey: ["admin-member-device", memberId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("devices")
        .select("*")
        .eq("member_id", memberId)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;
      return data as Device | null;
    },
  });

  const fetchAvailableDevices = async () => {
    try {
      // Only fetch EV-07B devices that are in stock
      const { data, error } = await supabase
        .from("devices")
        .select("*")
        .eq("model", "EV-07B")
        .eq("status", "in_stock")
        .is("member_id", null);

      if (error) throw error;
      setAvailableDevices(data || []);
    } catch (error) {
      console.error("Error fetching available devices:", error);
    }
  };

  const openAssignDialog = () => {
    fetchAvailableDevices();
    setIsDialogOpen(true);
  };

  const assignDevice = async () => {
    if (!selectedDeviceId) return;
    
    setIsAssigning(true);
    try {
      // Assign EV-07B device with allocated status
      const { error } = await supabase
        .from("devices")
        .update({ 
          member_id: memberId, 
          status: "allocated",
          assigned_at: new Date().toISOString()
        })
        .eq("id", selectedDeviceId);

      if (error) throw error;
      toast.success("EV-07B device allocated successfully");
      setIsDialogOpen(false);
      refetch();
    } catch (error) {
      console.error("Error assigning device:", error);
      toast.error("Failed to assign device");
    } finally {
      setIsAssigning(false);
    }
  };

  // Workflow action: Mark device as collected by staff
  const markCollected = async () => {
    if (!device) return;
    try {
      const { error } = await supabase
        .from("devices")
        .update({
          status: "with_staff",
          collected_at: new Date().toISOString(),
        })
        .eq("id", device.id);

      if (error) throw error;
      toast.success("Device marked as collected by staff");
      refetch();
    } catch (error) {
      console.error("Error marking collected:", error);
      toast.error("Failed to update device status");
    }
  };

  // Workflow action: Mark device as live (installed with member)
  const markLive = async () => {
    if (!device) return;
    try {
      const { error } = await supabase
        .from("devices")
        .update({
          status: "live",
          live_at: new Date().toISOString(),
          is_online: true,
        })
        .eq("id", device.id);

      if (error) throw error;
      toast.success("Device marked as live");
      refetch();
    } catch (error) {
      console.error("Error marking live:", error);
      toast.error("Failed to update device status");
    }
  };

  // Workflow action: Mark device as faulty
  const markFaulty = async () => {
    if (!device || !confirm("Mark this device as faulty? This will remove it from the member.")) return;
    try {
      const { error } = await supabase
        .from("devices")
        .update({
          status: "faulty",
          member_id: null,
        })
        .eq("id", device.id);

      if (error) throw error;
      toast.success("Device marked as faulty");
      queryClient.invalidateQueries({ queryKey: ["admin-member-device", memberId] });
    } catch (error) {
      console.error("Error marking faulty:", error);
      toast.error("Failed to update device status");
    }
  };

  const unassignDevice = async () => {
    if (!device || !confirm("Are you sure you want to unassign this device?")) return;
    
    try {
      const { error } = await supabase
        .from("devices")
        .update({ 
          member_id: null, 
          status: "in_stock",
          assigned_at: null
        })
        .eq("id", device.id);

      if (error) throw error;
      toast.success("Device unassigned");
      queryClient.invalidateQueries({ queryKey: ["admin-member-device", memberId] });
    } catch (error) {
      console.error("Error unassigning device:", error);
      toast.error("Failed to unassign device");
    }
  };

  const sendConfigSms = async () => {
    toast.info("Sending configuration SMS...");
    // TODO: Implement SMS sending via Twilio edge function
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Status timeline helper
  const getStatusStep = (status: string) => {
    switch (status) {
      case "allocated": return 1;
      case "with_staff": return 2;
      case "live": return 3;
      default: return 0;
    }
  };

  if (!device) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>EV-07B Device</CardTitle>
          <CardDescription>No EV-07B pendant assigned to this member.</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Smartphone className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">
            This member is currently using phone-only service.
          </p>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAssignDialog}>
                Assign EV-07B Pendant
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign EV-07B Device</DialogTitle>
                <DialogDescription>
                  Select an available EV-07B device from stock to assign to this member.
                </DialogDescription>
              </DialogHeader>
              <Select value={selectedDeviceId} onValueChange={setSelectedDeviceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a device..." />
                </SelectTrigger>
                <SelectContent>
                  {availableDevices.length === 0 ? (
                    <SelectItem value="" disabled>No EV-07B devices in stock</SelectItem>
                  ) : (
                    availableDevices.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        EV-07B - IMEI: {d.imei}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <DialogFooter>
                <Button 
                  onClick={assignDevice} 
                  disabled={!selectedDeviceId || isAssigning}
                >
                  {isAssigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Assign Device
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    );
  }

  const currentStep = getStatusStep(device.status);

  const batteryLevel = device.battery_level ?? 0;
  const batteryColor = batteryLevel > 50 ? "bg-alert-resolved" : batteryLevel > 20 ? "bg-yellow-500" : "bg-destructive";

  return (
    <div className="space-y-6">
      {/* Status Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Device Workflow Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            {/* Step 1: Allocated */}
            <div className="flex flex-col items-center flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                <Package className="h-5 w-5" />
              </div>
              <span className="text-xs mt-1">Allocated</span>
            </div>
            <div className={`flex-1 h-1 mx-2 ${currentStep >= 2 ? 'bg-primary' : 'bg-muted'}`} />
            {/* Step 2: With Staff */}
            <div className="flex flex-col items-center flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                <Truck className="h-5 w-5" />
              </div>
              <span className="text-xs mt-1">With Staff</span>
            </div>
            <div className={`flex-1 h-1 mx-2 ${currentStep >= 3 ? 'bg-primary' : 'bg-muted'}`} />
            {/* Step 3: Live */}
            <div className="flex flex-col items-center flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-green-600 text-white' : 'bg-muted text-muted-foreground'}`}>
                <CheckCircle className="h-5 w-5" />
              </div>
              <span className="text-xs mt-1">Live</span>
            </div>
          </div>
          
          {/* Workflow Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            {device.status === "allocated" && (
              <Button onClick={markCollected} size="sm">
                <Truck className="mr-2 h-4 w-4" />
                Mark Collected
              </Button>
            )}
            {device.status === "with_staff" && (
              <Button onClick={markLive} size="sm" className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark Live
              </Button>
            )}
            {device.status !== "faulty" && (
              <Button variant="outline" onClick={markFaulty} size="sm" className="text-destructive">
                <Wrench className="mr-2 h-4 w-4" />
                Mark Faulty
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Device Info Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              EV-07B Pendant
            </CardTitle>
            <CardDescription>Device assigned to this member</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {/* Online/Offline status */}
            {device.is_online ? (
              <Badge variant="default" className="bg-green-600">
                <Wifi className="h-3 w-3 mr-1" />
                Online
              </Badge>
            ) : (
              <Badge variant="destructive">
                <WifiOff className="h-3 w-3 mr-1" />
                Offline
              </Badge>
            )}
            <Badge 
              variant={device.status === "live" ? "default" : "secondary"}
              className="capitalize"
            >
              {device.status.replace("_", " ")}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Offline warning */}
          {!device.is_online && device.offline_since && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <WifiOff className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-sm font-medium text-destructive">Device Offline</p>
                <p className="text-xs text-muted-foreground">
                  Offline since {formatDistanceToNow(new Date(device.offline_since), { addSuffix: true })}
                </p>
              </div>
            </div>
          )}

          {/* Device Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">IMEI</p>
              <p className="font-mono">{device.imei}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">SIM Number</p>
              <p className="font-mono">{device.sim_phone_number}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Configuration Status</p>
              <Badge 
                variant={device.configuration_status === "complete" ? "default" : "outline"}
                className="capitalize"
              >
                {device.configuration_status}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Check-in</p>
              <p className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {device.last_checkin_at 
                  ? formatDistanceToNow(new Date(device.last_checkin_at), { addSuffix: true })
                  : "Never"
                }
              </p>
            </div>
          </div>

          {/* Battery Level */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium flex items-center gap-1">
                <Battery className="h-4 w-4" />
                Battery Level
              </span>
              <span className="text-sm font-medium">{batteryLevel}%</span>
            </div>
            <Progress value={batteryLevel} className={batteryColor} />
            {batteryLevel <= 20 && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertTriangle className="h-4 w-4" />
                Low battery - member should charge device
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={sendConfigSms}>
              <Send className="mr-2 h-4 w-4" />
              Send Configuration SMS
            </Button>
            <Button variant="outline" className="text-destructive" onClick={unassignDevice}>
              <X className="mr-2 h-4 w-4" />
              Unassign Device
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Location Card */}
      {device.last_location_lat && device.last_location_lng && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Last Known Location
            </CardTitle>
            {device.last_location_address && (
              <CardDescription>{device.last_location_address}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="h-[300px] rounded-lg overflow-hidden">
              <LocationMap 
                lat={Number(device.last_location_lat)} 
                lng={Number(device.last_location_lng)} 
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
