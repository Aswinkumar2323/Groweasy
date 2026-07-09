'use client';

import React from 'react';
import { Upload, Eye, Cpu, CheckCircle, Check } from 'lucide-react';
import { AppStep } from '@/types';

interface StepperProps {
  currentStep: AppStep;
}

const STEPS: { id: AppStep; label: string; icon: React.ReactNode }[] = [
  { id: 'upload', label: 'Upload', icon: <Upload size={18} /> },
  { id: 'preview', label: 'Preview', icon: <Eye size={18} /> },
  { id: 'processing', label: 'Processing', icon: <Cpu size={18} /> },
  { id: 'results', label: 'Results', icon: <CheckCircle size={18} /> },
];

const STEP_ORDER: AppStep[] = ['upload', 'preview', 'processing', 'results'];

export default function Stepper({ currentStep }: StepperProps) {
  const currentIndex = STEP_ORDER.indexOf(currentStep);

  return (
    <nav className="stepper" id="import-stepper" aria-label="Import progress">
      {STEPS.map((step, index) => {
        const isActive = index === currentIndex;
        const isCompleted = index < currentIndex;

        return (
          <React.Fragment key={step.id}>
            {index > 0 && (
              <div
                className={`stepper-line ${isCompleted || isActive ? 'active' : ''}`}
                aria-hidden="true"
              />
            )}
            <div
              className={`stepper-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
              aria-current={isActive ? 'step' : undefined}
            >
              <div className="stepper-circle">
                {isCompleted ? <Check size={18} /> : step.icon}
              </div>
              <span className="stepper-label">{step.label}</span>
            </div>
          </React.Fragment>
        );
      })}
    </nav>
  );
}
