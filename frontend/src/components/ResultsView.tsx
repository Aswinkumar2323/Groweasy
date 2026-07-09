'use client';

import React, { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  FileSpreadsheet,
  ClipboardList,
  Download,
  FileX,
} from 'lucide-react';
import { CRMRecord, SkippedRecord, CRM_FIELDS } from '@/types';
import StatsCard from './StatsCard';

interface ResultsViewProps {
  records: CRMRecord[];
  skipped: SkippedRecord[];
  totalProcessed: number;
  onReset: () => void;
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'GOOD_LEAD_FOLLOW_UP':
      return 'good-lead';
    case 'DID_NOT_CONNECT':
      return 'did-not-connect';
    case 'BAD_LEAD':
      return 'bad-lead';
    case 'SALE_DONE':
      return 'sale-done';
    default:
      return '';
  }
}

function formatStatusLabel(status: string): string {
  return status.replace(/_/g, ' ');
}

export default function ResultsView({
  records,
  skipped,
  totalProcessed,
  onReset,
}: ResultsViewProps) {
  const [activeTab, setActiveTab] = useState<'parsed' | 'skipped'>('parsed');

  const handleDownloadCSV = () => {
    if (records.length === 0) return;

    const headers = CRM_FIELDS.map((f) => f.key);
    const headerRow = headers.join(',');
    const dataRows = records.map((record) =>
      headers
        .map((key) => {
          const value = record[key];
          // Escape CSV values
          if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(',')
    );

    const csv = [headerRow, ...dataRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `groweasy_crm_import_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fade-in">
      {/* Stats */}
      <div className="stats-grid">
        <StatsCard
          icon={ClipboardList}
          value={totalProcessed}
          label="Total Processed"
          variant="info"
        />
        <StatsCard
          icon={CheckCircle}
          value={records.length}
          label="Successfully Imported"
          variant="success"
        />
        <StatsCard
          icon={XCircle}
          value={skipped.length}
          label="Skipped Records"
          variant={skipped.length > 0 ? 'warning' : 'success'}
        />
      </div>

      {/* Tabs */}
      <div className="results-tabs" id="results-tabs">
        <button
          className={`results-tab ${activeTab === 'parsed' ? 'active' : ''}`}
          onClick={() => setActiveTab('parsed')}
          id="tab-parsed"
        >
          <CheckCircle size={16} />
          Parsed Records
          <span className="results-tab-count">{records.length}</span>
        </button>
        <button
          className={`results-tab ${activeTab === 'skipped' ? 'active' : ''}`}
          onClick={() => setActiveTab('skipped')}
          id="tab-skipped"
        >
          <XCircle size={16} />
          Skipped Records
          <span className="results-tab-count">{skipped.length}</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'parsed' && (
        <div className="card" id="parsed-results-table">
          {records.length > 0 ? (
            <div className="table-container">
              <div className="table-scroll-wrapper" style={{ maxHeight: '500px' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th className="table-row-index">#</th>
                      {CRM_FIELDS.map((field) => (
                        <th key={field.key} style={{ minWidth: field.width }}>
                          {field.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record, idx) => (
                      <tr key={idx}>
                        <td className="table-row-index">{idx + 1}</td>
                        {CRM_FIELDS.map((field) => (
                          <td
                            key={field.key}
                            title={record[field.key] || ''}
                            style={{ minWidth: field.width }}
                          >
                            {field.key === 'crm_status' && record[field.key] ? (
                              <span
                                className={`status-badge ${getStatusBadgeClass(record[field.key])}`}
                              >
                                {formatStatusLabel(record[field.key])}
                              </span>
                            ) : (
                              record[field.key] || '—'
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="table-info-bar">
                <span>{records.length} CRM records ready</span>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">
                <FileSpreadsheet size={28} />
              </div>
              <div className="empty-state-title">No records parsed</div>
              <div className="empty-state-text">
                All records were skipped during processing
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'skipped' && (
        <div className="card" id="skipped-results-table">
          {skipped.length > 0 ? (
            <div className="table-container">
              <div className="table-scroll-wrapper" style={{ maxHeight: '500px' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th className="table-row-index">#</th>
                      <th style={{ minWidth: 250 }}>Reason</th>
                      <th style={{ minWidth: 400 }}>Original Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {skipped.map((item, idx) => (
                      <tr key={idx}>
                        <td className="table-row-index">{idx + 1}</td>
                        <td>
                          <span
                            className="status-badge bad-lead"
                            style={{ textTransform: 'none', letterSpacing: 0 }}
                          >
                            {item.reason}
                          </span>
                        </td>
                        <td
                          title={JSON.stringify(item.row)}
                          style={{ maxWidth: 500 }}
                        >
                          {Object.entries(item.row)
                            .filter(([, v]) => v)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(' | ') || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="table-info-bar">
                <span>{skipped.length} records skipped</span>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">
                <FileX size={28} />
              </div>
              <div className="empty-state-title">No skipped records</div>
              <div className="empty-state-text">All records were successfully parsed</div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="action-bar">
        <div className="action-bar-left">
          <button
            className="btn btn-secondary"
            onClick={onReset}
            id="import-another-btn"
          >
            <FileSpreadsheet size={18} />
            Import Another CSV
          </button>
        </div>
        {records.length > 0 && (
          <button
            className="btn btn-primary"
            onClick={handleDownloadCSV}
            id="download-csv-btn"
          >
            <Download size={18} />
            Download CRM CSV
          </button>
        )}
      </div>
    </div>
  );
}
