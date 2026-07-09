'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  icon: LucideIcon;
  value: number;
  label: string;
  variant: 'success' | 'warning' | 'info' | 'error';
}

export default function StatsCard({ icon: Icon, value, label, variant }: StatsCardProps) {
  return (
    <div className="stat-card" id={`stat-${variant}`}>
      <div className={`stat-icon ${variant}`}>
        <Icon size={24} />
      </div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}
