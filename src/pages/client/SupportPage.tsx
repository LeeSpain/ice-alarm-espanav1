import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Phone, 
  MessageCircle, 
  Mail, 
  Smartphone, 
  Loader2,
  Send,
  HelpCircle
} from "lucide-react";
import { toast } from "sonner";

const FAQ_ITEMS = [
  {
    id: "test-pendant",
    question: "How do I test my pendant?",
    answer: "Press and hold the SOS button for 3 seconds. Our team will answer and confirm your device is working correctly. We recommend testing your pendant once a month."
  },
  {
    id: "sos-button",
    question: "What happens when I press the SOS button?",
    answer: "When you press and hold the SOS button for 3 seconds, an alert is sent to our 24/7 monitoring center. A trained operator will immediately speak to you through your pendant and coordinate any necessary assistance."
  },
  {
    id: "fall-detection",
    question: "How does fall detection work?",
    answer: "Your pendant contains sensors that can detect sudden movements consistent with a fall. If a fall is detected, an automatic alert is sent to our team. We'll call through your pendant to check on you, and if there's no response, we'll follow your emergency protocol."
  },
  {
    id: "geo-fencing",
    question: "What is geo-fencing?",
    answer: "Geo-fencing creates a virtual boundary around a location (like your home). If you travel outside this boundary, an alert can be sent to designated contacts. This is useful for added peace of mind for you and your family."
  },
  {
    id: "update-medical",
    question: "How do I update my medical information?",
    answer: "Go to the 'Medical Info' section in your dashboard. Click 'Request Update' and describe the changes you'd like to make. Our team will review and update your records within 24-48 hours."
  },
  {
    id: "add-contacts",
    question: "How do I add emergency contacts?",
    answer: "Go to 'Emergency Contacts' in your dashboard. You can add up to 3 emergency contacts. These are the people we'll call if we can't reach you during an emergency."
  },
  {
    id: "update-payment",
    question: "How do I update my payment method?",
    answer: "Go to 'Subscription & Billing' in your dashboard. Click 'Update' next to your payment method to securely update your card details."
  },
  {
    id: "lost-pendant",
    question: "What if my pendant is lost or damaged?",
    answer: "Contact us immediately! We can disable your old pendant and send you a replacement. There may be a replacement fee depending on the circumstances. Call us or use the contact form below."
  },
  {
    id: "upgrade-plan",
    question: "Can I upgrade from Single to Couple membership?",
    answer: "Yes! Contact our support team and we'll help you upgrade your membership. The prorated difference will be charged to your payment method on file."
  },
];

export default function SupportPage() {
  const [contactForm, setContactForm] = useState({
    subject: "",
    message: "",
  });
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.subject.trim() || !contactForm.message.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSending(true);
    // In production, this would send to a support queue
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.success("Message sent! We'll get back to you soon.");
    setContactForm({ subject: "", message: "" });
    setIsSending(false);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Contact Support</h1>
        <p className="text-muted-foreground mt-1">We're here to help 24/7</p>
      </div>

      {/* Emergency Contact */}
      <Card className="bg-primary text-primary-foreground border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            For Emergencies
          </CardTitle>
          <CardDescription className="text-primary-foreground/80">
            If you have an emergency, press your pendant button!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center">
            <div className="h-32 w-32 bg-white/10 rounded-2xl flex items-center justify-center">
              <Smartphone className="h-16 w-16" />
            </div>
          </div>
          <p className="text-center mt-4 text-primary-foreground/80">
            Hold the SOS button for 3 seconds
          </p>
        </CardContent>
      </Card>

      {/* General Support */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">General Support</CardTitle>
          <CardDescription>
            Contact us for non-emergency questions or assistance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Phone */}
          <a 
            href="tel:+34950473199"
            className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
          >
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Phone className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-medium">Call Us</p>
              <p className="text-xl font-bold text-primary">+34 950 473 199</p>
            </div>
          </a>

          {/* WhatsApp */}
          <a 
            href="https://wa.me/34950473199"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-4 rounded-lg bg-[#25D366]/10 hover:bg-[#25D366]/20 transition-colors"
          >
            <div className="h-12 w-12 rounded-full bg-[#25D366]/20 flex items-center justify-center">
              <MessageCircle className="h-6 w-6 text-[#25D366]" />
            </div>
            <div>
              <p className="font-medium">WhatsApp</p>
              <p className="text-[#25D366] font-medium">Chat with us on WhatsApp</p>
            </div>
          </a>
        </CardContent>
      </Card>

      {/* Contact Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Us a Message
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={contactForm.subject}
                onChange={(e) => setContactForm(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="What can we help you with?"
                className="touch-target"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={contactForm.message}
                onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Please describe your question or issue..."
                rows={5}
              />
            </div>
            <Button type="submit" disabled={isSending} className="w-full touch-target">
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Message
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {FAQ_ITEMS.map((item) => (
              <AccordionItem key={item.id} value={item.id}>
                <AccordionTrigger className="text-left">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
