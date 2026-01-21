import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Loader2, Smartphone, Battery, MapPin, Clock, Settings, 
  Send, X, AlertTriangle
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
}

interface DeviceTabProps {
  memberId: string;
}

export function DeviceTab({ memberId }: DeviceTabProps) {
  const [device, setDevice] = useState<Device | null>(null);
  const [availableDevices, setAvailableDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");

  useEffect(() => {
    fetchDevice();
  }, [memberId]);

  const fetchDevice = async () => {
    try {
      const { data, error } = await supabase
        .from("devices")
        .select("*")
        .eq("member_id", memberId)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;
      setDevice(data);
    } catch (error) {
      console.error("Error fetching device:", error);
      toast.error("Failed to load device info");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableDevices = async () => {
    try {
      const { data, error } = await supabase
        .from("devices")
        .select("*")
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
      const { error } = await supabase
        .from("devices")
        .update({ 
          member_id: memberId, 
          status: "active",
          assigned_at: new Date().toISOString()
        })
        .eq("id", selectedDeviceId);

      if (error) throw error;
      toast.success("Device assigned successfully");
      setIsDialogOpen(false);
      fetchDevice();
    } catch (error) {
      console.error("Error assigning device:", error);
      toast.error("Failed to assign device");
    } finally {
      setIsAssigning(false);
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
      setDevice(null);
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

  if (!device) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Device</CardTitle>
          <CardDescription>No pendant or device assigned to this member.</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Smartphone className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">
            This member is currently using phone-only service.
          </p>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAssignDialog}>
                Assign Pendant
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Device</DialogTitle>
                <DialogDescription>
                  Select an available device to assign to this member.
                </DialogDescription>
              </DialogHeader>
              <Select value={selectedDeviceId} onValueChange={setSelectedDeviceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a device..." />
                </SelectTrigger>
                <SelectContent>
                  {availableDevices.length === 0 ? (
                    <SelectItem value="" disabled>No devices available</SelectItem>
                  ) : (
                    availableDevices.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.device_type} - IMEI: {d.imei}
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

  const batteryLevel = device.battery_level ?? 0;
  const batteryColor = batteryLevel > 50 ? "bg-alert-resolved" : batteryLevel > 20 ? "bg-yellow-500" : "bg-destructive";

  return (
    <div className="space-y-6">
      {/* Device Info Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              {device.device_type === "pendant" ? "SOS Pendant" : "Smart Watch"}
            </CardTitle>
            <CardDescription>Device assigned to this member</CardDescription>
          </div>
          <Badge 
            variant={device.status === "active" ? "default" : "secondary"}
            className="capitalize"
          >
            {device.status}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-6">
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
