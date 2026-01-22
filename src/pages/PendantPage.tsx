import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/ui/logo";
import { LanguageSelector } from "@/components/LanguageSelector";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowRight,
  Phone,
  MapPin,
  Shield,
  Mic,
  AlertTriangle,
  Battery,
  Navigation,
  Check,
  X,
  Star,
  Clock,
  Users,
  Zap,
  Droplets,
  Signal,
  ChevronRight
} from "lucide-react";
import { useWebsiteImagesBatch } from "@/hooks/useWebsiteImage";

export default function PendantPage() {
  const { t } = useTranslation();
  
  // Batch fetch all images in a single query
  const { getImage } = useWebsiteImagesBatch(["pendant_hero", "pendant_specs"]);
  const pendantHeroImage = getImage("pendant_hero");
  const pendantSpecsImage = getImage("pendant_specs");

  const features = [
    {
      icon: MapPin,
      title: "GPS Location Tracking",
      description: "When you press the SOS button, your exact location is instantly sent to our call centre. No need to explain where you are - we already know and can send help directly to you.",
      bullets: [
        "Works anywhere in Spain with mobile coverage",
        "Accurate to within a few meters",
        "Location shared with emergency services when needed"
      ]
    },
    {
      icon: Mic,
      title: "Two-Way Voice Communication",
      description: "Speak directly with our team through the pendant's built-in speaker and microphone. No phone needed - just press and talk.",
      bullets: [
        "Crystal clear audio quality",
        "Loud speaker for those hard of hearing",
        "English and Spanish speaking operators"
      ]
    },
    {
      icon: AlertTriangle,
      title: "Automatic Fall Detection",
      description: "Built-in sensors detect when you've fallen and automatically alert our call centre - even if you can't press the button.",
      bullets: [
        "Detects hard falls automatically",
        "Alert sent even if you're unconscious",
        "Peace of mind for you and your family"
      ]
    },
    {
      icon: Navigation,
      title: "Geo-Fencing Alerts",
      description: "Set up a safe zone around your home. If the pendant leaves this area, we're notified immediately. Perfect for peace of mind.",
      bullets: [
        "Customizable boundary radius",
        "Ideal for dementia care",
        "Family members can be notified"
      ]
    },
    {
      icon: Battery,
      title: "Long Battery Life",
      description: "The pendant lasts for days on a single charge. We monitor battery levels and alert you when it's time to recharge.",
      bullets: [
        "Up to 5 days standby time",
        "Low battery alerts sent to you and our team",
        "Easy magnetic charging cable included"
      ]
    }
  ];

  const specs = [
    { label: "Size", value: "45mm x 40mm x 15mm" },
    { label: "Weight", value: "35 grams" },
    { label: "Water Resistant", value: "IP67 rated" },
    { label: "Battery", value: "Up to 5 days standby" },
    { label: "Connectivity", value: "4G LTE + GPS" },
    { label: "SOS Button", value: "Large, easy to press" },
    { label: "Wearing", value: "Lanyard or belt clip" }
  ];

  const testimonials = [
    {
      quote: "ICE Alarm gave me back my independence. I feel safe knowing help is just one button press away.",
      author: "Margaret",
      location: "Alicante"
    },
    {
      quote: "When my father fell, the pendant automatically called for help. The team was amazing and spoke to him in English. They saved his life.",
      author: "David",
      location: "Son of ICE Alarm member"
    },
    {
      quote: "The peace of mind this gives our family is priceless. Mum can live independently knowing we'll be called if anything happens.",
      author: "Sarah",
      location: "Málaga"
    }
  ];

  const faqs = [
    {
      question: "How do I use the pendant?",
      answer: "Simply press and hold the SOS button for 3 seconds. Our call centre will answer and speak to you through the pendant."
    },
    {
      question: "Does it work everywhere in Spain?",
      answer: "Yes! The pendant works anywhere with mobile phone coverage across Spain."
    },
    {
      question: "What happens if I fall and can't press the button?",
      answer: "The pendant has automatic fall detection. If it detects a fall, it will alert our call centre even if you don't press the button."
    },
    {
      question: "Can I speak English with your call centre?",
      answer: "Absolutely! All our operators speak both English and Spanish fluently."
    },
    {
      question: "What if I don't want a pendant?",
      answer: "You can join with just a membership and use your phone to call us. However, you won't have GPS tracking, fall detection, or the SOS button features."
    },
    {
      question: "How long does the battery last?",
      answer: "Up to 5 days on standby. We monitor battery levels and will alert you when it needs charging."
    },
    {
      question: "Is there a contract?",
      answer: "No long-term contracts! You can cancel anytime. We offer monthly and annual billing options."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/">
            <Logo size="sm" />
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm font-medium hover:text-primary transition-colors">
              Home
            </Link>
            <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">
              Features
            </a>
            <Link to="/pendant" className="text-sm font-medium text-primary">
              Pendant
            </Link>
            <a href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">
              Pricing
            </a>
            <Link to="/contact" className="text-sm font-medium hover:text-primary transition-colors">
              Contact
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <Button variant="ghost" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link to="/join">Join Now</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Product Image */}
            <div className="relative order-2 lg:order-1">
              <div className="relative mx-auto max-w-md">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent rounded-3xl blur-3xl -z-10" />
                <div className="aspect-square overflow-hidden rounded-2xl shadow-2xl bg-muted">
                  <img
                    src={pendantHeroImage.imageUrl}
                    alt={pendantHeroImage.altText || "ICE Alarm GPS Personal Pendant"}
                    className="w-full h-full object-cover object-center"
                    loading="eager"
                    decoding="async"
                  />
                </div>
                {/* Trust Badge */}
                <div className="absolute -bottom-4 -right-4 bg-card rounded-xl shadow-xl p-3 border">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-full bg-status-active/20 flex items-center justify-center">
                      <Shield className="h-5 w-5 text-status-active" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">IP67 Rated</p>
                      <p className="text-xs text-muted-foreground">Water Resistant</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-6 order-1 lg:order-2">
              <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
                🇪🇸 Designed for Expats in Spain
              </Badge>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Your Lifeline in Spain
              </h1>
              
              <p className="text-xl text-muted-foreground">
                The ICE Alarm GPS Personal Pendant gives you and your loved ones peace of mind, wherever you are in Spain.
              </p>

              <ul className="space-y-3">
                {[
                  "24/7 English & Spanish Support",
                  "GPS Location Tracking",
                  "Automatic Fall Detection",
                  "Two-Way Communication"
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-full bg-status-active/20 flex items-center justify-center shrink-0">
                      <Check className="h-4 w-4 text-status-active" />
                    </div>
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button size="lg" className="h-14 px-8 text-lg shadow-lg" asChild>
                  <Link to="/join">
                    Join ICE Alarm Today
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg" asChild>
                  <a href="tel:+34950473199">
                    <Phone className="mr-2 h-5 w-5" />
                    +34 950 473 199
                  </a>
                </Button>
              </div>

              <p className="text-muted-foreground">
                Starting from <span className="font-bold text-foreground">€27.49/month</span> + pendant
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Getting help has never been easier. Just three simple steps.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                step: 1,
                icon: "👆",
                title: "Press the SOS Button",
                description: "One press is all it takes to alert our call centre. The button is large and easy to press, even in an emergency."
              },
              {
                step: 2,
                icon: "📞",
                title: "We Answer Immediately",
                description: "Our bilingual team responds 24/7/365 to help. We'll speak to you through the pendant to assess the situation."
              },
              {
                step: 3,
                icon: "🚑",
                title: "Help Arrives When Needed",
                description: "We coordinate with emergency services and your family. Your GPS location helps us send help directly to you."
              }
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="relative inline-block mb-6">
                  <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center text-4xl">
                    {item.icon}
                  </div>
                  <div className="absolute -top-2 -left-2 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Pendant Features</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              The ICE Alarm pendant is packed with life-saving technology.
            </p>
          </div>

          <div className="space-y-6 max-w-4xl mx-auto">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className={index % 2 === 0 ? "bg-muted/30" : ""}>
                  <CardContent className="p-6 md:p-8">
                    <div className="flex items-start gap-6">
                      <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="h-7 w-7 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                        <p className="text-muted-foreground mb-4">{feature.description}</p>
                        <ul className="space-y-2">
                          {feature.bullets.map((bullet) => (
                            <li key={bullet} className="flex items-center gap-2 text-sm">
                              <Check className="h-4 w-4 text-status-active shrink-0" />
                              {bullet}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Specifications */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
            <div>
              <h2 className="text-3xl font-bold mb-6">Technical Specifications</h2>
              <div className="grid gap-4">
                {specs.map((spec) => (
                  <div key={spec.label} className="flex justify-between items-center py-3 border-b">
                    <span className="font-medium">{spec.label}</span>
                    <span className="text-muted-foreground">{spec.value}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-4 mt-6">
                <Badge variant="outline" className="gap-1">
                  <Droplets className="h-3 w-3" />
                  Water Resistant
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Signal className="h-3 w-3" />
                  4G LTE
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Zap className="h-3 w-3" />
                  Fast Charging
                </Badge>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square max-w-sm mx-auto overflow-hidden rounded-2xl shadow-xl bg-muted">
                <img
                  src={pendantSpecsImage.imageUrl}
                  alt={pendantSpecsImage.altText || "ICE Alarm Pendant Specifications"}
                  className="w-full h-full object-cover object-center"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Choose Your Service</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Both options include our 24/7 bilingual call centre support.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Phone Only */}
            <Card>
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold mb-2">Phone Only Service</h3>
                <p className="text-sm text-muted-foreground mb-4">Use your existing phone</p>
                <div className="mb-6">
                  <span className="text-3xl font-bold">€27.49</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-status-active" />
                    24/7 Call Centre
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-status-active" />
                    English & Spanish
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-status-active" />
                    Emergency Response
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <X className="h-4 w-4" />
                    No GPS Tracking
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <X className="h-4 w-4" />
                    No Fall Detection
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <X className="h-4 w-4" />
                    No SOS Button
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <X className="h-4 w-4" />
                    No Geo-Fencing
                  </li>
                </ul>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/join">Select Phone Only</Link>
                </Button>
              </CardContent>
            </Card>

            {/* With Pendant - Recommended */}
            <Card className="border-primary shadow-lg relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">
                  Recommended
                </Badge>
              </div>
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold mb-2">Pendant + Membership</h3>
                <p className="text-sm text-muted-foreground mb-4">Full protection package</p>
                <div className="mb-6">
                  <span className="text-3xl font-bold">€27.49</span>
                  <span className="text-muted-foreground">/month</span>
                  <p className="text-sm text-muted-foreground mt-1">+ €151.25 pendant (one-time)</p>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-status-active" />
                    24/7 Call Centre
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-status-active" />
                    English & Spanish
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-status-active" />
                    Emergency Response
                  </li>
                  <li className="flex items-center gap-2 text-sm font-medium">
                    <Check className="h-4 w-4 text-status-active" />
                    GPS Location Tracking
                  </li>
                  <li className="flex items-center gap-2 text-sm font-medium">
                    <Check className="h-4 w-4 text-status-active" />
                    Automatic Fall Detection
                  </li>
                  <li className="flex items-center gap-2 text-sm font-medium">
                    <Check className="h-4 w-4 text-status-active" />
                    SOS Button
                  </li>
                  <li className="flex items-center gap-2 text-sm font-medium">
                    <Check className="h-4 w-4 text-status-active" />
                    Geo-Fencing Alerts
                  </li>
                </ul>
                <Button className="w-full" asChild>
                  <Link to="/join">
                    Select with Pendant
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Details */}
      <section id="pricing" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              All prices include IVA. No hidden fees.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
            {/* Single */}
            <Card>
              <CardContent className="p-8 text-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Single Membership</h3>
                <p className="text-sm text-muted-foreground mb-6">For one person</p>
                <div className="space-y-2 mb-6">
                  <div>
                    <span className="text-2xl font-bold">€27.49</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    or <span className="font-medium text-foreground">€274.89/year</span>
                    <Badge variant="secondary" className="ml-2">Save €54.99!</Badge>
                  </div>
                </div>
                <Button className="w-full" asChild>
                  <Link to="/join">Get Started</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Couple */}
            <Card className="border-primary">
              <CardContent className="p-8 text-center">
                <Badge className="bg-primary text-primary-foreground mb-4">Most Popular</Badge>
                <h3 className="text-xl font-semibold mb-2">Couple Membership</h3>
                <p className="text-sm text-muted-foreground mb-6">For two people (same address)</p>
                <div className="space-y-2 mb-6">
                  <div>
                    <span className="text-2xl font-bold">€38.49</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    or <span className="font-medium text-foreground">€384.89/year</span>
                    <Badge variant="secondary" className="ml-2">Save €76.99!</Badge>
                  </div>
                </div>
                <Button className="w-full" asChild>
                  <Link to="/join">Get Started</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* One-time fees */}
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-6">
              <h4 className="font-semibold mb-4">One-Time Fees</h4>
              <div className="grid gap-3">
                <div className="flex justify-between items-center">
                  <span>Registration Fee</span>
                  <span className="font-medium">€59.99</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>GPS Pendant (optional but recommended)</span>
                  <span className="font-medium">€151.25</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Shipping (if ordering pendant)</span>
                  <span className="font-medium">€14.99</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-6 w-6 fill-current" />
              ))}
            </div>
            <h2 className="text-3xl font-bold mb-4">What Our Members Say</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.author} className="bg-primary-foreground/10 border-primary-foreground/20">
                <CardContent className="p-6">
                  <blockquote className="text-lg mb-4">
                    "{testimonial.quote}"
                  </blockquote>
                  <cite className="block">
                    <span className="font-medium">— {testimonial.author}</span>
                    <span className="text-primary-foreground/70">, {testimonial.location}</span>
                  </cite>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary/10 to-primary/5">
        <div className="container mx-auto text-center max-w-2xl">
          <h2 className="text-3xl font-bold mb-4">Ready to Join the ICE Alarm Family?</h2>
          <p className="text-muted-foreground mb-8">
            Get 24/7 peace of mind for you and your loved ones. Join thousands of families across Spain who trust ICE Alarm.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="h-14 px-8 text-lg" asChild>
              <Link to="/join">
                Join ICE Alarm Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg" asChild>
              <a href="tel:+34950473199">
                <Phone className="mr-2 h-5 w-5" />
                +34 950 473 199
              </a>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-6">
            Or WhatsApp us anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-sidebar text-sidebar-foreground">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <Logo variant="white" size="sm" className="mb-4" />
              <p className="text-sm text-sidebar-foreground/70">
                Your lifeline in Spain. 24/7 emergency response for expats and residents.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-sidebar-foreground/70">
                <li>+34 950 473 199</li>
                <li>info@icealarm.es</li>
                <li>WhatsApp Available</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-sidebar-foreground/70">
                <li><Link to="/" className="hover:text-sidebar-foreground">Home</Link></li>
                <li><Link to="/pendant" className="hover:text-sidebar-foreground">Pendant</Link></li>
                <li><Link to="/contact" className="hover:text-sidebar-foreground">Contact</Link></li>
                <li><Link to="/join" className="hover:text-sidebar-foreground">Join Now</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-sidebar-foreground/70">
                <li><Link to="/terms" className="hover:text-sidebar-foreground">Terms of Service</Link></li>
                <li><Link to="/privacy" className="hover:text-sidebar-foreground">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-sidebar-border pt-8 text-center text-sm text-sidebar-foreground/60">
            <p>ICE Alarm España S.L. • CIF: B24731531</p>
            <p className="mt-1">© {new Date().getFullYear()} ICE Alarm España. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}