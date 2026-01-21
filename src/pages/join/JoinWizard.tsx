import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Check, User, Users, MapPin, Heart, Phone, Smartphone, FileText, PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils";
import { JoinWizardData, initialJoinWizardData } from "@/types/wizard";
import { Logo } from "@/components/ui/logo";
import { toast } from "sonner";

// Step Components
import { JoinMembershipStep } from "@/components/join/steps/JoinMembershipStep";
import { JoinPersonalStep } from "@/components/join/steps/JoinPersonalStep";
import { JoinAddressStep } from "@/components/join/steps/JoinAddressStep";
import { JoinMedicalStep } from "@/components/join/steps/JoinMedicalStep";
import { JoinContactsStep } from "@/components/join/steps/JoinContactsStep";
import { JoinPendantStep } from "@/components/join/steps/JoinPendantStep";
import { JoinSummaryStep } from "@/components/join/steps/JoinSummaryStep";
import { JoinConfirmationStep } from "@/components/join/steps/JoinConfirmationStep";

const steps = [
  { id: 1, title: "Plan", icon: Users, shortTitle: "Plan" },
  { id: 2, title: "Personal", icon: User, shortTitle: "Personal" },
  { id: 3, title: "Address", icon: MapPin, shortTitle: "Address" },
  { id: 4, title: "Medical", icon: Heart, shortTitle: "Medical" },
  { id: 5, title: "Contacts", icon: Phone, shortTitle: "Contacts" },
  { id: 6, title: "Device", icon: Smartphone, shortTitle: "Device" },
  { id: 7, title: "Review", icon: FileText, shortTitle: "Review" },
  { id: 8, title: "Complete", icon: PartyPopper, shortTitle: "Done" },
];

export default function JoinWizard() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState<JoinWizardData>(initialJoinWizardData);
  const [stepValidation, setStepValidation] = useState<Record<number, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateWizardData = (data: Partial<JoinWizardData>) => {
    setWizardData((prev) => ({ ...prev, ...data }));
  };

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 1:
        return !!wizardData.membershipType;
      case 2:
        const primaryValid = !!(
          wizardData.primaryMember.firstName &&
          wizardData.primaryMember.lastName &&
          wizardData.primaryMember.email &&
          wizardData.primaryMember.phone &&
          wizardData.primaryMember.dateOfBirth
        );
        if (wizardData.membershipType === "couple") {
          const partnerValid = !!(
            wizardData.partnerMember?.firstName &&
            wizardData.partnerMember?.lastName &&
            wizardData.partnerMember?.email &&
            wizardData.partnerMember?.phone &&
            wizardData.partnerMember?.dateOfBirth
          );
          return primaryValid && partnerValid;
        }
        return primaryValid;
      case 3:
        return !!(
          wizardData.address.addressLine1 &&
          wizardData.address.city &&
          wizardData.address.province &&
          wizardData.address.postalCode
        );
      case 4:
        return true; // Medical info is optional
      case 5:
        return wizardData.emergencyContacts.length >= 1;
      case 6:
        return true; // Pendant option always valid
      case 7:
        return wizardData.acceptTerms && wizardData.acceptPrivacy;
      case 8:
        return true;
      default:
        return true;
    }
  };

  const getValidationMessage = (): string | null => {
    switch (currentStep) {
      case 2:
        if (!wizardData.primaryMember.firstName || !wizardData.primaryMember.lastName) {
          return "Please enter your full name";
        }
        if (!wizardData.primaryMember.email) {
          return "Please enter your email address";
        }
        if (!wizardData.primaryMember.phone) {
          return "Please enter your phone number";
        }
        if (!wizardData.primaryMember.dateOfBirth) {
          return "Please enter your date of birth";
        }
        if (wizardData.membershipType === "couple") {
          if (!wizardData.partnerMember?.firstName || !wizardData.partnerMember?.lastName) {
            return "Please enter your partner's full name";
          }
          if (!wizardData.partnerMember?.email) {
            return "Please enter your partner's email address";
          }
          if (!wizardData.partnerMember?.phone) {
            return "Please enter your partner's phone number";
          }
          if (!wizardData.partnerMember?.dateOfBirth) {
            return "Please enter your partner's date of birth";
          }
        }
        return null;
      case 3:
        if (!wizardData.address.addressLine1) {
          return "Please enter your street address";
        }
        if (!wizardData.address.city) {
          return "Please enter your city";
        }
        if (!wizardData.address.province) {
          return "Please select your province";
        }
        if (!wizardData.address.postalCode) {
          return "Please enter your postal code";
        }
        return null;
      case 5:
        return "Please add at least one emergency contact";
      case 7:
        if (!wizardData.acceptTerms) {
          return "Please accept the Terms of Service";
        }
        if (!wizardData.acceptPrivacy) {
          return "Please consent to share medical information with emergency services";
        }
        return null;
      default:
        return null;
    }
  };

  const handleNext = async () => {
    if (validateCurrentStep()) {
      setStepValidation((prev) => ({ ...prev, [currentStep]: true }));
      
      if (currentStep === 7) {
        // Submit registration
        setIsSubmitting(true);
        try {
          // Simulate API call - in production this would create the member in DB
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Generate a mock order ID
          const orderId = `ICE-${Date.now().toString(36).toUpperCase()}`;
          updateWizardData({ orderId, paymentComplete: true });
          
          toast.success("Registration successful!");
          setCurrentStep(8);
        } catch (error) {
          toast.error("Registration failed. Please try again.");
        } finally {
          setIsSubmitting(false);
        }
      } else if (currentStep < steps.length) {
        setCurrentStep(currentStep + 1);
      }
    } else {
      const message = getValidationMessage();
      if (message) {
        toast.error(message);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepId: number) => {
    // Allow navigation to completed steps or current step (but not beyond, and not after completion)
    if (stepId <= currentStep && currentStep < 8) {
      setCurrentStep(stepId);
    }
  };

  const progress = ((currentStep - 1) / (steps.length - 1)) * 100;

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <JoinMembershipStep data={wizardData} onUpdate={updateWizardData} />;
      case 2:
        return <JoinPersonalStep data={wizardData} onUpdate={updateWizardData} />;
      case 3:
        return <JoinAddressStep data={wizardData} onUpdate={updateWizardData} />;
      case 4:
        return <JoinMedicalStep data={wizardData} onUpdate={updateWizardData} />;
      case 5:
        return <JoinContactsStep data={wizardData} onUpdate={updateWizardData} />;
      case 6:
        return <JoinPendantStep data={wizardData} onUpdate={updateWizardData} />;
      case 7:
        return <JoinSummaryStep data={wizardData} onUpdate={updateWizardData} />;
      case 8:
        return <JoinConfirmationStep data={wizardData} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container max-w-5xl flex items-center justify-between py-4">
          <Link to="/" className="flex items-center gap-2">
            <Logo className="h-8 w-auto" />
          </Link>
          {currentStep < 8 && (
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
              Exit
            </Link>
          )}
        </div>
      </header>

      <main className="container max-w-4xl py-8 px-4">
        {currentStep < 8 && (
          <>
            {/* Progress Bar */}
            <Progress value={progress} className="h-2 mb-6" />

            {/* Step Indicators - Mobile: Icons only, Desktop: Icons + Text */}
            <div className="flex justify-between mb-8 overflow-x-auto pb-2">
              {steps.slice(0, -1).map((step) => {
                const StepIcon = step.icon;
                const isCompleted = stepValidation[step.id];
                const isCurrent = step.id === currentStep;
                const isClickable = step.id <= currentStep;

                return (
                  <button
                    key={step.id}
                    onClick={() => handleStepClick(step.id)}
                    disabled={!isClickable}
                    className={cn(
                      "flex flex-col items-center gap-1 min-w-[60px] md:min-w-[80px] p-2 rounded-lg transition-colors",
                      isClickable && "cursor-pointer hover:bg-accent",
                      !isClickable && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                        isCurrent && "bg-primary text-primary-foreground",
                        isCompleted && !isCurrent && "bg-status-active text-white",
                        !isCurrent && !isCompleted && "bg-muted text-muted-foreground"
                      )}
                    >
                      {isCompleted && !isCurrent ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <StepIcon className="h-5 w-5" />
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-xs font-medium text-center hidden md:block",
                        isCurrent && "text-primary",
                        !isCurrent && "text-muted-foreground"
                      )}
                    >
                      {step.shortTitle}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Step Content */}
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-8 pb-8 px-6 md:px-10">
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        {currentStep < 8 && (
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>

            <Button 
              onClick={handleNext} 
              className="gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>Processing...</>
              ) : currentStep === 7 ? (
                <>
                  Complete Registration
                  <Check className="h-4 w-4" />
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t py-6 mt-auto">
        <div className="container max-w-4xl text-center text-sm text-muted-foreground">
          <p>
            Need help?{" "}
            <a href="tel:+34900000000" className="text-primary hover:underline">
              Call +34 900 000 000
            </a>{" "}
            or{" "}
            <a href="mailto:support@icealarm.es" className="text-primary hover:underline">
              email us
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
