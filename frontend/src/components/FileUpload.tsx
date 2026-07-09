'use client';

import React, { useCallback, useRef, useState } from 'react';
import { Upload, FileSpreadsheet, X } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClear: () => void;
  isLoading: boolean;
}

export default function FileUpload({
  onFileSelect,
  selectedFile,
  onClear,
  isLoading,
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        if (file.name.toLowerCase().endsWith('.csv') || file.type === 'text/csv') {
          onFileSelect(file);
        } else {
          alert('Please upload a CSV file.');
        }
      }
    },
    [onFileSelect]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        onFileSelect(e.target.files[0]);
      }
    },
    [onFileSelect]
  );

  const handleClick = useCallback(() => {
    if (!selectedFile && !isLoading) {
      inputRef.current?.click();
    }
  }, [selectedFile, isLoading]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="fade-in">
      <div className="card card-glass">
        <h2 className="card-title">Upload CSV File</h2>
        <p className="card-description">
          Upload any CSV file — Facebook leads, Google Ads exports, CRM data, or custom
          spreadsheets. Our AI will intelligently map your data to GrowEasy CRM format.
        </p>

        <div
          id="upload-zone"
          className={`upload-zone ${isDragOver ? 'drag-over' : ''} ${selectedFile ? 'has-file' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
          role="button"
          tabIndex={0}
          aria-label="Upload CSV file"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') handleClick();
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="upload-input"
            onChange={handleInputChange}
            id="csv-file-input"
            aria-label="Choose CSV file"
          />

          {!selectedFile ? (
            <>
              <div className="upload-icon-wrapper">
                <Upload size={32} />
              </div>
              <div className="upload-text">
                <div className="upload-text-main">
                  Drag & drop your CSV here, or <span>browse</span>
                </div>
                <div className="upload-text-sub">
                  Supports any CSV format — up to 10MB
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="upload-icon-wrapper">
                <FileSpreadsheet size={32} />
              </div>
              <div className="upload-file-info">
                <FileSpreadsheet size={20} className="upload-file-icon" />
                <div>
                  <div className="upload-file-name">{selectedFile.name}</div>
                  <div className="upload-file-size">
                    {formatFileSize(selectedFile.size)}
                  </div>
                </div>
                <button
                  className="upload-file-remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClear();
                    if (inputRef.current) inputRef.current.value = '';
                  }}
                  aria-label="Remove file"
                  id="remove-file-btn"
                >
                  <X size={18} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
