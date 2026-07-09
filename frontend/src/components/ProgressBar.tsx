'use client';

import React from 'react';

interface ProgressBarProps {
  batchIndex: number;
  totalBatches: number;
  processedRecords: number;
  totalRecords: number;
  message: string;
}

export default function ProgressBar({
  batchIndex,
  totalBatches,
  processedRecords,
  totalRecords,
  message,
}: ProgressBarProps) {
  const percentage = totalBatches > 0
    ? Math.round((batchIndex / totalBatches) * 100)
    : 0;

  const circumference = 2 * Math.PI * 50;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="progress-section fade-in" id="progress-indicator">
      <div className="progress-animation">
        <svg className="progress-ring" viewBox="0 0 120 120">
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
          </defs>
          <circle
            className="progress-ring-bg"
            cx="60"
            cy="60"
            r="50"
          />
          <circle
            className="progress-ring-fill"
            cx="60"
            cy="60"
            r="50"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
          />
        </svg>
        <div className="progress-percentage">{percentage}%</div>
      </div>

      <div className="progress-bar-container">
        <div className="progress-bar-track">
          <div
            className={`progress-bar-fill ${message.includes('Rate limit') || message.includes('Waiting') ? 'progress-pulse' : ''}`}
            style={{ 
              width: `${percentage}%`,
              transition: 'width 0.5s ease-in-out'
            }}
          />
        </div>
      </div>

      <div className="progress-status">
        <div className="progress-status-text">
          <span className="ai-sparkle">
            AI Processing
            <span className="sparkle-dots">
              <span className="sparkle-dot" />
              <span className="sparkle-dot" />
              <span className="sparkle-dot" />
            </span>
          </span>
        </div>
        <div className="progress-status-sub">{message}</div>
        {totalRecords > 0 && (
          <div className="progress-status-sub" style={{ marginTop: '0.25rem' }}>
            {processedRecords} of {totalRecords} records processed
          </div>
        )}
      </div>
    </div>
  );
}
