import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Check, User, Users, MapPin, Heart, Phone, Smartphone, FileText, CreditCard, PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils";
import { JoinWizardData, initialJoinWizardData } from "@/types/wizard";
import { Logo } from "@/components/ui/logo";
import { toast } from "sonner";
import { useRegistrationDraft } from "@/hooks/useRegistrationDraft";

// Step Components
import { JoinMembershipStep } from "@/components/join/steps/JoinMembershipStep";
import { JoinPersonalStep } from "@/components/join/steps/JoinPersonalStep";
import { JoinAddressStep } from "@/components/join/steps/JoinAddressStep";
import { JoinMedicalStep } from "@/components/join/steps/JoinMedicalStep";
import { JoinContactsStep } from "@/components/join/steps/JoinContactsStep";
import { JoinPendantStep } from "@/components/join/steps/JoinPendantStep";
import { JoinSummaryStep } from "@/components/join/steps/JoinSummaryStep";
import { JoinPaymentStep } from "@/components/join/steps/JoinPaymentStep";
import { JoinConfirmationStep } from "@/components/join/steps/JoinConfirmationStep";

const steps = [
  { id: 1, title: "Plan", icon: Users, shortTitle: "Plan" },
  { id: 2, title: "Personal", icon: User, shortTitle: "Personal" },
  { id: 3, title: "Address", icon: MapPin, shortTitle: "Address" },
  { id: 4, title: "Medical", icon: Heart, shortTitle: "Medical" },
  { id: 5, title: "Contacts", icon: Phone, shortTitle: "Contacts" },
  { id: 6, title: "Device", icon: Smartphone, shortTitle: "Device" },
  { id: 7, title: "Review", icon: FileText, shortTitle: "Review" },
  { id: 8, title: "Payment", icon: CreditCard, shortTitle: "Pay" },
  { id: 9, title: "Complete", icon: PartyPopper, shortTitle: "Done" },
];

const WIZARD_STORAGE_KEY = "join_wizard_data";
const PARTNER_REF_KEY = "partner_ref";

export default function JoinWizard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState<JoinWizardData>(initialJoinWizardData);
  const [stepValidation, setStepValidation] = useState<Record<number, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Progressive save hook
  const { saveDraft, clearSession, isSaving } = useRegistrationDraft();

  // Capture partner referral code from URL and store in localStorage
  useEffect(() => {
    const refCode = searchParams.get("ref");
    if (refCode) {
      // Store referral code - first-touch wins, don't overwrite existing
      const existingRef = localStorage.getItem(PARTNER_REF_KEY);
      if (!existingRef) {
        localStorage.setItem(PARTNER_REF_KEY, refCode);
        console.log("Partner referral captured:", refCode);
      }
    }
  }, [searchParams]);

  // Handle return from Stripe checkout
  useEffect(() => {
    const success = searchParams.get("success");
    const cancelled = searchParams.get("cancelled");
    const orderNumber = searchParams.get("order");

    if (success === "true" && orderNumber) {
      // Payment was successful - load saved data and go to confirmation
      const savedData = localStorage.getItem(WIZARD_STORAGE_KEY);
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          setWizardData({
            ...parsed,
            paymentComplete: true,
            orderId: orderNumber,
          });
          setCurrentStep(9); // Go to confirmation step
          toast.success("Payment successful! Welcome to ICE Alarm.");
        } catch (e) {
          console.error("Failed to parse saved wizard data:", e);
        }
      } else {
        // No saved data, but payment was successful
        setWizardData((prev) => ({
          ...prev,
          paymentComplete: true,
          orderId: orderNumber,
        }));
        setCurrentStep(9);
        toast.success("Payment successful! Welcome to ICE Alarm.");
      }
      // Clear saved data and registration session
      localStorage.removeItem(WIZARD_STORAGE_KEY);
      clearSession();
      // Clear URL params
      navigate("/join", { replace: true });
    } else if (cancelled === "true") {
      // Payment was cancelled - restore saved data
      const savedData = localStorage.getItem(WIZARD_STORAGE_KEY);
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          setWizardData(parsed);
          setCurrentStep(8); // Go back to payment step
        } catch (e) {
          console.error("Failed to parse saved wizard data:", e);
        }
      }
      toast.error("Payment was cancelled. You can try again when ready.");
      // Clear URL params
      navigate("/join", { replace: true });
    }
  }, [searchParams, navigate]);

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
        return wizardData.paymentComplete;
      case 9:
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
      
      // Save progress to database before advancing
      // This ensures we capture data even if user abandons later
      await saveDraft(currentStep, wizardData);
      
      if (currentStep < steps.length) {
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
    if (stepId <= currentStep && currentStep < 9) {
      setCurrentStep(stepId);
    }
  };

  const handlePaymentInitiated = () => {
    // Save wizard data to localStorage before redirecting to Stripe
    localStorage.setItem(WIZARD_STORAGE_KEY, JSON.stringify(wizardData));
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
        return (
          <JoinPaymentStep 
            data={wizardData} 
            onUpdate={updateWizardData} 
            onPaymentInitiated={handlePaymentInitiated}
          />
        );
      case 9:
        return <JoinConfirmationStep data={wizardData} />;
      default:
        return null;
    }
  };

  // Don't show navigation buttons on payment step (handled internally) or confirmation step
  const showNavigationButtons = currentStep !== 8 && currentStep !== 9;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container max-w-5xl flex items-center justify-between py-4">
          <Link to="/" className="flex items-center gap-2">
            <Logo className="h-8 w-auto" />
          </Link>
          {currentStep < 9 && (
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
              Exit
            </Link>
          )}
        </div>
      </header>

      <main className="container max-w-4xl py-8 px-4">
        {currentStep < 9 && (
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
                      "flex flex-col items-center gap-1 min-w-[50px] md:min-w-[70px] p-2 rounded-lg transition-colors",
                      isClickable && "cursor-pointer hover:bg-accent",
                      !isClickable && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div
                      className={cn(
                        "w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-colors",
                        isCurrent && "bg-primary text-primary-foreground",
                        isCompleted && !isCurrent && "bg-status-active text-white",
                        !isCurrent && !isCompleted && "bg-muted text-muted-foreground"
                      )}
                    >
                      {isCompleted && !isCurrent ? (
                        <Check className="h-4 w-4 md:h-5 md:w-5" />
                      ) : (
                        <StepIcon className="h-4 w-4 md:h-5 md:w-5" />
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
        {showNavigationButtons && (
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
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        )}

        {/* Back button on payment step */}
        {currentStep === 8 && (
          <div className="flex justify-start mt-8">
            <Button
              variant="outline"
              onClick={handleBack}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Review
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
