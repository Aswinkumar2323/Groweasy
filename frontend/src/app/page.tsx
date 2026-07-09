'use client';

import React, { useState, useCallback, useRef } from 'react';
import Papa from 'papaparse';
import Header from '@/components/Header';
import Stepper from '@/components/Stepper';
import FileUpload from '@/components/FileUpload';
import DataTable from '@/components/DataTable';
import ProgressBar from '@/components/ProgressBar';
import ResultsView from '@/components/ResultsView';
import { AppStep, CSVRow, ImportResult, ProgressUpdate } from '@/types';
import { uploadCSV, processCSVWithProgress } from '@/lib/api';
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  X,
} from 'lucide-react';

export default function Home() {
  // App state
  const [step, setStep] = useState<AppStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<CSVRow[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Progress state
  const [progress, setProgress] = useState<ProgressUpdate>({
    type: 'progress',
    batchIndex: 0,
    totalBatches: 0,
    processedRecords: 0,
    totalRecords: 0,
    message: 'Preparing...',
  });

  // Results state
  const [result, setResult] = useState<ImportResult | null>(null);

  // Abort controller ref
  const abortRef = useRef<(() => void) | null>(null);

  /**
   * Handle file selection — parse client-side for preview
   */
  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setIsUploading(true);

    try {
      // Client-side preview parsing with PapaParse
      const text = await selectedFile.text();
      const parsed = Papa.parse<CSVRow>(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h: string) => h.trim(),
      });

      if (parsed.errors.length > 0 && parsed.data.length === 0) {
        throw new Error('Failed to parse CSV: ' + parsed.errors[0]?.message);
      }

      if (parsed.data.length === 0) {
        throw new Error('CSV file is empty or has no data rows');
      }

      const csvHeaders = parsed.meta.fields || Object.keys(parsed.data[0]);
      setHeaders(csvHeaders);
      setRows(parsed.data);
      setStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse CSV file');
      setFile(null);
    } finally {
      setIsUploading(false);
    }
  }, []);

  /**
   * Handle file clear
   */
  const handleFileClear = useCallback(() => {
    setFile(null);
    setHeaders([]);
    setRows([]);
    setError(null);
    setStep('upload');
  }, []);

  /**
   * Handle confirm import — send to backend for AI processing
   */
  const handleConfirmImport = useCallback(async () => {
    if (rows.length === 0) return;

    setError(null);
    setIsProcessing(true);
    setStep('processing');
    setProgress({
      type: 'progress',
      batchIndex: 0,
      totalBatches: 0,
      processedRecords: 0,
      totalRecords: rows.length,
      message: 'Uploading to server...',
    });

    try {
      // First, upload to backend for server-side parsing validation
      let serverHeaders = headers;
      let serverRows = rows;

      if (file) {
        try {
          const uploadResult = await uploadCSV(file);
          serverHeaders = uploadResult.headers;
          serverRows = uploadResult.rows;
        } catch {
          // Fallback to client-parsed data if upload fails
          console.warn('Server upload failed, using client-parsed data');
        }
      }

      setProgress((prev) => ({
        ...prev,
        message: 'Starting AI extraction...',
      }));

      // Process with SSE progress
      const abort = processCSVWithProgress(
        serverHeaders,
        serverRows,
        (update) => {
          setProgress(update);
        },
        (importResult) => {
          setResult(importResult);
          setStep('results');
          setIsProcessing(false);
        },
        (errorMsg) => {
          setError(errorMsg);
          setStep('preview');
          setIsProcessing(false);
        }
      );

      abortRef.current = abort;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Processing failed');
      setStep('preview');
      setIsProcessing(false);
    }
  }, [rows, headers, file]);

  /**
   * Handle go back to preview
   */
  const handleBackToPreview = useCallback(() => {
    setStep('preview');
    setError(null);
  }, []);

  /**
   * Reset everything for a new import
   */
  const handleReset = useCallback(() => {
    if (abortRef.current) {
      abortRef.current();
      abortRef.current = null;
    }
    setFile(null);
    setHeaders([]);
    setRows([]);
    setStep('upload');
    setError(null);
    setResult(null);
    setIsProcessing(false);
    setIsUploading(false);
    setProgress({
      type: 'progress',
      batchIndex: 0,
      totalBatches: 0,
      processedRecords: 0,
      totalRecords: 0,
      message: 'Preparing...',
    });
  }, []);

  return (
    <div className="app-wrapper">
      <Header />
      <Stepper currentStep={step} />

      <main className="main-content" id="main-content">
        {/* Error Banner */}
        {error && (
          <div className="error-banner fade-in" role="alert">
            <AlertCircle size={20} className="error-icon" />
            <div className="error-content">
              <div className="error-title">
                {error.includes('429') || error.includes('Quota exceeded') 
                  ? 'API Quota Exceeded' 
                  : 'Something went wrong'}
              </div>
              <div className="error-message">
                {error.includes('429') || error.includes('Quota exceeded') ? (
                  <>
                    <p style={{ marginBottom: '0.5rem' }}>Your Google Gemini API key has run out of free tier quota.</p>
                    <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <li>This usually happens if your daily free tier limits are exhausted.</li>
                      <li>Or, if you are in a region where the free tier is unavailable (like the UK/EU).</li>
                      <li><strong>Action:</strong> Set up a paid billing account in Google AI Studio, or use a new key.</li>
                    </ul>
                  </>
                ) : (
                  error
                )}
              </div>
            </div>
            <button
              className="error-dismiss"
              onClick={() => setError(null)}
              aria-label="Dismiss error"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <FileUpload
            onFileSelect={handleFileSelect}
            selectedFile={file}
            onClear={handleFileClear}
            isLoading={isUploading}
          />
        )}

        {/* Step 2: Preview */}
        {step === 'preview' && (
          <div className="fade-in">
            <div className="card card-glass" style={{ marginBottom: '1rem' }}>
              <h2 className="card-title">Preview Your Data</h2>
              <p className="card-description">
                Review your CSV data below. When you&apos;re ready, click &quot;Confirm
                Import&quot; to let AI process and extract CRM fields.
              </p>
            </div>

            <DataTable headers={headers} rows={rows} />

            <div className="action-bar">
              <div className="action-bar-left">
                <button
                  className="btn btn-ghost"
                  onClick={handleReset}
                  id="back-to-upload-btn"
                >
                  <ArrowLeft size={18} />
                  Back
                </button>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
                  {rows.length} row{rows.length !== 1 ? 's' : ''} ready to import
                </span>
              </div>
              <button
                className="btn btn-primary btn-lg"
                onClick={handleConfirmImport}
                disabled={isProcessing}
                id="confirm-import-btn"
              >
                <Sparkles size={18} />
                Confirm Import
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Processing */}
        {step === 'processing' && (
          <div className="card card-glass fade-in">
            <ProgressBar
              batchIndex={progress.batchIndex || 0}
              totalBatches={progress.totalBatches || 0}
              processedRecords={progress.processedRecords || 0}
              totalRecords={progress.totalRecords || rows.length}
              message={progress.message || 'Processing...'}
            />
          </div>
        )}

        {/* Step 4: Results */}
        {step === 'results' && result && (
          <ResultsView
            records={result.records}
            skipped={result.skipped}
            totalProcessed={result.totalProcessed}
            onReset={handleReset}
          />
        )}
      </main>

      {/* Footer */}
      <footer
        style={{
          textAlign: 'center',
          padding: '1.5rem',
          fontSize: '0.8125rem',
          color: 'var(--text-tertiary)',
          borderTop: '1px solid var(--border-color)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        Built for{' '}
        <a
          href="https://groweasy.ai"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--color-primary-500)', textDecoration: 'none' }}
        >
          GrowEasy
        </a>{' '}
        · AI-Powered CSV Importer
      </footer>
    </div>
  );
}
