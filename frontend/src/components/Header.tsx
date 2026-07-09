'use client';

import React from 'react';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  return (
    <header className="header" id="app-header">
      <div className="header-brand">
        <div className="header-logo" aria-hidden="true">G</div>
        <div>
          <div className="header-title">
            Grow<span>Easy</span>
          </div>
          <div className="header-subtitle">AI CSV Importer</div>
        </div>
      </div>
      <div className="header-actions">
        <ThemeToggle />
      </div>
    </header>
  );
}
