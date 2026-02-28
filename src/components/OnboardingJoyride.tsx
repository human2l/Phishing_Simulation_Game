'use client';

import { useEffect, useState } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';

export function OnboardingJoyride() {
  const [run, setRun] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Check localStorage to see if user has already completed onboarding
    const hasOnboarded = localStorage.getItem('securmail-onboarding-complete');
    if (!hasOnboarded) {
      // Small delay to let the UI map / cards render first
      const timer = setTimeout(() => {
        setRun(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!isMounted) return null;

  const steps: Step[] = [
    {
      target: '[data-tour="inbox-list"]',
      content: 'Welcome to SecurMail Pro! This is your inbox. Evaluate each email one by one here. Click on an email to view its contents.',
      placement: 'right',
      disableBeacon: true,
    },
    {
      target: '[data-tour="action-buttons"]',
      content: 'After reading the email, use these buttons to declare whether it is a Safe email or a Phishing attempt.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="score-board"]',
      content: 'Your performance is tracked here. You have 10 emails to evaluate. Aim for 100 points!',
      placement: 'top',
    },
    {
      target: '[data-tour="stats-board"]',
      content: 'These stats break down your choices: True Positives (Intercepted Phishing), True Negatives (Cleared Safe), False Positives (Safe marked as Phishing), and False Negatives (Phishing missed).',
      placement: 'right',
    }
  ];

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      localStorage.setItem('securmail-onboarding-complete', 'true');
    }
  };

  return (
    <Joyride
      callback={handleJoyrideCallback}
      continuous
      hideCloseButton
      run={run}
      scrollToFirstStep
      showProgress
      showSkipButton
      steps={steps}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: '#3B82F6', // Blue-500
          backgroundColor: '#ffffff',
          textColor: '#1F2937', // Gray-800
        },
        buttonNext: {
          backgroundColor: '#3B82F6',
          borderRadius: '8px',
          fontWeight: 600,
        },
        buttonBack: {
          marginRight: 10,
          color: '#6B7280',
        },
        buttonSkip: {
          color: '#9CA3AF',
        }
      }}
    />
  );
}
