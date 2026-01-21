import { ArrowRight, Phone, Shield, Clock, Heart, Users, Check, Star, Play, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/ui/logo";
import { Link } from "react-router-dom";
import heroFamily from "@/assets/hero-family.jpg";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Logo size="sm" />
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">
              Pricing
            </a>
            <a href="#contact" className="text-sm font-medium hover:text-primary transition-colors">
              Contact
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link to="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section - Enhanced */}
      <section className="pt-24 pb-12 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-accent/30 -z-10" />
        <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl -z-10" />
        
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-alert-resolved opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-alert-resolved"></span>
                </span>
                <span className="text-sm font-medium text-primary">24/7 Emergency Response in Spain</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
                Peace of Mind for 
                <span className="text-gradient block mt-2">Your Family in Spain</span>
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground max-w-xl mx-auto lg:mx-0">
                Professional 24/7 emergency medical response for English and Spanish-speaking 
                expats. One press of a button connects you to our bilingual response team.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <Button size="lg" className="h-14 px-8 text-lg shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all" asChild>
                  <Link to="/register">
                    Start Your Protection
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg group">
                  <Phone className="mr-2 h-5 w-5 group-hover:animate-pulse" />
                  +34 900 123 456
                </Button>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-3 pt-4">
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-5 w-5 rounded-full bg-alert-resolved/20 flex items-center justify-center">
                    <Check className="h-3 w-3 text-alert-resolved" />
                  </div>
                  <span className="text-muted-foreground">No contracts</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-5 w-5 rounded-full bg-alert-resolved/20 flex items-center justify-center">
                    <Check className="h-3 w-3 text-alert-resolved" />
                  </div>
                  <span className="text-muted-foreground">Cancel anytime</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-5 w-5 rounded-full bg-alert-resolved/20 flex items-center justify-center">
                    <Check className="h-3 w-3 text-alert-resolved" />
                  </div>
                  <span className="text-muted-foreground">English & Spanish</span>
                </div>
              </div>
            </div>

            {/* Right Image */}
            <div className="relative">
              {/* Main image container */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-primary/10">
                <img 
                  src={heroFamily} 
                  alt="Happy multigenerational family enjoying peace of mind with ICE Alarm protection" 
                  className="w-full h-auto object-cover"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
              </div>

              {/* Floating stats card */}
              <div className="absolute -bottom-6 -left-6 bg-card rounded-2xl shadow-xl p-4 border animate-fade-up hidden md:block">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-alert-resolved/20 flex items-center justify-center">
                    <ShieldCheck className="h-6 w-6 text-alert-resolved" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">10,000+</p>
                    <p className="text-sm text-muted-foreground">Families Protected</p>
                  </div>
                </div>
              </div>

              {/* Floating response time card */}
              <div className="absolute -top-4 -right-4 bg-card rounded-2xl shadow-xl p-4 border animate-fade-up hidden md:block" style={{ animationDelay: '0.2s' }}>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">&lt;30 sec</p>
                    <p className="text-sm text-muted-foreground">Response Time</p>
                  </div>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] rounded-full border border-primary/10" />
              <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] rounded-full border border-primary/5" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose ICE Alarm España?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We understand the unique needs of expats living in Spain. Our service is designed 
              specifically for you.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">24/7 Response</h3>
                <p className="text-muted-foreground text-sm">
                  Round-the-clock monitoring with immediate response to all alerts, day or night.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Bilingual Support</h3>
                <p className="text-muted-foreground text-sm">
                  Fluent English and Spanish operators who can communicate with you and local services.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">GPS Location</h3>
                <p className="text-muted-foreground text-sm">
                  Automatic location sharing ensures help finds you quickly, wherever you are.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Medical Profile</h3>
                <p className="text-muted-foreground text-sm">
                  Your medical information is instantly available to responders for better care.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that fits your needs. All plans include 24/7 monitoring and bilingual support.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Single Plan */}
            <Card className="relative">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-lg mb-2">Single Person</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold">€24.99</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-alert-resolved" />
                    One pendant device
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-alert-resolved" />
                    24/7 monitoring
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-alert-resolved" />
                    GPS location
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-alert-resolved" />
                    Fall detection
                  </li>
                </ul>
                <Button className="w-full" variant="outline">
                  Get Started
                </Button>
              </CardContent>
            </Card>

            {/* Couple Plan */}
            <Card className="relative border-primary shadow-glow">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                  Most Popular
                </span>
              </div>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-lg mb-2">Couple</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold">€39.99</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-alert-resolved" />
                    Two pendant devices
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-alert-resolved" />
                    24/7 monitoring
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-alert-resolved" />
                    GPS location
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-alert-resolved" />
                    Fall detection
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-alert-resolved" />
                    Linked accounts
                  </li>
                </ul>
                <Button className="w-full">
                  Get Started
                </Button>
              </CardContent>
            </Card>

            {/* Family Plan */}
            <Card className="relative">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-lg mb-2">Family</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold">€54.99</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-alert-resolved" />
                    Up to 4 devices
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-alert-resolved" />
                    24/7 monitoring
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-alert-resolved" />
                    GPS location
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-alert-resolved" />
                    Fall detection
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-alert-resolved" />
                    Priority support
                  </li>
                </ul>
                <Button className="w-full" variant="outline">
                  Get Started
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto text-center max-w-3xl">
          <div className="flex justify-center mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-6 w-6 fill-current" />
            ))}
          </div>
          <blockquote className="text-xl md:text-2xl font-medium mb-6">
            "ICE Alarm gave me peace of mind after my husband's heart attack. 
            Knowing that help is just one button press away, in a language I understand, 
            has made all the difference living abroad."
          </blockquote>
          <cite className="text-primary-foreground/80">
            — Margaret Thompson, British expat in Mojácar
          </cite>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="py-12 px-4 bg-sidebar text-sidebar-foreground">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <Logo variant="white" size="sm" className="mb-4" />
              <p className="text-sm text-sidebar-foreground/70">
                24/7 emergency medical response for English and Spanish-speaking expats in Spain.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-sidebar-foreground/70">
                <li>+34 900 123 456</li>
                <li>info@icealarm.es</li>
                <li>Calle Principal 1, Albox</li>
                <li>04800 Almería, Spain</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Links</h4>
              <ul className="space-y-2 text-sm text-sidebar-foreground/70">
                <li><a href="#" className="hover:text-sidebar-foreground transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-sidebar-foreground transition-colors">How It Works</a></li>
                <li><a href="#" className="hover:text-sidebar-foreground transition-colors">FAQs</a></li>
                <li><a href="#" className="hover:text-sidebar-foreground transition-colors">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-sidebar-foreground/70">
                <li><a href="#" className="hover:text-sidebar-foreground transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-sidebar-foreground transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-sidebar-foreground transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-sidebar-border pt-8 text-center text-sm text-sidebar-foreground/60">
            <p>© {new Date().getFullYear()} ICE Alarm España. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
