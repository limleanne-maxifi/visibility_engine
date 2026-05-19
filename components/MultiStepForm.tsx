'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FormData, initialFormData } from '@/lib/types';
import { generateSessionId, parseUtmParams } from '@/lib/utils';
import ProgressBar from '@/components/ProgressBar';
import Step1Identity from '@/components/steps/Step1Identity';
import Step2Context from '@/components/steps/Step2Context';
import Step3Awareness from '@/components/steps/Step3Awareness';
import Step4Goals from '@/components/steps/Step4Goals';
import Step5Consent from '@/components/steps/Step5Consent';

const TOTAL_STEPS = 5;

type Errors = Partial<Record<keyof FormData, string>>;

function validateStep(step: number, data: FormData): Errors {
  const errors: Errors = {};

  if (step === 1) {
    if (!data.firstName.trim()) errors.firstName = 'First name is required.';
    if (!data.email.trim()) {
      errors.email = 'Business email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = 'Please enter a valid email address.';
    }
    if (!data.websiteUrl.trim()) errors.websiteUrl = 'Website URL is required.';
  }

  if (step === 2) {
    if (!data.occupation) errors.occupation = 'Please select your role.';
    if (!data.industry.trim()) errors.industry = 'Please select your industry.';
    if (!data.company.trim()) errors.company = 'Company name is required.';
  }

  if (step === 3) {
    if (!data.aiPresence) errors.aiPresence = 'Please select an option.';
    if (data.platforms.length === 0) errors.platforms = 'Please select at least one platform.';
  }

  if (step === 4) {
    if (data.challenges.length === 0) errors.challenges = 'Please select at least one challenge.';
    if (!data.aeoOutcome) errors.aeoOutcome = 'Please select your desired outcome.';
  }

  if (step === 5) {
    if (!data.consent) errors.consent = 'Please tick the box to continue.';
  }

  return errors;
}

export default function MultiStepForm() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Errors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const router = useRouter();

  // Capture UTM params and generate session metadata on mount
  useEffect(() => {
    const utms = parseUtmParams(window.location.search);
    setFormData((prev) => ({
      ...prev,
      ...utms,
      sessionId: generateSessionId(),
      timestamp: new Date().toISOString(),
    }));
  }, []);

  const handleChange = (updates: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
    // Clear errors for changed fields
    const clearedErrors = { ...errors };
    (Object.keys(updates) as (keyof FormData)[]).forEach((key) => {
      delete clearedErrors[key];
    });
    setErrors(clearedErrors);
  };

  const goNext = () => {
    const stepErrors = validateStep(step, formData);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    setStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    setErrors({});
    setStep((s) => s - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    const stepErrors = validateStep(5, formData);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    setSubmitError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const contentType = res.headers.get('content-type') ?? '';
      if (!contentType.includes('application/json')) {
        throw new Error('Something went wrong on our end. Please try again in a moment.');
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? 'Something went wrong. Please try again.');
      }

      router.push(`/results/${data.id}`);
    } catch (err) {
      setIsLoading(false);
      setSubmitError(
        err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again.'
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1929] flex flex-col">
      {/* Site header */}
      <header className="flex items-center justify-between px-6 sm:px-8 h-14 border-b border-white/[0.07] bg-[#091521]/80 backdrop-blur-sm flex-shrink-0">
        <a href="https://www.maxifidigital.com" aria-label="Maxifi Digital">
          <Image
            src="/maxifi-logo-white.png"
            alt="Maxifi Digital"
            height={28}
            width={140}
            className="h-7 w-auto"
          />
        </a>
        <a
          href="https://www.maxifidigital.com"
          className="text-xs text-white/40 hover:text-white/70 transition-colors"
        >
          ← maxifidigital.com
        </a>
      </header>

      {/* Form area */}
      <div className="flex-1 flex items-start justify-center py-10 px-4">
      <div className="w-full max-w-[520px]">

        {/* Eyebrow */}
        <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-[#C87A2F] mb-3">
          AI Visibility Snapshot &nbsp;·&nbsp; Step {step} of {TOTAL_STEPS}
        </p>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-white/[0.06] p-6 sm:p-8"
             style={{ boxShadow: '0 32px 64px rgba(0,0,0,0.45)' }}>
          {/* Progress bar */}
          <div className="mb-6">
            <ProgressBar step={step} totalSteps={TOTAL_STEPS} />
          </div>

          {/* Step content */}
          {step === 1 && (
            <Step1Identity
              data={formData}
              onChange={handleChange}
              onNext={goNext}
              errors={errors}
            />
          )}
          {step === 2 && (
            <Step2Context
              data={formData}
              onChange={handleChange}
              onNext={goNext}
              onBack={goBack}
              errors={errors}
            />
          )}
          {step === 3 && (
            <Step3Awareness
              data={formData}
              onChange={handleChange}
              onNext={goNext}
              onBack={goBack}
              errors={errors}
            />
          )}
          {step === 4 && (
            <Step4Goals
              data={formData}
              onChange={handleChange}
              onNext={goNext}
              onBack={goBack}
              errors={errors}
              industry={formData.industry}
            />
          )}
          {step === 5 && (
            <Step5Consent
              data={formData}
              onChange={handleChange}
              onSubmit={handleSubmit}
              onBack={goBack}
              errors={errors}
              isLoading={isLoading}
            />
          )}
        </div>

        {/* Submission error */}
        {submitError && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <p className="font-medium mb-1">Something went wrong</p>
            <p>{submitError}</p>
            <p className="mt-2 text-red-500">
              Need help?{' '}
              <a
                href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'letsgetstarted@maxifidigital.com'}`}
                className="underline"
              >
                Email us directly
              </a>
            </p>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
