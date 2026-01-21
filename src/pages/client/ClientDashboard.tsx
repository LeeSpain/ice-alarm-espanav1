import { Phone, MessageCircle, ArrowRight, Calendar, CreditCard } from "lucide-react";
import { DeviceStatusCard } from "@/components/dashboard/DeviceStatusCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

export default function ClientDashboard() {
  const memberName = "María";
  const currentDate = new Date().toLocaleDateString('en-GB', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* Welcome Section */}
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Welcome back, {memberName}
        </h1>
        <p className="text-muted-foreground">{currentDate}</p>
      </div>

      {/* Device Status */}
      <DeviceStatusCard
        batteryLevel={78}
        isConnected={true}
        lastCheckIn={new Date(Date.now() - 1000 * 60 * 30)}
        location="Calle Mayor 42, Albox, Almería"
      />

      {/* Emergency Contact Button */}
      <Card className="bg-primary text-primary-foreground overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-xl font-semibold mb-1">Need Help?</h2>
              <p className="text-primary-foreground/80">
                Our 24/7 emergency response team is always ready to help
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                size="lg" 
                variant="secondary"
                className="h-14 px-6 text-base font-semibold"
              >
                <Phone className="mr-2 h-5 w-5" />
                Call ICE Alarm
              </Button>
              <Button 
                size="lg" 
                className="h-14 px-6 text-base font-semibold bg-[#25D366] hover:bg-[#128C7E] text-white"
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                WhatsApp
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Subscription Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Subscription</span>
              <Badge variant="outline" className="bg-alert-resolved/10 text-alert-resolved border-alert-resolved/30">
                Active
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Plan</span>
              <span className="font-medium">Single Person</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Next Payment</span>
              <span className="font-medium flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                15 Feb 2025
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-medium">€29.99/month</span>
            </div>
            <Button variant="outline" className="w-full mt-2" asChild>
              <Link to="/dashboard/subscription">
                <CreditCard className="mr-2 h-4 w-4" />
                Manage Subscription
                <ArrowRight className="ml-auto h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Emergency Contacts Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Emergency Contacts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div>
                  <span className="font-medium block">Juan García</span>
                  <span className="text-sm text-muted-foreground">Husband</span>
                </div>
                <Badge variant="secondary">Primary</Badge>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div>
                  <span className="font-medium block">Ana García</span>
                  <span className="text-sm text-muted-foreground">Daughter</span>
                </div>
                <Badge variant="outline">2nd</Badge>
              </div>
            </div>
            <Button variant="outline" className="w-full" asChild>
              <Link to="/dashboard/contacts">
                Update Contacts
                <ArrowRight className="ml-auto h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Announcements */}
      <Card className="border-alert-checkin/30 bg-alert-checkin/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-alert-checkin/20 flex items-center justify-center shrink-0">
              <span className="text-lg">📢</span>
            </div>
            <div>
              <h3 className="font-semibold">Service Announcement</h3>
              <p className="text-sm text-muted-foreground mt-1">
                We've upgraded our response system! Your alerts now reach our team 30% faster. 
                Thank you for trusting ICE Alarm España with your safety.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
